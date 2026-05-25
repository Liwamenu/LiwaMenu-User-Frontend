import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantSettings",
  // Thunk type kept on the old "SetRestaurantSettings" prefix so the
  // restaurantEntityPatchers list + any cross-slice matcher that
  // already references it keep working. Only the URL moved when the
  // backend renamed the endpoint to UpdateRestaurantSettings (the
  // canonical name in the brief that introduced showWaiterCallButton).
  thunkType: "Restaurants/SetRestaurantSettings",
  url: "Restaurants/UpdateRestaurantSettings",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantSettings = slice.thunk;
export const { resetSetRestaurantSettings } = slice.actions;
export default slice.reducer;
