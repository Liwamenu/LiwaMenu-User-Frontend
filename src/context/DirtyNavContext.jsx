// Cross-component "unsaved changes" tracker for the Genel Ayarlar
// tab strip (and anything else that opts in). Each settings sub-page
// pushes its dirty state into the context via `useDirtyTracking` (or
// the lower-level `setIsDirty`); the SettingsTabs strip checks the
// flag in its Link click handler and prompts the user before letting
// them navigate away.
//
// Scope is intentionally narrow: only navigations that explicitly
// call `confirmAndNavigate` are gated. Browser back/forward + raw
// sidebar Links don't go through here, so this isn't a "browser-wide
// guard" — it's a "tab-strip nudge" focused on the spot users
// actually lose work today.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { useTranslation } from "react-i18next";

const noop = () => {};

const DirtyNavContext = createContext({
  isDirty: false,
  setIsDirty: noop,
  // Returns true when the navigation should proceed, false when it
  // should be cancelled. Always returns true when the form isn't
  // dirty, so consumers can call this unconditionally.
  confirmAndNavigate: () => true,
});

export const useDirtyNav = () => useContext(DirtyNavContext);

/**
 * Convenience hook for the common "compare current vs baseline" case.
 * Pages with a `xxxData` + `xxxDataBefore` pair just call:
 *
 *   useDirtyTracking(reservationData, reservationDataBefore);
 *
 * The hook updates the context's `isDirty` on every change and
 * cleans up to `false` on unmount so a freshly mounted sibling page
 * doesn't inherit a stale flag.
 */
export const useDirtyTracking = (current, baseline) => {
  const { setIsDirty } = useDirtyNav();
  useEffect(() => {
    if (baseline == null) {
      // Baseline not loaded yet — treat as clean.
      setIsDirty(false);
      return;
    }
    setIsDirty(!isEqual(current, baseline));
  }, [current, baseline, setIsDirty]);
  useEffect(() => () => setIsDirty(false), [setIsDirty]);
};

export const DirtyNavProvider = ({ children }) => {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);

  const confirmAndNavigate = useCallback(() => {
    if (!isDirty) return true;
    const ok = window.confirm(
      t(
        "dirtyNav.unsaved_warning",
        "Kaydedilmemiş değişiklikleriniz var. Yine de devam etmek istiyor musunuz?",
      ),
    );
    if (ok) setIsDirty(false);
    return ok;
  }, [isDirty, t]);

  return (
    <DirtyNavContext.Provider value={{ isDirty, setIsDirty, confirmAndNavigate }}>
      {children}
    </DirtyNavContext.Provider>
  );
};
