// MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { CalendarClock, Clock, Users, Save, Power } from "lucide-react";

// COMP
import CustomToggle from "../common/customToggle";
import CustomDatePicker from "../common/customdatePicker";
import SettingsTabs from "./settingsTabs";

// REDUX
import {
  setRestaurantReservationSettings,
  resetSetRestaurantReservationSettings,
} from "../../redux/restaurant/setRestaurantReservationSettingsSlice";
import {
  getRestaurantReservationSettings,
  resetGetRestaurantReservationSettingsSlice,
} from "../../redux/restaurant/getRestaurantReservationSettingsSlice";

const RestaurantReservationSettings = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const id = useParams()["*"]?.split("/")[1];

  const parseTimeToDate = (timeValue) => {
    if (!timeValue) return null;
    const [hours, minutes] = timeValue.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatDateToTime = (dateValue) => {
    if (!(dateValue instanceof Date)) return "";
    const hours = String(dateValue.getHours()).padStart(2, "0");
    const minutes = String(dateValue.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const { success, loading } = useSelector(
    (s) => s.restaurant.setRestaurantReservationSettings,
  );
  const { data: reservationSettings, error } = useSelector(
    (s) => s.restaurant.getRestaurantReservationSettings,
  );

  const [reservationData, setReservationData] = useState(null);

  //GET RESERVATION SETTINGS
  useEffect(() => {
    if (!reservationData) {
      dispatch(getRestaurantReservationSettings({ restaurantId: id }));
    }
  }, [reservationData]);

  // HANDLE SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      setRestaurantReservationSettings({
        restaurantId: id,
        ...reservationData,
      }),
    );
  };

  // GET RESERVATION DATA ON SUCCESS OR ERROR
  useEffect(() => {
    if (reservationSettings) {
      setReservationData(reservationSettings);
      dispatch(resetGetRestaurantReservationSettingsSlice());
    }
    if (error) dispatch(resetGetRestaurantReservationSettingsSlice());
  }, [reservationSettings, error]);

  // TOAST NOTIFICATIONS
  useEffect(() => {
    if (success) {
      toast.success(t("restaurantReservationSettings.updateSuccess"));
    }
    if (error) {
      dispatch(resetSetRestaurantReservationSettings());
    }
  }, [success, error]);

  const inputCls =
    "w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
  const labelCls =
    "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide";

  const SectionHeader = ({ icon: Icon, label }) => (
    <header className="flex items-center gap-1.5 mb-2.5">
      <Icon className="size-3.5 text-indigo-600" />
      <h2 className="text-[11px] font-bold text-[--gr-1] uppercase tracking-[0.12em]">
        {label}
      </h2>
    </header>
  );

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* gradient strip */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <CalendarClock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("restaurantReservationSettings.title", {
                name: data?.name || "",
              })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {reservationData?.isActive
                ? `${reservationData?.startTime || "--:--"} – ${reservationData?.endTime || "--:--"}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* DURUM */}
            <div>
              <SectionHeader
                icon={Power}
                label={t("restaurantReservationSettings.is_active_label")}
              />
              <div className="rounded-xl border border-[--border-1] bg-[--white-2]/40 p-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[--black-1] whitespace-nowrap">
                  {t("restaurantReservationSettings.is_active_label")}
                </span>
                <CustomToggle
                  label=""
                  swap
                  className1="!w-auto !shrink-0"
                  checked={reservationData?.isActive}
                  onChange={(e) =>
                    setReservationData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
              </div>
            </div>

            {/* SAATLER */}
            <div>
              <SectionHeader
                icon={Clock}
                label={`${t(
                  "restaurantReservationSettings.start_time_label",
                )} / ${t("restaurantReservationSettings.end_time_label")}`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    {t("restaurantReservationSettings.start_time_label")}
                  </label>
                  <CustomDatePicker
                    value={parseTimeToDate(reservationData?.startTime)}
                    onChange={(date) =>
                      setReservationData((prev) => ({
                        ...prev,
                        startTime: formatDateToTime(date),
                      }))
                    }
                    timeOnly
                    calendarClassName
                    className2="mt-0 sm:mt-0"
                    className="!w-full !h-10 !px-3 !rounded-lg !border !border-[--border-1] !bg-[--white-1] !text-[--black-1] !text-sm focus:!border-indigo-500"
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    {t("restaurantReservationSettings.end_time_label")}
                  </label>
                  <CustomDatePicker
                    value={parseTimeToDate(reservationData?.endTime)}
                    onChange={(date) =>
                      setReservationData((prev) => ({
                        ...prev,
                        endTime: formatDateToTime(date),
                      }))
                    }
                    timeOnly
                    calendarClassName
                    className2="mt-0 sm:mt-0"
                    className="!w-full !h-10 !px-3 !rounded-lg !border !border-[--border-1] !bg-[--white-1] !text-[--black-1] !text-sm focus:!border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* KAPASİTE */}
            <div>
              <SectionHeader
                icon={Users}
                label={t("restaurantReservationSettings.max_guests_label")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    {t("restaurantReservationSettings.interval_minutes_label")}
                  </label>
                  <div className="flex items-stretch rounded-lg border border-[--border-1] bg-[--white-1] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden">
                    <input
                      type="number"
                      min={1}
                      className="flex-1 min-w-0 h-10 px-3 outline-none text-sm bg-transparent"
                      placeholder={t(
                        "restaurantReservationSettings.interval_minutes_label",
                      )}
                      value={reservationData?.intervalMinutes ?? ""}
                      onChange={(e) =>
                        setReservationData((prev) => ({
                          ...prev,
                          intervalMinutes: e.target.value,
                        }))
                      }
                    />
                    <span className="bg-[--white-2] text-[--gr-1] text-xs font-semibold px-3 grid place-items-center border-l border-[--border-1]">
                      dk
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>
                    {t("restaurantReservationSettings.max_guests_label")}
                  </label>
                  <div className="flex items-stretch rounded-lg border border-[--border-1] bg-[--white-1] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden">
                    <input
                      type="number"
                      min={1}
                      className="flex-1 min-w-0 h-10 px-3 outline-none text-sm bg-transparent"
                      placeholder={t(
                        "restaurantReservationSettings.max_guests_label",
                      )}
                      value={reservationData?.maxGuests ?? ""}
                      onChange={(e) =>
                        setReservationData((prev) => ({
                          ...prev,
                          maxGuests: e.target.value,
                        }))
                      }
                    />
                    <span className="bg-[--white-2] text-[--gr-1] text-xs font-semibold px-3 grid place-items-center border-l border-[--border-1]">
                      <Users className="size-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <div className="flex justify-end pt-3 border-t border-[--border-1]">
              <button
                type="submit"
                disabled={loading}
                className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
                }}
              >
                <Save className="size-4" />
                {t("restaurantReservationSettings.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RestaurantReservationSettings;
