import { combineReducers } from "@reduxjs/toolkit";

import getSambaTablesSlice from "./getSambaTablesSlice";

const sambaTablesSlice = combineReducers({
  get: getSambaTablesSlice,
});

export default sambaTablesSlice;
