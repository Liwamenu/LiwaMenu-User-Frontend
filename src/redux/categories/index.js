import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getCategoriesSlice from "./getCategoriesSlice";
import editCategoriesSlice from "./editCategoriesSlice";
import addCategoriesSlice from "./addCategoriesSlice";
import addCategorySlice from "./addCategorySlice";
import editCategorySlice from "./editCategorySlice";
import deleteCategorySlice from "./deleteCategorySlice";
import reorderCategoryProductsSlice from "./reorderCategoryProductsSlice";

const categoriesSlice = combineReducers({
  get: getCategoriesSlice,
  edit: editCategoriesSlice,
  add: addCategoriesSlice,
  // Sub-slice key was previously misspelled as `addCatergory`. Fixed
  // here + at every consumer (addCategory.jsx selector, t() key) so
  // the typo no longer leaks into the toast text shown to users.
  addCategory: addCategorySlice,
  editCategory: editCategorySlice,
  deleteCategory: deleteCategorySlice,
  // Bulk drag-reorder of products within a category — replaces the
  // legacy "loop N editProduct PUTs" the modal used to do.
  reorderProducts: reorderCategoryProductsSlice,
});

export default categoriesSlice;
