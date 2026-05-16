// Save a product's allergen selections to the backend.
//
//   PUT /api/Products/{productId}/Allergens
//   Body: { allergens: [{ code, presence }, …] }
//     • code     — master allergen code (see getAllergensSlice).
//     • presence — "contains" | "mayContain".
//     • An empty array means "clear all allergens" — only send it
//       when that's the intended outcome.
//     • Sending the same code twice returns 400.
//
// The response echoes the persisted list back via `data.allergens`,
// so a successful save is verifiable client-side.
//
// `Products/getProductsByCategoryIdSlice` plus the lite / paginated
// product caches invalidate on `Products/UpdateProductAllergens/
// fulfilled` so subsequent reads pick up the new allergens without
// a hard refresh.

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

const updateProductAllergensSlice = createSlice({
  name: "updateProductAllergens",
  initialState,
  reducers: {
    resetUpdateProductAllergens: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(updateProductAllergens.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(updateProductAllergens.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(updateProductAllergens.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const updateProductAllergens = createAsyncThunk(
  "Products/UpdateProductAllergens",
  async ({ productId, allergens }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}Products/${productId}/Allergens`,
        { allergens },
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetUpdateProductAllergens } =
  updateProductAllergensSlice.actions;
export default updateProductAllergensSlice.reducer;
