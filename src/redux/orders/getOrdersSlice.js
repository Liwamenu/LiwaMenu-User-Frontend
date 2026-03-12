import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  orders: null,
};

const getOrdersSlice = createSlice({
  name: "getOrders",
  initialState: initialState,
  reducers: {
    resetGetOrders: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.orders = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getOrders.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.orders = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.orders = action.payload;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.orders = null;
      });
  },
});

export const getOrders = createAsyncThunk(
  "Orders/GetOrders",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Orders/GetOrders/`, {
        params: data,
      });

      // console.log(res.data);
      return res.data.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetOrdersState, resetGetOrders } = getOrdersSlice.actions;
export default getOrdersSlice.reducer;
