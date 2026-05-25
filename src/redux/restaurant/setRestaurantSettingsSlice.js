import { createApiSlice } from "../createApiSlice";

// The Genel Ayarlar save goes through this slice. The recent backend
// "license split + waiter-call toggle" brief mentioned the endpoint
// as `Restaurants/UpdateRestaurantSettings` — that name returns 404
// in the deployed backend (likely renamed in docs only). The
// long-standing `SetRestaurantSettings` URL is what's actually
// listening, so we keep using it. If a future backend deploy
// renames it for real, swap the url here (thunkType stays stable
// so cross-slice matchers + restaurantEntityPatchers keep working).
const slice = createApiSlice({
  name: "setRestaurantSettings",
  thunkType: "Restaurants/SetRestaurantSettings",
  url: "Restaurants/SetRestaurantSettings",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantSettings = slice.thunk;
export const { resetSetRestaurantSettings } = slice.actions;
export default slice.reducer;
