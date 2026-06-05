# `autoResolveWaiterCalls` — persist + return on restaurant DTO

Sibling of the just-shipped `showWaiterCallButton` field. The admin's
**Genel Ayarlar** page now has a second toggle under "Garson Çağır Butonu
Göster": **"Çağrıları Otomatik Çöz"** (default ON). When on, the admin app
auto-marks an incoming waiter call as resolved ~5s after it arrives.

The toggle is saved through the existing `SetRestaurantSettings` flow, but —
exactly like `showWaiterCallButton` was before its fix — the value can't be
read back yet because no admin GET returns it. So on a fresh load the toggle
falls back to its default (ON) and a saved `false` doesn't stick.

## The ask (small, additive — identical shape to `showWaiterCallButton`)

A `bool autoResolveWaiterCalls` on the restaurant entity:

1. **Accept + persist it** on `PUT Restaurants/SetRestaurantSettings`
   (the admin already sends it in the settings payload).
2. **Return it** in the restaurant projection of:
   - `Restaurants/GetmyRestaurants` (the list — the settings form reads from this), and
   - `Restaurants/GetRestaurantById`.
3. Default **true** for existing rows (customers' calls should auto-resolve
   unless the owner turns it off) — mirror how `showWaiterCallButton`
   defaults true.

Emit it camelCase (`autoResolveWaiterCalls`) to match the rest of the list
payload (e.g. `showWaiterCallButton`, `showCategoriesInFront`).

No schema change beyond the additive column; no contract break — one extra
bool on the settings write + two read responses.

## Why it matters to the frontend

The admin's `WaiterCallsProvider` reads each call's restaurant from the
`GetmyRestaurants` cache and uses `restaurant.autoResolveWaiterCalls`
(default true) to decide whether to arm the 5s auto-resolve timer. Until
the field is returned, the provider can only use the default (ON); a
per-restaurant OFF won't take effect across reloads.

## Frontend code references
- Toggle + default: `src/components/restaurant/restaurantSettings.jsx`
  (`autoResolveWaiterCalls: inData?.autoResolveWaiterCalls ?? true`)
- Save thunk: `src/redux/restaurant/setRestaurantSettingsSlice.js`
  (`Restaurants/SetRestaurantSettings`)
- Auto-resolve logic: `src/context/waiterCallsContext.jsx`
  (`isAutoResolveEnabled`, 5s timer in the FCM push effect)
- Read source for the form / provider:
  `src/redux/restaurants/getRestaurantsSlice.js` (`Restaurants/GetmyRestaurants`)

---

## Backend Claude prompt (copy verbatim)

```
Add an additive boolean field `autoResolveWaiterCalls` to the restaurant
entity, mirroring the existing `showWaiterCallButton` exactly:

1. Accept + persist it on PUT /api/Restaurants/SetRestaurantSettings (the
   admin already sends it in the settings payload).
2. Return it in the restaurant projection of GET
   /api/Restaurants/GetmyRestaurants AND GET /api/Restaurants/GetRestaurantById,
   camelCase (`autoResolveWaiterCalls`), same as showWaiterCallButton.
3. Default true for existing rows.

Additive only — no schema change beyond the column, no contract break.
Verify: set it false via SetRestaurantSettings, then GET both endpoints and
confirm they return false.
```
