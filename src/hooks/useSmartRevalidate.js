// useSmartRevalidate — keep a list page's data fresh across tab focus
// changes and in-app navigation, without a hard refresh.
//
// THE PROBLEM IT SOLVES
// Our redux list slices cache by `fetchedFor` (a restaurant id or a
// composite key) but carry NO timestamp. Once a cache is populated for
// a restaurant in a given browser session, the call sites
// (`if (!data || fetchedFor !== key) dispatch(...)`) never refetch it
// again unless a mutation in THAT SAME tab invalidates it. So a change
// made on another device (the owner edits on mobile) is invisible on
// an already-open desktop tab until a full page reload — the desktop's
// redux cache simply doesn't know anything changed.
//
// THE FIX
// A small per-key staleness layer that lives OUTSIDE redux (a
// module-level Map of last-revalidate timestamps, so it survives
// component unmount/remount during in-app navigation). The hook fires
// the supplied `revalidate` callback:
//   • on mount (in-app navigation to the page), and
//   • on window focus / tab visibility regaining (returning to the tab)
// …but only when the key hasn't been revalidated within `staleMs`.
//
// The callback is expected to dispatch a SILENT, stale-while-revalidate
// refetch: the slice keeps showing the previous payload while the new
// one loads (no blank flash), and the request is excluded from the
// global full-screen loader (no freeze). Net effect: the page shows
// cached data instantly and quietly swaps in fresh data a moment later
// — the standard "stale-while-revalidate" behaviour users expect from
// modern admin panels.
//
// WHY NOT just add `fetchedAt` to every slice
// That'd touch ~15 slices + every call site and risk regressions in
// the cross-slice invalidation matchers. Keeping the throttle in a
// module-level Map here means ZERO slice changes — each page opts in
// with a single hook call.

import { useEffect, useRef } from "react";

// key -> last revalidate timestamp (ms). Module-level so it persists
// across component unmount/remount (in-app route changes) within the
// same page load. Cleared naturally on a hard refresh, which is fine —
// a hard refresh refetches everything anyway.
const lastRevalidatedAt = new Map();

// Default staleness window. Short enough that returning to a tab or
// navigating back to a page after doing something elsewhere pulls
// fresh data; long enough that bouncing quickly between two pages
// doesn't hammer the backend.
const DEFAULT_STALE_MS = 15_000;

// Exported so a mutation flow can force the next visit to revalidate
// immediately (e.g. after a cross-entity write that the slice matchers
// don't cover). Not required for the core behaviour.
export function markStale(key) {
  if (key) lastRevalidatedAt.delete(key);
}

/**
 * @param {string|null} key        Stable cache key (e.g. `menus:<restaurantId>`).
 *                                  When null/empty the hook is inert — handy
 *                                  while the restaurant id is still resolving.
 * @param {() => void} revalidate  Dispatches the silent refetch. Should be
 *                                  stable (wrap in useCallback) or at least
 *                                  safe to call on every trigger.
 * @param {object} [opts]
 * @param {number} [opts.staleMs]  Throttle window in ms. Default 15s.
 * @param {boolean} [opts.onMount] Revalidate on mount too (in-app nav).
 *                                  Default true. Set false for pages that
 *                                  already do their own first-load fetch and
 *                                  ONLY want focus-based revalidation.
 */
export function useSmartRevalidate(key, revalidate, opts = {}) {
  const { staleMs = DEFAULT_STALE_MS, onMount = true } = opts;

  // Keep the latest callback in a ref so the focus listener (registered
  // once) always calls the freshest closure without re-subscribing.
  const revalidateRef = useRef(revalidate);
  revalidateRef.current = revalidate;

  const run = (force) => {
    if (!key) return;
    const now = Date.now();
    const last = lastRevalidatedAt.get(key) || 0;
    if (!force && now - last < staleMs) return; // still fresh — skip
    lastRevalidatedAt.set(key, now);
    try {
      revalidateRef.current?.();
    } catch {
      // A revalidate dispatch should never throw, but never let it
      // break the focus listener / mount effect either.
    }
  };

  // Mount / key-change: in-app navigation lands here. Throttled so
  // quick back-and-forth between two pages doesn't refetch each time.
  useEffect(() => {
    if (onMount) run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Focus / visibility: returning to a backgrounded tab lands here.
  // This is the branch that fixes the cross-device case — the owner
  // edited on mobile, comes back to the desktop tab, and the page
  // quietly pulls the change in.
  useEffect(() => {
    if (!key) return undefined;

    const onFocus = () => run(false);
    const onVisible = () => {
      if (document.visibilityState === "visible") run(false);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, staleMs]);
}

export default useSmartRevalidate;
