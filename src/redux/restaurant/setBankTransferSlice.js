// Save the restaurant's global "Bankaya Transfer" (bank transfer) config:
// the enabled flag + a single bank account (name / account holder / IBAN).
// Stored on the restaurant entity; see BANK_TRANSFER_BRIEF for the backend
// contract. Uses skipErrorToast so the Payment Methods tab can show its own
// "not deployed yet" message on a 404 instead of the generic interceptor toast.
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
};

const setBankTransferSlice = createSlice({
  name: "setBankTransfer",
  initialState,
  reducers: {
    resetSetBankTransfer: (state) => {
      state.loading = false;
      state.success = false;
      state.error = false;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(setBankTransfer.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
      })
      .addCase(setBankTransfer.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = false;
      })
      .addCase(setBankTransfer.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const setBankTransfer = createAsyncThunk(
  "Restaurants/SetBankTransfer",
  async (
    {
      restaurantId,
      bankTransferEnabled,
      bankName,
      bankAccountHolder,
      iban,
      bankTransferNote,
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.put(
        `${baseURL}Restaurants/SetBankTransfer`,
        {
          restaurantId,
          bankTransferEnabled,
          bankName,
          bankAccountHolder,
          iban,
          bankTransferNote,
        },
        { skipErrorToast: true },
      );
      return res?.data;
    } catch (err) {
      const status = err?.response?.status ?? 0;
      if (err?.response?.data) {
        return rejectWithValue({ ...err.response.data, status });
      }
      return rejectWithValue({ message_TR: err.message, status });
    }
  },
);

export const { resetSetBankTransfer } = setBankTransferSlice.actions;
export default setBankTransferSlice.reducer;
