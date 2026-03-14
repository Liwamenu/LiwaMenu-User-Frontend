//MODULES
import {
  Bell,
  CheckCircle,
  Clock,
  MessageSquare,
  Utensils,
} from "lucide-react";
import { useTranslation } from "react-i18next";

//COMP
import { BellI } from "../../../assets/icon";
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import FilterWaiterCalls from "../components/filterWaiterCalls";

//UTILS
import { formatDateString } from "../../../utils/utils";
import { useWaiterCalls } from "../../../context/waiterCallsContext";

const WaiterCallsPage = () => {
  const { t } = useTranslation();
  const {
    calls,
    pageNumber,
    setPageNumber,
    totalCount,
    pageSize,
    pageNumbers,
    handleResolve,
    handleItemsPerPage,
    handlePageChange,
  } = useWaiterCalls();

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

  return (
    <section className="min-h-screen bg-[--white-1] lg:ml-[280px] pt-16 px-[4%] pb-4 flex flex-col">
      <main className="flex flex-grow w-full">
        <div className="w-full">
          {/* TITLE */}
          <div className="w-full text-[--black-2] py-4 text-2xl font-semibold flex items-center gap-3">
            <BellI className="text-red-500 animate-pulse" />
            <h2>{t("waiterCalls.title")}</h2>
            <span className="ml-auto text-sm font-normal text-[--gr-1] bg-[--white-1] px-3 py-1 rounded-full border border-[--border-1]">
              {calls?.filter((c) => !c.isResolved).length}{" "}
              {t("waiterCalls.active_calls")}
            </span>

            <FilterWaiterCalls />
          </div>

          {calls ? (
            <div className="grid gap-4 mt-4">
              {calls.map((call) => (
                <div
                  key={call.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative overflow-hidden bg-[--white-1] rounded-2xl border transition-all duration-300 ${
                    call.isResolved
                      ? "border-[--light-3] opacity-60"
                      : "border-[--border-1] hover:border-[--primary-1]"
                  }`}
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Table Indicator */}
                    <div
                      className={`flex-shrink-0 size-20 rounded-xl flex flex-col items-center justify-center transition-colors ${
                        call.isResolved
                          ? "bg-[--light-3] text-[--gr-1]"
                          : "bg-[--primary-1] text-white"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {t("waiterCalls.table")}
                      </span>
                      <span className="text-base font-black w-full text-wrap text-center">
                        {call.tableNumber}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-[--black-2]">
                          {call.restaurantName}
                        </h3>
                        {!call.isResolved && (
                          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[--gr-1]">
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} />
                          <span>
                            {formatDateString(
                              call.createdDateTime,
                              true,
                              true,
                              true,
                              true,
                              true,
                            )}
                          </span>
                          <span className="text-xs opacity-60">
                            ({getTimeAgo(call.createdDateTime)})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Utensils size={14} />
                          <span>{t("waiterCalls.dine_in")}</span>
                        </div>
                      </div>

                      {call.note && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50/50 rounded-lg border border-amber-100/50">
                          <MessageSquare
                            size={16}
                            className="text-amber-600 mt-0.5"
                          />
                          <p className="text-sm text-amber-800 italic">
                            "{call.note}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!call.isResolved ? (
                        <button
                          onClick={() => handleResolve(call.id)}
                          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CheckCircle size={18} />
                          {t("waiterCalls.resolve_call")}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 font-medium px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                          <CheckCircle size={18} />
                          <span>{t("waiterCalls.resolved")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {calls.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Bell size={48} className="mb-4 opacity-20" />
                  <p className="text-lg font-medium">
                    {t("waiterCalls.no_active_calls")}
                  </p>
                  <p className="text-sm">{t("waiterCalls.running_smoothly")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <p className="text-lg text-[--gr-1]">
                {t("waiterCalls.no_calls_yet")}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* PAGINATION */}
      {calls && typeof totalCount === "number" && (
        <div className="w-full self-end flex justify-center py-4 text-[--black-2]">
          <div className="scale-[.8] min-w-20">
            <CustomSelect
              className="mt-[0] sm:mt-[0]"
              className2="mt-[0] sm:mt-[0]"
              menuPlacement="top"
              value={pageSize}
              options={pageNumbers()}
              onChange={(option) => {
                handleItemsPerPage(option.value);
              }}
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

export default WaiterCallsPage;
