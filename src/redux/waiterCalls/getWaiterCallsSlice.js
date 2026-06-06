import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  waiterCalls: null,
};

const getWaiterCallsSlice = createSlice({
  name: "getWaiterCalls",
  initialState: initialState,
  reducers: {
    resetWaiterCalls: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.waiterCalls = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getWaiterCalls.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.waiterCalls = null;
      })
      .addCase(getWaiterCalls.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.waiterCalls = action.payload;
      })
      .addCase(getWaiterCalls.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.waiterCalls = null;
      });
  },
});

export const getWaiterCalls = createAsyncThunk(
  "Notifications/GetWaiterCalls",
  async (data, { rejectWithValue }) => {
    try {
      // Strip the loading-middleware control flag so background polls
      // (`__silent: true`) don't leak it to the backend as a query param.
      const { __silent, ...params } = data || {};
      const res = await api.get(`${baseURL}Notifications/GetWaiterCalls`, {
        params,
      });

      // console.log(res.data);
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

export const { resetWaiterCalls } = getWaiterCallsSlice.actions;
export default getWaiterCallsSlice.reducer;
