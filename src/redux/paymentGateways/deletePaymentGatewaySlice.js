// Delete a payment-gateway config row.
//
// Endpoint: `DELETE /api/PaymentGateways/Delete/{id}?restaurantId=`
// Arg shape: `{ id, restaurantId }`. The id is a path segment and the
// restaurantId is a query param — handled directly with axios because
// `createApiSlice`'s params-mode would re-include the id as a duplicate
// query string.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
};

export const deletePaymentGateway = createAsyncThunk(
  "PaymentGateways/Delete",
  async ({ id, restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.delete(
        `${baseURL}PaymentGateways/Delete/${id}`,
        { params: { restaurantId } },
      );
      return res?.data ?? null;
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

const slice = createSlice({
  name: "deletePaymentGateway",
  initialState,
  reducers: {
    resetDeletePaymentGateway: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(deletePaymentGateway.pending, (s) => {
      s.loading = true;
      s.success = false;
      s.error = null;
    })
      .addCase(deletePaymentGateway.fulfilled, (s) => {
        s.loading = false;
        s.success = true;
        s.error = null;
      })
      .addCase(deletePaymentGateway.rejected, (s, a) => {
        s.loading = false;
        s.success = false;
        s.error = a.payload;
      });
  },
});

export const { resetDeletePaymentGateway } = slice.actions;
export default slice.reducer;
