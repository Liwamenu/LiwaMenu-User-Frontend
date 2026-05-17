// Drag-reorder products within a single category — the bulk
// counterpart of the legacy per-product editProduct sortOrder
// dispatches the "Ürünleri Yönet" modal used to loop through.
//
// Endpoint: PUT /api/Categories/{categoryId}/ProductOrder
// Body:     { productIds: [uuid, uuid, ...] }
//           Must include EVERY product currently in the category,
//           exactly once, in the desired order. Server assigns
//           sortOrder = 0, 1, 2, ... for each (productId, this
//           categoryId) junction row.
// Response: 200 (no body of consequence; modal already holds the
//           authoritative order).
//           400 if `productIds` doesn't match the category's
//           current membership set.
//
// Significantly faster than dispatching N editProduct PUTs (one
// per moved row) and avoids the partial-failure surface that the
// loop had — either the whole order saves, or nothing does.

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

const reorderCategoryProductsSlice = createSlice({
  name: "reorderCategoryProducts",
  initialState,
  reducers: {
    resetReorderCategoryProducts: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(reorderCategoryProducts.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(reorderCategoryProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(reorderCategoryProducts.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

/**
 * Dispatch:
 *   reorderCategoryProducts({ categoryId, productIds: [...] })
 *
 * `categoryId` is path-segmented into the URL; `productIds` is the
 * single body field. Send the full ordered list of every product
 * currently in the category — backend rejects partial lists with 400.
 */
export const reorderCategoryProducts = createAsyncThunk(
  "Categories/UpdateProductOrder",
  async ({ categoryId, productIds }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}Categories/${categoryId}/ProductOrder`,
        { productIds },
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetReorderCategoryProducts } =
  reorderCategoryProductsSlice.actions;
export default reorderCategoryProductsSlice.reducer;
