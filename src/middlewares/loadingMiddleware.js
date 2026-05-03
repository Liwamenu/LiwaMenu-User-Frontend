import { setIsLoading } from "../redux/loadingSlice";

// Thunk type prefixes that should NEVER trigger the global full-screen
// spinner. Background work (polling, prefetch, cache invalidation, FCM-
// driven refreshes) belongs here so the UI doesn't freeze on every tick.
//
// Add an entry as you identify a thunk that's painful to gate behind the
// spinner. The string must match the first arg passed to createAsyncThunk
// (e.g. "Products/getProducts").
const SILENT_THUNKS = new Set([
  // Examples (uncomment when needed):
  // "Orders/getOrders",
  // "WaiterCalls/getWaiterCalls",
  // "Reservations/getReservations",
]);

const isSilent = (action) => {
  // 1) Per-call opt-out: dispatch(thunk({ ...args, __silent: true })).
  //    Note: if the slice forwards the whole arg to axios (e.g.
  //    `params: data`), __silent leaks to the backend as a query param.
  //    Slices that opt in cleanly should destructure it out first.
  if (
    action.meta?.arg &&
    typeof action.meta.arg === "object" &&
    action.meta.arg.__silent === true
  ) {
    return true;
  }

  // 2) Static allowlist: prefix-based, no call-site changes required.
  //    action.type is e.g. "Orders/getOrders/pending" — strip the suffix.
  const prefix = action.type.replace(/\/(pending|fulfilled|rejected)$/, "");
  return SILENT_THUNKS.has(prefix);
};

let loadingCount = 0;

const loadingMiddleware = (store) => (next) => (action) => {
  const isLifecycle =
    typeof action.type === "string" &&
    /\/(pending|fulfilled|rejected)$/.test(action.type);

  if (isLifecycle && !isSilent(action)) {
    if (action.type.endsWith("/pending")) {
      loadingCount++;
      store.dispatch(setIsLoading(true));
    } else {
      loadingCount = Math.max(0, loadingCount - 1);
      if (loadingCount === 0) {
        store.dispatch(setIsLoading(false));
      }
    }
  }

  return next(action);
};

export default loadingMiddleware;
