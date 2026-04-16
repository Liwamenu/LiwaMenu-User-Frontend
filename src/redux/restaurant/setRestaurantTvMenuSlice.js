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

const setRestaurantTvMenuSlice = createSlice({
  name: "setRestaurantTvMenu",
  initialState,
  reducers: {
    resetSetRestaurantTvMenu: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(setRestaurantTvMenu.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(setRestaurantTvMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(setRestaurantTvMenu.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const setRestaurantTvMenu = createAsyncThunk(
  "Restaurants/SetRestaurantTvMenu",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}Restaurants/UpdateRestaurantTvMenu`,
        data,
      );
      return res.data;
    } catch (err) {
      if (err?.response?.data) {
        throw rejectWithValue(err.response.data);
      }
      throw rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetSetRestaurantTvMenu } = setRestaurantTvMenuSlice.actions;
export default setRestaurantTvMenuSlice.reducer;
