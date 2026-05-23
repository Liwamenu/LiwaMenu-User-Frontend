// Defensive normalizer for product DTOs across the many-to-many
// category migration.
//
// The backend is moving from a 1-to-1 product↔category relationship
// (flat `categoryId` / `categoryName` / `subCategoryId` / `sortOrder`
// fields hanging off each product) to a true many-to-many model where
// each product carries a `categories: [{ categoryId, categoryName,
// categoryImage, categorySortOrder, subCategoryId, subCategoryName,
// subCategoryImage, subCategorySortOrder, sortOrder }]` array.
//
// During the migration window, this normalizer makes every product
// readable through BOTH shapes regardless of what the backend
// actually returned, so:
//   • The frontend can be deployed *before* backend cuts over without
//     breaking existing readers (the flat fields are present either way).
//   • The frontend can be deployed *after* backend cuts over without
//     breaking either — the new categories array is present, and the
//     flat aliases reflect categories[0] so single-category readers
//     keep working until they're individually upgraded to iterate.
//
// Once every reader has been migrated to iterate `categories[]` and
// the backend cutover has been live long enough that the old
// payload shape is no longer in flight, the aliasing block can be
// removed and this helper collapses to just "ensure categories[] is
// present". Until then, the dual shape is intentional.
//
// `isCampaign` is also normalized: previously it was inherited from
// the parent category at render time; the new model puts it directly
// on the product. We pass through whatever the server sends and let
// consumers default to `false` when missing.

/**
 * Coerce a single product DTO into the dual-shape (flat aliases +
 * categories array) representation. Pure: never mutates the input.
 *
 * Inputs handled (checked in order of richness):
 *  - Full shape:        `{ ..., categories: [{ categoryId, categoryName, ... }, ...] }`
 *  - Lite m2m shape:    `{ ..., categoryIds: [id, id, ...] }`  ← lite endpoint after the m2m migration
 *  - Old flat shape:    `{ ..., categoryId, categoryName, ..., subCategoryId, ..., sortOrder }`
 *  - Mixed/partial: best-effort fill from whichever side is populated.
 *
 * Returns: `{ ...product, categories: [...always], <flat aliases for backwards compat> }`.
 */
export function normalizeProduct(product) {
  if (!product || typeof product !== "object") return product;

  const hasFullCategories = Array.isArray(product.categories);
  const hasLiteCategoryIds = Array.isArray(product.categoryIds);

  // Build the categories array regardless of input shape.
  let categories;
  if (hasFullCategories) {
    categories = product.categories;
  } else if (hasLiteCategoryIds) {
    // Lite endpoint carries membership only (no denormalized name /
    // image / sort fields). Expand the id list into membership entries
    // so consumers that iterate `categories[]` see every category the
    // product belongs to, not just the first one. Empty array stays
    // empty — that's a real "belongs to no category" signal post-m2m.
    categories = product.categoryIds.map((id) => ({
      categoryId: id ?? null,
      categoryName: null,
      categoryImage: null,
      categorySortOrder: 0,
      subCategoryId: null,
      subCategoryName: null,
      subCategoryImage: null,
      subCategorySortOrder: null,
      sortOrder: 0,
    }));
  } else {
    // Synthesize a single-element array from the old flat fields. We
    // include the keys even when they're null/undefined so consumers
    // can rely on the field's existence (vs. having to optional-chain
    // every read).
    categories = [
      {
        categoryId: product.categoryId ?? null,
        categoryName: product.categoryName ?? null,
        categoryImage: product.categoryImage ?? null,
        categorySortOrder: product.categorySortOrder ?? 0,
        subCategoryId: product.subCategoryId ?? null,
        subCategoryName: product.subCategoryName ?? null,
        subCategoryImage: product.subCategoryImage ?? null,
        subCategorySortOrder: product.subCategorySortOrder ?? null,
        sortOrder: product.sortOrder ?? 0,
      },
    ];
  }

  // Backwards-compat flat aliases — point at the first category so
  // single-category readers keep working. After the cutover this is
  // semantically lossy for multi-category products (only the first
  // membership is visible) but no worse than today's 1-to-1 model.
  // Phase 4 walks every reader and replaces these accesses with a
  // proper iteration over `categories[]`.
  const first = categories[0] ?? {};
  const flatAliases = {
    categoryId: product.categoryId ?? first.categoryId ?? null,
    categoryName: product.categoryName ?? first.categoryName ?? null,
    categoryImage: product.categoryImage ?? first.categoryImage ?? null,
    categorySortOrder:
      product.categorySortOrder ?? first.categorySortOrder ?? 0,
    subCategoryId: product.subCategoryId ?? first.subCategoryId ?? null,
    subCategoryName:
      product.subCategoryName ?? first.subCategoryName ?? null,
    subCategoryImage:
      product.subCategoryImage ?? first.subCategoryImage ?? null,
    subCategorySortOrder:
      product.subCategorySortOrder ?? first.subCategorySortOrder ?? null,
    // The old `sortOrder` was global per product; the new one is
    // per-category. We surface the first-category's sortOrder as the
    // flat alias so readers that group/sort by it (PriceList,
    // SubCategoryProducts) keep working until they pivot.
    sortOrder: product.sortOrder ?? first.sortOrder ?? 0,
  };

  return {
    ...product,
    ...flatAliases,
    categories,
  };
}

/**
 * Apply `normalizeProduct` to every entry in an array (or to the
 * `data` payload of a paged response, which is the most common
 * envelope from the .NET backend). Returns the same shape it
 * received — only the inner product objects are transformed.
 *
 * Accepts:
 *  - `T[]`                     → returns normalized array
 *  - `{ data: T[], ... }`      → returns `{ data: normalized, ...rest }`
 *  - anything else             → returned unchanged (defensive)
 */
export function normalizeProductsPayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(normalizeProduct);
  }
  if (payload && Array.isArray(payload.data)) {
    return { ...payload, data: payload.data.map(normalizeProduct) };
  }
  return payload;
}
