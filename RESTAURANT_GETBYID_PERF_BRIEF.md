# GetRestaurantById — ~41s response, times out every per-restaurant page

`GET /api/Restaurants/GetRestaurantById?restaurantId=<id>` takes
**~41 seconds** to return on the test restaurant. The admin frontend
caps every request at a 30s axios timeout, so this endpoint **never
completes from the browser** — it aborts at 30s with a "request did not
reach the server" toast and, until a frontend workaround landed, froze
the full-screen loader for the whole 30s on every hard-refresh of a
`/restaurant/*` page (Menüler, Fiyat Listesi, Genel Ayarlar, …).

The smoking gun: the **list** endpoint `GetmyRestaurants` returns the
**same restaurant entity** (all the same fields) for up to 50
restaurants in **~0.3s**. A single-restaurant lookup has no business
being ~140× slower than the 50-restaurant list. Whatever
`GetRestaurantById` does that the list projection doesn't is the entire
problem.

## 1. Measurements (live, same logged-in session, same restaurant)

Restaurant `26a63a16-926e-4fba-8fec-411280a4a5bb`, measured from the
browser with a raw `fetch` (no 30s cap), warm session:

| Endpoint | Wall-clock | Status | Payload |
| --- | --- | --- | --- |
| `Restaurants/GetmyRestaurants?pageNumber=1&pageSize=50` | **~0.2–0.3 s** | 200 | **6 KB** (50 restaurants) |
| `Menus/GetMenusByRestaurantId` | **~0.3 s** | 200 | — |
| `Restaurants/GetRestaurantById` | **~39–41 s** | 200 | **3 KB** (1 restaurant) |

Measured twice for `GetRestaurantById`: 40.8s and 39.3s — so this is
**repeatable, not cold-start variance**. (Every prior page-load in the
network log also aborted it at exactly the 30s frontend cap.)

### Key clue: the slow response is TINY

`GetRestaurantById` returns **only 3 KB** — *smaller* than the
50-restaurant list (6 KB) — yet takes ~40s. So this is **not** a
large-payload / serialization / over-hydration problem: there is no
big object graph coming over the wire. ~40s is being spent **server-side
producing a 3 KB result**. That points at one of:

- an expensive **query / table scan** that filters or aggregates down to
  a tiny result (e.g. counts/sums over Orders or Products without a
  covering index),
- an eager **Include chain materialised in memory** and then projected
  down to the small DTO (the cartesian cost is paid during
  materialisation even though the output is small — projecting *in the
  query* avoids it), or
- a **blocking synchronous call** inside the handler (integration /
  license / FCM lookup) that stalls for a fixed ~40s regardless of data
  size.

A quick triage signal: if the ~40s is roughly **constant** across
different restaurants (large and small), suspect the blocking-call path;
if it **scales with the restaurant's product/order count**, suspect the
query/Include path.

## 2. Repro

```
GET https://liwamenu.pentegrasyon.net/api/Restaurants/GetRestaurantById?restaurantId=26a63a16-926e-4fba-8fec-411280a4a5bb
Accept: application/json
Authorization: Bearer <admin token>
```

Compare against the list call for the same account:

```
GET https://liwamenu.pentegrasyon.net/api/Restaurants/GetmyRestaurants?pageNumber=1&pageSize=50
```

The list returns the same restaurant (and 49 others) in ~0.3s; the
single hangs ~41s.

## 3. What the frontend actually uses from the response

Every consumer reads a **flat restaurant entity** — the same shape the
list endpoint already returns. None of them need eager-loaded child
collections (products / categories / menus / orders) inlined into this
DTO:

- **Per-restaurant pages** (`restaurantHome` → settings tabs): name,
  tenant, moneySign, decimalPoint, slogan1/2, onlineOrder,
  inPersonOrder, hide, theme ids, license flags, … — i.e. the scalar
  settings fields. (These have since been switched to read from the
  list slice as a workaround; see §6.)
- **Licenses flow** (`getLicensesRestaurant`): only `name` and `id`.
- **Restaurants map** (`getRestaurantsMapSlice`): location/name level
  fields.

If `GetRestaurantById` currently hydrates `restaurant.Products`,
`restaurant.Categories`, `restaurant.Menus`, `restaurant.Orders`, etc.
as navigation properties, **none of that is read here** — the pages
that need products/categories/menus call their own dedicated endpoints
(`GetProductsByRestaurantIdLite`, `GetCategoriesByRestaurantId`,
`GetMenusByRestaurantId`), each of which already returns in <300ms.

## 4. Hypotheses (rough order of likelihood)

Given the response is only 3 KB, rank the *server-side work* causes, not
payload size:

1. **Eager Include chain materialised in memory, then projected to the
   small DTO.** If the handler does
   `Restaurants.Include(r => r.Products).ThenInclude(...).Include(r => r.Categories).Include(r => r.Menus)...`
   then maps the result to a flat DTO, EF Core still pays the full
   cartesian materialisation cost (products × categories × menus rows)
   *before* the projection trims it to 3 KB. `GetmyRestaurants`
   presumably projects **in the query** (`.Select(...)`) and never
   materialises the graph — hence ~0.3s for 50 rows. Fix: project in the
   query / `.AsSplitQuery()` / drop the Includes.

2. **Expensive query or aggregate returning a tiny result.** Counts /
   sums / "is everything configured" checks over Orders or Products
   computed in-handler, or a join over large tables that filters down to
   one row, without a covering index. Scales with the restaurant's
   data volume.

3. **Blocking synchronous call inside the handler** (Pentegrasyon /
   license / FCM / cross-service lookup) that stalls for a roughly fixed
   ~40s regardless of restaurant size. Distinguish from #1/#2 by the
   constant-vs-scaling triage in §1.

4. **Missing index** on a column used by whatever join/filter only the
   single endpoint performs.

The fastest diagnostic: **diff the LINQ/SQL of `GetRestaurantById`
against `GetmyRestaurants`.** The list is fast and returns the same
entity in a smaller payload — make the single match its query shape.

## 5. Asks

Pick the smallest change that brings `GetRestaurantById` in line with
the list endpoint (target: **P95 < 500ms** for any single restaurant):

### A. Reuse the list projection (recommended)

`GetmyRestaurants` already returns the correct, fast, flat restaurant
projection. Have `GetRestaurantById` return that **same projection**
filtered to one id (`...Where(r => r.Id == id)`). Same DTO, same speed,
zero frontend change — the frontend already reads identical fields from
both.

### B. Strip eager Includes / fix the query

If A isn't clean, profile the handler's SQL and remove the Include
chain (or `.AsSplitQuery()` it, or replace with a projection). The
child collections aren't read from this DTO.

### C. Targeted index

If a specific join/filter is the long pole and isn't covered, add an
additive index. (No table changes.)

## 6. Frontend status / workaround already shipped

To unfreeze the admin, the per-restaurant shell
(`src/pages/restaurantHome.jsx`) was switched to resolve the restaurant
from the **list** slice (`GetmyRestaurants`, silent + ~0.3s) instead of
calling `GetRestaurantById` on hard-refresh. That fixed the 30s freeze
for the per-restaurant pages.

**But two flows still call `GetRestaurantById` and remain affected:**

- `src/redux/restaurants/getRestaurantSlice.js` →
  `getLicensesRestaurant` (`Restaurants/GetRestaurantByIdFromLicenses`)
  fans out **one `GetRestaurantById` call per unique restaurant in the
  licenses list, in parallel (`Promise.all`)** — and uses only
  `name` + `id` from each. For a dealer/owner with several restaurants
  that's N × ~41s concurrent calls, all timing out, just to map
  `restaurantId → name`.
- `src/redux/restaurants/getRestaurantsMapSlice.js` → uses
  `GetRestaurantById` for map markers.

So this is worth fixing at the source even though the main pages are
worked around. (Bonus: once it's fast, the licenses flow could keep
using it, or the backend could expose a tiny `restaurantId → name`
lookup so that flow doesn't pull whole entities at all.)

## 7. Out of scope

- No caching headers / CDN — admin reads are per-user and invalidated
  often; fix the source query instead.
- No contract change required for ask A/B (the frontend reads the same
  fields the list returns).
- The 30s frontend timeout stays — it's the correct guard; the endpoint
  just needs to finish well under it.

## 8. Frontend code references

- Thunk: `src/redux/restaurants/getRestaurantSlice.js`
  - `getRestaurant` → `Restaurants/GetRestaurantById`
  - `getLicensesRestaurant` → fans out `GetRestaurantById` per license
- Map: `src/redux/restaurants/getRestaurantsMapSlice.js`
- Fast comparison endpoint: `src/redux/restaurants/getRestaurantsSlice.js`
  (`Restaurants/GetmyRestaurants`)
- 30s request cap: `src/redux/api.js` (`REQUEST_TIMEOUT_MS = 30000`)
- Workaround that removed the single-fetch from the page shell:
  `src/pages/restaurantHome.jsx`

---

## 9. Backend Claude prompt (copy verbatim)

```
Profile and speed up GET /api/Restaurants/GetRestaurantById. On the test
restaurant 26a63a16-926e-4fba-8fec-411280a4a5bb it returns 200 but takes
~39-41 seconds (measured twice, repeatable, not cold start). For
comparison, GetmyRestaurants?pageNumber=1&pageSize=50 returns the SAME
restaurant entity (plus 49 others) in ~0.3 seconds. The admin frontend
caps requests at 30s, so GetRestaurantById never completes from the
browser.

Key clue: the slow response is only 3 KB — SMALLER than the
50-restaurant list (6 KB). So this is NOT a large-payload/serialization
problem; ~40s is spent server-side producing a tiny result. Look at
server-side work, not response size.

Tasks:

1. Capture the SQL both endpoints emit for that restaurant/account and
   diff them. GetmyRestaurants is fast and returns the entity the
   frontend actually uses, so GetRestaurantById is doing extra work the
   list doesn't. Given the 3 KB payload, the likely causes are: (a) an
   eager Include chain (Products/Categories/Menus/Orders) that EF
   materialises in memory and then projects down to the small DTO — the
   cartesian cost is paid before the trim; (b) an expensive
   query/aggregate (counts/sums/"is configured" checks) over large
   tables without a covering index; or (c) a blocking synchronous call
   in the handler (integration/license/FCM). Triage: if the ~40s is
   constant across restaurants suspect (c); if it scales with
   product/order count suspect (a)/(b).

2. The frontend reads only FLAT restaurant fields from this endpoint
   (name, tenant, moneySign, decimalPoint, slogans, onlineOrder,
   inPersonOrder, hide, theme ids, license flags, location/name). It
   never reads child collections from this DTO — products, categories
   and menus are fetched via their own endpoints. So the child
   collections can be dropped from this response.

3. Preferred fix: return the SAME flat projection GetmyRestaurants uses,
   filtered to the single id (Where(r => r.Id == id)). Otherwise remove
   the Include chain / use AsSplitQuery / project to a flat DTO. Add an
   additive index only if a specific join is the long pole.

4. Target P95 < 500ms for any single restaurant. Verify with a warm
   curl loop (3-5 runs) against the same restaurantId.

Constraints:
- No contract change beyond dropping unused eagerly-loaded child
  collections (frontend reads the same scalar fields the list returns).
- No new endpoints required; no schema changes beyond an additive index
  if truly missing.

Affected frontend (context, no change needed as part of this fix):
- src/redux/restaurants/getRestaurantSlice.js  (getRestaurant,
  getLicensesRestaurant — the latter fans out one GetRestaurantById per
  license in parallel and uses only name+id)
- src/redux/restaurants/getRestaurantsMapSlice.js
- src/redux/restaurants/getRestaurantsSlice.js  (GetmyRestaurants — the
  fast reference projection)
```
