import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { pickAxiosErrorMessage } from "../api";
import { setTranslationLanguage } from "../../config/i18n";
import { getDeviceId, getDeviceName } from "../../utils/utils";

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
        // Stable per-browser id + readable name so the backend can keep ONE
        // session per device (upsert) instead of a new row per login.
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
      });

      // console.log(res);
      const KEY = import.meta.env.VITE_LOCAL_KEY;
      localStorage.setItem(`${KEY}`, JSON.stringify(res.data));
      setTranslationLanguage(res.data.user.defaultLang);
      return res.data.sessionId;
    } catch (err) {
      console.log(err);
      // pickAxiosErrorMessage handles locale, PascalCase, timeout and
      // network failures uniformly — see registerSlice for the rationale.
      const errorMessage = pickAxiosErrorMessage(err);
      const statusCode = err?.status || err?.response?.status;
      return rejectWithValue({ message: errorMessage, statusCode });
    }
  },
);

export const { resetLoginState } = loginSlice.actions;
export default loginSlice.reducer;
