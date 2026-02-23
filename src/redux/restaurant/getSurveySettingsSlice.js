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

const getSurveySettingsSlice = createSlice({
  name: "getSurveySettings",
  initialState: initialState,
  reducers: {
    resetGetSurveySettings: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getSurveySettings.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.data = null;
      })
      .addCase(getSurveySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.data = action.payload;
      })
      .addCase(getSurveySettings.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const getSurveySettings = createAsyncThunk(
  "Restaurants/GetSurveySettings",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Restaurants/GetSurveySettings`, {
        params: {
          restaurantId,
        },
      });

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

export const { resetGetSurveySettings } = getSurveySettingsSlice.actions;
export default getSurveySettingsSlice.reducer;
