import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getRestaurantReservationSettings",
  thunkType: "Restaurants/GetRestaurantReservationSettings",
  url: "Restaurants/GetRestaurantReservationSettings",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getRestaurantReservationSettings = slice.thunk;
// Original slice exported a "...Slice"-suffixed reset action — keep the alias.
export const {
  resetGetRestaurantReservationSettings:
    resetGetRestaurantReservationSettingsSlice,
} = slice.actions;
export default slice.reducer;
