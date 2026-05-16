// Master allergens catalog — 14 fixed entries served by
// `GET /api/Allergens/GetMasterCatalog?lang=`.
//
// Each entry: `{ code, displayName, sortOrder, includes }`
//   • `code`        — stable id used by the write endpoint (e.g.
//                     "gluten", "crustaceans"). See AllergensPicker.
//   • `displayName` — localized to the `lang` query (tr / en / …).
//   • `includes`    — sub-category tooltip; backend returns this in
//                     Turkish regardless of `lang` per spec.
//   • `sortOrder`   — render order for the picker.
//
// Cached by `fetchedFor === lang` so a UI language switch triggers
// exactly one refetch and same-language revisits are no-ops.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  allergens: null,
  fetchedFor: null,
};

const getAllergensSlice = createSlice({
  name: "getAllergens",
  initialState,
  reducers: {
    resetGetAllergens: (state) => {
      state.allergens = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getAllergens.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
      })
      .addCase(getAllergens.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.allergens = action.payload;
        state.fetchedFor = action.meta?.arg?.lang ?? null;
      })
      .addCase(getAllergens.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const getAllergens = createAsyncThunk(
  "Allergens/GetMasterCatalog",
  // Destructure `lang` so loadingMiddleware control flags like
  // `__silent` can't leak to the backend as a query param.
  async ({ lang }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Allergens/GetMasterCatalog`, {
        params: { lang },
      });
      return res.data?.data || res.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetAllergens } = getAllergensSlice.actions;
export default getAllergensSlice.reducer;
