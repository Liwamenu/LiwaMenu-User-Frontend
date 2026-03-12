import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getOrdersSlice from "./getOrdersSlice";
import updateOrderStatusSlice from "./updateOrderStatusSlice";

const ordersSlice = combineReducers({
  get: getOrdersSlice,
  updateStatus: updateOrderStatusSlice,
});

export default ordersSlice;
