import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  payments: null,
};

const getPaymentsSlice = createSlice({
  name: "getPayments",
  initialState: initialState,
  reducers: {
    resetGetPaymentsState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetPayments: (state) => {
      state.payments = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getPayments.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.payments = null;
      })
      .addCase(getPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.payments = action.payload;
      })
      .addCase(getPayments.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.payments = null;
      });
  },
});

export const getPayments = createAsyncThunk(
  "Payments/GetMyPayments",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Payments/GetMyPayments`, {
        params: data,
      });

      // console.log(res.data);
      return res.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetPaymentsState, resetGetPayments } =
  getPaymentsSlice.actions;
export default getPaymentsSlice.reducer;
