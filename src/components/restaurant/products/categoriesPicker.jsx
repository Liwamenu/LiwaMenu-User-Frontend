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
// Per row:
//   • category name pill (the row IS the picked category)
//   • inline subcategory dropdown when that category has subs;
//     hidden otherwise so the UI doesn't pretend something exists
//   • remove button — backend orphan guard rejects empty membership
//     on EditProduct, but the form-level "required" check catches
//     it client-side first
//
// Add affordance below the list shows the picker for an unpicked
// category. Clicking a category picks it (and slots it as the
// latest row). Disappears when there's nothing left to pick.

import { useState } from "react";
import { Plus, X, Layers } from "lucide-react";
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
  const [adding, setAdding] = useState(false);

  // Set lookup for fast O(1) "is this category already picked"
  // checks while building the "available to pick" list below.
  const pickedIds = new Set((value || []).map((v) => v.categoryId));

  const availableOptions = (categories || [])
    .filter((c) => c?.id && !pickedIds.has(c.id))
    .map((c) => ({ value: c.id, label: c.name }));

  const handleAdd = (catId) => {
    const cat = (categories || []).find((c) => c.id === catId);
    if (!cat) return;
    onChange([
      ...(value || []),
      {
        categoryId: cat.id,
        categoryName: cat.name,
        subCategoryId: null,
        subCategoryName: null,
      },
    ]);
    setAdding(false);
  };

  const handleRemove = (catId) => {
    onChange((value || []).filter((v) => v.categoryId !== catId));
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

  return (
    <div className="space-y-1.5">
      <label className="block text-[--black-2] text-sm font-medium">
        {label || t("editProduct.categories_label", "Kategoriler")}
        {required ? " *" : ""}
      </label>

      {/* Picked categories list */}
      <div className="space-y-2">
        {(value || []).length === 0 && (
          <div className="rounded-xl border border-dashed border-[--border-1] bg-[--light-1] px-3 py-3 text-xs text-[--gr-1] text-center">
            {t("editProduct.no_categories_yet", "Henüz kategori eklenmedi")}
          </div>
        )}

        {(value || []).map((v) => {
          const subOptions = getSubOptions(v.categoryId);
          const hasSubs = subOptions.length > 0;
          return (
            <div
              key={v.categoryId}
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-xl border border-[--border-1] bg-[--light-1] hover:border-indigo-200 transition-colors"
            >
              {/* Category chip — indigo wash to match the row's
                  "this category is locked in" semantics. */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-white shadow-sm shadow-indigo-500/25 shrink-0 max-w-full"
                style={{ background: PRIMARY_GRADIENT }}
                title={v.categoryName}
              >
                <Layers className="size-3 shrink-0" strokeWidth={2.5} />
                <span className="truncate">{v.categoryName}</span>
              </span>

              {/* Inline subcategory dropdown — only when that
                  category actually has subs. Hiding the empty
                  control prevents "why is this dropdown empty?"
                  confusion. */}
              <div className="flex-1 min-w-0">
                {hasSubs ? (
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
                ) : (
                  <span className="text-[11px] text-[--gr-2] italic">
                    {t(
                      "editProduct.no_subs_for_category",
                      "Bu kategoride alt kategori yok",
                    )}
                  </span>
                )}
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => handleRemove(v.categoryId)}
                title={t("editProduct.remove_category", "Kaldır")}
                className="grid place-items-center size-8 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add affordance — shrinks to a small "+ Kategori Ekle"
          button when collapsed, becomes a focused autocomplete
          select when expanded. Disappears entirely once every
          category has been picked. */}
      {availableOptions.length > 0 &&
        (adding ? (
          <div className="pt-1">
            <CustomSelect
              placeholder={t(
                "editProduct.category_pick_one",
                "Kategori seç…",
              )}
              options={availableOptions}
              onChange={(opt) => opt && handleAdd(opt.value)}
              onBlur={() => setAdding(false)}
              isSearchable
              autoFocus
              menuIsOpen
              className="text-sm"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 transition dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            {t("editProduct.add_category", "Kategori Ekle")}
          </button>
        ))}
    </div>
  );
};

export default CategoriesPicker;
