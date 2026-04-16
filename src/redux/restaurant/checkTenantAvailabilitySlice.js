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

const checkTenantAvailabilitySlice = createSlice({
  name: "checkTenantAvailability",
  initialState,
  reducers: {
    resetCheckTenantAvailability: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(checkTenantAvailability.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(checkTenantAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(checkTenantAvailability.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const checkTenantAvailability = createAsyncThunk(
  "Restaurants/CheckTenantNameAvailability",
  async (tenantName, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Restaurants/CheckTenantNameAvailability`,
        {
          params: { name: tenantName },
        },
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

export const { resetCheckTenantAvailability } =
  checkTenantAvailabilitySlice.actions;
export default checkTenantAvailabilitySlice.reducer;
