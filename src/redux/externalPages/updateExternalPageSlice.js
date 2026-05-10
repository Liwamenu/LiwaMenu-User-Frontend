// Update one external page (multipart, partial). Callers pass
//   { id, body }  where body is a FormData containing any subset of
// buttonName / image / htmlBody / sortOrder. The endpoint URL takes the
// id as a path segment, so this slice can't use the factory (the factory
// passes the whole arg as the request body).

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

export const updateExternalPage = createAsyncThunk(
  "ExternalPages/Update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}ExternalPages/Update/${id}`,
        body,
      );
      return res?.data?.data;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

const updateExternalPageSlice = createSlice({
  name: "updateExternalPage",
  initialState,
  reducers: {
    resetUpdateExternalPageState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetUpdateExternalPage: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateExternalPage.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(updateExternalPage.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(updateExternalPage.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const { resetUpdateExternalPageState, resetUpdateExternalPage } =
  updateExternalPageSlice.actions;
export default updateExternalPageSlice.reducer;
