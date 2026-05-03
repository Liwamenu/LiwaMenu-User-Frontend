import { createApiSlice } from "../createApiSlice";

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
