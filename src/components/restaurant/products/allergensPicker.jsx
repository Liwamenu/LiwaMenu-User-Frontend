// "Alerjenler" — three-state-per-allergen picker for the Add / Edit
// Product form. 14 master items come from `Allergens/GetMasterCatalog`
// (locale-aware display names, Turkish sub-category tooltips).
//
// Internal state per allergen:
//   "none"       — not included in the saved array (default)
//   "contains"   — { code, presence: "contains" }
//   "mayContain" — { code, presence: "mayContain" }
//
// `value` is the array the backend persists verbatim — see the write
// slice in src/redux/allergens/updateProductAllergensSlice.js. The
// component only knows about the array shape; the parent owns when
// to dispatch the save.

import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Leaf, Loader2, AlertCircle, X } from "lucide-react";

import { getAllergens } from "../../../redux/allergens/getAllergensSlice";

const PRESENCE_NONE = "none";
const PRESENCE_CONTAINS = "contains";
const PRESENCE_MAY_CONTAIN = "mayContain";

// Stable language token so the cache key matches `en` between `en` /
// `en-US`. The backend tolerates either but we only want one fetch.
const baseLang = (full) => (full || "tr").slice(0, 2).toLowerCase();

const AllergensPicker = ({ value, onChange }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { allergens, fetchedFor, loading } = useSelector(
    (s) => s.allergens.get,
  );

  const lang = baseLang(i18n.language);

  useEffect(() => {
    if (fetchedFor !== lang) {
      dispatch(getAllergens({ lang }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // O(1) lookup of the saved presence per code.
  const presenceByCode = useMemo(() => {
    const map = new Map();
    (value || []).forEach((row) => {
      if (row?.code) map.set(row.code, row.presence);
    });
    return map;
  }, [value]);

  // Push a new value array to the parent — never mutate in place.
  const setPresence = (code, nextPresence) => {
    const others = (value || []).filter((row) => row?.code !== code);
    if (nextPresence === PRESENCE_NONE) {
      onChange(others);
    } else {
      onChange([...others, { code, presence: nextPresence }]);
    }
  };

  const sortedAllergens = useMemo(() => {
    if (!Array.isArray(allergens)) return null;
    return [...allergens].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }, [allergens]);

  const selectedCount = presenceByCode.size;

  return (
    <div className="pt-4 border-t border-[--border-1]">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="grid place-items-center size-7 rounded-md bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
            <Leaf className="size-3.5" />
          </span>
          <label className="text-[--black-2] text-sm font-medium">
            {t("allergens.title")}
          </label>
        </div>
        {selectedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100 px-1.5 py-0.5 rounded-md dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
            {t("allergens.selected_count", { count: selectedCount })}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[--gr-1] mb-3 leading-snug">
        {t("allergens.hint")}
      </p>

      {!sortedAllergens ? (
        loading ? (
          <div className="grid place-items-center py-6 text-[--gr-2]">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-[--gr-1] p-3 rounded-lg border border-dashed border-[--border-1]">
            <AlertCircle className="size-4" />
            {t("allergens.empty")}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {sortedAllergens.map((a) => {
            const current = presenceByCode.get(a.code) || PRESENCE_NONE;
            return (
              <AllergenRow
                key={a.code}
                allergen={a}
                presence={current}
                onPick={(next) => setPresence(a.code, next)}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// One row per allergen. Two mutually-exclusive toggle buttons:
//   • "İçerir" (rose)        — sets presence: "contains"
//   • "İçerebilir" (amber)   — sets presence: "mayContain"
// Clicking the currently-active button turns it off (presence: "none"),
// matching how a checkbox toggle reads but with two flavors. The row
// itself tints slightly when something is selected.
const AllergenRow = ({ allergen, presence, onPick, t }) => {
  const isContains = presence === PRESENCE_CONTAINS;
  const isMay = presence === PRESENCE_MAY_CONTAIN;
  const isSelected = isContains || isMay;

  const containerTone = isContains
    ? "border-rose-300 bg-rose-50/60 dark:border-rose-400/40 dark:bg-rose-500/10"
    : isMay
      ? "border-amber-300 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-500/10"
      : "border-[--border-1] bg-[--white-1] hover:border-indigo-200";

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg border transition ${containerTone}`}
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium text-[--black-1] truncate"
          title={allergen.includes || ""}
        >
          {allergen.displayName || allergen.code}
        </div>
        {/* The tooltip text (`includes`) is comma-separated; show a
            shortened preview inline on wider widths so the choice
            isn't gated on a hover-only signal. Truncated to keep the
            row compact. */}
        {allergen.includes && (
          <div className="text-[10px] text-[--gr-1] truncate mt-0.5">
            {allergen.includes}
          </div>
        )}
      </div>
      <div className="inline-flex items-center gap-1 shrink-0">
        {isSelected && (
          <button
            type="button"
            onClick={() => onPick(PRESENCE_NONE)}
            title={t("allergens.clear")}
            aria-label={t("allergens.clear")}
            className="grid place-items-center size-7 rounded-md text-[--gr-1] hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <X className="size-3.5" />
          </button>
        )}
        <PresenceButton
          label={t("allergens.presence_contains")}
          active={isContains}
          activeClass="bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25"
          inactiveClass="bg-[--white-1] text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-[--white-2] dark:text-rose-300 dark:border-rose-400/40"
          onClick={() => onPick(isContains ? PRESENCE_NONE : PRESENCE_CONTAINS)}
        />
        <PresenceButton
          label={t("allergens.presence_may")}
          active={isMay}
          activeClass="bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/25"
          inactiveClass="bg-[--white-1] text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-[--white-2] dark:text-amber-300 dark:border-amber-400/40"
          onClick={() => onPick(isMay ? PRESENCE_NONE : PRESENCE_MAY_CONTAIN)}
        />
      </div>
    </div>
  );
};

const PresenceButton = ({
  label,
  active,
  activeClass,
  inactiveClass,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center justify-center h-7 px-2 rounded-md text-[10px] font-bold uppercase tracking-wide border transition ${
      active ? activeClass : inactiveClass
    }`}
  >
    {label}
  </button>
);

export default AllergensPicker;
