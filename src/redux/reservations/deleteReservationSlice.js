// Hard-delete a reservation from the backend.
//
// Endpoint: DELETE /api/Reservations/DeleteReservation?reservationId={id}
// Backend convention is `?reservationId=` to mirror the existing
// UpdateReservationStatus payload which takes
// `{ reservationId, status, note }` in its body. If backend rejects
// with "reservationId required", that's the spelling that has to
// match — don't switch to `?id=` without coordinating.
//
// Used by:
//   • ReservationsPage's per-row delete button → opens a confirm
//     modal that dispatches this thunk on confirm, then drops the
//     row from `reservationsContext` on success.

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

const deleteReservationSlice = createSlice({
  name: "deleteReservation",
  initialState,
  reducers: {
    resetDeleteReservation: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteReservation.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(deleteReservation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(deleteReservation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const deleteReservation = createAsyncThunk(
  "Reservations/DeleteReservation",
  async (reservationId, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `${baseURL}Reservations/DeleteReservation?reservationId=${reservationId}`,
      );
      return response.data;
    } catch (error) {
      const payload = error.response?.data || {
        message_TR: "Rezervasyon silinemedi. Sunucu hatası oluştu.",
        message: "Could not delete reservation. A server error occurred.",
      };
      return rejectWithValue(payload);
    }
  },
);

export const { resetDeleteReservation } = deleteReservationSlice.actions;
export default deleteReservationSlice.reducer;
