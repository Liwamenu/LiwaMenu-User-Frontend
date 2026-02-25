import { combineReducers } from "@reduxjs/toolkit";

// Slices
import addOrderTagSlice from "./addOrderTagSlice";
import editOrderTagSlice from "./editOrderTagSlice";
import getOrderTagsSlice from "./getOrderTagsSlice";
import editOrderTagsSlice from "./editOrderTagsSlice";
import deleteOrderTagSlice from "./deleteOrderTagSlice";

const orderTagsSlice = combineReducers({
  get: getOrderTagsSlice,
  add: addOrderTagSlice,
  edit: editOrderTagSlice,
  delete: deleteOrderTagSlice,
  editAll: editOrderTagsSlice,
});

export default orderTagsSlice;
