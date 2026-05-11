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

      if (res.data.data.includes("html")) {
        return res.data.data;
      }

      const parsedData = JSON.parse(res.data.data);
      if (parsedData.status === "failed") {
        throw new Error({ message_TR: parsedData.reason });
      }

      return res.data.data;
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
