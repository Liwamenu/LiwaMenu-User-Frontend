// TV menu theme save — POSTs `{ restaurantId, tvMenuId }`.
//
// Backend now ships dedicated endpoints for QR vs TV
// (UpdateRestaurantQrTheme + UpdateRestaurantTvTheme). This slice
// targets the TV-only one — only `tvMenuId` is written, `themeId`
// (the QR field) is untouched. Previously both sides hit the
// merged UpdateRestaurantTheme endpoint with one field omitted,
// which the backend silently nulled — picking a TV theme would
// switch the QR theme back to default. Split resolves that.
//
// Companion slice for QR: setRestaurantThemeSlice.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantTvTheme",
  thunkType: "Restaurants/SetRestaurantTvTheme",
  url: "Restaurants/UpdateRestaurantTvTheme",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantTvTheme = slice.thunk;
export const { resetSetRestaurantTvTheme } = slice.actions;
export default slice.reducer;
