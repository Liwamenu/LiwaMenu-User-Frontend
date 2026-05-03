import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getPaymentMethods",
  thunkType: "Restaurants/GetPaymentMethods",
  url: "Restaurants/GetPaymentMethods",
  method: "get",
  transform: (res) => res?.data?.data,
  errorIdle: null,
  clearOnPending: true,
});

export const getPaymentMethods = slice.thunk;
export const { resetGetPaymentMethods } = slice.actions;
export default slice.reducer;
