// Kiosk theme save — PUTs `{ restaurantId, kioskThemeId }`.
//
// Backend split the previously-merged UpdateRestaurantTheme endpoint
// into three dedicated endpoints (Qr / Tv / Kiosk), each writing only
// its own field on the restaurant entity. This slice targets the
// kiosk-only one — only `kioskThemeId` is written; `themeId` (QR) and
// `tvMenuId` (TV) are untouched.
//
// Before this slice existed, the Kiosk page reused
// `setRestaurantThemeSlice` and wrote `themeId`. After the rename to
// UpdateRestaurantQrTheme that became "save the kiosk pick into the
// QR slot", which silently overwrote the saved QR theme. Splitting
// the slice resolves that — companions: setRestaurantThemeSlice (QR)
// and setRestaurantTvThemeSlice (TV).

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantKioskTheme",
  thunkType: "Restaurants/SetRestaurantKioskTheme",
  url: "Restaurants/UpdateRestaurantKioskTheme",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantKioskTheme = slice.thunk;
export const { resetSetRestaurantKioskTheme } = slice.actions;
export default slice.reducer;
