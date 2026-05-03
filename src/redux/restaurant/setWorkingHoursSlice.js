import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setWorkingHours",
  thunkType: "Restaurants/setWorkingHours",
  url: "Restaurants/SetWorkingHours",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setWorkingHours = slice.thunk;
export const { resetSetWorkingHours } = slice.actions;
export default slice.reducer;
