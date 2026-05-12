import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const extendByOnlinePaySlice = createSlice({
  name: "extendByOnlinePay",
  initialState: initialState,
  reducers: {
    resetExtendByOnlinePay: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(extendByOnlinePay.pending, (state) => {
        state.loading = true;
      })
      .addCase(extendByOnlinePay.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(extendByOnlinePay.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const extendByOnlinePay = createAsyncThunk(
  "Licenses/ExtendLicenseByOnlinePayment",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${baseURL}Licenses/ExtendLicenseByOnlinePayment`,
        { ...data },
      );

      // Same envelope as AddLicenseByOnlinePayment — see that slice's
      // comment. We extract `paytr` (the self-submitting 3DS form)
      // so the consumer's iframe srcDoc keeps receiving a string.
      const payload = res?.data?.data;
      if (payload && typeof payload === "object" && payload.paytr) {
        return payload.paytr;
      }
      if (typeof payload === "string") return payload;
      return null;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetExtendByOnlinePay } = extendByOnlinePaySlice.actions;
export default extendByOnlinePaySlice.reducer;
