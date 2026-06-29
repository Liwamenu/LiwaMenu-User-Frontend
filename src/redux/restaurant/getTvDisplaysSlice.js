// Multi-screen TV displays — GET Restaurants/GetTvDisplays?restaurantId=.
//
// Returns (under the ResponsBase `data` envelope):
//   { restaurantId, tvLicenseCount, displays: [
//       { displayNo, isActive, tvMenuId, pageDurationMs, transitionStyle, name }
//   ] }
//
// Screen 1 is the restaurant's own TV setup (edited on the TV theme page);
// screens 2,3,… are extra licensed screens managed by the "Additional TV
// Screens" card. Read via `s.restaurant.getTvDisplays`.
import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getTvDisplays",
  thunkType: "Restaurants/GetTvDisplays",
  url: "Restaurants/GetTvDisplays",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
});

export const getTvDisplays = slice.thunk;
export const { resetGetTvDisplays, resetGetTvDisplaysState } = slice.actions;
export default slice.reducer;
