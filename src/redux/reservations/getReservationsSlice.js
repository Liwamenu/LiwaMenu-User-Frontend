import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  reservations: null,
};

const getReservationsSlice = createSlice({
  name: "getReservations",
  initialState,
  reducers: {
    resetGetReservations: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.reservations = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getReservations.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.reservations = null;
      })
      .addCase(getReservations.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.reservations = action.payload;
      })
      .addCase(getReservations.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.reservations = null;
      });
  },
});

export const getReservations = createAsyncThunk(
  "Reservations/OwnerList",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Reservations/OwnerList`, {
        params: data,
      });
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

export const { resetGetReservations } = getReservationsSlice.actions;
export default getReservationsSlice.reducer;
