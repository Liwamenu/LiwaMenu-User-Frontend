// MODULES
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Package,
  Search,
  X,
  Copy,
  Loader2,
  Trash2,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// COMP
import ProductsHeader from "./header";
import ProductCard from "./productCard";
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import PageHelp from "../../common/pageHelp";
import { usePopup } from "../../../context/PopupContext";

// REDUX
import {
  getProducts,
  resetGetProducts,
} from "../../../redux/products/getProductsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const ALL_CATEGORIES_VALUE = "__all__";

// Diacritic-insensitive normalizer. Handles Turkish letters that don't
// decompose via NFD (ı, ş, ğ, …) explicitly, then strips combining marks
// for the rest of Latin script (é, ñ, ć, …).
const TR_FOLD = {
  ı: "i",
  İ: "i",
  i: "i",
  I: "i",
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ç: "c",
  Ç: "c",
  ü: "u",
  Ü: "u",
  ö: "o",
  Ö: "o",
};
const normalizeSearch = (s) => {
  if (!s) return "";
  let out = "";
  for (const ch of String(s)) out += TR_FOLD[ch] ?? ch.toLowerCase();
  return out.normalize("NFD").replace(/\p{M}+/gu, "");
};

const Products = () => {
  const params = useParams();
  const restaurantId = params.id;
  const dispatch = useDispatch();
  const { t } = useTranslation();
  // Persist the active page in the URL so navigating back from edit/details
  // (or refreshing) restores the user to the same page in the list.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Math.max(1, parseInt(searchParams.get("page"), 10) || 1);

  const { categories } = useSelector((s) => s.categories.get);
  const { products, error } = useSelector((s) => s.products.get);
  const [categoryOptions, setCategoryOptions] = useState([]);

  const allCategoryOption = {
    label: t("productsList.all_categories"),
    value: ALL_CATEGORIES_VALUE,
    id: null,
  };

  useEffect(() => {
    if (categories) {
      const options = (categories || []).map((c) => ({
        value: c.id,
        label: c.name,
        ...c,
      }));
      setCategoryOptions([allCategoryOption, ...options]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Status options use sentinel `null` for "All". The backend filter `hide`
  // expects `false`/`true` for active/closed and `null`/undefined for "any".
  const statusOptions = [
    { label: t("productsList.all_statuses"), value: null },
    { label: t("editCategories.status_open"), value: true },
    { label: t("editCategories.status_closed"), value: false },
  ];

  const [productsData, setProductsData] = useState(null);
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState(statusOptions[0]);
  const [categoryFilter, setCategoryFilter] = useState(allCategoryOption);

  const [pageNumber, setPageNumber] = useState(initialPage);
  const itemsPerPage = import.meta.env.VITE_ROWS_PER_PAGE;
  const [totalItems, setTotalItems] = useState(null);

  // Duplicate-finder mode: fetches every product once and shows only the
  // names that appear more than once so the user can clean them up.
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [allProducts, setAllProducts] = useState(null);
  const [dupLoading, setDupLoading] = useState(false);

  // Multi-select state for bulk-delete (works in both normal and dup mode).
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { setSecondPopupContent } = usePopup();

  const toggleSelectId = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  // Mirror pageNumber back into the URL whenever it changes so a back-nav
  // (or page refresh) restores it. `replace: true` avoids creating new
  // history entries for every page click.
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (pageNumber > 1) next.set("page", String(pageNumber));
    else next.delete("page");
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  // Convert a status option into the `hide` query value the backend expects.
  // Critical: when the user picks "All Statuses" we must return `null`, not
  // `!null` (which would be `true` and only fetch hidden products) — that was
  // the bug that left the page empty after toggling back to "All".
  const hideForStatus = (opt) => {
    if (!opt || opt.value === null || opt.value === undefined) return null;
    return !opt.value; // value=true → hide=false (active), value=false → hide=true (closed)
  };

  const isAllCategory = (opt) =>
    !opt || opt.value === ALL_CATEGORIES_VALUE || !opt.id;

  function handleFilter(opt, type) {
    if (type === "status") setStatusFilter(opt);
    else if (type === "category") setCategoryFilter(opt);
    else if (type === "search") setSearchVal(opt);

    const nextStatus = type === "status" ? opt : statusFilter;
    const nextCategory = type === "category" ? opt : categoryFilter;
    const nextSearch = type === "search" ? opt : searchVal;

    // Backend search isn't diacritic-insensitive (Turkish "ı" ≠ "i", etc.),
    // so search is applied client-side over `allProducts`. Backend only
    // gets the category/status/page filters here.
    dispatch(
      getProducts({
        restaurantId,
        pageNumber: 1,
        pageSize: itemsPerPage,
        hide: hideForStatus(nextStatus),
        categoryId: isAllCategory(nextCategory) ? null : nextCategory.id,
      }),
    );
    setPageNumber(1);
  }

  function handlePageChange(number) {
    if (number === pageNumber) return;
    dispatch(
      getProducts({
        restaurantId,
        pageNumber: number,
        pageSize: itemsPerPage,
        hide: hideForStatus(statusFilter),
        categoryId: isAllCategory(categoryFilter) ? null : categoryFilter.id,
      }),
    );
  }

  const clearFilters = () => {
    setSearchVal("");
    setStatusFilter(statusOptions[0]);
    setCategoryFilter(allCategoryOption);
    dispatch(
      getProducts({
        restaurantId,
        pageNumber: 1,
        pageSize: itemsPerPage,
        hide: null,
        categoryId: null,
      }),
    );
    setPageNumber(1);
  };

  const hasActiveFilters =
    searchVal ||
    statusFilter?.value !== null ||
    !isAllCategory(categoryFilter);

  // Pull *every* product (the backend silently caps pageSize at 100, so a
  // single big request returns only the first 100). We fetch page 1 to see
  // totalCount, then fan out for the remaining pages in parallel.
  // Direct API call keeps the regular paginated slice untouched.
  const fetchAllProducts = async () => {
    setDupLoading(true);
    try {
      const api = privateApi();
      const PAGE = 100;
      const first = await api.get(
        `${baseURL}Products/getProductsByRestaurantId`,
        { params: { restaurantId, pageNumber: 1, pageSize: PAGE } },
      );
      const total = first?.data?.totalCount ?? 0;
      const firstPage = first?.data?.data || [];
      const totalPages = Math.max(1, Math.ceil(total / PAGE));

      let combined = firstPage;
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            api
              .get(`${baseURL}Products/getProductsByRestaurantId`, {
                params: { restaurantId, pageNumber: i + 2, pageSize: PAGE },
              })
              .then((r) => r?.data?.data || [])
              .catch(() => []),
          ),
        );
        combined = firstPage.concat(...rest);
      }

      // De-dupe by id in case pages overlap on the server side.
      const seen = new Set();
      const unique = [];
      for (const p of combined) {
        if (p?.id && !seen.has(p.id)) {
          seen.add(p.id);
          unique.push(p);
        }
      }
      setAllProducts(unique);
    } catch {
      setAllProducts([]);
    } finally {
      setDupLoading(false);
    }
  };

  const handleToggleDuplicates = (next) => {
    setShowDuplicates(next);
    clearSelection();
    if (next) fetchAllProducts();
  };

  // Bulk delete: fire DELETE per id in parallel, count successes/failures.
  const performBulkDelete = async () => {
    if (selectedIds.size === 0 || bulkDeleting) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const api = privateApi();
    const results = await Promise.allSettled(
      ids.map((pid) =>
        api.delete(`${baseURL}Products/DeleteProduct/${pid}`),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.length - ok;
    setBulkDeleting(false);
    setSecondPopupContent(null);
    if (ok > 0) {
      toast.success(
        t("productsList.bulk_delete_success", {
          count: ok,
          defaultValue: "{{count}} ürün silindi.",
        }),
      );
    }
    if (fail > 0) {
      toast.error(
        t("productsList.bulk_delete_partial", {
          count: fail,
          defaultValue:
            "{{count}} ürün silinemedi (geçmiş kayıtlarla bağlantılı olabilir).",
        }),
        { id: "bulkDeleteError" },
      );
    }
    clearSelection();
    refetchProducts();
  };

  const openBulkDeleteConfirm = () => {
    if (selectedIds.size === 0) return;
    setSecondPopupContent(
      <BulkDeleteConfirm
        count={selectedIds.size}
        onCancel={() => setSecondPopupContent(null)}
        onConfirm={performBulkDelete}
        t={t}
      />,
    );
  };

  // "Select all visible" — second click toggles back off:
  // if every id in `visibleIds` is already selected, clear those; otherwise
  // add the missing ones to the selection.
  const selectAllVisible = (visibleIds) => {
    if (!visibleIds || visibleIds.length === 0) return;
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Group products by normalized name and keep only the names that occur
  // more than once. The flat result is what the duplicate view renders.
  const duplicateProducts = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const norm = (s) => (s || "").trim().toLowerCase();
    const groups = new Map();
    for (const p of allProducts) {
      const key = norm(p.name);
      if (!key) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    const out = [];
    for (const [, items] of groups) {
      if (items.length > 1) out.push(...items);
    }
    return out.sort((a, b) =>
      norm(a.name).localeCompare(norm(b.name), "tr") ||
      String(a.id).localeCompare(String(b.id)),
    );
  }, [allProducts]);

  const duplicateGroupCount = useMemo(() => {
    if (!duplicateProducts.length) return 0;
    return new Set(
      duplicateProducts.map((p) => (p.name || "").trim().toLowerCase()),
    ).size;
  }, [duplicateProducts]);

  // === Client-side search ===
  // Active when the user has typed anything. Searches the locally-cached
  // `allProducts` list with diacritic folding (so "kavurma" matches "Kâvurma"
  // and "ızgara" matches "izgara") because backend search is exact-match.
  const searchActive = !!searchVal && searchVal.trim().length > 0;

  // Pull the full list once when search begins (or restart it when content
  // changes via delete/edit). Skipping if duplicates mode is on — that mode
  // already loads the full list itself.
  useEffect(() => {
    if (searchActive && !allProducts && !dupLoading && !showDuplicates) {
      fetchAllProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchActive]);

  const searchResults = useMemo(() => {
    if (!searchActive || !allProducts) return null;
    const q = normalizeSearch(searchVal.trim());
    if (!q) return allProducts;
    const catId = isAllCategory(categoryFilter) ? null : categoryFilter.id;
    const statusVal = statusFilter?.value;
    return allProducts.filter((p) => {
      // Apply category filter
      if (catId && p.categoryId !== catId) return false;
      // Apply status filter (true = active, false = closed/hidden)
      if (statusVal === true && p.hide) return false;
      if (statusVal === false && !p.hide) return false;
      // Match against name (and description as a bonus)
      const nameN = normalizeSearch(p.name);
      const descN = normalizeSearch(p.description || "");
      return nameN.includes(q) || descN.includes(q);
    });
  }, [searchActive, allProducts, searchVal, categoryFilter, statusFilter]);

  // Re-fetch with the currently active filters/page — used after a delete
  // so the list reflects the server state immediately (no manual refresh).
  const refetchProducts = () => {
    if (showDuplicates || searchVal) {
      // Search is client-side over the full cache, so refresh that too.
      fetchAllProducts();
      return;
    }
    dispatch(
      getProducts({
        restaurantId,
        pageNumber,
        pageSize: itemsPerPage,
        hide: hideForStatus(statusFilter),
        categoryId: isAllCategory(categoryFilter) ? null : categoryFilter.id,
      }),
    );
  };

  useEffect(() => {
    if (!productsData) {
      // Honor the URL ?page=N on first mount so back-nav from edit lands
      // on the same page the user came from.
      dispatch(
        getProducts({
          restaurantId,
          pageNumber: initialPage,
          pageSize: itemsPerPage,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productsData]);

  useEffect(() => {
    if (products) {
      setTotalItems(products.totalCount || 0);
      setProductsData(products.data);
    }
    if (error) dispatch(resetGetProducts());
  }, [products, error]);

  useEffect(() => {
    if (!categories) dispatch(getCategories({ restaurantId }));
  }, [categories]);

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      {/* Top tabs (Manage / Price List / Add) */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Package className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("productsList.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {typeof totalItems === "number"
                ? t("productsList.summary", { count: totalItems })
                : t("productsList.subtitle")}
            </p>
          </div>
          <PageHelp pageKey="products" />
        </div>

        {/* FILTERS */}
        <div className="px-3 sm:px-5 py-3 border-b border-[--border-1] bg-[--white-2]/40">
          <div className="flex flex-col sm:flex-row gap-2">
            <form
              className="relative flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                handleFilter(searchVal, "search");
              }}
            >
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-2]">
                <Search className="size-4" />
              </span>
              <input
                type="text"
                placeholder={t("productsList.search_placeholder")}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="block w-full pl-9 pr-9 h-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    handleFilter("", "search");
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[--gr-2] hover:text-[--gr-1]"
                  title={t("productsList.clear_filters")}
                >
                  <X className="size-4" />
                </button>
              )}
            </form>

            <div className="flex gap-2 sm:shrink-0">
              <div className="flex-1 sm:w-48">
                <CustomSelect
                  label=""
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={(opt) => handleFilter(opt, "category")}
                  isSearchable={false}
                  className="text-sm font-medium"
                  className2="relative w-full"
                  menuPlacement="auto"
                />
              </div>
              <div className="flex-1 sm:w-44">
                <CustomSelect
                  label=""
                  value={statusFilter}
                  options={statusOptions}
                  onChange={(opt) => handleFilter(opt, "status")}
                  isSearchable={false}
                  className="text-sm font-medium"
                  className2="relative w-full"
                  menuPlacement="auto"
                />
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  title={t("productsList.clear_filters")}
                  aria-label={t("productsList.clear_filters")}
                  className="grid place-items-center h-10 px-2.5 rounded-lg border border-[--border-1] bg-[--white-1] text-[--gr-1] hover:bg-[--white-2] hover:text-rose-600 hover:border-rose-200 transition shrink-0"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Duplicate-finder toggle */}
          <div className="mt-2.5 flex items-center justify-between gap-3 px-1">
            <label
              htmlFor="dup-toggle"
              className={`flex items-center gap-2 text-xs cursor-pointer select-none transition ${
                showDuplicates
                  ? "text-amber-700 dark:text-amber-300 font-semibold"
                  : "text-[--gr-1]"
              }`}
            >
              <Copy className="size-3.5" />
              {t("productsList.show_duplicates", "Tekrarlananları göster")}
            </label>
            <div className="flex items-center gap-2">
              {showDuplicates && !dupLoading && allProducts && (
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
                  {t("productsList.duplicates_summary", {
                    products: duplicateProducts.length,
                    groups: duplicateGroupCount,
                    defaultValue: "{{products}} ürün · {{groups}} grup",
                  })}
                </span>
              )}
              <button
                id="dup-toggle"
                type="button"
                role="switch"
                aria-checked={showDuplicates}
                onClick={() => handleToggleDuplicates(!showDuplicates)}
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition ${
                  showDuplicates
                    ? "bg-amber-500 border-amber-500"
                    : "bg-[--white-2] border-[--border-1]"
                }`}
              >
                <span
                  className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
                    showDuplicates ? "translate-x-4" : "translate-x-0.5"
                  } translate-y-[1px]`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* TOP BULK ACTION BAR */}
        {selectedIds.size > 0 && (
          <BulkBar
            count={selectedIds.size}
            onClear={clearSelection}
            onDelete={openBulkDeleteConfirm}
            loading={bulkDeleting}
            t={t}
            position="top"
          />
        )}

        {/* PRODUCT LIST */}
        <div className="p-3 sm:p-5">
          {showDuplicates ? (
            // === Duplicate-finder view ===
            dupLoading ? (
              <div className="grid place-items-center py-12 text-[--gr-1]">
                <Loader2 className="size-6 animate-spin text-indigo-600" />
              </div>
            ) : duplicateProducts.length > 0 ? (
              <>
                {/* Quick-select shortcut: select every "extra" copy
                    (i.e. 2nd, 3rd... of each group, leaving the first). */}
                <div className="flex items-center justify-end mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const norm = (s) => (s || "").trim().toLowerCase();
                      const seen = new Set();
                      const extras = [];
                      for (const p of duplicateProducts) {
                        const k = norm(p.name);
                        if (!seen.has(k)) {
                          seen.add(k);
                        } else {
                          extras.push(p.id);
                        }
                      }
                      selectAllVisible(extras);
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-400/30"
                    title={t(
                      "productsList.select_extras_hint",
                      "Her gruptaki ilk kopya hariç hepsini seç",
                    )}
                  >
                    <CheckCheck className="size-3.5" />
                    {t("productsList.select_extras", "Fazla kopyaları seç")}
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {duplicateProducts.map((product) => {
                    const norm = (s) => (s || "").trim().toLowerCase();
                    const groupSize = duplicateProducts.filter(
                      (p) => norm(p.name) === norm(product.name),
                    ).length;
                    const indexInGroup =
                      duplicateProducts
                        .filter((p) => norm(p.name) === norm(product.name))
                        .findIndex((p) => p.id === product.id) + 1;
                    const isExtra = indexInGroup > 1;
                    return (
                      <div key={product.id} className="relative">
                        {isExtra && (
                          <span className="absolute -top-1 -left-1 z-10 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500 text-white shadow">
                            <Copy className="size-3" />
                            {t("productsList.duplicate_badge", {
                              n: indexInGroup,
                              total: groupSize,
                              defaultValue: "Kopya {{n}}/{{total}}",
                            })}
                          </span>
                        )}
                        <ProductCard
                          product={product}
                          onDeleted={refetchProducts}
                          selectable
                          selected={selectedIds.has(product.id)}
                          onToggleSelect={toggleSelectId}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
                <span className="grid place-items-center size-12 rounded-xl bg-emerald-50 text-emerald-600 mb-3 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <Copy className="size-6" />
                </span>
                <h3 className="text-sm font-semibold text-[--black-1]">
                  {t("productsList.no_duplicates", "Tekrarlanan ürün yok")}
                </h3>
                <p className="text-xs text-[--gr-1] mt-1">
                  {t(
                    "productsList.no_duplicates_hint",
                    "Tüm ürün isimleri benzersiz görünüyor.",
                  )}
                </p>
              </div>
            )
          ) : searchActive ? (
            // === Client-side search view (diacritic-insensitive) ===
            !allProducts || dupLoading ? (
              <div className="grid place-items-center py-12 text-[--gr-1]">
                <Loader2 className="size-6 animate-spin text-indigo-600" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[--gr-1]">
                    {t("productsList.search_summary", {
                      count: searchResults.length,
                      defaultValue: "{{count}} sonuç",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      selectAllVisible(searchResults.map((p) => p.id))
                    }
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
                  >
                    <CheckCheck className="size-3.5" />
                    {t("productsList.select_visible", "Sayfadakileri seç")}
                  </button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {searchResults.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onDeleted={refetchProducts}
                      selectable
                      selected={selectedIds.has(product.id)}
                      onToggleSelect={toggleSelectId}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
                <span className="grid place-items-center size-12 rounded-xl bg-[--white-2] text-[--gr-1] mb-3">
                  <Search className="size-6" />
                </span>
                <h3 className="text-sm font-semibold text-[--black-1]">
                  {t(
                    "productsList.no_search_results",
                    "Aramaya uygun ürün bulunamadı",
                  )}
                </h3>
                <p className="text-xs text-[--gr-1] mt-1">
                  "{searchVal}"
                </p>
              </div>
            )
          ) : productsData && productsData.length > 0 ? (
            // === Normal paginated view ===
            <>
              <div className="flex items-center justify-end mb-2">
                <button
                  type="button"
                  onClick={() =>
                    selectAllVisible(productsData.map((p) => p.id))
                  }
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
                >
                  <CheckCheck className="size-3.5" />
                  {t("productsList.select_visible", "Sayfadakileri seç")}
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {productsData.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDeleted={refetchProducts}
                    selectable
                    selected={selectedIds.has(product.id)}
                    onToggleSelect={toggleSelectId}
                  />
                ))}
              </div>
            </>
          ) : productsData ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <Package className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("productsList.no_products")}
              </h3>
            </div>
          ) : null}
        </div>

        {/* STICKY BOTTOM BULK ACTION BAR */}
        {selectedIds.size > 0 && (
          <BulkBar
            count={selectedIds.size}
            onClear={clearSelection}
            onDelete={openBulkDeleteConfirm}
            loading={bulkDeleting}
            t={t}
            position="bottom"
          />
        )}

        {/* PAGINATION (hidden in duplicate / search modes) */}
        {!showDuplicates &&
          !searchActive &&
          productsData &&
          productsData.length > 0 &&
          typeof totalItems === "number" && (
            <div className="w-full flex justify-center px-3 pb-4 pt-1 text-[--black-2] border-t border-[--border-1]">
              <CustomPagination
                pageNumber={pageNumber}
                setPageNumber={setPageNumber}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                handlePageChange={handlePageChange}
              />
            </div>
          )}
      </div>
    </div>
  );
};

// Selection action strip — rendered both above the list (sticky to the
// header section) and below it (sticky to the viewport bottom) so the user
// can hit "Sil" without scrolling either way.
const BulkBar = ({ count, onClear, onDelete, loading, t, position }) => {
  const wrapClass =
    position === "top"
      ? "sticky top-16 z-30 mx-3 sm:mx-5 mt-3"
      : "sticky bottom-3 z-30 mx-3 sm:mx-5 mb-3";
  return (
    <div
      className={`${wrapClass} flex items-center gap-2 p-2 rounded-xl border border-rose-200 bg-rose-50/95 backdrop-blur-sm shadow-lg dark:bg-rose-500/15 dark:border-rose-400/30 dark:shadow-rose-500/20`}
    >
      <span className="grid place-items-center size-8 rounded-md bg-rose-600 text-white shrink-0">
        <CheckCheck className="size-4" />
      </span>
      <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 flex-1 truncate">
        {t("productsList.bulk_selected", {
          count,
          defaultValue: "{{count}} ürün seçildi",
        })}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-700 bg-[--white-1] border border-rose-200 hover:bg-rose-50 transition dark:text-rose-200 dark:bg-rose-500/10 dark:border-rose-400/30"
      >
        <X className="size-3.5" />
        {t("productsList.bulk_clear", "Seçimi Temizle")}
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition shadow-md shadow-rose-500/25 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
        {t("productsList.bulk_delete", "Sil")}
      </button>
    </div>
  );
};

// Confirmation dialog for bulk delete — same visual language as the
// single-product DeleteProduct modal but with the selected count.
const BulkDeleteConfirm = ({ count, onCancel, onConfirm, t }) => {
  return (
    <main className="flex justify-center">
      <div className="bg-[--white-2] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[440px] flex flex-col items-center text-center shadow-2xl">
        <div className="size-16 bg-rose-50 dark:bg-rose-500/15 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle
            className="size-8 text-rose-600 dark:text-rose-300"
            strokeWidth={1.8}
          />
        </div>
        <h2 className="text-xl font-bold mb-3 tracking-tight">
          {t("productsList.bulk_delete_title", "Toplu Silme")}
        </h2>
        <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
          <span className="font-bold text-rose-600">{count}</span>{" "}
          {t(
            "productsList.bulk_delete_description",
            "ürün silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?",
          )}
        </p>
        <div className="flex gap-4 w-full text-sm">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--white-1] transition-colors"
          >
            {t("deleteProduct.cancel", "Vazgeç")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-2 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all"
          >
            {t("productsList.bulk_delete_confirm", "Hepsini Sil")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default Products;
