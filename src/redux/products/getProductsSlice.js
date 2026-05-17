import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import { invalidateOn } from "../cacheInvalidation";
import { normalizeProductsPayload } from "../../utils/normalizeProduct";

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
      })
      // Auto-invalidate so any direct product mutation OR a sibling
      // edit that affects products' denormalized fields forces the
      // next read to refetch. Without this, the Price List / Products
      // page would render stale Kampanya / category-name / sortOrder
      // values until a hard refresh.
      //
      // Cross-domain dependencies:
      //   • Categories edits change product.categoryName /
      //     categoryImage / categorySortOrder + the `campaign` flag
      //     the Price List checks per row.
      //   • SubCategories edits change product.subCategoryName /
      //     subCategorySortOrder.
      //   • Deleting a category or subcategory cascades into products
      //     server-side (orphans), so the cache must drop too.
      .addMatcher(
        invalidateOn([
          // direct product mutations
          "Products/AddProduct",
          "Products/EditProduct",
          "Products/DeleteProduct",
          "Products/UpdatePriceList",
          "Products/PriceListApplyBulk",
          // Allergens use their own write endpoint; the product DTO
          // carries them, so the Products page needs to refetch to
          // surface a fresh selection.
          "Products/UpdateProductAllergens",
          // Many-to-many junction mutations — change a product's
          // `categories` array, which the Products page renders
          // verbatim. Plus the bulk per-category drag-reorder, which
          // shifts the sortOrder field on every junction it touches.
          "Products/AddProductToCategory",
          "Products/RemoveProductFromCategory",
          "Categories/UpdateProductOrder",
          // sibling categories — denormalized fields on each product
          "Categories/AddCategory",
          "Categories/AddCategories",
          "Categories/EditCategory",
          "Categories/EditCategories",
          "Categories/DeleteCategory",
          // sibling subcategories — denormalized fields on each product
          "SubCategories/AddSubCategory",
          "SubCategories/AddSubCategories",
          "SubCategories/EditSubCategory",
          "SubCategories/EditSubCategories",
          "SubCategories/DeleteSubCategory",
          "SubCategories/UpdateSubCategoriesOrder",
        ]),
        (state) => {
          state.products = null;
          state.fetchedFor = null;
        },
      );
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

      // Normalize each product into the dual flat+categories shape so
      // every reader works against either the old or the new backend
      // response. See `utils/normalizeProduct.js` for the migration
      // contract — this is a no-op once every reader has been pivoted
      // to iterate `categories[]` directly.
      return normalizeProductsPayload(res.data);
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
