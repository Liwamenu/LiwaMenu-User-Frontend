//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Search, ShieldCheck, X } from "lucide-react";

//COMP
import AddLicense from "../actions/addLicense";
import LicensesTable from "../../common/licensesTable";

// REDUX
import {
  getLicenses,
  resetGetLicensesState,
} from "../../../redux/licenses/getLicensesSlice";

const LicensesPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { loading, success, error, licenses } = useSelector(
    (state) => state.licenses.getLicenses,
  );

  const [searchVal, setSearchVal] = useState("");
  const [licensesData, setLicensesData] = useState(null);
  const [totalItems, setTotalItems] = useState(null);

  const PAGE_SIZE = 50;

  function fetchAll(opts = {}) {
    dispatch(
      getLicenses({
        pageNumber: 1,
        pageSize: PAGE_SIZE,
        searchKey: opts.searchKey ?? searchVal ?? null,
      }),
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    if (!searchVal) return;
    fetchAll({ searchKey: searchVal });
  }

  function clearSearch() {
    setSearchVal("");
    fetchAll({ searchKey: null });
  }

  // INITIAL FETCH
  useEffect(() => {
    if (!licensesData) {
      dispatch(getLicenses({ pageNumber: 1, pageSize: PAGE_SIZE }));
    }
  }, [licensesData]);

  // GetmyLicenses already returns restaurantName/City/District/etc on each
  // license, so we just consume the response directly — no per-license
  // GetRestaurantById fan-out needed.
  useEffect(() => {
    if (error) {
      toast.error(error.message);
      dispatch(resetGetLicensesState());
    }
    if (success) {
      setTotalItems(licenses?.totalCount ?? null);
      setLicensesData(licenses?.data || []);
      dispatch(resetGetLicensesState());
    }
  }, [success, error, licenses, dispatch]);

  const isLoading = loading;
  const isEmpty = licensesData && licensesData.length === 0;
  const hasActiveSearch = Boolean(searchVal);

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] section_row">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[--black-1] leading-tight">
            {t("licenses.title")}
          </h1>
          <p className="mt-1 text-sm text-[--gr-1]">
            {typeof totalItems === "number"
              ? t("licenses.total_count", {
                  count: totalItems,
                  defaultValue: `${totalItems} lisans`,
                })
              : t("licenses.subtitle")}
          </p>
        </div>
        <AddLicense
          licenses={licensesData}
          onSuccess={() => setLicensesData(null)}
        />
      </header>

      {/* TOOLBAR — search only */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
            placeholder={t("licenses.search_placeholder")}
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
      </div>

      {/* CONTENT */}
      {isLoading && !licensesData ? (
        <SkeletonGrid />
      ) : isEmpty ? (
        <EmptyState
          searching={hasActiveSearch}
          licenses={licensesData}
          onSuccess={() => setLicensesData(null)}
        />
      ) : licensesData ? (
        <LicensesTable
          inData={licensesData}
          onSuccess={() => setLicensesData(null)}
        />
      ) : null}
    </section>
  );
};

export default LicensesPage;

// ----- Skeleton -----

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl border border-[--border-1] bg-[--white-1] overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-[--border-1] flex items-center justify-between">
          <div className="h-5 w-20 rounded-full bg-[--white-2] animate-pulse" />
          <div className="h-5 w-14 rounded-full bg-[--white-2] animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          <div className="h-5 w-3/4 rounded bg-[--white-2] animate-pulse" />
          <div className="h-3 w-1/2 rounded bg-[--white-2] animate-pulse" />
          <div className="pt-3 border-t border-[--border-1] space-y-2">
            <div className="h-4 w-full rounded bg-[--white-2] animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-[--white-2] animate-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ----- Empty state -----

const EmptyState = ({ searching, licenses, onSuccess }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
      <div className="grid place-items-center size-20 rounded-2xl bg-indigo-50 text-[--primary-1] mb-5">
        <ShieldCheck className="size-10" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-[--black-1] mb-2">
        {searching ? t("licenses.no_results") : t("licenses.no_licenses")}
      </h3>
      <p className="text-sm text-[--gr-1] max-w-md mb-6 px-4">
        {searching
          ? t("licenses.no_results_description")
          : t("licenses.no_licenses_description")}
      </p>
      {!searching && <AddLicense licenses={licenses} onSuccess={onSuccess} />}
    </div>
  );
};
