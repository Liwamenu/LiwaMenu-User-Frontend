import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setSocialMedias",
  thunkType: "Restaurants/SetSocialMedias",
  url: "Restaurants/SetSocialLinks",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setSocialMedias = slice.thunk;
export const { resetSetSocialMedias } = slice.actions;
export default slice.reducer;
