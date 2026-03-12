import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
};

const updateOrderStatusSlice = createSlice({
  name: "updateOrderStatus",
  initialState,
  reducers: {
    resetUpdateOrderStatus: (state) => {
      state.loading = false;
      state.success = false;
      state.error = false;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
      })
      .addCase(updateOrderStatus.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = false;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const updateOrderStatus = createAsyncThunk(
  "Orders/UpdateOrderStatus",
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}Orders/UpdateOrderStatus?orderId=${orderId}`,
        { status },
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetUpdateOrderStatus } = updateOrderStatusSlice.actions;
export default updateOrderStatusSlice.reducer;
