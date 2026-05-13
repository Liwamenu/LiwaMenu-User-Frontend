import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import { invalidateOn } from "../cacheInvalidation";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  subCategories: null,
  // Restaurant id the cached `subCategories` belongs to. Lets callers skip
  // refetching when navigating back to a page they just visited, while still
  // forcing a refresh when the active restaurant changes.
  fetchedFor: null,
};

const getSubCategoriesSlice = createSlice({
  name: "getSubCategories",
  initialState: initialState,
  reducers: {
    resetGetSubCategoriesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetSubCategories: (state) => {
      state.subCategories = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getSubCategories.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Keep the previous payload around so consumers can render stale
        // data while the (slow) refetch is in flight — clearing it here is
        // what made the SubCategories page go blank for ~2s on every visit.
      })
      .addCase(getSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.subCategories = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getSubCategories.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.subCategories = null;
        state.fetchedFor = null;
      })
      // Invalidate on any subcategory mutation. We also invalidate on
      // `Categories/DeleteCategory` because deleting a parent category
      // cascades into its subcategories server-side; the cached list
      // would otherwise still show the orphaned rows.
      .addMatcher(
        invalidateOn([
          "SubCategories/AddSubCategory",
          "SubCategories/AddSubCategories",
          "SubCategories/EditSubCategory",
          "SubCategories/EditSubCategories",
          "SubCategories/DeleteSubCategory",
          "SubCategories/UpdateSubCategoriesOrder",
          "Categories/DeleteCategory",
        ]),
        (state) => {
          state.subCategories = null;
          state.fetchedFor = null;
        },
      );
  },
});

export const getSubCategories = createAsyncThunk(
  "Subcategories/GetSubCategoriesByRestaurantId",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Subcategories/GetSubCategoriesByRestaurantId`,
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

export const { resetGetSubCategoriesState, resetGetSubCategories } =
  getSubCategoriesSlice.actions;
export default getSubCategoriesSlice.reducer;
