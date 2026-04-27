// MODULES
import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Package, Search, X } from "lucide-react";

// COMP
import ProductsHeader from "./header";
import ProductCard from "./productCard";
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";

// REDUX
import {
  getProducts,
  resetGetProducts,
} from "../../../redux/products/getProductsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const ALL_CATEGORIES_VALUE = "__all__";

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

    dispatch(
      getProducts({
        restaurantId,
        pageNumber: 1,
        pageSize: itemsPerPage,
        searchKey: nextSearch || "",
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
        searchKey: searchVal,
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
        searchKey: "",
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
    <div className="w-full pb-8 mt-1 text-slate-900">
      {/* Top tabs (Manage / Price List / Add) */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Package className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate tracking-tight">
              {t("productsList.title")}
            </h1>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {typeof totalItems === "number"
                ? t("productsList.summary", { count: totalItems })
                : t("productsList.subtitle")}
            </p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="px-3 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row gap-2">
            <form
              className="relative flex-1 min-w-0"
              onSubmit={(e) => {
                e.preventDefault();
                handleFilter(searchVal, "search");
              }}
            >
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input
                type="text"
                placeholder={t("productsList.search_placeholder")}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="block w-full pl-9 pr-9 h-10 rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchVal("");
                    handleFilter("", "search");
                  }}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
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
                  className="grid place-items-center h-10 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition shrink-0"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="p-3 sm:p-5">
          {productsData && productsData.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {productsData.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : productsData ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <Package className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                {t("productsList.no_products")}
              </h3>
            </div>
          ) : null}
        </div>

        {/* PAGINATION */}
        {productsData &&
          productsData.length > 0 &&
          typeof totalItems === "number" && (
            <div className="w-full flex justify-center px-3 pb-4 pt-1 text-slate-700 border-t border-slate-100">
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

export default Products;
