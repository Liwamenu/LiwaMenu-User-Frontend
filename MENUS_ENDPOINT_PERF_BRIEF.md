# GetMenusByRestaurantId — slow endpoint, hangs the admin Menus page

The admin panel's Menus page does a single `GET
/api/Menus/GetMenusByRestaurantId?restaurantId=<id>` on first visit
(and again whenever the slice cache is invalidated). On the test
restaurant **`f9f7344a-bcf8-47fb-9aaf-4736341c4fa8` (Liwa Cafe &
Bistro)** that call regularly takes long enough that:

- a hard refresh sits on a blank Menus card for many seconds, and
- on some runs the browser itself aborts the request as a navigation
  timeout (the user has reported both behaviours during repeated
  testing this week).

Frontend already shipped two UX workarounds (the request is silenced
out of the global full-screen spinner so the rest of the app stays
interactive, and a card-shaped skeleton plays while the slice cache
is null) but those don't change the underlying wall-clock — the
list still doesn't render until the response lands. We'd like a
backend pass on this endpoint.

## 1. Repro

Same restaurant as above, fresh browser tab, normal admin login:

```
GET https://liwamenu.pentegrasyon.net/api/Menus/GetMenusByRestaurantId?restaurantId=f9f7344a-bcf8-47fb-9aaf-4736341c4fa8
Accept: application/json
Authorization: Bearer <admin token>
```

Observed wall-clock from the browser network tab: variable but
frequently in the multi-second range, occasionally exceeding the
default Vercel preview navigation timeout for the host page that
fires the request.

## 2. What the frontend uses from the response

Every menu in the response is consumed by `menuList.jsx` /
`menuFormSections.jsx`. The minimum field set actually rendered is:

```
id
name
plans: [ { id?, days[], startTime, endTime } ]
categoryIds: [ <guid> ]
priceListType  (one of "normal" | "campaign" | "special")
```

Plus the bidirectional m2m field (`menu.categoryIds` ⇄
`category.menuIds`) maintained by PR #162. The admin doesn't need
anything else from this endpoint on the Menus list page — no joined
category names, no product counts, no schedule rendering.

If the current handler is eagerly hydrating denormalised fields
(every menu's full category objects, every category's products, etc.)
those joins are likely the long pole. The list page can absolutely
work off a flat menu projection and call `GetCategoriesByMenuId` /
`GetCategoriesByRestaurantId` separately for the picker — which it
already does — so we don't need them inlined into the menu DTO.

## 3. Hypotheses worth checking

In rough order of likelihood from the outside:

1. **N+1 on category materialisation per menu.** If the read joins
   each menu to its `categoryIds` set via a per-menu subquery (or
   loads `categories` as a nav property without `.AsSplitQuery()`
   / `.Include` batching), 13 categories × N menus = a lot of round
   trips. Restaurant has ~13 categories and 1 menu in the test
   data, so cardinality alone isn't the smoking gun — the join
   shape is.

2. **Cartesian blowup from Include chains.** If `Menus.Include(m =>
   m.Categories).Include(m => m.Plans)` (or similar) executes as
   one query, EF Core fans the rowset out to menus × categories ×
   plans rows. With even modest counts that's expensive to
   materialise. Splitting with `.AsSplitQuery()` usually solves it.

3. **No covering index for the filter.** `WHERE restaurantId = @id`
   on Menus / MenuCategory / MenuPlans without an index on the
   restaurantId column scans the whole table per join.

4. **Per-call DB connection setup latency.** If the API spins up a
   fresh DbContext / connection without pooling, the first read
   after an idle period eats the cold-start cost. Subsequent reads
   in the same session land faster — does that match what you see?

5. **Synchronous network call inside the handler** (FCM token
   touch, cross-service lookup, etc.) — anything blocking that's
   not pure DB.

## 4. Asks

Pick the smallest of these that gives us a measurably faster
response (target: P95 under 500ms for a restaurant with <20 menus,
<200 categories):

### A. Profile + targeted optimisation

Capture the actual SQL the handler emits for the test restaurant
above. If it's an N+1 or cartesian Include, the typical fix is
`.AsSplitQuery()` on the LINQ chain or a hand-written projection
into a flat DTO. No frontend change, no contract change.

### B. Trim the projection

If the endpoint currently returns nested category objects /
product references per menu, drop them. The list page only needs
the fields listed in §2. The picker / detail dialogs already call
the right endpoints for their own data. Smaller DTO + fewer joins
should be a 1-2 line change in the controller / service.

### C. Pagination (last resort)

If a restaurant can legitimately have hundreds of menus the
endpoint may need `pageNumber` / `pageSize` parameters. Probably
overkill for now (restaurants typically run 1-5 menus) — list it
for completeness, not as the recommended fix.

## 5. Verification

After the fix, the test restaurant call should consistently land
in well under one second on a warm connection. Easy spot-check:

```bash
time curl -s -H "Authorization: Bearer <admin token>" \
  "https://liwamenu.pentegrasyon.net/api/Menus/GetMenusByRestaurantId?restaurantId=f9f7344a-bcf8-47fb-9aaf-4736341c4fa8" \
  > /dev/null
```

Run it 3-5 times in a row to flush cold-start variance, report the
warm-call wall-clock.

## 6. Frontend code references

- Caller: `src/redux/menus/getMenusSlice.js` —
  `Menus/GetMenusByRestaurantId` createAsyncThunk
- Page that triggers the call: `src/components/restaurant/menus/menuList.jsx`
  (`useEffect` on mount + after the cache-invalidating matcher fires
  on Menus/Add|Edit|Delete)
- Existing UX workarounds:
  - `src/middlewares/loadingMiddleware.js` — endpoint is in
    `SILENT_THUNKS`
  - `menuList.jsx#MenusSkeleton` — inline placeholder while cache
    is null

## 7. Out of scope

- This isn't asking for cache headers or CDN — admin reads are
  per-user and frequently invalidated, caching gains would be
  marginal compared to fixing the source query.
- This isn't asking for a websocket / push for menus — the page
  reloads on demand, not in the background.

---

## 8. Backend Claude prompt (copy verbatim)

```
Profile and speed up GET /api/Menus/GetMenusByRestaurantId. The
admin Menus page calls it on every first visit; on the test
restaurant f9f7344a-bcf8-47fb-9aaf-4736341c4fa8 the response
regularly takes multiple seconds and occasionally exceeds the host
page's navigation timeout in the browser. Frontend already silences
the request from the global UI loader and renders a card skeleton
while waiting, but the underlying wall-clock is still the
bottleneck.

Tasks:

1. Capture the actual SQL the handler emits when called with
   restaurantId = f9f7344a-bcf8-47fb-9aaf-4736341c4fa8. Note the
   query count and the worst-case row materialisation. Most likely
   culprits (in rough order): N+1 on the Menu → Category join
   (CategoryIds / Categories nav prop), a cartesian Include chain
   that needs AsSplitQuery, or a missing index on Menus.RestaurantId
   / MenuCategory.MenuId.

2. The frontend only needs these per-menu fields on this endpoint:
       id, name, plans[{ id, days, startTime, endTime }],
       categoryIds[], priceListType
   If the current handler eagerly hydrates joined category objects
   or product references, drop them — the list page calls
   GetCategoriesByMenuId / GetCategoriesByRestaurantId for its own
   detail needs and doesn't read those from this DTO.

3. Apply the smallest fix that brings P95 under ~500ms for a
   restaurant with <20 menus and <200 categories. Don't add new
   pagination, caching headers or new endpoints — those are out of
   scope.

4. Verify with a warm curl loop (3-5 runs, ignore first-call
   cold-start) against the same restaurantId. Target: each warm
   call under one second.

Constraints:
- No schema migration unless an index is truly missing — additive
  index is fine, table changes are not.
- No new endpoints; no contract changes to the existing one beyond
  trimming joined fields if applicable.
- Preserve the menu.categoryIds field as a string[] (it's the
  source of truth for the picker after PR #162).

Affected admin frontend code (no changes required as part of this
fix, listed for context):
- src/redux/menus/getMenusSlice.js
- src/components/restaurant/menus/menuList.jsx
- src/middlewares/loadingMiddleware.js (SILENT_THUNKS allowlist)
```
