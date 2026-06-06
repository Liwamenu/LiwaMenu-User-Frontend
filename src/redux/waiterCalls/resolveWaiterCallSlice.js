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

const resolveWaiterCallSlice = createSlice({
  name: "resolveWaiterCall",
  initialState: initialState,
  reducers: {
    resetResolveWaiterCall: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(resolveWaiterCall.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(resolveWaiterCall.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(resolveWaiterCall.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const resolveWaiterCall = createAsyncThunk(
  "Notifications/ResolveWaiterCall",
  async (data, { rejectWithValue }) => {
    try {
      // Strip the loading-middleware control flag so it never lands in the
      // PUT body (auto-resolve passes `__silent: true`).
      const { __silent, ...body } = data || {};
      const res = await api.put(
        `${baseURL}Notifications/ResolveWaiterCall`,
        body,
      );

      console.log(res);
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

export const { resetResolveWaiterCall } = resolveWaiterCallSlice.actions;
export default resolveWaiterCallSlice.reducer;
