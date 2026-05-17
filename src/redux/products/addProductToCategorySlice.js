// Per-product, per-category junction add — the "true many-to-many"
// counterpart of the legacy editProduct flow that overloaded
// categoryId as a single-cat move.
//
// Endpoint: POST /api/Products/{productId}/Categories
// Body:     { categoryId, subCategoryId: null|string }
// Response: 200 with the product's updated `categories` array
//           400 if the (productId, categoryId) pair already exists
//           400 if subCategoryId doesn't belong to categoryId
//
// Used by the "Ürünleri Yönet" modal's "Ekle" button when the
// backend supports the many-to-many model. Before the cutover,
// the modal still dispatches editProduct as a move — once this
// thunk's type appears in the invalidation matchers of the read
// slices (already wired), every downstream consumer refetches
// after a successful link.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const addProductToCategorySlice = createSlice({
  name: "addProductToCategory",
  initialState,
  reducers: {
    resetAddProductToCategory: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(addProductToCategory.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(addProductToCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(addProductToCategory.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

/**
 * Dispatch:
 *   addProductToCategory({ productId, categoryId, subCategoryId?: string|null })
 *
 * `productId` is path-segmented into the URL; everything else goes
 * in the JSON body. Resolves with the updated product DTO so
 * callers (and the cross-slice invalidators) can react to the new
 * categories array without a follow-up GET.
 */
export const addProductToCategory = createAsyncThunk(
  "Products/AddProductToCategory",
  async ({ productId, categoryId, subCategoryId = null }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${baseURL}Products/${productId}/Categories`,
        { categoryId, subCategoryId },
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetAddProductToCategory } = addProductToCategorySlice.actions;
export default addProductToCategorySlice.reducer;
