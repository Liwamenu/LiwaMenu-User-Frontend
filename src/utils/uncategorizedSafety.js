// Defensive safety net for products that lose (or never had) a valid
// `categoryId`. Backend rejects empty categoryId on every save path, so
// an orphaned product (categoryId pointing at a deleted/missing
// category) becomes effectively invisible — it doesn't render under
// any category in the admin list and the customer menu skips it. This
// helper detects those rows and re-homes them under a system category
// called "Uncategorized" so the admin can see them and manually move
// them somewhere meaningful via the existing CategoryProducts modal.
//
// Design choices:
//   • Hard-coded English NAME ("Uncategorized") rather than a locale
//     key — this is a system identifier, not user-facing copy. The
//     Categories list still renders the literal name. If the user
//     renames it, the next run won't recognise the existing row and
//     will create a NEW one (acceptable trade-off; renaming a system
//     category is a clearly opted-in action).
//   • Newly-created Uncategorized has `isActive: false` AND empty
//     `menuIds` — both signals so the customer themes can pick
//     whichever they respect to keep it hidden.
//   • Idempotent: safe to call on every Categories page mount.
//     Returns null when nothing to do, otherwise a summary object.
//   • Failures are swallowed (warned to console) — this is a safety
//     net, never a blocker. If the backend rejects the auto-create
//     or a reassignment, the orphan stays orphaned and will be
//     retried next time.

import { addCategory } from "../redux/categories/addCategorySlice";
import { editProduct } from "../redux/products/editProductSlice";

export const UNCATEGORIZED_NAME = "Uncategorized";

export const isUncategorizedCategory = (cat) =>
  !!cat && cat.name === UNCATEGORIZED_NAME;

const findUncategorized = (categories) =>
  (categories || []).find(isUncategorizedCategory);

// m2m: a product is an orphan when NONE of its memberships point at a
// currently-valid category. An empty `categories` array counts as an
// orphan too (the post-migration "no parent at all" state — pre-migration
// products without a categoryId fall through the normalizer with an empty
// array too, so this catches both).
const collectOrphans = (products, categories) => {
  const validIds = new Set(
    (categories || []).map((c) => c?.id).filter(Boolean),
  );
  return (products || []).filter((p) => {
    if (!p) return false;
    const memberships = p.categories || [];
    if (memberships.length === 0) return true;
    return !memberships.some(
      (m) => m.categoryId && validIds.has(m.categoryId),
    );
  });
};

const createUncategorizedCategory = async (dispatch, restaurantId) => {
  const formData = new FormData();
  formData.append("restaurantId", restaurantId);
  formData.append(
    "categoriesData",
    JSON.stringify([
      {
        name: UNCATEGORIZED_NAME,
        // isActive false + empty menuIds — both flags so whichever
        // the customer themes consult, the category stays hidden.
        isActive: false,
        featured: false,
        campaign: false,
        menuIds: [],
      },
    ]),
  );
  const action = await dispatch(addCategory(formData));
  if (action?.error) throw action.payload || action.error;
  // Backend response shape varies — try common envelopes.
  const payload = action.payload;
  if (payload?.id) return payload;
  if (Array.isArray(payload) && payload[0]?.id) return payload[0];
  if (payload?.data?.id) return payload.data;
  if (Array.isArray(payload?.data) && payload.data[0]?.id) return payload.data[0];
  return null;
};

const reassignOrphan = (dispatch, prod, targetCategoryId) => {
  // Send the full product DTO with the membership rewritten to point
  // at the Uncategorized category. Without preserving every other
  // editable field the backend defaults would blank out description /
  // hide / recommendation; the lite payload carries id / name /
  // portions / categories, so we round-trip what we have and let safe
  // defaults cover the rest.
  //
  // m2m: collapse the (orphaned) memberships into a single new one
  // pointing at the Uncategorized target. Carrying the old broken
  // categoryIds would just hit the same orphan check on next run.
  // Flat `categoryId` / `subCategoryId` stay on the payload as the
  // backwards-compat bridge for backend builds still on the old
  // schema (mirrors editProduct.jsx).
  const fd = new FormData();
  fd.append("id", prod.id);
  if (prod.restaurantId) fd.append("restaurantId", prod.restaurantId);
  fd.append("name", prod.name ?? "");
  fd.append("description", prod.description ?? "");
  fd.append("recommendation", String(prod.recommendation ?? false));
  fd.append("hide", String(prod.hide ?? false));
  fd.append("freeTagging", String(prod.freeTagging ?? false));
  fd.append("isCampaign", String(prod.isCampaign ?? false));
  if (Array.isArray(prod.portions)) {
    fd.append("portions", JSON.stringify(prod.portions));
  }
  fd.append(
    "categories",
    JSON.stringify([{ categoryId: targetCategoryId }]),
  );
  fd.append("categoryId", targetCategoryId);
  fd.append("subCategoryId", "");
  return dispatch(editProduct(fd));
};

/**
 * @param {object} args
 * @param {Function} args.dispatch  Redux dispatch
 * @param {string}   args.restaurantId
 * @param {Array}    args.categories  Loaded categories list
 * @param {Array}    args.products    Loaded products (lite or full)
 * @returns {Promise<null | { orphansFound: number, repaired: number, uncategorizedId?: string, created?: boolean }>}
 *   null when no orphans; summary object otherwise.
 */
export const runUncategorizedSafety = async ({
  dispatch,
  restaurantId,
  categories,
  products,
}) => {
  if (!restaurantId || !Array.isArray(products) || !Array.isArray(categories)) {
    return null;
  }

  const orphans = collectOrphans(products, categories);
  if (orphans.length === 0) return null;

  let uncategorized = findUncategorized(categories);
  let created = false;

  try {
    if (!uncategorized) {
      uncategorized = await createUncategorizedCategory(dispatch, restaurantId);
      created = true;
    }
    if (!uncategorized?.id) {
      // eslint-disable-next-line no-console
      console.warn(
        "[uncategorizedSafety] Could not resolve Uncategorized category id",
        uncategorized,
      );
      return { orphansFound: orphans.length, repaired: 0 };
    }

    // Reassign in parallel; per-row failure doesn't affect the others.
    const results = await Promise.allSettled(
      orphans.map((p) => reassignOrphan(dispatch, p, uncategorized.id)),
    );
    const repaired = results.filter(
      (r) => r.status === "fulfilled" && !r.value?.error,
    ).length;
    return {
      orphansFound: orphans.length,
      repaired,
      uncategorizedId: uncategorized.id,
      created,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[uncategorizedSafety] safety net failed:", err);
    return { orphansFound: orphans.length, repaired: 0 };
  }
};
