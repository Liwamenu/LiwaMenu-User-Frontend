// Delete SambaPOS table-name records for a restaurant. Backend contract
// (see SAMBA_TABLES_DELETE_BRIEF): DELETE /api/TableNames/Delete with body
// { restaurantId, names: [...] } — idempotent, scoped to the restaurant.
//
// Uses skipErrorToast so the modal can show its own graceful message
// (incl. a "not deployed yet" fallback on 404/network) instead of the
// generic interceptor toast.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
};

const deleteSambaTablesSlice = createSlice({
  name: "deleteSambaTables",
  initialState,
  reducers: {
    resetDeleteSambaTablesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = false;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(deleteSambaTables.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
      })
      .addCase(deleteSambaTables.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = false;
      })
      .addCase(deleteSambaTables.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const deleteSambaTables = createAsyncThunk(
  "TableNames/Delete",
  async ({ restaurantId, names }, { rejectWithValue }) => {
    try {
      const res = await api.delete(`${baseURL}TableNames/Delete`, {
        data: { restaurantId, names },
        skipErrorToast: true,
      });
      return res?.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message, status: err?.response?.status ?? 0 });
    }
  },
);

export const { resetDeleteSambaTablesState } = deleteSambaTablesSlice.actions;
export default deleteSambaTablesSlice.reducer;
