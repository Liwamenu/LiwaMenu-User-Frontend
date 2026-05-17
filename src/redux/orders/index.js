import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getOrdersSlice from "./getOrdersSlice";
import updateOrderStatusSlice from "./updateOrderStatusSlice";
import deleteOrderSlice from "./deleteOrderSlice";

const ordersSlice = combineReducers({
  get: getOrdersSlice,
  updateStatus: updateOrderStatusSlice,
  delete: deleteOrderSlice,
});

export default ordersSlice;
