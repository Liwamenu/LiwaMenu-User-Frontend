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

const addByOnlinePaySlice = createSlice({
  name: "addByOnlinePay",
  initialState: initialState,
  reducers: {
    resetAddByOnlinePay: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(addByOnlinePay.pending, (state) => {
        state.loading = true;
      })
      .addCase(addByOnlinePay.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.data = action.payload;
      })
      .addCase(addByOnlinePay.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const addByOnlinePay = createAsyncThunk(
  "Licenses/AddLicenseByOnlinePayment",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `${baseURL}Licenses/AddLicenseByOnlinePayment`,
        { ...data },
      );

      // New response shape:
      //   res.data.data = { paytr: "<html>…</html>", payment: { …record… } }
      // The `paytr` blob is a self-submitting form that hands the user
      // off to PayTR's 3D Secure flow — that's what the iframe in
      // 5thStepOnlinePayment / 4thStepOnlinePayment renders via srcDoc.
      // We return just the HTML string so the existing consumer doesn't
      // need to know about the envelope.
      const payload = res?.data?.data;
      if (payload && typeof payload === "object" && payload.paytr) {
        return payload.paytr;
      }
      // Defensive fallback for the old shape, just in case any caller
      // hits an endpoint that still returns a plain HTML string.
      if (typeof payload === "string") return payload;
      return null;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  }
);

export const { resetAddByOnlinePay } = addByOnlinePaySlice.actions;
export default addByOnlinePaySlice.reducer;
