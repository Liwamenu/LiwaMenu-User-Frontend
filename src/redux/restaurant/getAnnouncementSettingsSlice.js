import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getAnnouncementSettings",
  thunkType: "Restaurants/GetAnnouncementSettings",
  url: "Restaurants/GetAnnouncementSettings",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getAnnouncementSettings = slice.thunk;
// Original slice exported a "...Slice"-suffixed reset action — keep the
// alias so callers (`dispatch(resetGetAnnouncementSettingsSlice())`) work.
export const {
  resetGetAnnouncementSettings: resetGetAnnouncementSettingsSlice,
} = slice.actions;
export default slice.reducer;
