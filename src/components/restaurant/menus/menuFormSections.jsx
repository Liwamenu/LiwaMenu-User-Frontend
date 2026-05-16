// Shared form sections for the Add / Edit Menu dialogs:
//
//   • PriceListSelect    — which product price column this menu serves
//                          (Normal / Kampanya / Özel). Stored on the
//                          menu as `priceListType`; the customer-facing
//                          themes read it to decide which price to show
//                          while the menu's schedule is active. "normal"
//                          is the default and the fallback when a
//                          product has no price for the chosen column.
//
//   • MenuCategoryPicker — searchable checklist of the restaurant's
//                          categories with select-all / clear-all, so
//                          an owner can scope a menu to a subset of
//                          categories. Selection is the `categoryIds`
//                          array already round-tripped by Add/Edit Menu.
//
// Both Add and Edit Menu render identical versions of these, hence the
// shared module instead of duplicating the markup in two near-identical
// dialog files.

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Tag,
  Percent,
  Sparkles,
  Layers,
  Search,
  X,
  Check,
  Loader2,
  CheckCheck,
  Lock,
  AlertTriangle,
} from "lucide-react";

import { getCategories } from "../../../redux/categories/getCategoriesSlice";

// The three price columns a product can carry (price / campaignPrice /
// specialPrice). A menu picks ONE; "normal" is the safe default and the
// fallback the themes use when a product has no price for the chosen
// column.
export const PRICE_LIST_TYPES = ["normal", "campaign", "special"];
export const DEFAULT_PRICE_LIST_TYPE = "normal";

// Per-type display metadata, shared with the MenuCard chip in
// menuList.jsx so the selector and the card stay visually in sync.
export const PRICE_LIST_META = {
  normal: { icon: Tag, chipTone: "slate" },
  campaign: { icon: Percent, chipTone: "emerald" },
  special: { icon: Sparkles, chipTone: "amber" },
};

// Turkish-aware diacritic folding for the category search — mirror of
// the helper used across products.jsx / categoryProducts.jsx etc.
const TR_FOLD = {
  ı: "i", İ: "i", i: "i", I: "i",
  ş: "s", Ş: "s",
  ğ: "g", Ğ: "g",
  ç: "c", Ç: "c",
  ü: "u", Ü: "u",
  ö: "o", Ö: "o",
};
const normalizeSearch = (s) => {
  if (!s) return "";
  let out = "";
  for (const ch of String(s)) out += TR_FOLD[ch] ?? ch.toLowerCase();
  return out.normalize("NFD").replace(/\p{M}+/gu, "");
};

// Three-option segmented control. `value` falls back to "normal" for
// any unknown/missing value so an older menu (saved before this field
// existed) renders sensibly.
//
// "Özel Fiyat" depends on the restaurant-level Special Price feature
// (Genel Ayarlar → Genel). When that's off, picking it would just make
// every product fall back to its normal price, so we flag the option
// with a lock, toast on selection, and show a persistent how-to-enable
// note. The selection is still allowed (so an existing menu that had it
// keeps the value, and an owner can pre-set it before enabling the
// feature) — we warn rather than block.
export const PriceListSelect = ({ restaurantId, value, onChange }) => {
  const { t } = useTranslation();

  // Read the restaurant to know whether Special Price is enabled and
  // pick up the owner's custom column name (Genel Ayarlar → "Özel
  // Fiyat Tanımı"). Check both restaurant slices — the entity may sit
  // in the list cache (came from /restaurants) or the single-fetch
  // cache (deep link).
  const { isSpecialPriceActive, specialPriceName } = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    const r =
      fetched?.id === restaurantId
        ? fetched
        : s.restaurants.getRestaurants?.restaurants?.data?.find(
            (x) => x.id === restaurantId,
          );
    return {
      isSpecialPriceActive: !!r?.isSpecialPriceActive,
      specialPriceName: r?.specialPriceName,
    };
  });
  const customSpecialName = specialPriceName?.trim() || null;

  const selected = PRICE_LIST_TYPES.includes(value)
    ? value
    : DEFAULT_PRICE_LIST_TYPE;
  const specialOff = !isSpecialPriceActive;
  const specialSelectedButOff = selected === "special" && specialOff;

  const handlePick = (type) => {
    if (type === "special" && specialOff) {
      toast.error(t("menuForm.special_price_inactive_toast"), {
        id: "menu-special-price-inactive",
      });
    }
    onChange(type);
  };

  return (
    <div>
      <label className="block text-[--black-2] text-sm font-medium mb-2">
        {t("menuForm.price_list_label")}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {PRICE_LIST_TYPES.map((type) => {
          const { icon: Icon } = PRICE_LIST_META[type];
          const active = selected === type;
          // Dim the "Özel Fiyat" option while the feature is off — but
          // only when it isn't the current selection, so an existing
          // menu still shows it clearly highlighted.
          const dimmed = type === "special" && specialOff && !active;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handlePick(type)}
              className={`relative flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-xl border text-xs font-semibold transition ${
                active
                  ? "border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/50 dark:ring-indigo-400/30"
                  : dimmed
                    ? "border-[--border-1] bg-[--white-2]/60 text-[--gr-2] hover:border-amber-300 hover:text-amber-700"
                    : "border-[--border-1] bg-[--white-1] text-[--gr-1] hover:border-indigo-200 hover:bg-indigo-50/40"
              }`}
            >
              {type === "special" && specialOff && (
                <Lock className="absolute top-1.5 right-1.5 size-3 text-amber-500" />
              )}
              <Icon className="size-4" />
              <span className="truncate max-w-full px-1">
                {type === "special" && customSpecialName
                  ? customSpecialName
                  : t(`menuForm.price_list_${type}`)}
              </span>
            </button>
          );
        })}
      </div>
      {specialSelectedButOff ? (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 flex items-start gap-2 dark:bg-amber-500/10 dark:border-amber-400/30">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
          <div className="text-[11px] text-amber-900 leading-snug dark:text-amber-100">
            <p className="font-semibold">
              {t("menuForm.special_price_inactive_title")}
            </p>
            <p className="mt-0.5">
              {t("menuForm.special_price_inactive_how")}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-[--gr-1] mt-1.5 leading-snug">
          {t("menuForm.price_list_hint")}
        </p>
      )}
    </div>
  );
};

// Searchable category checklist. `selectedIds` is the menu's
// `categoryIds` array; `onChange` always receives a fresh array.
export const MenuCategoryPicker = ({ restaurantId, selectedIds, onChange }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { categories, fetchedFor } = useSelector((s) => s.categories.get);
  const [search, setSearch] = useState("");

  // Lean on the slice's `fetchedFor` cache — if the owner already
  // visited the Categories page this is a no-op.
  useEffect(() => {
    if (restaurantId && (!categories || fetchedFor !== restaurantId)) {
      dispatch(getCategories({ restaurantId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const selectedSet = useMemo(
    () => new Set(selectedIds || []),
    [selectedIds],
  );

  const sorted = useMemo(() => {
    if (!categories) return null;
    return [...categories].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
  }, [categories]);

  const q = normalizeSearch(search.trim());
  const filtered = useMemo(() => {
    if (!sorted) return null;
    if (!q) return sorted;
    return sorted.filter((c) => normalizeSearch(c.name).includes(q));
  }, [sorted, q]);

  const allIds = useMemo(() => (sorted || []).map((c) => c.id), [sorted]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedSet.has(id));

  const toggle = (id) => {
    if (selectedSet.has(id)) {
      onChange((selectedIds || []).filter((x) => x !== id));
    } else {
      onChange([...(selectedIds || []), id]);
    }
  };
  const toggleAll = () => onChange(allSelected ? [] : [...allIds]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="block text-[--black-2] text-sm font-medium">
          {t("menuForm.categories_label")}
        </label>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md shrink-0 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
          {t("menuForm.categories_selected", {
            count: selectedSet.size,
            total: allIds.length,
          })}
        </span>
      </div>

      <div className="rounded-xl border border-[--border-1] bg-[--light-1] overflow-hidden">
        {/* Search + select-all toolbar */}
        <div className="flex items-center gap-2 p-2 border-b border-[--border-1] bg-[--white-1]">
          <div className="relative flex-1 min-w-0">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[--gr-2]">
              <Search className="size-3.5" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("menuForm.categories_search")}
              className="block w-full pl-8 pr-7 h-9 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 pr-2 flex items-center text-[--gr-2] hover:text-[--gr-1]"
                aria-label={t("menuForm.categories_clear_search")}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleAll}
            disabled={allIds.length === 0}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-lg text-xs font-semibold border border-[--border-1] bg-[--white-1] text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <CheckCheck className="size-3.5" />
            <span className="hidden sm:inline">
              {allSelected
                ? t("menuForm.categories_clear_all")
                : t("menuForm.categories_select_all")}
            </span>
          </button>
        </div>

        {/* Category list — own scroll so the dialog height stays sane */}
        <div className="max-h-44 overflow-y-auto custom-scrollbar">
          {!filtered ? (
            <div className="grid place-items-center py-8 text-[--gr-2]">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-xs text-[--gr-1] text-center py-8">
              {q
                ? t("menuForm.categories_no_results")
                : t("menuForm.categories_empty")}
            </div>
          ) : (
            <div className="p-1.5 flex flex-col gap-1">
              {filtered.map((cat) => {
                const checked = selectedSet.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition ${
                      checked
                        ? "bg-indigo-50 dark:bg-indigo-500/15"
                        : "hover:bg-[--white-2]"
                    }`}
                  >
                    <span
                      className={`grid place-items-center size-5 rounded-md border-2 shrink-0 transition ${
                        checked
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-[--border-1] bg-[--white-1]"
                      }`}
                    >
                      {checked && (
                        <Check className="size-3" strokeWidth={3.5} />
                      )}
                    </span>
                    <span className="grid place-items-center size-6 rounded-md bg-[--white-2] text-[--gr-1] shrink-0">
                      <Layers className="size-3" />
                    </span>
                    <span
                      className={`text-sm truncate flex-1 min-w-0 ${
                        checked
                          ? "font-semibold text-indigo-900 dark:text-indigo-100"
                          : "text-[--black-1]"
                      }`}
                    >
                      {cat.name || "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <p className="text-[11px] text-[--gr-1] mt-1.5 leading-snug">
        {t("menuForm.categories_hint")}
      </p>
    </div>
  );
};
