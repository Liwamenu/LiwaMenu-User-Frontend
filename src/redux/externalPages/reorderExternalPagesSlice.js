// Reorder external pages. Body: { restaurantId, orderedIds: string[] }.
// Server assigns sortOrder = 0, 1, 2, ... in the given order.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "reorderExternalPages",
  thunkType: "ExternalPages/Reorder",
  url: "ExternalPages/Reorder",
  method: "put",
  transform: (res) => res?.data?.data ?? true,
  clearOnPending: true,
});

export const reorderExternalPages = slice.thunk;
export const { resetReorderExternalPagesState, resetReorderExternalPages } =
  slice.actions;
export default slice.reducer;
