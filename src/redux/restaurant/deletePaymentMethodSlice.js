import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "deletePaymentMethod",
  thunkType: "Restaurants/DeletePaymentMethod",
  url: "Restaurants/DeletePaymentMethod",
  method: "delete",
  errorIdle: null,
  clearOnPending: true,
});

export const deletePaymentMethod = slice.thunk;
export const { resetDeletePaymentMethod } = slice.actions;
export default slice.reducer;
