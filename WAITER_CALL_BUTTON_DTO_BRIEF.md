# `showWaiterCallButton` is write-only — admin GET endpoints don't return it

The admin can **save** `showWaiterCallButton` (the "Garson Çağır Butonu
Göster" toggle in Genel Ayarlar) via `SetRestaurantSettings`, but **no
admin GET endpoint returns the field**, so the settings form can never
read the saved value back. On every (re)load the toggle falls back to
its default (`true`), which makes it look unstable: the owner turns it
off, saves, and on the next refresh / page revalidate it shows on again.

## 1. What we measured (live, test restaurant `26a63a16-926e-4fba-8fec-411280a4a5bb`)

| Endpoint | Returns `showWaiterCallButton`? |
| --- | --- |
| `Restaurants/GetmyRestaurants` (list) | **No** (`listHasField: false`) |
| `Restaurants/GetRestaurantById` (single) | **No** (`hasField: false`) |
| `Restaurants/SetRestaurantSettings` (save) | accepts & (presumably) persists it |

So the field is **accepted on write but absent from both read DTOs.**
The admin settings form reads the restaurant entity from
`GetmyRestaurants` (the per-restaurant pages were switched to the fast
list endpoint — see `RESTAURANT_GETBYID_PERF_BRIEF.md`), and that
payload has no `showWaiterCallButton` key at all.

Sibling boolean flags on the same entity (e.g. `showCategoriesInFront`)
**are** returned by the list — so this one looks like a simple omission
from the DTO projection, not a deliberate exclusion.

## 2. Why it manifests as "the toggle won't stay off"

1. Form loads → entity has no `showWaiterCallButton` → form defaults to
   `?? true` → shows **ON**.
2. Owner turns it **OFF**, saves. The save succeeds and the value is
   sent to the backend.
3. The next list revalidate (on tab focus / navigation — the settings
   pages use `useSmartRevalidate`) returns the entity **without** the
   field → form defaults to `true` again → flips back **ON**.

From the owner's seat the toggle is unreliable: the off state never
sticks across a refresh.

## 3. The ask (small, additive)

Add `showWaiterCallButton` to the restaurant entity projection returned
by:

1. **`Restaurants/GetmyRestaurants`** (the list — this is the one the
   admin settings form actually reads), and
2. **`Restaurants/GetRestaurantById`** (the single — for consistency and
   any other consumer).

It's a `bool` already persisted by `SetRestaurantSettings`; this is just
exposing it in the read DTOs the same way `showCategoriesInFront` is
already exposed. **No schema change, no contract break** — purely an
additive field on two read responses.

Casing: the list returns camelCase to the wire (e.g.
`showCategoriesInFront`), so emit `showWaiterCallButton` to match.

## 4. Frontend status / workaround already shipped

Until the backend returns the field, the admin can't know the persisted
value on a cold load, so a fresh session still shows the default on the
**first** render. To at least stop the **within-session flip-flop**, the
list slice now **preserves** `showWaiterCallButton` across revalidates:

- `src/redux/restaurants/getRestaurantsSlice.js` — `getRestaurants.fulfilled`
  keeps the previously-cached `showWaiterCallButton` per restaurant when
  the fresh list payload omits it. Combined with the optimistic merge in
  `restaurantEntityPatchers.js` (which already patches the saved value
  into the cache on `SetRestaurantSettings` fulfilled), the toggle now
  holds its value for the rest of the session after a save.

This workaround is **forward-compatible**: the preserve only fires when
the payload omits the field, so once the backend includes it the slice
uses the real value and the merge no-ops. **Please still ship the DTO
fix** — the workaround can't recover the true value on a cold load /
fresh login, only the backend can.

## 5. Frontend code references

- Save thunk: `src/redux/restaurant/setRestaurantSettingsSlice.js`
  (`Restaurants/SetRestaurantSettings`)
- Toggle + default: `src/components/restaurant/restaurantSettings.jsx`
  (`showWaiterCallButton: inData?.showWaiterCallButton ?? true`)
- Read source for the form: `src/redux/restaurants/getRestaurantsSlice.js`
  (`Restaurants/GetmyRestaurants`)
- Optimistic merge on save: `src/redux/restaurants/restaurantEntityPatchers.js`

---

## 6. Backend Claude prompt (copy verbatim)

```
Add the existing boolean field `showWaiterCallButton` to the restaurant
entity projection returned by GET /api/Restaurants/GetmyRestaurants AND
GET /api/Restaurants/GetRestaurantById.

Context: PUT /api/Restaurants/SetRestaurantSettings already accepts and
persists `showWaiterCallButton`, but neither read endpoint returns it.
Verified live on restaurant 26a63a16-926e-4fba-8fec-411280a4a5bb: the
field is absent from both the list and the single-entity responses,
while sibling flags like `showCategoriesInFront` ARE present. As a
result the admin "Garson Çağır Butonu Göster" toggle can be saved but
never read back, so it always renders its default (true) and looks
unstable.

Tasks:
1. Include `showWaiterCallButton` in the DTO/projection for both
   GetmyRestaurants and GetRestaurantById, mirroring how
   showCategoriesInFront is already projected. Emit it as camelCase
   (`showWaiterCallButton`) to match the rest of the list payload.
2. Confirm the value round-trips: set it false via SetRestaurantSettings,
   then GET both endpoints and verify they return false.

Constraints:
- Additive only. No schema change (the column already exists and is
  written by SetRestaurantSettings). No contract break — just one extra
  field on two read responses.
```
