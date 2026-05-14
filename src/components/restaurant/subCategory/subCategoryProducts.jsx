// "Alt Kategori Ürünleri" — a two-column picker that assigns the PARENT
// category's products to / removes them from one sub-category:
//   • LEFT  — products in the parent category that are NOT in this
//             sub-category. "Ekle →" sets the product's subCategoryId
//             to this one. A chip flags products that currently sit in
//             a DIFFERENT sub-category (so "Ekle" is really a move).
//   • RIGHT — products that ARE in this sub-category. "← Çıkart" clears
//             the product's subCategoryId. Unlike a category, a product
//             CAN be sub-category-less, so there is no destination
//             picker here (contrast categoryProducts.jsx's
//             MoveToCategoryPopup).
// One search box filters both columns (Turkish-aware diacritic folding).
//
// Single data source: Products/getProductsByCategoryId on the PARENT
// category returns full product DTOs carrying subCategoryId, so both
// columns derive from one fetch — no lite catalogue needed. Assignment
// is 1:1 per the Products/EditProduct contract (single subCategoryId).
//
// Mounted via PopupContext.setPopupContent (single-popup slot). The
// `onChanged` callback fires once on close — only when an assignment
// actually persisted — so the host SubCategories page can refetch and
// refresh its productsCount badges without a wasteful round-trip on a
// look-and-close.

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Package,
  X,
  Loader2,
  Search,
  ArrowRight,
  ArrowLeft,
  PackagePlus,
  PackageCheck,
  Inbox,
  Layers,
  FolderTree,
} from "lucide-react";

import {
  getProductsByCategoryId,
  resetGetProductsByCategoryIdState,
} from "../../../redux/products/getProductsByCategoryIdSlice";
import {
  editProduct,
  resetEditProduct,
} from "../../../redux/products/editProductSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Turkish-aware diacritic folding for client-side search — mirror of the
// helper in categoryProducts.jsx ("ızgara" matches "izgara", etc.).
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

const byName = (a, b) =>
  (a.name || "").localeCompare(b.name || "", "tr", { sensitivity: "base" });

const SubCategoryProducts = ({
  subCategoryId,
  subCategoryName,
  categoryId,
  categoryName,
  restaurantId,
  onClose,
  onChanged,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { products, success, error } = useSelector(
    (s) => s.products.getByCategoryId,
  );

  // Local working copy of the parent category's products, mutated
  // optimistically as the user assigns / unassigns.
  const [items, setItems] = useState(null);
  // Serialises mutations — only one editProduct in flight at a time so
  // the optimistic state can't get clobbered by overlapping rollbacks.
  const [mutatingId, setMutatingId] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  // Did any assignment actually persist? Gates the parent refetch on
  // close so a look-and-close doesn't fire a slow getSubCategories.
  const dirtyRef = useRef(false);

  // Fetch the PARENT category's products once. The DTO carries
  // subCategoryId, so both columns derive from this single call.
  useEffect(() => {
    dispatch(getProductsByCategoryId({ categoryId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Slice → local working copy.
  useEffect(() => {
    if (products) {
      setItems((products.data || products || []).slice());
      dispatch(resetGetProductsByCategoryIdState());
    }
    if (error) dispatch(resetGetProductsByCategoryIdState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, success, error]);

  const handleClose = () => {
    if (dirtyRef.current) onChanged?.();
    onClose?.();
  };

  // Derived columns — left = not in this sub-category, right = in it.
  const q = normalizeSearch(searchVal.trim());
  const inSub = useMemo(() => {
    if (!items) return null;
    let arr = items.filter((p) => p.subCategoryId === subCategoryId);
    if (q) arr = arr.filter((p) => normalizeSearch(p.name).includes(q));
    return [...arr].sort(byName);
  }, [items, subCategoryId, q]);
  const notInSub = useMemo(() => {
    if (!items) return null;
    let arr = items.filter((p) => p.subCategoryId !== subCategoryId);
    if (q) arr = arr.filter((p) => normalizeSearch(p.name).includes(q));
    return [...arr].sort(byName);
  }, [items, subCategoryId, q]);

  const totalInSub = items
    ? items.filter((p) => p.subCategoryId === subCategoryId).length
    : 0;
  const totalNotInSub = items ? items.length - totalInSub : 0;

  // Minimal editProduct payload — carry every editable field through so
  // the backend doesn't blank them, override only subCategoryId. No
  // image field is sent: omitting it preserves the existing imageURL
  // (the same "untouched image" contract editProduct.jsx relies on).
  // The product DTO from getProductsByCategoryId has no restaurantId of
  // its own, so the prop is the source of truth for that field.
  const buildEditPayload = (p, nextSubCategoryId) => {
    const fd = new FormData();
    fd.append("id", p.id);
    fd.append("restaurantId", p.restaurantId || restaurantId || "");
    fd.append("categoryId", p.categoryId ?? categoryId ?? "");
    fd.append("subCategoryId", nextSubCategoryId ?? "");
    fd.append("name", p.name ?? "");
    fd.append("description", p.description ?? "");
    fd.append("recommendation", String(p.recommendation ?? false));
    fd.append("hide", String(p.hide ?? false));
    fd.append("freeTagging", String(p.freeTagging ?? false));
    fd.append("sortOrder", String(p.sortOrder ?? 0));
    if (Array.isArray(p.portions)) {
      fd.append("portions", JSON.stringify(p.portions));
    }
    return fd;
  };

  // Assign (nextSubCategoryId = this sub-cat id) or unassign (= "").
  // Optimistic: flip the row locally, roll back on backend reject. The
  // api response interceptor already toasts the backend error, so the
  // catch reuses that toast id instead of stacking a duplicate.
  const mutate = async (prod, nextSubCategoryId) => {
    if (mutatingId) return;
    setMutatingId(prod.id);
    const prev = items;
    setItems(
      items.map((p) =>
        p.id === prod.id
          ? {
              ...p,
              subCategoryId: nextSubCategoryId || null,
              subCategoryName: nextSubCategoryId ? subCategoryName : null,
            }
          : p,
      ),
    );
    try {
      const action = await dispatch(
        editProduct(buildEditPayload(prod, nextSubCategoryId)),
      );
      if (action?.error) throw action.payload || action.error;
      dirtyRef.current = true;
      toast.success(
        t(
          nextSubCategoryId
            ? "subCategoryProducts.add_success"
            : "subCategoryProducts.remove_success",
          { name: prod.name },
        ),
        { id: "subCatProd" },
      );
    } catch (err) {
      setItems(prev);
      const msg =
        err?.message_TR ||
        err?.message ||
        t("subCategoryProducts.save_failed");
      toast.error(msg, { id: "api-error" });
    } finally {
      dispatch(resetEditProduct());
      setMutatingId(null);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88dvh]">
      <div
        className="h-0.5 shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
      />

      {/* HEADER */}
      <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Package className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
            {subCategoryName
              ? `${t("subCategoryProducts.title")} — ${subCategoryName}`
              : t("subCategoryProducts.title")}
          </h3>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5 flex items-center gap-1">
            <FolderTree className="size-3 shrink-0" />
            {t("subCategoryProducts.subtitle", {
              category: categoryName || "—",
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={t("subCategoryProducts.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* SEARCH BAR — filters both columns at once */}
      <div className="px-3 sm:px-4 py-3 border-b border-[--border-1] bg-[--white-2]/30 shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-2]">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder={t("subCategoryProducts.search_placeholder")}
            className="block w-full pl-9 pr-9 h-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => setSearchVal("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[--gr-2] hover:text-[--gr-1]"
              aria-label={t("subCategoryProducts.clear_search")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* TWO-COLUMN BODY — single column on mobile, side-by-side on lg */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-[--border-1] bg-[--white-1] overflow-hidden">
        {/* LEFT — products NOT in this sub-category */}
        <ColumnPane
          icon={PackagePlus}
          title={t("subCategoryProducts.available_title")}
          count={notInSub?.length}
          totalCount={totalNotInSub}
          loading={!items}
          accent="slate"
        >
          {!items ? (
            <ColumnLoader />
          ) : notInSub && notInSub.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                q
                  ? t("subCategoryProducts.no_results")
                  : items.length === 0
                    ? t("subCategoryProducts.empty_category")
                    : t("subCategoryProducts.no_available")
              }
            />
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {notInSub.map((prod) => (
                <AvailableRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  onAdd={() => mutate(prod, subCategoryId)}
                  adding={mutatingId === prod.id}
                  disabled={!!mutatingId && mutatingId !== prod.id}
                />
              ))}
            </div>
          )}
        </ColumnPane>

        {/* RIGHT — products IN this sub-category */}
        <ColumnPane
          icon={PackageCheck}
          title={t("subCategoryProducts.in_subcategory_title")}
          chip={subCategoryName}
          count={inSub?.length}
          totalCount={totalInSub}
          loading={!items}
          accent="indigo"
        >
          {!items ? (
            <ColumnLoader />
          ) : inSub && inSub.length === 0 ? (
            <EmptyState
              icon={Package}
              title={
                q
                  ? t("subCategoryProducts.no_results")
                  : t("subCategoryProducts.no_products")
              }
            />
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {inSub.map((prod) => (
                <AssignedRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  onRemove={() => mutate(prod, "")}
                  removing={mutatingId === prod.id}
                  disabled={!!mutatingId && mutatingId !== prod.id}
                />
              ))}
            </div>
          )}
        </ColumnPane>
      </div>

      {/* FOOTER */}
      <div className="px-3 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-end gap-3 shrink-0 bg-[--white-1]">
        <button
          type="button"
          onClick={handleClose}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("subCategoryProducts.close")}
        </button>
      </div>
    </div>
  );
};

// One column wrapper — header strip + scrollable body. When `chip` is
// supplied the header gets a soft indigo wash and a solid indigo badge
// carrying the chip text (right pane = the active sub-category name).
// Mirror of categoryProducts.jsx's ColumnPane.
const ColumnPane = ({
  icon: Icon,
  title,
  chip,
  count,
  totalCount,
  loading,
  accent = "slate",
  children,
}) => {
  const accentMap = {
    slate: "bg-[--white-2] text-[--gr-1] ring-[--border-1]",
    indigo:
      "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30",
  };
  const showCount =
    typeof count === "number" &&
    typeof totalCount === "number" &&
    count !== totalCount
      ? `${count} / ${totalCount}`
      : typeof totalCount === "number"
        ? `${totalCount}`
        : null;
  const headerBg = chip
    ? "bg-indigo-50/60 dark:bg-indigo-500/10"
    : "bg-[--white-2]/40";
  return (
    <div className="flex flex-col min-h-0 max-h-[60dvh] lg:max-h-none overflow-hidden">
      <div
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-[--border-1] shrink-0 ${headerBg}`}
      >
        <span
          className={`grid place-items-center size-7 rounded-md ring-1 shrink-0 ${accentMap[accent]}`}
        >
          <Icon className="size-3.5" />
        </span>
        <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[--gr-1] truncate min-w-0 hidden sm:block">
          {title}
        </h4>
        {chip && (
          <span
            className="inline-flex items-center text-[11px] sm:text-xs font-bold tracking-wide px-2 py-1 rounded-md text-white shadow-sm shadow-indigo-500/30 truncate min-w-0 max-w-[60%] sm:max-w-[55%]"
            style={{ background: PRIMARY_GRADIENT }}
            title={chip}
          >
            <span className="truncate">{chip}</span>
          </span>
        )}
        <div className="flex-1 min-w-0" />
        {showCount && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] bg-[--white-1] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
            {showCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
};

const ColumnLoader = () => (
  <div className="grid place-items-center py-10 text-[--gr-2]">
    <Loader2 className="size-5 animate-spin" />
  </div>
);

const EmptyState = ({ icon: Icon, title }) => (
  <div className="p-3 sm:p-4">
    <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-6 grid place-items-center text-center">
      <span className="grid place-items-center size-10 rounded-xl bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] mb-2">
        <Icon className="size-5" />
      </span>
      <p className="text-xs text-[--gr-1]">{title}</p>
    </div>
  </div>
);

// Left-column row — name + current sub-category chip + "Ekle →" button.
// The chip flags products that already sit in ANOTHER sub-category, so
// the author sees "Ekle" is really a move, not a fresh assignment.
const AvailableRow = ({ prod, t, onAdd, adding, disabled }) => (
  <div
    className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
      adding
        ? "border-indigo-300 ring-2 ring-indigo-100"
        : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
    } ${disabled ? "opacity-50" : ""}`}
  >
    <span className="grid place-items-center size-9 rounded-lg bg-[--white-2] text-[--gr-1] shrink-0 ring-1 ring-[--border-1]">
      <Package className="size-4" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold text-[--black-1] truncate">
        {prod.name}
      </div>
      <div className="mt-0.5 flex items-center gap-1 min-w-0">
        {prod.subCategoryId ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md max-w-full dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
            <Layers className="size-2.5 shrink-0" strokeWidth={2.25} />
            <span className="truncate">{prod.subCategoryName || "—"}</span>
          </span>
        ) : (
          <span className="inline-flex items-center text-[10px] font-medium text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md">
            {t("subCategoryProducts.no_subcategory")}
          </span>
        )}
      </div>
    </div>
    <button
      type="button"
      onClick={onAdd}
      disabled={adding || disabled}
      title={t("subCategoryProducts.add")}
      className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25 shrink-0"
    >
      <span className="hidden sm:inline">{t("subCategoryProducts.add")}</span>
      {adding ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ArrowRight className="size-3.5" strokeWidth={2.5} />
      )}
    </button>
  </div>
);

// Right-column row — name + portions count + "← Çıkart" button. Amber
// tone signals "non-destructive but a removal" — the product stays in
// the system, only its subCategoryId is cleared.
const AssignedRow = ({ prod, t, onRemove, removing, disabled }) => {
  const portionsCount = Array.isArray(prod.portions)
    ? prod.portions.length
    : 0;
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
        removing
          ? "border-amber-300 ring-2 ring-amber-100"
          : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span className="grid place-items-center size-9 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
        <Package className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[--black-1] truncate">
          {prod.name}
        </div>
        <div className="text-[11px] text-[--gr-1] mt-0.5">
          {t("subCategoryProducts.portions", { count: portionsCount })}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing || disabled}
        title={t("subCategoryProducts.remove")}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30 dark:hover:bg-amber-500/25 shrink-0"
      >
        {removing ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ArrowLeft className="size-3.5" strokeWidth={2.5} />
        )}
        <span className="hidden sm:inline">
          {t("subCategoryProducts.remove")}
        </span>
      </button>
    </div>
  );
};

export default SubCategoryProducts;
