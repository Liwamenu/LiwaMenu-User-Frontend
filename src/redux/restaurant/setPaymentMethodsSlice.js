import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "setPaymentMethods",
  thunkType: "Restaurants/SetPaymentMethods",
  url: "Restaurants/SetPaymentMethods",
  method: "put",
  errorIdle: null,
  clearOnPending: true,
});

export const setPaymentMethods = slice.thunk;
export const { resetSetPaymentMethods } = slice.actions;
export default slice.reducer;
