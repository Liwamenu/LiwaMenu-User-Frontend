import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setAnnouncementSettings",
  thunkType: "Restaurants/SetAnnouncementSettings",
  url: "Restaurants/SetAnnouncementSettings",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setAnnouncementSettings = slice.thunk;
// Original slice exported a "...Slice"-suffixed reset action — keep the alias.
export const {
  resetSetAnnouncementSettings: resetSetAnnouncementSettingsSlice,
} = slice.actions;
export default slice.reducer;
