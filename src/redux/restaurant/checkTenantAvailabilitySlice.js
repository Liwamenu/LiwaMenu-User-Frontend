import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "checkTenantAvailability",
  thunkType: "Restaurants/CheckTenantNameAvailability",
  url: "Restaurants/CheckTenantNameAvailability",
  method: "get",
  errorIdle: null,
  clearOnPending: true,
});

export const checkTenantAvailability = slice.thunk;
export const { resetCheckTenantAvailability } = slice.actions;
export default slice.reducer;
