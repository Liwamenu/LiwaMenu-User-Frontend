// Migrated to createApiSlice (see src/redux/createApiSlice.js).
// Preserves the original thunkType "Restaurants/SetRestaurantTheme" so the
// cross-slice matcher in restaurantEntityPatchers keeps working, and keeps
// the same export name `resetSetRestaurantTheme` so existing callers don't
// need to change.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantTheme",
  thunkType: "Restaurants/SetRestaurantTheme",
  url: "Restaurants/UpdateRestaurantTheme",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantTheme = slice.thunk;
export const { resetSetRestaurantTheme } = slice.actions;
export default slice.reducer;
