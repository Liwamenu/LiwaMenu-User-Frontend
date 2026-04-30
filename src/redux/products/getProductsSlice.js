import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

// Stable cache key from a `getProducts` argument object. Used by the
// slice to remember which (restaurant, page, filters) combination the
// cached `products` payload belongs to, so call sites can skip the
// network on revisit when the params still match. Exported so the
// Products page computes the SAME key when checking the cache.
export const productsCacheKey = (arg) => {
  if (!arg) return null;
  return [
    arg.restaurantId ?? "",
    arg.pageNumber ?? 1,
    arg.pageSize ?? "",
    arg.categoryId ?? "all",
    arg.hide === null || arg.hide === undefined ? "any" : String(arg.hide),
    arg.recommendation === null || arg.recommendation === undefined
      ? "any"
      : String(arg.recommendation),
  ].join("|");
};

const initialState = {
  loading: false,
  success: false,
  error: false,
  products: null,
  // Key of the (restaurant, page, filter) combination that the cached
  // `products` payload belongs to — null when no payload is cached.
  // Use this on revisit to skip the refetch when the params still match.
  fetchedFor: null,
};

const getProductsSlice = createSlice({
  name: "getProducts",
  initialState: initialState,
  reducers: {
    resetGetProductsState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetProducts: (state) => {
      state.products = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Stale-while-revalidate: keep the previous payload visible
        // while the refetch is in flight, matching the pattern used
        // by Categories / SubCategories / Menus / OrderTags slices.
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.products = action.payload;
        state.fetchedFor = productsCacheKey(action.meta?.arg);
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.products = null;
        state.fetchedFor = null;
      });
  },
});

export const getProducts = createAsyncThunk(
  "Products/getProducts",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Products/getProductsByRestaurantId`,
        {
          params: data,
        },
      );

      // console.log(res.data);
      return res.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetProductsState, resetGetProducts } =
  getProductsSlice.actions;
export default getProductsSlice.reducer;
