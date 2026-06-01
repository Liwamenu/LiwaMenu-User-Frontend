import { combineReducers } from "@reduxjs/toolkit";
import getPaymentGatewaysSlice from "./getPaymentGatewaysSlice";
import upsertPaymentGatewaySlice from "./upsertPaymentGatewaySlice";
import deletePaymentGatewaySlice from "./deletePaymentGatewaySlice";

const paymentGatewaysSlice = combineReducers({
  get: getPaymentGatewaysSlice,
  upsert: upsertPaymentGatewaySlice,
  delete: deletePaymentGatewaySlice,
});

export default paymentGatewaysSlice;
