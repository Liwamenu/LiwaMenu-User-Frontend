// Create one external page (multipart). Callers build a FormData with
// restaurantId, type ("Image" | "Html"), buttonName, and either `image`
// (File) or `htmlBody` (string) depending on type.
//
// On fulfilled, getExternalPagesSlice invalidates its cache (see the
// addMatcher there) so the next list mount will refetch.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "createExternalPage",
  thunkType: "ExternalPages/Create",
  url: "ExternalPages/Create",
  method: "post",
  // ResponsBase wraps the created page under `.data`.
  transform: (res) => res?.data?.data,
  clearOnPending: true,
});

export const createExternalPage = slice.thunk;
export const { resetCreateExternalPageState, resetCreateExternalPage } =
  slice.actions;
export default slice.reducer;
