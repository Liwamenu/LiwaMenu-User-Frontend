// "Alt Kategori Ürünleri" — a two-column picker that assigns the PARENT
// category's products to / removes them from one sub-category:
//   • LEFT  — products in the parent category with NO sub-category yet.
//             "Ekle →" stages them for this sub-category. A product
//             already in a DIFFERENT sub-category is intentionally NOT
//             shown — it has to be removed from that sub-category first
//             (a product belongs to at most one sub-category).
//   • RIGHT — products staged for / already in this sub-category.
//             "← Çıkart" stages their removal.
// Nothing is persisted until the user hits "Kaydet" in the footer;
// "Vazgeç" (or the X) discards every pending toggle. One search box
// filters both columns (Turkish-aware diacritic folding).
//
// Single data source: Products/getProductsByCategoryId on the PARENT
// category returns full product DTOs carrying subCategoryId. The
// working set (`assigned`) starts from that snapshot and is toggled
// purely in local state; "Kaydet" diffs it against the snapshot and
// fires one Products/EditProduct per changed product. On success
// `onChanged` lets the host SubCategories page refetch so its
// productsCount badges reflect the new state.

import { useEffect, useMemo, useState } from "react";
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
  FolderTree,
  Save,
} from "lucide-react";

import {
  getProductsByCategoryId,
  resetGetProductsByCategoryId,
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

// A product counts as "has a sub-category" only when subCategoryId is a
// real id. The .NET backend isn't consistent about the unassigned
// case — it may return null, "", or the all-zero GUID sentinel
// (default(Guid)). Treating the empty GUID as a real id would wrongly
// classify a sub-category-less product as "in another sub-category"
// and hide it from the left column, so fold all three to "none".
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";
const hasSubCategory = (id) => !!id && id !== EMPTY_GUID;

// Pull the m2m membership that ties this product to the modal's
// PARENT category. The product can carry membership rows for several
// categories; we only care about the one for `categoryId` here
// because the subcategory selection is per-junction (a product in
// "Kebaplar" can be in sub "Et Kebabı" while the SAME product in
// "Sıcaklar" can be in sub "Ana Yemek" — independent rows).
const getParentMembership = (product, categoryId) =>
  (product?.categories || []).find((m) => m.categoryId === categoryId);

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

  const { products, error } = useSelector((s) => s.products.getByCategoryId);

  // All products in the PARENT category, straight from the slice.
  const [allItems, setAllItems] = useState(null);
  // Working set — product IDs currently assigned to THIS sub-category.
  // Toggled locally by Ekle / Çıkart; only persisted on "Kaydet".
  const [assigned, setAssigned] = useState(() => new Set());
  const [searchVal, setSearchVal] = useState("");
  const [saving, setSaving] = useState(false);

  // Initial fetch. Reset the (app-global, shared with categoryProducts)
  // slice first so a stale payload from a previous modal session can't
  // flash the wrong category's products before our fetch resolves.
  useEffect(() => {
    dispatch(resetGetProductsByCategoryId());
    dispatch(getProductsByCategoryId({ categoryId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  // Hydrate the working state when the fetch lands. Depending only on
  // `products` (not success/error) is deliberate: resetGetProductsBy
  // CategoryIdState below flips `success`, and a re-run on that would
  // wipe the user's pending toggles. The "is this product in this
  // sub?" check walks the m2m membership for the modal's PARENT
  // category — the flat `subCategoryId` alias only sees the first
  // membership, which would miss every multi-category product.
  useEffect(() => {
    if (!products) return;
    const all = products.data || products || [];
    setAllItems(all);
    setAssigned(
      new Set(
        all
          .filter((p) => {
            const m = getParentMembership(p, categoryId);
            return m && m.subCategoryId === subCategoryId;
          })
          .map((p) => p.id),
      ),
    );
    dispatch(resetGetProductsByCategoryIdState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  useEffect(() => {
    if (error) dispatch(resetGetProductsByCategoryIdState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Products eligible for this modal: those with NO sub-category in
  // the parent membership, or already in THIS one. A product sitting
  // in a DIFFERENT sub of the same parent is excluded entirely — it
  // has to be removed from its current sub-category first.
  // `hasSubCategory` folds the empty-GUID / "" / null variants so a
  // genuinely unassigned product always lands in the left column.
  const relevant = useMemo(
    () =>
      (allItems || []).filter((p) => {
        const m = getParentMembership(p, categoryId);
        // No membership in the parent (shouldn't happen — backend
        // returns this list by-parent — but defensive). Treat as
        // "no sub" so it shows up on the left.
        if (!m) return true;
        return (
          !hasSubCategory(m.subCategoryId) || m.subCategoryId === subCategoryId
        );
      }),
    [allItems, subCategoryId, categoryId],
  );
  // Baseline assignment as fetched — used to diff against `assigned`.
  const originalAssigned = useMemo(
    () =>
      new Set(
        (allItems || [])
          .filter((p) => {
            const m = getParentMembership(p, categoryId);
            return m && m.subCategoryId === subCategoryId;
          })
          .map((p) => p.id),
      ),
    [allItems, subCategoryId, categoryId],
  );

  const q = normalizeSearch(searchVal.trim());
  const inSub = useMemo(() => {
    if (!allItems) return null;
    return relevant
      .filter(
        (p) =>
          assigned.has(p.id) && (!q || normalizeSearch(p.name).includes(q)),
      )
      .sort(byName);
  }, [allItems, relevant, assigned, q]);
  const notInSub = useMemo(() => {
    if (!allItems) return null;
    return relevant
      .filter(
        (p) =>
          !assigned.has(p.id) && (!q || normalizeSearch(p.name).includes(q)),
      )
      .sort(byName);
  }, [allItems, relevant, assigned, q]);

  const totalInSub = relevant.filter((p) => assigned.has(p.id)).length;
  const totalNotInSub = relevant.length - totalInSub;

  // Pending changes vs the fetched baseline — drives the footer count,
  // the dirty flag and the save loop.
  const changes = useMemo(() => {
    const out = [];
    for (const p of relevant) {
      const isAssigned = assigned.has(p.id);
      const wasAssigned = originalAssigned.has(p.id);
      if (isAssigned && !wasAssigned) {
        out.push({ product: p, subCategoryId });
      } else if (!isAssigned && wasAssigned) {
        out.push({ product: p, subCategoryId: "" });
      }
    }
    return out;
  }, [relevant, assigned, originalAssigned, subCategoryId]);
  const dirty = changes.length > 0;

  const add = (p) =>
    setAssigned((prev) => {
      const next = new Set(prev);
      next.add(p.id);
      return next;
    });
  const remove = (p) =>
    setAssigned((prev) => {
      const next = new Set(prev);
      next.delete(p.id);
      return next;
    });

  // Minimal editProduct payload — carry every editable field through so
  // the backend doesn't blank them, override only the parent-category
  // membership's `subCategoryId`. No image field is sent: omitting it
  // preserves the existing imageURL (the same "untouched image"
  // contract editProduct.jsx relies on). The product DTO from
  // getProductsByCategoryId has no restaurantId of its own, so the
  // prop is the source of truth for that field.
  //
  // m2m: rebuild the categories[] array so only the membership for the
  // modal's PARENT category gets its subCategoryId touched — every
  // other membership round-trips untouched. The flat
  // `categoryId` / `subCategoryId` fields are still sent for the
  // backwards-compat window (see editProduct.jsx for the same bridge).
  const buildEditPayload = (p, nextSubCategoryId) => {
    const existing = Array.isArray(p.categories) ? p.categories : [];
    const updated = existing.map((m) =>
      m.categoryId === categoryId
        ? {
            categoryId: m.categoryId,
            ...(nextSubCategoryId ? { subCategoryId: nextSubCategoryId } : {}),
          }
        : {
            categoryId: m.categoryId,
            ...(m.subCategoryId ? { subCategoryId: m.subCategoryId } : {}),
          },
    );
    // Defensive: backend should always return a parent membership for
    // a product fetched by-parent-category, but if it doesn't we synth
    // one so the save doesn't silently drop the row's category link.
    if (!updated.some((m) => m.categoryId === categoryId)) {
      updated.push({
        categoryId,
        ...(nextSubCategoryId ? { subCategoryId: nextSubCategoryId } : {}),
      });
    }

    const fd = new FormData();
    fd.append("id", p.id);
    fd.append("restaurantId", p.restaurantId || restaurantId || "");
    fd.append("name", p.name ?? "");
    fd.append("description", p.description ?? "");
    fd.append("recommendation", String(p.recommendation ?? false));
    fd.append("hide", String(p.hide ?? false));
    fd.append("freeTagging", String(p.freeTagging ?? false));
    fd.append("isCampaign", String(p.isCampaign ?? false));
    if (Array.isArray(p.portions)) {
      fd.append("portions", JSON.stringify(p.portions));
    }
    fd.append("categories", JSON.stringify(updated));
    // Backwards-compat flat fields — point at the parent membership we
    // just rewrote so old backends see the new sub assignment.
    const parent = updated.find((m) => m.categoryId === categoryId);
    fd.append("categoryId", parent?.categoryId || categoryId || "");
    fd.append("subCategoryId", parent?.subCategoryId || "");
    return fd;
  };

  const handleCancel = () => {
    if (saving) return;
    onClose?.();
  };

  // Persist every pending change, one editProduct at a time (sequential
  // keeps error reporting simple and is friendly to the API). On full
  // success the host page refetches via onChanged and the modal closes.
  // On a mid-way failure we keep the modal open — but still refetch +
  // re-pull the parent category so the working set re-syncs with
  // whatever DID persist, so a retry only covers the remainder.
  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    let savedAny = false;
    try {
      for (const ch of changes) {
        const action = await dispatch(
          editProduct(buildEditPayload(ch.product, ch.subCategoryId)),
        );
        if (action?.error) throw action.payload || action.error;
        savedAny = true;
      }
      toast.success(
        t("subCategoryProducts.save_success", { count: changes.length }),
        { id: "subCatProd" },
      );
      onChanged?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.message_TR ||
        err?.message ||
        t("subCategoryProducts.save_failed");
      toast.error(msg, { id: "api-error" });
      if (savedAny) {
        onChanged?.();
        dispatch(resetGetProductsByCategoryId());
        dispatch(getProductsByCategoryId({ categoryId }));
      }
    } finally {
      dispatch(resetEditProduct());
      setSaving(false);
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
          <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] text-[--gr-1] shrink-0">
              <FolderTree className="size-3 shrink-0" />
              {t("subCategoryProducts.subtitle")}
            </span>
            {/* Parent category surfaced as a bold indigo pill so it's
                obvious at a glance which category's products this
                picker is scoped to. */}
            <span
              className="inline-flex items-center text-[11px] sm:text-xs font-bold tracking-wide px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 truncate min-w-0 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
              title={categoryName || "—"}
            >
              {categoryName || "—"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCancel}
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
          loading={!allItems}
          accent="slate"
        >
          {!allItems ? (
            <ColumnLoader />
          ) : notInSub.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                q
                  ? t("subCategoryProducts.no_results")
                  : allItems.length === 0
                    ? t("subCategoryProducts.empty_category")
                    : relevant.length === 0
                      ? t("subCategoryProducts.all_in_other")
                      : t("subCategoryProducts.no_available")
              }
            />
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {notInSub.map((prod) => (
                <ProductRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  side="left"
                  pending={originalAssigned.has(prod.id)}
                  disabled={saving}
                  onClick={() => add(prod)}
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
          loading={!allItems}
          accent="indigo"
        >
          {!allItems ? (
            <ColumnLoader />
          ) : inSub.length === 0 ? (
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
                <ProductRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  side="right"
                  pending={!originalAssigned.has(prod.id)}
                  disabled={saving}
                  onClick={() => remove(prod)}
                />
              ))}
            </div>
          )}
        </ColumnPane>
      </div>

      {/* FOOTER — Vazgeç discards, Kaydet persists the pending changes */}
      <div className="px-3 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-between gap-3 shrink-0 bg-[--white-1]">
        <span className="text-[11px] font-semibold uppercase tracking-wide truncate">
          {dirty ? (
            <span className="text-indigo-600 dark:text-indigo-300">
              {t("subCategoryProducts.pending_changes", {
                count: changes.length,
              })}
            </span>
          ) : (
            <span className="text-[--gr-1]">
              {t("subCategoryProducts.no_pending")}
            </span>
          )}
        </span>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="h-10 px-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-sm font-medium hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("subCategoryProducts.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("subCategoryProducts.save")}
          </button>
        </div>
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

// One product row, shared by both columns. `side` decides the action
// button direction (left column = "Ekle →", right = "← Çıkart"); the
// toggle is purely local — nothing persists until "Kaydet". `pending`
// flags a row whose working state differs from the fetched baseline (a
// left-column row staged for removal, or a right-column row staged for
// addition) and tints it + adds a chip so the user sees exactly what
// "Kaydet" will do.
const ProductRow = ({ prod, t, side, pending, disabled, onClick }) => {
  const isLeft = side === "left";
  const portionsCount = Array.isArray(prod.portions)
    ? prod.portions.length
    : 0;
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
        pending
          ? isLeft
            ? "border-amber-300 ring-1 ring-amber-100 dark:border-amber-400/40 dark:ring-amber-400/20"
            : "border-emerald-300 ring-1 ring-emerald-100 dark:border-emerald-400/40 dark:ring-emerald-400/20"
          : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <span
        className={`grid place-items-center size-9 rounded-lg shrink-0 ring-1 ${
          isLeft
            ? "bg-[--white-2] text-[--gr-1] ring-[--border-1]"
            : "bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
        }`}
      >
        <Package className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[--black-1] truncate">
          {prod.name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-[--gr-1] shrink-0">
            {t("subCategoryProducts.portions", { count: portionsCount })}
          </span>
          {pending && (
            <span
              className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md truncate ${
                isLeft
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/30"
              }`}
            >
              {isLeft
                ? t("subCategoryProducts.pending_remove")
                : t("subCategoryProducts.pending_add")}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={
          isLeft
            ? t("subCategoryProducts.add")
            : t("subCategoryProducts.remove")
        }
        className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0 ${
          isLeft
            ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25"
            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30 dark:hover:bg-amber-500/25"
        }`}
      >
        {isLeft ? (
          <>
            <span className="hidden sm:inline">
              {t("subCategoryProducts.add")}
            </span>
            <ArrowRight className="size-3.5" strokeWidth={2.5} />
          </>
        ) : (
          <>
            <ArrowLeft className="size-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">
              {t("subCategoryProducts.remove")}
            </span>
          </>
        )}
      </button>
    </div>
  );
};

export default SubCategoryProducts;
