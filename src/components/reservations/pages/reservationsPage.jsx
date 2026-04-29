import {
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import FilterReservations from "../components/filterReservations";
import { useReservations } from "../../../context/reservationsContext";

const ReservationsPage = () => {
  const { t } = useTranslation();
  const {
    reservationsData,
    totalCount,
    pageNumber,
    setPageNumber,
    pageSize,
    pageNumbers,
    handlePageChange,
    handleItemsPerPage,
    handleUpdateStatus,
    updateLoading,
  } = useReservations();

  const STATUS_LABEL = {
    Accepted: t("reservationsPage.status_accepted"),
    PendingOwnerDecision: t("reservationsPage.status_pending"),
    Rejected: t("reservationsPage.status_rejected"),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-[--status-green] text-[--green-2] border-[--green-2]";
      case "PendingOwnerDecision":
        return "bg-[--status-yellow] text-[--yellow-1] border-[--yellow-1]";
      case "Rejected":
        return "bg-[--status-red] text-[--red-2] border-[--red-2]";
      default:
        return "bg-[--status-gray] text-[--gr-1] border-[--border-1]";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Accepted":
        return <CheckCircle size={14} />;
      case "PendingOwnerDecision":
        return <AlertCircle size={14} />;
      case "Rejected":
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <section className="min-h-screen bg-[--light-1] lg:ml-[280px] pt-16 px-[4%] pb-4 flex flex-col">
      <main className="flex flex-grow w-full">
        <div className="w-full">
          <div className="w-full py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[--black-1]">
                {t("reservationsPage.title")}
              </h2>
              <p className="text-[--gr-1] text-sm mt-1">
                {t("reservationsPage.subtitle")}
              </p>
            </div>

            <div className="w-auto">
              <FilterReservations />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                label: t("reservationsPage.stat_total"),
                value: reservationsData.length,
                icon: Calendar,
                color: "text-[--primary-1]",
                bg: "bg-[--status-primary-1]",
              },
              {
                label: t("reservationsPage.stat_pending"),
                value: reservationsData.filter(
                  (reservation) =>
                    reservation.status === "PendingOwnerDecision",
                ).length,
                icon: Clock,
                color: "text-[--yellow-1]",
                bg: "bg-[--status-yellow]",
              },
              {
                label: t("reservationsPage.stat_confirmed_guests"),
                value: reservationsData
                  .filter((reservation) => reservation.status === "Accepted")
                  .reduce(
                    (accumulator, currentItem) =>
                      accumulator + currentItem.guestCount,
                    0,
                  ),
                icon: Users,
                color: "text-[--green-2]",
                bg: "bg-[--status-green]",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-[--white-1] p-4 rounded-2xl border border-[--border-1] shadow-sm flex items-center gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-[--gr-1] font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-[--black-1]">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {reservationsData.map((reservation) => (
              <div
                key={reservation.id}
                className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-shrink-0 lg:w-64 border-b lg:border-b-0 lg:border-r border-[--border-1] pb-4 lg:pb-0 lg:pr-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[--light-4] flex items-center justify-center text-[--gr-1] font-bold">
                          {reservation.fullName?.charAt(0) || "-"}
                        </div>
                        <div>
                          <h3 className="font-bold text-[--black-1]">
                            {reservation.fullName || "-"}
                          </h3>
                          <div
                            className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(reservation.status)}`}
                          >
                            {getStatusIcon(reservation.status)}
                            {STATUS_LABEL[reservation.status] ||
                              reservation.status}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-[--gr-1]">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-[--gr-2]" />
                          <span className="truncate">
                            {reservation.email || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-[--gr-2]" />
                          <span>
                            {reservation.phoneCountryCode}{" "}
                            {reservation.phoneNumber}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[--gr-2] uppercase tracking-widest">
                          {t("reservationsPage.date_time")}
                        </p>
                        <div className="flex items-center gap-2 text-[--black-1] font-semibold">
                          <Calendar size={16} className="text-[--primary-1]" />
                          <span>
                            {reservation.reservationDate
                              ? new Date(
                                  reservation.reservationDate,
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[--gr-1] text-sm">
                          <Clock size={16} className="text-[--primary-1]" />
                          <span>
                            {reservation.reservationTime
                              ? reservation.reservationTime.substring(0, 5)
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[--gr-2] uppercase tracking-widest">
                          {t("reservationsPage.guests_label")}
                        </p>
                        <div className="flex items-center gap-2 text-[--black-1] font-semibold">
                          <Users size={16} className="text-[--primary-1]" />
                          <span>
                            {t("reservationsPage.people_count", {
                              count: reservation.guestCount,
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-[--gr-1]">
                          {reservation.isVerified
                            ? t("reservationsPage.verified")
                            : t("reservationsPage.unverified")}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-[--gr-2] uppercase tracking-widest">
                          {t("reservationsPage.special_notes")}
                        </p>
                        {reservation.specialNotes ? (
                          <div className="flex items-start gap-2 text-sm text-[--gr-1] italic">
                            <MessageSquare
                              size={16}
                              className="text-[--yellow-1] mt-0.5 flex-shrink-0"
                            />
                            <span>"{reservation.specialNotes}"</span>
                          </div>
                        ) : (
                          <p className="text-sm text-[--gr-2] italic">
                            {t("reservationsPage.no_special")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex lg:flex-col items-center justify-center gap-2 pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-[--border-1]">
                      {reservation.status === "PendingOwnerDecision" ? (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(reservation.id, "Accepted", "")
                            }
                            disabled={updateLoading}
                            className="flex-1 lg:w-full px-4 py-2 bg-[--primary-1] hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {t("reservationsPage.accept")}
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(reservation.id, "Rejected", "")
                            }
                            disabled={updateLoading}
                            className="flex-1 lg:w-full px-4 py-2 bg-[--white-1] hover:bg-[--light-4] text-[--red-2] border border-[--red-1] rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {t("reservationsPage.reject")}
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-[--gr-2] uppercase mb-1">
                            {t("reservationsPage.decided_on")}
                          </p>
                          <p className="text-xs font-medium text-[--gr-1]">
                            {reservation.ownerDecisionAt
                              ? new Date(
                                  reservation.ownerDecisionAt,
                                ).toLocaleDateString()
                              : "-"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {reservationsData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[--gr-2]">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">
                  {t("reservationsPage.empty_title")}
                </p>
                <p className="text-sm">
                  {t("reservationsPage.empty_desc")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {typeof totalCount === "number" && (
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

export default ReservationsPage;
