import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  categories: null,
  // Restaurant id the cached `categories` belongs to. Used by call sites to
  // skip duplicate fetches on revisit and across pages (Add/Edit Product,
  // Sub Categories, Order Tags, etc. all hit this slice).
  fetchedFor: null,
};

const getCategoriesSlice = createSlice({
  name: "getCategories",
  initialState: initialState,
  reducers: {
    resetGetCategoriesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetCategories: (state) => {
      state.categories = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getCategories.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Stale-while-revalidate: keep the previous payload visible while
        // the refetch is in flight. The pages that consume this slice all
        // already guard on `categories` being truthy, so they handle stale
        // data gracefully.
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.categories = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.categories = null;
        state.fetchedFor = null;
      });
  },
});

export const getCategories = createAsyncThunk(
  "Categories/GetCategoriesByRestaurantId",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Categories/GetCategoriesByRestaurantId`,
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

export const { resetGetCategoriesState, resetGetCategories } =
  getCategoriesSlice.actions;
export default getCategoriesSlice.reducer;
