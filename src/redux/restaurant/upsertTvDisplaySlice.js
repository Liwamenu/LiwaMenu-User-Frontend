// Create or replace one extra TV screen (displayNo >= 2) —
// PUT Restaurants/UpsertTvDisplay.
//
// Upsert is a FULL save of the screen (not a patch): the body carries the
// complete config every time:
//   { restaurantId, displayNo, tvMenuId, pageDurationMs, transitionStyle, name }
// Returns the refreshed displays list (same shape as GetTvDisplays) under
// the ResponsBase `data` envelope — the manager refetches GetTvDisplays on
// success so the list has a single source of truth.
import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "upsertTvDisplay",
  thunkType: "Restaurants/UpsertTvDisplay",
  url: "Restaurants/UpsertTvDisplay",
  method: "put",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const upsertTvDisplay = slice.thunk;
export const { resetUpsertTvDisplay, resetUpsertTvDisplayState } =
  slice.actions;
export default slice.reducer;
