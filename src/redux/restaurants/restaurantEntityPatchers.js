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
  "Restaurants/SetRestaurantTheme",
  "Restaurants/SetRestaurantTvMenu",
  "Restaurants/SetRestaurantSettings",
  "Restaurants/SetRestaurantReservationSettings",
  "Restaurants/SetAnnouncementSettings",
  "Restaurants/SetSurveySettings",
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
