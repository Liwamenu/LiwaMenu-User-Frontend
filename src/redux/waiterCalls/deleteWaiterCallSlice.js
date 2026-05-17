// Hard-delete a waiter call from the backend.
//
// Endpoint: DELETE /api/Notifications/DeleteWaiterCall?waiterCallId={id}
// Backend convention is `?waiterCallId=` to mirror the existing
// ResolveWaiterCall payload which takes `{ waiterCallId }` in its
// body. If backend rejects with "waiterCallId required", that's the
// spelling that has to match — don't switch to `?id=` without
// coordinating.
//
// Used by:
//   • WaiterCallsPage's per-row delete button → opens a confirm
//     modal that dispatches this thunk on confirm, then drops the
//     row from `waiterCallsContext` on success.

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

const deleteWaiterCallSlice = createSlice({
  name: "deleteWaiterCall",
  initialState,
  reducers: {
    resetDeleteWaiterCall: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteWaiterCall.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(deleteWaiterCall.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(deleteWaiterCall.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const deleteWaiterCall = createAsyncThunk(
  "Notifications/DeleteWaiterCall",
  async (waiterCallId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `${baseURL}Notifications/DeleteWaiterCall?waiterCallId=${waiterCallId}`,
      );
      return response.data;
    } catch (error) {
      const payload = error.response?.data || {
        message_TR: "Garson çağrısı silinemedi. Sunucu hatası oluştu.",
        message: "Could not delete waiter call. A server error occurred.",
      };
      return rejectWithValue(payload);
    }
  },
);

export const { resetDeleteWaiterCall } = deleteWaiterCallSlice.actions;
export default deleteWaiterCallSlice.reducer;
