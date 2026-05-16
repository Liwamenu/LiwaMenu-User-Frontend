import { combineReducers } from "@reduxjs/toolkit";

import getAllergens from "./getAllergensSlice";
import updateProductAllergens from "./updateProductAllergensSlice";

const allergensSlice = combineReducers({
  get: getAllergens,
  update: updateProductAllergens,
});

export default allergensSlice;
