// Multi-select category picker for AddProduct / EditProduct.
//
// Replaces the legacy "single CustomSelect for category + a second
// one for subcategory" duo. Under the many-to-many product model
// a product can belong to N categories with an optional
// subcategory per junction, so the working shape is:
//
//   value = [
//     { categoryId, categoryName, subCategoryId, subCategoryName },
//     ...
//   ]
//
// UI:
//   • A single trigger button that opens a checkbox-style dropdown
//     listing every available category. Checking/unchecking
//     immediately toggles inclusion in `value`. No explicit
//     "Add" affordance — the dropdown is the always-available
//     interaction surface.
//   • Below the trigger, for every picked category that has
//     subcategories, an inline CustomSelect lets the user pick
//     the optional subcategory. Categories without subs don't
//     render anything here (no empty controls).

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Layers } from "lucide-react";
import CustomSelect from "../../common/customSelector";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const CategoriesPicker = ({
  value = [],
  onChange,
  categories = [],
  subCategories = [],
  t,
  required = false,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Click-outside to close. Capture phase so the listener fires
  // before nested controls (e.g. the inline subcategory CustomSelect)
  // swallow the event.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // O(1) "is this category already picked" check while rendering the
  // checkbox list.
  const pickedIds = new Set((value || []).map((v) => v.categoryId));

  const toggleCategory = (cat) => {
    if (pickedIds.has(cat.id)) {
      onChange((value || []).filter((v) => v.categoryId !== cat.id));
    } else {
      onChange([
        ...(value || []),
        {
          categoryId: cat.id,
          categoryName: cat.name,
          subCategoryId: null,
          subCategoryName: null,
        },
      ]);
    }
  };

  const handleSubChange = (catId, opt) => {
    onChange(
      (value || []).map((v) =>
        v.categoryId === catId
          ? {
              ...v,
              subCategoryId: opt?.value || null,
              subCategoryName: opt?.label || null,
            }
          : v,
      ),
    );
  };

  const getSubOptions = (catId) =>
    (subCategories || [])
      .filter((s) => s.categoryId === catId)
      .map((s) => ({ value: s.id, label: s.name }));

  // Trigger label: empty placeholder when nothing's picked, a
  // comma-separated list when small, a count summary otherwise.
  // The list form keeps single/double selections visible at a
  // glance; the count form prevents the trigger from ballooning
  // once selections start stacking up.
  const triggerLabel =
    (value || []).length === 0
      ? t("editProduct.category_pick_one", "Kategori seç…")
      : value.length <= 2
        ? value.map((v) => v.categoryName).filter(Boolean).join(", ")
        : t(
            "editProduct.categories_selected_count",
            "{{count}} kategori seçildi",
            { count: value.length },
          );

  // Only the picked categories that actually have subs need an
  // inline subcategory selector row. Hiding the rest keeps the
  // form short.
  const rowsWithSubs = (value || []).filter(
    (v) => getSubOptions(v.categoryId).length > 0,
  );

  return (
    <div className="space-y-1.5">
      <label className="block text-[--black-2] text-sm font-medium">
        {label || t("editProduct.categories_label", "Kategoriler")}
        {required ? " *" : ""}
      </label>

      {/* Trigger + checkbox dropdown panel */}
      <div className="relative" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-[--light-1] focus:bg-[--white-1] p-3 text-[--black-1] text-sm transition outline-none ${
            open
              ? "border-[--primary-1] ring-4 ring-indigo-500/10"
              : "border-[--border-1]"
          }`}
        >
          <span
            className={`truncate ${
              (value || []).length === 0 ? "text-[--gr-1]" : ""
            }`}
          >
            {triggerLabel}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-[--gr-1] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-[--border-1] bg-[--white-1] shadow-lg">
            {(categories || []).filter((c) => c?.id).length === 0 ? (
              <div className="p-3 text-xs text-[--gr-1] text-center">
                {t(
                  "editProduct.no_available_categories",
                  "Kategori bulunamadı",
                )}
              </div>
            ) : (
              (categories || [])
                .filter((c) => c?.id)
                .map((c) => {
                  const checked = pickedIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50 transition ${
                        checked ? "bg-indigo-50/60" : ""
                      }`}
                    >
                      {/* Custom checkbox — gradient fill when checked
                          to match the brand pill used elsewhere in
                          this form, plain border when not. */}
                      <span
                        className={`grid place-items-center size-4 shrink-0 rounded border ${
                          checked
                            ? "border-transparent text-white"
                            : "border-[--border-1] bg-[--light-1]"
                        }`}
                        style={
                          checked ? { background: PRIMARY_GRADIENT } : undefined
                        }
                      >
                        {checked && (
                          <Check className="size-3" strokeWidth={3} />
                        )}
                      </span>
                      <span className="truncate">{c.name}</span>
                    </button>
                  );
                })
            )}
          </div>
        )}
      </div>

      {/* Per-picked-category subcategory selectors. Only rendered
          for categories that actually have subs — categories without
          subs are fully managed via the checkbox dropdown above. */}
      {rowsWithSubs.length > 0 && (
        <div className="space-y-2 pt-1">
          {rowsWithSubs.map((v) => {
            const subOptions = getSubOptions(v.categoryId);
            return (
              <div
                key={v.categoryId}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-[--border-1] bg-[--light-1]"
              >
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm shadow-indigo-500/25 shrink-0 max-w-full"
                  style={{ background: PRIMARY_GRADIENT }}
                  title={v.categoryName}
                >
                  <Layers className="size-3 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{v.categoryName}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    isClearable
                    placeholder={t(
                      "editProduct.subCategory_inline_placeholder",
                      "Alt kategori (opsiyonel)",
                    )}
                    value={
                      v.subCategoryId
                        ? {
                            value: v.subCategoryId,
                            label: v.subCategoryName,
                          }
                        : null
                    }
                    options={subOptions}
                    onChange={(opt) => handleSubChange(v.categoryId, opt)}
                    className="text-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoriesPicker;
