//MODULES
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { CreditCard, Search, X } from "lucide-react";

//COMP
import PaymentsTable from "../paymentsTable";
import CustomPagination from "../../common/pagination";
import FilterPayments from "../components/filterPayments";

//UTILS
import { formatDate } from "../../../utils/utils";

//REDUX
import {
  getPayments,
  resetGetPaymentsState,
} from "../../../redux/payments/getPaymentsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const PaymentsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading, success, error, payments } = useSelector(
    (state) => state.payments.get,
  );

  const [searchVal, setSearchVal] = useState("");
  const [filter, setFilter] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const itemsPerPage = import.meta.env.VITE_ROWS_PER_PAGE;

  const buildParams = (overrides = {}) => ({
    pageNumber,
    pageSize: itemsPerPage,
    searchKey: searchVal || null,
    startDateTime: filter?.startDateTime
      ? formatDate(filter.startDateTime)
      : null,
    endDateTime: filter?.endDateTime ? formatDate(filter.endDateTime) : null,
    status: filter?.statusId ?? null,
    type: filter?.typeId ?? null,
    paymentMethod: filter?.paymentMethodId ?? null,
    ...overrides,
  });

  const handlePageChange = (number) => {
    dispatch(getPayments(buildParams({ pageNumber: number })));
  };

  useEffect(() => {
    if (!paymentsData) {
      dispatch(getPayments({ pageNumber, pageSize: itemsPerPage }));
    }
  }, [paymentsData]);

  useEffect(() => {
    if (error) {
      const msg =
        error?.message_TR ||
        error?.message ||
        t("paymentsPage.generic_error");
      toast.error(msg);
      dispatch(resetGetPaymentsState());
    }
    if (success) {
      setPaymentsData(payments?.data || []);
      setTotalItems(payments?.totalCount || 0);
      dispatch(resetGetPaymentsState());
    }
  }, [loading, success, error, payments]);

  const activeFilterCount = useMemo(() => {
    if (!filter) return 0;
    let n = 0;
    if (filter.startDateTime) n++;
    if (filter.endDateTime) n++;
    if (filter.statusId != null) n++;
    if (filter.typeId != null) n++;
    if (filter.paymentMethodId != null) n++;
    return n;
  }, [filter]);

  function handleSubmitSearch(e) {
    e.preventDefault();
    dispatch(getPayments(buildParams({ pageNumber: 1 })));
    setPageNumber(1);
  }

  function handleSearchChange(value) {
    setSearchVal(value);
    if (!value) {
      dispatch(
        getPayments(buildParams({ pageNumber: 1, searchKey: null })),
      );
      setPageNumber(1);
    }
  }

  function clearSearch() {
    setSearchVal("");
    dispatch(getPayments(buildParams({ pageNumber: 1, searchKey: null })));
    setPageNumber(1);
  }

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] section_row">
      {/* HERO HEADER */}
      <header className="flex items-start gap-3 sm:gap-4 mt-4 mb-6">
        <div
          className="grid place-items-center size-11 sm:size-12 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <CreditCard className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[--black-1] leading-tight">
            {t("paymentsPage.title")}
          </h1>
          <p className="mt-1 text-sm text-[--gr-1]">
            {t("paymentsPage.subtitle")}
            {totalItems > 0
              ? ` · ${t("paymentsPage.summary_count", { count: totalItems })}`
              : ""}
          </p>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <form onSubmit={handleSubmitSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--gr-1] pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("paymentsPage.search_placeholder")}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
          />
          {searchVal && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center size-6 rounded-full hover:bg-[--white-2] text-[--gr-1] transition"
              aria-label={t("paymentsPage.clear_search")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        <FilterPayments
          filter={filter}
          setFilter={setFilter}
          searchVal={searchVal}
          pageNumber={pageNumber}
          itemsPerPage={itemsPerPage}
          setPageNumber={setPageNumber}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* LIST */}
      {loading || !paymentsData ? (
        <PaymentsListSkeleton />
      ) : (
        <PaymentsTable payments={paymentsData} />
      )}

      {/* PAGINATION */}
      {paymentsData &&
        totalItems > 0 &&
        totalItems > Number(itemsPerPage || 0) && (
          <div className="w-full flex justify-center pt-6">
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

export default PaymentsPage;

const PaymentsListSkeleton = () => (
  <ul className="space-y-2.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <li
        key={i}
        className="h-28 rounded-2xl bg-[--white-2] border border-[--border-1] animate-pulse"
      />
    ))}
  </ul>
);
