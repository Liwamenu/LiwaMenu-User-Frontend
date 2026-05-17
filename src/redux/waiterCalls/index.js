import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getWaiterCallsSlice from "./getWaiterCallsSlice";
import resolveWaiterCallSlice from "./resolveWaiterCallSlice";
import deleteWaiterCallSlice from "./deleteWaiterCallSlice";

const waiterCallsSlice = combineReducers({
  get: getWaiterCallsSlice,
  resolve: resolveWaiterCallSlice,
  delete: deleteWaiterCallSlice,
});

export default waiterCallsSlice;
