// Single source of truth for the payment-basket shape that goes out to
// the backend on add-license and extend-license flows. Both
// `bankPayment.jsx` and `onlinePayment.jsx` build the same structure via
// this helper, so adding a new field is a one-place edit.
//
// Backend stores the value verbatim (no longer parses field names) — any
// future field added here is forwarded into the persisted blob without a
// backend change.
//
// Shape:
//   {
//     type: "NewLicense" | "ExtendLicense",
//     items: [
//       {
//         restaurantId: string,
//         licensePackageIds: string[],
//         licenseId: string | null,  // set on ExtendLicense, null on NewLicense
//       },
//       ...
//     ],
//     faturaBilgileri: object,
//   }
//
// Notes
// - `items` is always an array. On ExtendLicense it has exactly one entry
//   (the single license being renewed). On NewLicense it groups cart
//   items by restaurant so each restaurant carries its own bag of
//   package ids.
// - The previous ad-hoc shapes (extend had top-level `licensePackageId`
//   + `restaurantId` + `licenseId`; add had `items: [{restaurantId,
//   licensePackageIds}]`) are both expressed by this one structure
//   without losing information — the readers' job is to handle the
//   single uniform shape.

/**
 * @param {object} args
 * @param {Array<{ id: string, restaurantId: string }>} args.cartItems
 *   Items the user added to the cart. Each carries its license-package
 *   `id` and the `restaurantId` the package will be applied to.
 * @param {{ id?: string } | null | undefined} args.currentLicense
 *   The license being renewed in extend flow. Ignored when isExtend = false.
 * @param {object} [args.faturaBilgileri]
 *   Billing info captured earlier in the flow. Empty object if missing.
 * @param {boolean} args.isExtend
 *   `true` = ExtendLicense (renew an existing license), `false` = NewLicense.
 * @returns {{ type: "NewLicense" | "ExtendLicense", items: Array, faturaBilgileri: object }}
 */
export function buildLicenseBasket({
  cartItems,
  currentLicense,
  faturaBilgileri,
  isExtend,
}) {
  const fatura = faturaBilgileri || {};
  const items = isExtend
    ? buildExtendItems(cartItems, currentLicense)
    : buildNewItems(cartItems);

  return {
    type: isExtend ? "ExtendLicense" : "NewLicense",
    items,
    faturaBilgileri: fatura,
  };
}

// Extend: one cart item (the package the owner picked to renew the license
// with) attached to the currentLicense.id. The shape still uses the
// `items` array — single entry — so consumers don't have to branch.
function buildExtendItems(cartItems, currentLicense) {
  const first = (cartItems || [])[0];
  if (!first) return [];
  return [
    {
      restaurantId: first.restaurantId,
      licensePackageIds: [first.id],
      licenseId: currentLicense?.id ?? null,
    },
  ];
}

// NewLicense: group cart items by restaurantId so each restaurant gets
// its own bag of package ids. `licenseId` is null (there's no existing
// license — that's what NewLicense means).
function buildNewItems(cartItems) {
  const byRestaurant = new Map();
  for (const item of cartItems || []) {
    const bag = byRestaurant.get(item.restaurantId);
    if (bag) {
      bag.licensePackageIds.push(item.id);
    } else {
      byRestaurant.set(item.restaurantId, {
        restaurantId: item.restaurantId,
        licensePackageIds: [item.id],
        licenseId: null,
      });
    }
  }
  return Array.from(byRestaurant.values());
}
