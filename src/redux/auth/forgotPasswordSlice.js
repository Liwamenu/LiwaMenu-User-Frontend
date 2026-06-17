import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { pickAxiosErrorMessage } from "../api";

const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
};

const forgotPasswordSlice = createSlice({
  name: "forgotPassword",
  initialState: initialState,
  reducers: {
    resetForgotPassword: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.sessionId = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const forgotPassword = createAsyncThunk(
  "Auth/forgotPassword",
  async ({ toAddress }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${baseURL}Email/send-password-reset`, {
        emailOrPhone: toAddress,
      });
      return res.data;
    } catch (err) {
      console.log(err);
      // Keep `message` (localized, backward-compatible) but also pass the
      // raw ResponsBase as `data` so the page can detect the "user not
      // found" case (backend only says it in message_EN; message_TR is a
      // generic "…gönderilemedi") and show a clearer message.
      return rejectWithValue({
        message: pickAxiosErrorMessage(err),
        data: err?.response?.data ?? null,
      });
    }
  }
);

export const { resetForgotPassword } = forgotPasswordSlice.actions;
export default forgotPasswordSlice.reducer;
