// Cross-slice cache invalidation helper.
//
// Every `get*Slice` with a `fetchedFor` cache lists the *thunk type
// prefixes* of the mutations that should drop its cache. When any
// listed mutation fulfills, the slice clears its payload + fetchedFor
// so the next call site (which guards on `fetchedFor === restaurantId`)
// dispatches a fresh fetch instead of serving stale data.
//
// Before this helper, only `getProductsLiteSlice` + `getExternalPages`
// had local invalidation matchers. The other six cached slices
// (categories, products, subCategories, menus, orderTags, sambaTables)
// would happily serve last-page data after the user mutated a related
// entity — so flipping a category's `campaign` flag and switching to
// the Price List page would leave the Kampanya column hidden until a
// hard refresh. This file centralises the mapping so future slices
// can opt-in with one line.
//
// Usage:
//   import { invalidateOn } from "../cacheInvalidation";
//
//   extraReducers: (build) => {
//     build
//       .addCase(getCategories.pending, …)
//       .addCase(getCategories.fulfilled, …)
//       .addCase(getCategories.rejected, …)
//       .addMatcher(invalidateOn([
//         "Categories/AddCategory",
//         "Categories/EditCategory",
//         …
//       ]), (state) => {
//         state.categories = null;
//         state.fetchedFor = null;
//       });
//   };
//
// IMPORTANT — the strings MUST match the first arg of the
// corresponding `createAsyncThunk`. A typo silently disables the
// invalidation, which is the exact bug class this helper exists to
// prevent. Keep matcher arrays alphabetised so a missing entry is
// easy to spot in code review.
export const invalidateOn = (thunkPrefixes) => {
  const fulfilledTypes = new Set(
    (thunkPrefixes || []).map((p) => `${p}/fulfilled`),
  );
  return (action) => fulfilledTypes.has(action?.type);
};
