import { combineReducers } from "@reduxjs/toolkit";
import getPaymentsSlice from "./getPaymentsSlice";

// Slices
const paymentsSlice = combineReducers({
  get: getPaymentsSlice,
});

export default paymentsSlice;
