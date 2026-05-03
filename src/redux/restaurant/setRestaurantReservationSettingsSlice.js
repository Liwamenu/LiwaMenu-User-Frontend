import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setRestaurantReservationSettings",
  thunkType: "Restaurants/SetRestaurantReservationSettings",
  url: "Restaurants/SetRestaurantReservationSettings",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setRestaurantReservationSettings = slice.thunk;
export const { resetSetRestaurantReservationSettings } = slice.actions;
export default slice.reducer;
