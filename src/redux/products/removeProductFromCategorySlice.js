// Per-product, per-category junction delete — the inverse of
// addProductToCategory. Used by the "Ürünleri Yönet" modal when
// the user wants to drop a product from this category WITHOUT
// deleting the product entirely.
//
// Endpoint: DELETE /api/Products/{productId}/Categories/{categoryId}
// Response: 200 with the product's updated `categories` array
//           400 "Ürün en az bir kategoride olmalıdır." when this
//                would leave the product orphaned (zero categories).
//
// Backend guards against orphaning, so callers can dispatch without
// checking the membership count first — the failure is surfaced via
// the localized error message which the global axios toaster picks
// up automatically.

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

const removeProductFromCategorySlice = createSlice({
  name: "removeProductFromCategory",
  initialState,
  reducers: {
    resetRemoveProductFromCategory: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(removeProductFromCategory.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(removeProductFromCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(removeProductFromCategory.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

/**
 * Dispatch:
 *   removeProductFromCategory({ productId, categoryId })
 *
 * Both IDs land in the URL path; no body. Resolves with the
 * product's updated categories array.
 */
export const removeProductFromCategory = createAsyncThunk(
  "Products/RemoveProductFromCategory",
  async ({ productId, categoryId }, { rejectWithValue }) => {
    try {
      const res = await api.delete(
        `${baseURL}Products/${productId}/Categories/${categoryId}`,
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetRemoveProductFromCategory } =
  removeProductFromCategorySlice.actions;
export default removeProductFromCategorySlice.reducer;
