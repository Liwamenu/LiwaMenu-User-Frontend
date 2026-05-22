import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { pickAxiosErrorMessage } from "../api";

const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
};

const setNewPasswordSlice = createSlice({
  name: "setNewPassword",
  initialState,
  reducers: {
    resetSetNewPassword: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(setNewPassword.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(setNewPassword.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.error = null;
      })
      .addCase(setNewPassword.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const setNewPassword = createAsyncThunk(
  "Auth/setNewPassword",
  async ({ emailOrPhone, token, newPassword }, { rejectWithValue }) => {
    try {
      // Anonymous password-reset step. POST /api/Auth/reset-password with
      // the ASP.NET Identity reset token taken straight from the reset
      // link's `token` query param — sent as-is, no decode/re-encode.
      // (Backend renamed this JSON key from `code` to `token` to match
      // the URL param; the value is identical.) Uses the public `api`
      // instance — no Bearer header — and inherits its 30s timeout.
      const res = await api.post(`${baseURL}Auth/reset-password`, {
        emailOrPhone,
        token,
        newPassword,
      });
      return res.data;
    } catch (err) {
      console.log(err);
      const errorMessage = pickAxiosErrorMessage(err);
      const statusCode =
        err?.response?.status || err?.response?.data?.statusCode;
      return rejectWithValue({ message: errorMessage, statusCode });
    }
  },
);

export const { resetSetNewPassword } = setNewPasswordSlice.actions;
export default setNewPasswordSlice.reducer;
