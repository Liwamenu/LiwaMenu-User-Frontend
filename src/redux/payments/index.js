import { combineReducers } from "@reduxjs/toolkit";
import createReceiptLicensePaymentSlice from "./createReceiptLicensePaymentSlice";
import getPaymentsSlice from "./getPaymentsSlice";

// Slices
const paymentsSlice = combineReducers({
  get: getPaymentsSlice,
  createReceiptLicensePayment: createReceiptLicensePaymentSlice,
});

export default paymentsSlice;
