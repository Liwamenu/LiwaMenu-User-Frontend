import { combineReducers } from "@reduxjs/toolkit";

import getExternalPagesSlice from "./getExternalPagesSlice";
import createExternalPageSlice from "./createExternalPageSlice";
import updateExternalPageSlice from "./updateExternalPageSlice";
import deleteExternalPageSlice from "./deleteExternalPageSlice";
import reorderExternalPagesSlice from "./reorderExternalPagesSlice";

const externalPagesSlice = combineReducers({
  get: getExternalPagesSlice,
  create: createExternalPageSlice,
  update: updateExternalPageSlice,
  delete: deleteExternalPageSlice,
  reorder: reorderExternalPagesSlice,
});

export default externalPagesSlice;
