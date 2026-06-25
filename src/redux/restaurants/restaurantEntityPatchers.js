// Helpers for cross-slice "settings save → patch cached restaurant entity"
// behavior. Used by getRestaurantsSlice (the list cache) and getRestaurantSlice
// (the single-restaurant cache) so any of the listed save thunks transparently
// keeps the cached entity in sync — without the slow GetRestaurantById refetch
// that used to be intentionally avoided.
//
// Add a thunk type prefix to PATCH_THUNK_PREFIXES when its dispatched arg
// shape is { restaurantId, ...patch } and the patch fields live on the
// restaurant entity itself (NOT on a sibling slice). FormData-arg thunks
// (e.g. updateRestaurant) are intentionally excluded — they need different
// extraction logic.

const PATCH_THUNK_PREFIXES = new Set([
  // QR theme save → patches `themeId` on the cached restaurant entity.
  "Restaurants/SetRestaurantTheme",
  // TV menu theme save → patches `tvMenuId`. Used to share the QR
  // thunk type, but a single backend endpoint that only reads
  // `themeId` was silently overwriting the saved QR theme when the
  // TV body arrived without it. Now an independent thunk type +
  // endpoint, and the patcher merges whatever fields are present in
  // the dispatched arg (so both `themeId` and `tvMenuId` patches
  // continue to flow through the same merge logic below).
  "Restaurants/SetRestaurantTvTheme",
  // Kiosk theme save → patches `kioskThemeId`. Same per-type
  // split rationale as TV: each pick writes only its own field and
  // the cached restaurant entry is merged with whatever fields the
  // dispatched arg carries.
  "Restaurants/SetRestaurantKioskTheme",
  "Restaurants/SetRestaurantSettings",
  "Restaurants/SetRestaurantReservationSettings",
  "Restaurants/SetAnnouncementSettings",
  "Restaurants/SetSurveySettings",
  // Social-links save also carries `googleReviewLink` — a restaurant-entity
  // field surfaced in BOTH the "Sosyal Medya" and "Genel" tabs. Merging the
  // dispatched arg keeps the cached entity's `googleReviewLink` in sync so
  // the other tab reads the saved value without a reload. The arg's social
  // URL fields (facebookUrl, …) are harmless extras on the entity, and the
  // payload has `restaurantId` but no standalone `id` to collide with.
  "Restaurants/SetSocialMedias",
  // "Bankaya Transfer" save (Ödeme Yöntemleri tab) carries the bank-transfer
  // config (bankTransferEnabled / bankName / bankAccountHolder / iban) — all
  // restaurant-entity fields. Merging the dispatched arg keeps the cached
  // entity in sync so the card reflects the saved values without a refetch.
  "Restaurants/SetBankTransfer",
]);

const FULFILLED = "/fulfilled";

export const isRestaurantPatchAction = (action) => {
  if (typeof action?.type !== "string") return false;
  if (!action.type.endsWith(FULFILLED)) return false;
  const prefix = action.type.slice(0, -FULFILLED.length);
  return PATCH_THUNK_PREFIXES.has(prefix);
};

// Returns { restaurantId, patch } or null if the action arg doesn't fit the
// expected { restaurantId, ...patch } shape.
export const restaurantPatchFromAction = (action) => {
  const arg = action?.meta?.arg;
  if (!arg || typeof arg !== "object") return null;
  const { restaurantId, ...patch } = arg;
  if (!restaurantId) return null;
  return { restaurantId, patch };
};
