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

const createReceiptLicensePaymentSlice = createSlice({
  name: "createReceiptLicensePayment",
  initialState: initialState,
  reducers: {
    resetCreateReceiptLicensePayment: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(createReceiptLicensePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(createReceiptLicensePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(createReceiptLicensePayment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const createReceiptLicensePayment = createAsyncThunk(
  "Payments/CreateReceiptLicensePayment",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${baseURL}Payments/CreateReceiptLicensePayment`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log(res);
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

export const { resetCreateReceiptLicensePayment } =
  createReceiptLicensePaymentSlice.actions;
export default createReceiptLicensePaymentSlice.reducer;
