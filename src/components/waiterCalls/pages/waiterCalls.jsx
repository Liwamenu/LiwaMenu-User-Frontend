// MODULES
import {
  Bell,
  CheckCircle2,
  Clock,
  MessageSquare,
  Trash2,
  Utensils,
  Hash,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// COMP
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import ConfirmDeleteModal from "../../common/confirmDeleteModal";
import FilterWaiterCalls from "../components/filterWaiterCalls";

// CONTEXT
import { usePopup } from "../../../context/PopupContext";

// UTILS
import { formatDateString } from "../../../utils/utils";
import { useWaiterCalls } from "../../../context/waiterCallsContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const WaiterCallsPage = () => {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  const {
    calls,
    pageNumber,
    setPageNumber,
    totalCount,
    pageSize,
    pageNumbers,
    handleResolve,
    handleDelete,
    handleItemsPerPage,
    handlePageChange,
  } = useWaiterCalls();

  const openDeleteConfirm = (call) => {
    setSecondPopupContent(
      <ConfirmDeleteModal
        title={t("waiterCalls.delete_title")}
        targetName={t("waiterCalls.delete_target", {
          table: call.tableNumber || "—",
        })}
        description={t("waiterCalls.delete_description")}
        confirmLabel={t("waiterCalls.delete_confirm")}
        onConfirm={async () => {
          await handleDelete(call.id);
          setSecondPopupContent(null);
        }}
      />,
    );
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const then = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);
    if (diffInMinutes < 1) return t("waiterCalls.just_now");
    if (diffInMinutes < 60)
      return t("waiterCalls.minutes_ago", { count: diffInMinutes });
    const diffInHours = Math.floor(diffInMinutes / 60);
    return t("waiterCalls.hours_ago", { count: diffInHours });
  };

  const activeCount = calls?.filter((c) => !c.isResolved).length || 0;

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] flex flex-col section_row">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0 relative"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Bell className="size-4" />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-rose-500 ring-2 ring-[--white-1] animate-pulse" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("waiterCalls.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {typeof totalCount === "number"
                ? t("waiterCalls.summary", {
                    active: activeCount,
                    total: totalCount,
                  })
                : t("waiterCalls.subtitle")}
            </p>
          </div>
          <div className="shrink-0">
            <FilterWaiterCalls />
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {!calls ? (
            <div className="grid place-items-center py-16 text-[--gr-1] text-sm">
              {t("waiterCalls.no_calls_yet")}
            </div>
          ) : calls.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {calls.map((call) => (
                <WaiterCallCard
                  key={call.id}
                  call={call}
                  t={t}
                  onResolve={() => handleResolve(call.id)}
                  onDelete={() => openDeleteConfirm(call)}
                  getTimeAgo={getTimeAgo}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION — pinned to the bottom; hidden when one page or no data */}
      {calls &&
        calls.length > 0 &&
        typeof totalCount === "number" &&
        totalCount > (pageSize?.value || 10) && (
          <div className="w-full flex flex-wrap justify-center items-center gap-2 pt-6 mt-auto text-[--black-2]">
            <div className="scale-[.8] min-w-20">
              <CustomSelect
                className="mt-[0] sm:mt-[0]"
                className2="mt-[0] sm:mt-[0]"
                menuPlacement="top"
                value={pageSize}
                options={pageNumbers()}
                onChange={(option) => handleItemsPerPage(option.value)}
              />
            </div>
            <CustomPagination
              pageNumber={pageNumber}
              setPageNumber={setPageNumber}
              itemsPerPage={pageSize.value}
              totalItems={totalCount}
              handlePageChange={handlePageChange}
            />
          </div>
        )}
    </section>
  );
};

// =================== CALL CARD ===================
const WaiterCallCard = ({ call, t, onResolve, onDelete, getTimeAgo }) => {
  const resolved = !!call.isResolved;
  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all ${
        resolved
          ? "border-[--border-1] bg-[--white-2] opacity-70"
          : "border-[--border-1] bg-[--white-1] hover:border-indigo-300 hover:shadow-sm"
      }`}
    >
      {/* TABLE BADGE */}
      <div
        className={`flex items-center gap-2 sm:flex-col sm:gap-0.5 sm:size-20 sm:justify-center px-3 sm:px-2 py-2 sm:py-0 rounded-lg shrink-0 transition-colors ${
          resolved
            ? "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]"
            : "text-white shadow-md shadow-indigo-500/25"
        }`}
        style={!resolved ? { background: PRIMARY_GRADIENT } : undefined}
      >
        <Hash className="size-3.5 sm:size-3 sm:opacity-80" />
        <span className="text-[10px] font-bold uppercase tracking-wider sm:opacity-90">
          {t("waiterCalls.table")}
        </span>
        <span className="text-base sm:text-lg font-bold leading-none break-all text-center">
          {call.tableNumber}
        </span>
      </div>

      {/* CONTENT */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-[--black-1] truncate">
            {call.restaurantName}
          </h3>
          {!resolved && (
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
              <span className="relative size-2 rounded-full bg-rose-500" />
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[--gr-1]">
          <div className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            <span className="tabular-nums">
              {formatDateString({
                dateString: call.createdDateTime,
                letDay: true,
                letMonth: true,
                letYear: true,
                hour: true,
                min: true,
              })}
            </span>
          </div>
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-400/20">
            {getTimeAgo(call.createdDateTime)}
          </span>
          <div className="inline-flex items-center gap-1">
            <Utensils className="size-3" />
            <span>{t("waiterCalls.dine_in")}</span>
          </div>
        </div>

        {call.note && (
          <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-[--status-yellow] border border-[--yellow-1]/40">
            <MessageSquare className="size-3.5 text-[--yellow-1] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[--black-2] italic leading-snug">
              "{call.note}"
            </p>
          </div>
        )}
      </div>

      {/* ACTIONS — Resolve (when active) / Resolved badge (when done),
          plus a Sil icon button. Sil is always available so the staff
          can clear out the list after a busy shift. */}
      <div className="shrink-0 self-end sm:self-center flex items-center gap-1.5">
        {!resolved ? (
          <button
            type="button"
            onClick={onResolve}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <CheckCircle2 className="size-4" strokeWidth={2.5} />
            {t("waiterCalls.resolve_call")}
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
            <CheckCircle2 className="size-3.5" />
            {t("waiterCalls.resolved")}
          </span>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            title={t("waiterCalls.delete_call")}
            aria-label={t("waiterCalls.delete_call")}
            className="grid place-items-center size-9 rounded-lg text-rose-600 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100 transition dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30 dark:hover:bg-rose-500/25"
          >
            <Trash2 className="size-3.5" strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  );
};

// =================== EMPTY STATE ===================
const EmptyState = ({ t }) => (
  <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2] p-8 sm:p-12 grid place-items-center text-center">
    <span className="grid place-items-center size-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 dark:bg-indigo-500/15 dark:text-indigo-300">
      <Bell className="size-7" strokeWidth={1.5} />
    </span>
    <h3 className="text-sm font-semibold text-[--black-1]">
      {t("waiterCalls.no_active_calls")}
    </h3>
    <p className="text-xs text-[--gr-1] mt-1 max-w-sm">
      {t("waiterCalls.running_smoothly")}
    </p>
  </div>
);

export default WaiterCallsPage;
