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
const setSurveySettingsSlice = createSlice({
  name: "setSurveySettings",
  initialState: initialState,
  reducers: {
    resetSetSurveySettings: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(setSurveySettings.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(setSurveySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(setSurveySettings.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const setSurveySettings = createAsyncThunk(
  "Restaurants/SetSurveySettings",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}Restaurants/SetSurveySettings`,
        data,
      );

      // console.log(res);
      return res.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        throw rejectWithValue(err.response.data);
      }
      throw rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetSetSurveySettings } = setSurveySettingsSlice.actions;
export default setSurveySettingsSlice.reducer;
