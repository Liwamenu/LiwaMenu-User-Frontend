import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import { normalizeKeysDeep } from "../../utils/normalizeKeys";

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

      // Defensive PascalCase → camelCase normalization at the slice
      // boundary, matching the FCM push handler in ordersContext.jsx.
      // Without this, an order whose backend payload arrives with
      // `Items` / `OrderItems` / etc. would render with an empty body
      // in OrderDetailDrawer (the section guards on `order.items`).
      // Top-level fields like `subTotal` / `totalAmount` happen to
      // already arrive lowercased today, but the items array under
      // each row is the one most likely to ship mixed-case from a
      // .NET endpoint that hasn't enforced JSON naming policy.
      return normalizeKeysDeep(res.data);
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
