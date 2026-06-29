// Remove one extra TV screen's config (displayNo >= 2) —
// DELETE Restaurants/DeleteTvDisplay?restaurantId=&displayNo=.
//
// Arg shape: { restaurantId, displayNo } → sent as query params (createApiSlice
// defaults delete to params mode). Returns the refreshed displays list under
// the ResponsBase `data` envelope.
import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "deleteTvDisplay",
  thunkType: "Restaurants/DeleteTvDisplay",
  url: "Restaurants/DeleteTvDisplay",
  method: "delete",
  transform: (res) => res?.data?.data,
  errorIdle: null,
});

export const deleteTvDisplay = slice.thunk;
export const { resetDeleteTvDisplay, resetDeleteTvDisplayState } =
  slice.actions;
export default slice.reducer;
