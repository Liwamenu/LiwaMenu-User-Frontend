//MODULES
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";

//COMP
import CheckI from "../../../assets/icon/check";
import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import { usePopup } from "../../../context/PopupContext";

//REEDUX
import { updatePriceList } from "../../../redux/products/updatePriceListSlice";

const ALL_CATEGORIES_VALUE = "__all__";

const BULK_TYPE_OPTIONS = [
  {
    value: "percent-increase",
    labelKey: "priceList.bulk_type_percent_increase",
  },
  {
    value: "percent-decrease",
    labelKey: "priceList.bulk_type_percent_decrease",
  },
  { value: "amount-add", labelKey: "priceList.bulk_type_amount_add" },
  { value: "amount-subtract", labelKey: "priceList.bulk_type_amount_subtract" },
];

const BULK_TARGET_OPTIONS = [
  { value: "price", labelKey: "priceList.bulk_target_price" },
  { value: "campaignPrice", labelKey: "priceList.bulk_target_campaign" },
  { value: "both", labelKey: "priceList.bulk_target_both" },
];

const PriceListApplyBulk = ({ list, setList, restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setSecondPopupContent } = usePopup();

  const [history, setHistory] = useState(null);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkTarget, setBulkTarget] = useState("price");
  // Defaults to "Tutar (+) Ekle" — restaurants more often bump prices
  // by a flat lira amount than a percentage when running quick updates.
  const [bulkType, setBulkType] = useState("amount-add");
  // null sentinel ALL_CATEGORIES_VALUE applies the change to every
  // category; otherwise we only mutate products whose categoryId
  // matches. Defaults to "all" so the existing flow stays the same
  // for users who don't touch the new dropdown.
  const [bulkCategory, setBulkCategory] = useState(ALL_CATEGORIES_VALUE);

  // Surface the special-price column as a bulk target only when the
  // restaurant has the feature on (Genel Ayarlar → Özel Fiyat Tanımı).
  // Otherwise this target would just touch a column that's hidden
  // from every other surface, which would confuse the owner.
  const specialActive = !!restaurant?.isSpecialPriceActive;
  const specialLabel =
    restaurant?.specialPriceName?.trim() || t("priceList.special");

  // Defensive: if the feature is toggled off in another tab while the
  // user had picked "specialPrice" here, snap back to the safe default
  // so the dropdown doesn't render an option that no longer exists.
  useEffect(() => {
    if (!specialActive && bulkTarget === "specialPrice") {
      setBulkTarget("price");
    }
  }, [specialActive, bulkTarget]);

  const bulkTypeOptions = BULK_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const bulkTargetOptions = useMemo(() => {
    const opts = BULK_TARGET_OPTIONS.map((opt) => ({
      value: opt.value,
      label: t(opt.labelKey),
    }));
    if (specialActive) {
      // Use the owner's custom column name ("Happy Hours", "Personel",
      // …) wrapped in the "Sadece X" / "X Only" pattern so it lines up
      // with the existing options ("Sadece Normal Fiyat" etc.).
      opts.push({
        value: "specialPrice",
        label: t("priceList.bulk_target_special_named", {
          name: specialLabel,
        }),
      });
    }
    return opts;
  }, [t, specialActive, specialLabel]);

  // Build the category dropdown from the live `list` so it always
  // matches what the user can actually see. De-duplicated by id and
  // sorted by name for predictable scrolling.
  const categoryOptions = useMemo(() => {
    const seen = new Map();
    for (const p of list || []) {
      const id = p.categoryId || "uncategorized";
      if (!seen.has(id)) {
        seen.set(id, p.categoryName || "—");
      }
    }
    const cats = [...seen.entries()]
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label), "tr"));
    return [
      { value: ALL_CATEGORIES_VALUE, label: t("priceList.bulk_all_categories") },
      ...cats,
    ];
  }, [list, t]);

  const selectedCategoryOption =
    categoryOptions.find((o) => o.value === bulkCategory) ||
    categoryOptions[0];

  // Run the actual price math. Pulled out of `applyBulkUpdate` so the
  // confirmation modal's "yes" button can call this directly without
  // re-validating or re-opening another modal.
  const runBulkUpdate = () => {
    // Save current state for undo (full list, so undo restores even
    // categories that weren't touched — keeps the contract simple).
    setHistory([...list]);

    const value = parseFloat(bulkValue);
    const onlyCategoryId =
      bulkCategory === ALL_CATEGORIES_VALUE ? null : bulkCategory;

    const updatedList = list.map((product) => {
      // Skip products outside the selected category — they pass through
      // unchanged so the rest of the price list stays intact.
      if (
        onlyCategoryId !== null &&
        (product.categoryId || "uncategorized") !== onlyCategoryId
      ) {
        return product;
      }
      const newProduct = { ...product };
      newProduct.portions = (product.portions || []).map((portion) => {
        const newPortion = { ...portion };
        const currentPrice = parseFloat(newPortion.price) || 0;
        const currentDiscounted = parseFloat(newPortion.campaignPrice) || 0;
        const currentSpecial = parseFloat(newPortion.specialPrice) || 0;

        let newPrice = currentPrice;
        let newDiscountedPrice = currentDiscounted;
        let newSpecialPrice = currentSpecial;

        // Apply to normal price
        if (bulkTarget === "price" || bulkTarget === "both") {
          if (bulkType === "percent-increase") {
            newPrice = currentPrice * (1 + value / 100);
          } else if (bulkType === "percent-decrease") {
            newPrice = currentPrice * (1 - value / 100);
          } else if (bulkType === "amount-add") {
            newPrice = currentPrice + value;
          } else if (bulkType === "amount-subtract") {
            newPrice = currentPrice - value;
          }
        }

        // Apply to discounted price
        if (bulkTarget === "campaignPrice" || bulkTarget === "both") {
          if (bulkType === "percent-increase") {
            newDiscountedPrice = currentDiscounted * (1 + value / 100);
          } else if (bulkType === "percent-decrease") {
            newDiscountedPrice = currentDiscounted * (1 - value / 100);
          } else if (bulkType === "amount-add") {
            newDiscountedPrice = currentDiscounted + value;
          } else if (bulkType === "amount-subtract") {
            newDiscountedPrice = currentDiscounted - value;
          }
        }

        // Apply to the special-price column (only target on purpose —
        // "both" stays Normal + Kampanya so the existing flow doesn't
        // suddenly start rewriting a third column when the feature
        // gets turned on).
        if (bulkTarget === "specialPrice") {
          if (bulkType === "percent-increase") {
            newSpecialPrice = currentSpecial * (1 + value / 100);
          } else if (bulkType === "percent-decrease") {
            newSpecialPrice = currentSpecial * (1 - value / 100);
          } else if (bulkType === "amount-add") {
            newSpecialPrice = currentSpecial + value;
          } else if (bulkType === "amount-subtract") {
            newSpecialPrice = currentSpecial - value;
          }
        }

        newPortion.price = Math.max(0, newPrice).toFixed(2);
        newPortion.campaignPrice = Math.max(0, newDiscountedPrice).toFixed(2);
        // Only write the special column when it's actually the bulk
        // target — keeps Normal / Kampanya updates from rewriting
        // (and reformatting) an unrelated field.
        if (bulkTarget === "specialPrice") {
          newPortion.specialPrice = Math.max(0, newSpecialPrice).toFixed(2);
        }
        return newPortion;
      });

      return newProduct;
    });

    setList(updatedList);
    dispatch(updatePriceList(updatedList));
    setBulkValue("");
  };

  const applyBulkUpdate = () => {
    if (!bulkValue || isNaN(bulkValue)) {
      toast.error(t("priceList.bulk_error_invalid_value"), {
        id: "applyInBulk",
      });
      return;
    }

    // Open the confirmation modal — actual mutation runs only after
    // the user clicks "Evet, Güncelle". This is intentional even when
    // the user picks "Tüm Kategoriler" because a single click otherwise
    // rewrites every price; the Geri Al button limits damage but the
    // confirmation gives a chance to pause first.
    const isAll = bulkCategory === ALL_CATEGORIES_VALUE;
    setSecondPopupContent(
      <BulkPriceConfirm
        t={t}
        isAll={isAll}
        categoryName={isAll ? "" : selectedCategoryOption?.label || ""}
        onCancel={() => setSecondPopupContent(null)}
        onConfirm={() => {
          setSecondPopupContent(null);
          runBulkUpdate();
        }}
      />,
    );
  };

  const handleUndo = () => {
    if (history) {
      dispatch(updatePriceList(history));
      setList(history);
      setHistory(null);
    }
  };

  return (
    // Light-theme-friendly indigo wash + matching border. Replaced the
    // earlier hardcoded `#222265/50` wrap (which forced white text on
    // dark indigo and made the "İşlem Türü / Değer / Hedef" labels
    // disappear in light mode). Inputs/selects now keep their default
    // theme-aware styling so contrast just works.
    <div className="rounded-2xl p-5 sm:p-6 mb-8 shadow-sm border bg-gradient-to-br from-indigo-50 via-violet-50/70 to-cyan-50/60 border-indigo-100 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-cyan-500/10 dark:border-indigo-400/20">
      <div className="relative z-10">
        {/* Title & Desc */}
        <div className="flex-1 mb-5">
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {t("priceList.bulk_title")}
            </h2>
          </div>
          <p className="text-indigo-700/80 dark:text-indigo-200/90 text-sm max-w-md leading-relaxed">
            {t("priceList.bulk_description")}
          </p>
        </div>

        {/* Inputs Grid — flex-wrap on desktop so the new Kategori
            dropdown doesn't push buttons off-screen on narrower
            laptops. Mobile still stacks vertically. */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 w-full">
          {/* İşlem Türü */}
          <div className="w-full sm:w-44">
            <CustomSelect
              label={t("priceList.bulk_type_label")}
              value={bulkTypeOptions.find((opt) => opt.value === bulkType)}
              options={bulkTypeOptions}
              onChange={(opt) => setBulkType(opt.value)}
              isSearchable={false}
              className="text-sm"
            />
          </div>

          {/* Değer */}
          <div className="w-full sm:w-32">
            <CustomInput
              label={t("priceList.bulk_value_label")}
              type="number"
              placeholder={t("priceList.bulk_value_placeholder")}
              value={bulkValue}
              onChange={(v) => setBulkValue(v)}
              // CustomInput's base styles don't set a bg, which leaves
              // the browser default (light) in dark mode and turns the
              // already-light --black-2 text invisible. Force theme-
              // aware surface + a higher-contrast text colour here.
              className="bg-[--white-1] text-[--black-1]"
            />
          </div>

          {/* Hedef */}
          <div className="w-full sm:w-52">
            <CustomSelect
              label={t("priceList.bulk_target_label")}
              value={bulkTargetOptions.find((opt) => opt.value === bulkTarget)}
              options={bulkTargetOptions}
              onChange={(opt) => setBulkTarget(opt.value)}
              isSearchable={false}
              className="text-sm"
            />
          </div>

          {/* Kategori — limits the bulk update to a single category
              when picked, "Tüm Kategoriler" applies to everything. */}
          <div className="w-full sm:w-52">
            <CustomSelect
              label={t("priceList.bulk_category_label")}
              value={selectedCategoryOption}
              options={categoryOptions}
              onChange={(opt) =>
                setBulkCategory(opt?.value ?? ALL_CATEGORIES_VALUE)
              }
              isSearchable={categoryOptions.length > 6}
              className="text-sm"
            />
          </div>

          {/* Geri Al Button */}
          {history && (
            <div className="flex flex-col justify-end">
              <button
                onClick={handleUndo}
                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-[--white-1] border border-[--border-1] text-[--gr-1] font-semibold text-sm hover:bg-[--white-2] hover:text-[--black-1] transition whitespace-nowrap"
                title={t("priceList.bulk_undo_title")}
              >
                {t("priceList.bulk_undo_button")}
              </button>
            </div>
          )}

          {/* Uygula Button */}
          <div className="flex flex-col justify-end w-full sm:w-auto">
            <button
              onClick={applyBulkUpdate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-500/25 transition"
            >
              <CheckI className="size-[1.1rem]" />
              {t("priceList.bulk_apply_button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Confirmation dialog shown before the bulk price math runs. Amber
// (warning) tone instead of rose because the action is reversible via
// the Geri Al button — we just want a deliberate pause.
const BulkPriceConfirm = ({ t, isAll, categoryName, onCancel, onConfirm }) => (
  <main className="flex justify-center">
    <div className="bg-[--white-2] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[460px] flex flex-col items-center text-center shadow-2xl">
      <div className="size-16 bg-amber-50 dark:bg-amber-500/15 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle
          className="size-8 text-amber-600 dark:text-amber-300"
          strokeWidth={1.8}
        />
      </div>
      <h2 className="text-xl font-bold mb-3 tracking-tight">
        {t("priceList.bulk_confirm_title")}
      </h2>
      <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
        {isAll
          ? t("priceList.bulk_confirm_message_all")
          : t("priceList.bulk_confirm_message_category", {
              category: categoryName,
            })}
      </p>
      <div className="flex gap-4 w-full text-sm">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--white-1] transition-colors"
        >
          {t("priceList.bulk_confirm_cancel")}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-md shadow-amber-500/25"
        >
          {t("priceList.bulk_confirm_yes")}
        </button>
      </div>
    </div>
  </main>
);

export default PriceListApplyBulk;
