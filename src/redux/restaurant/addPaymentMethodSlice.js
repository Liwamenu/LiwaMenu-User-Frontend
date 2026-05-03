import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "addPaymentMethod",
  thunkType: "Restaurants/AddPaymentMethod",
  url: "Restaurants/AddPaymentMethod",
  method: "post",
  errorIdle: null,
  clearOnPending: true,
});

export const addPaymentMethod = slice.thunk;
export const { resetAddPaymentMethod } = slice.actions;
export default slice.reducer;
