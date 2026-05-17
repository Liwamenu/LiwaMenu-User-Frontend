import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getProductsByCategoryIdSlice from "./getProductsByCategoryIdSlice";
import getProductsSlice from "./getProductsSlice";
import getProductsLiteSlice from "./getProductsLiteSlice";
import updatePriceListSlice from "./updatePriceListSlice";
import addProductSlice from "./addProductSlice";
import editProductSlice from "./editProductSlice";
import deleteProductSlice from "./deleteProductSlice";
import priceListApplyBulkSlice from "./priceListApplyBulkSlice";
import addProductToCategorySlice from "./addProductToCategorySlice";
import removeProductFromCategorySlice from "./removeProductFromCategorySlice";

const productsSlice = combineReducers({
  get: getProductsSlice,
  // Lite (id+name+categoryId+portions) list — used by Order Tags and
  // any other consumer that only needs dropdown data, not the full
  // product DTO. See getProductsLiteSlice.js for the cache contract.
  getLite: getProductsLiteSlice,
  add: addProductSlice,
  edit: editProductSlice,
  delete: deleteProductSlice,
  getByCategoryId: getProductsByCategoryIdSlice,
  updatePriceList: updatePriceListSlice,
  applyPriceListBulk: priceListApplyBulkSlice,
  // Per-product, per-category junction mutations — the many-to-many
  // counterparts of the single-cat editProduct overload.
  addToCategory: addProductToCategorySlice,
  removeFromCategory: removeProductFromCategorySlice,
});

export default productsSlice;
