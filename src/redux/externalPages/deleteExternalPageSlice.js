// Delete one external page by id. Path-param URL, no body — can't use the
// factory cleanly (it would pass the arg as either body or query params).

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

export const deleteExternalPage = createAsyncThunk(
  "ExternalPages/Delete",
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await api.delete(`${baseURL}ExternalPages/Delete/${id}`);
      return res?.data?.data ?? true;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

const deleteExternalPageSlice = createSlice({
  name: "deleteExternalPage",
  initialState,
  reducers: {
    resetDeleteExternalPageState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetDeleteExternalPage: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteExternalPage.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(deleteExternalPage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(deleteExternalPage.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const { resetDeleteExternalPageState, resetDeleteExternalPage } =
  deleteExternalPageSlice.actions;
export default deleteExternalPageSlice.reducer;
