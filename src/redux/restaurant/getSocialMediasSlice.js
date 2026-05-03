import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getSocialMedias",
  thunkType: "Restaurants/GetSocialMedias",
  url: "Restaurants/GetSocialLinks",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getSocialMedias = slice.thunk;
export const { resetGetSocialMedias } = slice.actions;
export default slice.reducer;
