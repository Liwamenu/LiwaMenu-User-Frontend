import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  orderTags: null,
  // Restaurant id the cached `orderTags` belongs to. The list page reads
  // this to skip the (slow) refetch on revisit. Save/delete handlers in the
  // page invalidate the cache via resetGetOrderTags, since new groups carry
  // temp `New-…` ids locally and only the backend has the real ones.
  fetchedFor: null,
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
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getOrderTags.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Stale-while-revalidate: keep the previous payload visible while
        // the refetch is in flight rather than blanking the page.
      })
      .addCase(getOrderTags.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.orderTags = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getOrderTags.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.orderTags = null;
        state.fetchedFor = null;
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
