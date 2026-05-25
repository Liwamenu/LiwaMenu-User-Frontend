// QR theme save — POSTs `{ restaurantId, themeId }`.
//
// Backend split the single Restaurants/UpdateRestaurantTheme into two
// dedicated endpoints (UpdateRestaurantQrTheme + UpdateRestaurantTvTheme)
// after a footgun where the TV save would null out the QR theme by
// echoing back an unfilled themeId. The TV path now lives in
// setRestaurantTvThemeSlice; this slice is the QR-only writer.
//
// Preserves the original thunkType "Restaurants/SetRestaurantTheme" so
// the cross-slice matcher in restaurantEntityPatchers keeps working,
// and keeps the same export name `resetSetRestaurantTheme` so existing
// callers don't need to change.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantTheme",
  thunkType: "Restaurants/SetRestaurantTheme",
  url: "Restaurants/UpdateRestaurantQrTheme",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantTheme = slice.thunk;
export const { resetSetRestaurantTheme } = slice.actions;
export default slice.reducer;
