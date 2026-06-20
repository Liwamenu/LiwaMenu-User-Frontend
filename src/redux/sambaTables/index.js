import { combineReducers } from "@reduxjs/toolkit";

import getSambaTablesSlice from "./getSambaTablesSlice";
import deleteSambaTablesSlice from "./deleteSambaTablesSlice";

const sambaTablesSlice = combineReducers({
  get: getSambaTablesSlice,
  del: deleteSambaTablesSlice,
});

export default sambaTablesSlice;
