import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getWorkingHours",
  thunkType: "Restaurants/GetWorkingHours",
  url: "Restaurants/GetWorkingHours",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getWorkingHours = slice.thunk;
export const { resetGetWorkingHours } = slice.actions;
export default slice.reducer;
