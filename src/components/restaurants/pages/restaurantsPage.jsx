//MODULES
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, Store, X } from "lucide-react";

//COMP
import AddRestaurant from "../addRestaurant";
import RestaurantsCard from "../restaurantsCard";
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import { sortByCreatedDateTime } from "../../../utils/utils";

// REDUX
import {
  getRestaurants,
  resetGetRestaurantsState,
} from "../../../redux/restaurants/getRestaurantsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const RestaurantsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { loading, success, error, restaurants } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );

  const [searchVal, setSearchVal] = useState("");
  const [filter, setFilter] = useState({
    status: null,
  });
  const [restaurantsData, setRestaurantsData] = useState(null);
  const [showFilter, setShowFilter] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const itemsPerPage = import.meta.env.VITE_ROWS_PER_PAGE;
  const [totalItems, setTotalItems] = useState(null);

  const activeFilterCount = useMemo(() => {
    return [filter.status]
      .filter((v) => v && v.value !== null && v.value !== undefined)
      .length;
  }, [filter]);

  function fetchPage(opts = {}) {
    dispatch(
      getRestaurants({
        pageNumber: opts.pageNumber ?? pageNumber,
        pageSize: itemsPerPage,
        searchKey: opts.searchKey ?? searchVal ?? null,
        active: opts.active ?? filter?.status?.value ?? null,
      }),
    );
  }

  function clearSearch() {
    setSearchVal("");
    fetchPage({ searchKey: null });
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchVal) return;
    setPageNumber(1);
    fetchPage({ pageNumber: 1, searchKey: searchVal });
  }

  function applyFilter() {
    setShowFilter(false);
    setPageNumber(1);
    fetchPage({ pageNumber: 1 });
  }

  function clearFilter() {
    setFilter({
      status: null,
    });
    setShowFilter(false);
    setPageNumber(1);
    fetchPage({
      pageNumber: 1,
      active: null,
    });
  }

  function handlePageChange(number) {
    setPageNumber(number);
    fetchPage({ pageNumber: number });
  }

  // GET RESTAURANTS — fires on initial mount AND whenever the slice
  // cache is invalidated. The cross-slice matcher in
  // getRestaurantsSlice nulls `restaurants` after any license
  // purchase / restaurant add-delete-transfer, so gating only on
  // `!restaurants` (NOT the stale `restaurantsData` local mirror)
  // makes this effect re-fire and pull fresh data. Previously the
  // `!restaurantsData` guard blocked that refetch — a bought license
  // wouldn't show until a hard reload.
  //
  // The Sidebar also fetches this list on mount (pageSize=50) for
  // license-gating; the `!loading` guard means if its fetch is
  // already in flight we wait instead of firing a duplicate, and the
  // second effect below picks up whatever lands. Refetch uses the
  // CURRENT page + search + filter so an invalidation mid-session
  // doesn't silently reset the user back to page 1.
  useEffect(() => {
    if (!restaurants && !loading) {
      dispatch(
        getRestaurants({
          pageNumber,
          pageSize: itemsPerPage,
          searchKey: searchVal || null,
          active: filter?.status?.value ?? null,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, loading]);

  // SET RESTAURANTS / clear errors
  useEffect(() => {
    if (error) {
      dispatch(resetGetRestaurantsState());
    }
    if (restaurants) {
      setTotalItems(restaurants.totalCount);
      setRestaurantsData(sortByCreatedDateTime(restaurants.data));
      dispatch(resetGetRestaurantsState());
    }
  }, [success, error, restaurants]);

  const allOption = { value: null, label: t("restaurants.all") };
  const isEmpty = restaurantsData && restaurantsData.length === 0;
  const hasActiveSearchOrFilter = searchVal || activeFilterCount > 0;

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] flex flex-col section_row">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[--black-1] leading-tight">
            {t("sidebar.restaurants")}
          </h1>
          <p className="mt-1 text-sm text-[--gr-1]">
            {typeof totalItems === "number"
              ? t("restaurants.total_count", {
                  count: totalItems,
                  defaultValue: `${totalItems} restoran`,
                })
              : t("restaurants.subtitle")}
          </p>
        </div>
        <AddRestaurant onSuccess={() => fetchPage()} />
      </header>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[--gr-1] pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => {
              const v = e.target.value;
              setSearchVal(v);
              if (!v) clearSearch();
            }}
            placeholder={t("restaurants.search_placeholder")}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
          />
          {searchVal && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-7 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition"
            >
              <X className="size-4" />
            </button>
          )}
        </form>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setShowFilter((v) => !v)}
          className={`relative inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border bg-[--white-1] transition text-sm font-medium ${
            showFilter || activeFilterCount > 0
              ? "border-[--primary-1] text-[--primary-1]"
              : "border-[--border-1] text-[--black-1] hover:border-[--primary-1]/40"
          }`}
        >
          <SlidersHorizontal className="size-4" />
          {t("restaurants.filter")}
          {activeFilterCount > 0 && (
            <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-[--primary-1] text-white text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilter && (
        <div className="bg-[--white-1] border border-[--border-1] rounded-2xl p-4 sm:p-5 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[--black-1]">
              {t("restaurants.filters_title")}
            </h2>
            <button
              type="button"
              onClick={() => setShowFilter(false)}
              aria-label="Close"
              className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <CustomSelect
              label={t("restaurants.status")}
              className="text-sm"
              options={[
                allOption,
                { value: true, label: t("restaurants.active") },
                { value: false, label: t("restaurants.passive") },
              ]}
              value={filter.status || allOption}
              onChange={(opt) => setFilter((p) => ({ ...p, status: opt }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-[--border-1]">
            <button
              type="button"
              onClick={clearFilter}
              className="h-10 px-4 rounded-xl border border-[--border-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition"
            >
              {t("restaurants.clear")}
            </button>
            <button
              type="button"
              onClick={applyFilter}
              className="h-10 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110"
              style={{ background: PRIMARY_GRADIENT }}
            >
              {t("restaurants.apply")}
            </button>
          </div>
        </div>
      )}

      {/* CONTENT */}
      {loading && !restaurantsData ? (
        <SkeletonGrid />
      ) : isEmpty ? (
        <EmptyState
          searching={Boolean(hasActiveSearchOrFilter)}
          onAddSuccess={() => fetchPage()}
        />
      ) : restaurantsData ? (
        <RestaurantsCard
          inData={restaurantsData}
          totalItems={restaurantsData.length}
          onSuccess={() => fetchPage()}
        />
      ) : null}

      {/* PAGINATION — pinned to the bottom of the page via mt-auto so it
          sits at the section's footer regardless of how many cards render.
          Hidden when only one page exists. */}
      {restaurantsData &&
        restaurantsData.length > 0 &&
        typeof totalItems === "number" &&
        totalItems > Number(itemsPerPage) && (
          <div className="w-full flex justify-center pt-6 mt-auto text-[--black-2]">
            <CustomPagination
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              handlePageChange={handlePageChange}
            />
          </div>
        )}
    </section>
  );
};

export default RestaurantsPage;

// ----- Skeleton -----

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-[--border-1] bg-[--white-1] overflow-hidden"
      >
        <div className="aspect-[16/10] bg-[--white-2] animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="h-5 w-2/3 rounded bg-[--white-2] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[--white-2] animate-pulse" />
          <div className="pt-3 border-t border-[--border-1]">
            <div className="h-10 w-full rounded-xl bg-[--white-2] animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ----- Empty state -----

const EmptyState = ({ searching, onAddSuccess }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="grid place-items-center size-20 rounded-2xl bg-indigo-50 text-[--primary-1] mb-5">
        <Store className="size-10" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-[--black-1] mb-2">
        {searching
          ? t("restaurants.no_results")
          : t("restaurants.no_restaurants")}
      </h3>
      <p className="text-sm text-[--gr-1] max-w-md mb-6 px-4">
        {searching
          ? t("restaurants.no_results_description")
          : t("restaurants.no_restaurants_description")}
      </p>
      {!searching && <AddRestaurant onSuccess={onAddSuccess} />}
    </div>
  );
};
