import { privateApi } from "../api";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  data: null,
};

const getRestaurantReservationSettingsSlice = createSlice({
  name: "getRestaurantReservationSettings",
  initialState: initialState,
  reducers: {
    resetGetRestaurantReservationSettingsSlice: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getRestaurantReservationSettings.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.data = null;
      })
      .addCase(getRestaurantReservationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.data = action.payload;
      })
      .addCase(getRestaurantReservationSettings.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const getRestaurantReservationSettings = createAsyncThunk(
  "Restaurants/GetRestaurantReservationSettings",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Restaurants/GetRestaurantReservationSettings`,
        {
          params: {
            restaurantId,
          },
        },
      );

      // console.log(res.data.data);
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

export const { resetGetRestaurantReservationSettingsSlice } =
  getRestaurantReservationSettingsSlice.actions;
export default getRestaurantReservationSettingsSlice.reducer;
