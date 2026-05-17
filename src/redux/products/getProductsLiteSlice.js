// Lite product list — backed by `Products/GetProductsByRestaurantIdLite`,
// added by the backend per BACKEND_PERFORMANCE_REQUEST.md to support
// dropdown-style consumers (Order Tags relation row, future ones) that
// only need {id, name, categoryId, portions:[{id,name}]} per product.
//
// The endpoint returns the *entire* product list in a single response
// (no pagination), so this slice stores a flat array of lite products
// and uses a simple `fetchedFor === restaurantId` cache key — same
// pattern as Categories / SubCategories / Menus / OrderTags slices.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import { invalidateOn } from "../cacheInvalidation";
import { normalizeProductsPayload } from "../../utils/normalizeProduct";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  // Flat array of lite products: [{ id, name, categoryId, portions:
  // [{ id, name }] }, ...]. Null until the first successful fetch.
  products: null,
  // Restaurant the cached `products` belongs to. Lets call sites skip
  // refetching when revisiting within the same restaurant.
  fetchedFor: null,
};

export const getProductsLite = createAsyncThunk(
  "Products/GetProductsByRestaurantIdLite",
  // Destructure `restaurantId` explicitly rather than forwarding the
  // whole arg as `params` — call sites may pass loading-middleware
  // control flags (e.g. `__silent: true` from the subSidebar
  // onboarding prefetch) that must not leak to the backend as query
  // params. `action.meta.arg` still carries the full arg, so the
  // `fetchedFor` stamp below is unaffected.
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Products/GetProductsByRestaurantIdLite`,
        { params: { restaurantId } },
      );
      // Endpoint returns { data: ProductLite[], totalCount }. Some
      // backends omit the wrapper for unpaged endpoints; tolerate both.
      // Then normalize so each product has both the flat
      // `categoryId` alias AND the new `categories[]` array — see
      // `utils/normalizeProduct.js` for the migration contract.
      const raw = res?.data?.data ?? res?.data ?? [];
      return normalizeProductsPayload(raw);
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

const getProductsLiteSlice = createSlice({
  name: "getProductsLite",
  initialState,
  reducers: {
    resetGetProductsLite: (state) => {
      state.products = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getProductsLite.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Stale-while-revalidate: keep the previous payload visible
        // while the refetch is in flight.
      })
      .addCase(getProductsLite.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.products = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getProductsLite.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.products = null;
        state.fetchedFor = null;
      })
      // Auto-invalidate on any product mutation OR sibling edit that
      // affects denormalized fields (categoryName, subCategoryName,
      // sortOrder) the lite payload carries. Without this, editing a
      // category and revisiting Order Tags shows the old category
      // names on the relation-row dropdown until a hard refresh. The
      // strings match the first arg of each `createAsyncThunk` — a
      // typo silently disables invalidation.
      .addMatcher(
        invalidateOn([
          // direct product mutations
          "Products/AddProduct",
          "Products/EditProduct",
          "Products/DeleteProduct",
          // Allergen assignment runs through its own endpoint; the
          // lite payload doesn't carry allergens today, but other
          // consumers (Order Tags row, future ones) may grow to read
          // them — keep the cache eventually consistent either way.
          "Products/UpdateProductAllergens",
          // Many-to-many junction mutations — the lite payload
          // carries `categoryId`, so adding or removing a
          // membership has to bust the cache so dropdowns stay
          // accurate. Reorder doesn't touch the lite shape today
          // but include it for symmetry / future-proofing.
          "Products/AddProductToCategory",
          "Products/RemoveProductFromCategory",
          "Categories/UpdateProductOrder",
          // sibling categories / subcategories — denormalized labels
          "Categories/EditCategory",
          "Categories/EditCategories",
          "Categories/DeleteCategory",
          "SubCategories/EditSubCategory",
          "SubCategories/EditSubCategories",
          "SubCategories/DeleteSubCategory",
        ]),
        (state) => {
          state.products = null;
          state.fetchedFor = null;
        },
      );
  },
});

export const { resetGetProductsLite } = getProductsLiteSlice.actions;
export default getProductsLiteSlice.reducer;
