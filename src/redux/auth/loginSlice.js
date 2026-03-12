import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
  sessionId: null,
};

const loginSlice = createSlice({
  name: "Login",
  initialState: initialState,
  reducers: {
    resetLoginState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.sessionId = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.sessionId = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.sessionId = null;
      });
  },
});

export const login = createAsyncThunk(
  "Auth/login",
  async ({ emailOrPhone, password, pushToken }, { rejectWithValue }) => {
    try {
      const res = await api.post(`${baseURL}Auth/login`, {
        emailOrPhone,
        password,
        pushToken: pushToken || null,
        deviceType: "web",
      });

      // console.log(res);
      const KEY = import.meta.env.VITE_LOCAL_KEY;
      localStorage.setItem(`${KEY}`, JSON.stringify(res.data));
      return res.data.sessionId;
    } catch (err) {
      console.log(err);
      const errorMessage =
        err?.response?.data?.message_TR ||
        err?.response?.data?.message ||
        err.message;
      const statusCode =
        err?.status || err?.response?.status || err?.response?.data?.statusCode;
      return rejectWithValue({ message: errorMessage, statusCode });
    }
  },
);

export const { resetLoginState } = loginSlice.actions;
export default loginSlice.reducer;
