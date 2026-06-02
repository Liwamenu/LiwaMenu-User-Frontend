// Derive a category's "on campaign" state from its products.
//
// The category-level `campaign` column was dropped at the backend in
// favour of a per-product `isCampaign` flag (m2m migration). The Edit
// Category dialog still SENDS `campaign: true|false`, which the backend
// treats as a one-shot cascade that stamps every product in the
// category — but the *read* side is now derived from the products
// themselves. There is no stored category-level value to read back.
//
// Derivation rule: a category is "on campaign" when it has at least one
// product AND every product in it has `isCampaign === true`. We use
// every-true (not some-true) because the cascade sets all products
// uniformly; if any product is false the owner has since hand-edited
// individual rows, in which case the category is no longer uniformly
// on and the toggle/badge should reflect OFF.
//
// Membership lookup tolerates all three product shapes the normalizer
// might produce: full `categories[{categoryId, ...}]`, lite
// `categoryIds[id, ...]`, or flat `categoryId`.

export const productInCategory = (product, categoryId) => {
  if (!product || !categoryId) return false;
  if (Array.isArray(product.categories)) {
    return product.categories.some((m) => m?.categoryId === categoryId);
  }
  if (Array.isArray(product.categoryIds)) {
    return product.categoryIds.includes(categoryId);
  }
  return product.categoryId === categoryId;
};

export const isCategoryOnCampaign = (categoryId, products) => {
  if (!categoryId || !Array.isArray(products) || products.length === 0) {
    return false;
  }
  const members = products.filter((p) => productInCategory(p, categoryId));
  if (members.length === 0) return false;
  return members.every((p) => p?.isCampaign === true);
};

// NOTE: there's intentionally no `isCategoryRecommended` here. Unlike
// `isCampaign`, the per-product `recommendation` flag is NOT included in
// the lite product DTO, so a category's recommendation state can't be
// derived from `liteProducts`. The Edit Category dialog fetches the
// category's full products on open to read recommendation instead. If
// the lite DTO ever gains `recommendation`, add the mirror of
// isCategoryOnCampaign here and switch the dialog back to derived.

// Build a categoryId → boolean map in one pass. Cheaper than calling
// `isCategoryOnCampaign` once per category for big catalogues, and the
// shape mirrors what the Price List already consumes.
export const buildCategoryCampaignMap = (categories, products) => {
  const map = new Map();
  if (!Array.isArray(categories)) return map;
  for (const c of categories) {
    if (c?.id) map.set(c.id, isCategoryOnCampaign(c.id, products));
  }
  return map;
};
