// Hard-delete an order from the backend.
//
// Endpoint: DELETE /api/Orders/DeleteOrder?orderId={id}
// Backend convention is `?orderId=` rather than the generic `?id=`
// (mirrors UpdateOrderStatus on the same controller). If backend
// rejects with "orderId required", that's the spelling that has to
// match — don't switch to `?id=` without coordinating.
//
// Used by:
//   • OrderDetailDrawer's "Sil" button → opens a confirm modal that
//     dispatches this thunk on confirm, then optimistically drops the
//     row from `ordersContext` on success.

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

const deleteOrderSlice = createSlice({
  name: "deleteOrder",
  initialState,
  reducers: {
    resetDeleteOrder: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const deleteOrder = createAsyncThunk(
  "Orders/DeleteOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `${baseURL}Orders/DeleteOrder?orderId=${orderId}`,
      );
      return response.data;
    } catch (error) {
      // `error.response` is undefined on CORS / network failures.
      // Surface a sensible message instead of crashing the thunk —
      // the api interceptor will still toast `message_TR` from the
      // backend when present, this fallback only covers transport
      // errors.
      const payload = error.response?.data || {
        message_TR: "Sipariş silinemedi. Sunucu hatası oluştu.",
        message: "Could not delete order. A server error occurred.",
      };
      return rejectWithValue(payload);
    }
  },
);

export const { resetDeleteOrder } = deleteOrderSlice.actions;
export default deleteOrderSlice.reducer;
