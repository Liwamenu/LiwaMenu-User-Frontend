import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  orderTags: null,
};

const getOrderTagsSlice = createSlice({
  name: "getOrderTags",
  initialState: initialState,
  reducers: {
    resetGetOrderTagsState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetOrderTags: (state) => {
      state.orderTags = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getOrderTags.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.orderTags = null;
      })
      .addCase(getOrderTags.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.orderTags = action.payload;
      })
      .addCase(getOrderTags.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.orderTags = null;
      });
  },
});

export const getOrderTags = createAsyncThunk(
  "OrderTags/GetOrderTags",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}OrderTags/GetOrderTagsByRestaurantId/`,
        {
          params: data,
        },
      );

      // console.log(res.data);
      return res.data.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetOrderTagsState, resetGetOrderTags } =
  getOrderTagsSlice.actions;
export default getOrderTagsSlice.reducer;
