// MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Clock, Save, Check, CopyCheck } from "lucide-react";

// COMP
import CustomToggle from "../common/customToggle";
import CustomDatePicker from "../common/customdatePicker";
import SettingsTabs from "./settingsTabs";

// REDUX
import {
  setWorkingHours,
  resetSetWorkingHours,
} from "../../redux/restaurant/setWorkingHoursSlice";
import { getWorkingHours } from "../../redux/restaurant/getWorkingHoursSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Default open/close used when a day is toggled to "Açık" without saved
// values. 08:00–22:00 is the same starting week `addRestaurant.jsx`
// seeds at creation, so toggling a previously-closed day open lands on
// the same realistic default rather than a 24h 08:00–23:59 span.
const DEFAULT_OPEN_HHMM = "08:00";
const DEFAULT_CLOSE_HHMM = "22:00";

function parseTimeToDate(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

function formatTimeHHmm(d) {
  if (!d || isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

const WorkingHours = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const id = useParams()["*"]?.split("/")[1];

  const { success, loading } = useSelector((s) => s.restaurant.setWorkingHours);
  const { data: workingHours } = useSelector(
    (s) => s.restaurant.getWorkingHours,
  );

  const [workingHoursData, setWorkingHoursData] = useState([]);

  useEffect(() => {
    if (!workingHoursData?.length) {
      dispatch(getWorkingHours({ restaurantId: id }));
    }
  }, [workingHours, dispatch, id]);

  useEffect(() => {
    if (workingHours) {
      const mapped = workingHours.days.map((item) => ({
        Day: item.day,
        IsClosed: item.isClosed,
        Open: parseTimeToDate(item.open),
        Close: parseTimeToDate(item.close),
      }));
      setWorkingHoursData(mapped);
      dispatch(resetSetWorkingHours());
    }
  }, [workingHours]);

  useEffect(() => {
    if (loading)
      toast.loading(t("workingHours.processing"), { id: "workingHours" });
    if (success) {
      toast.success(t("workingHours.success"), { id: "workingHours" });
      dispatch(resetSetWorkingHours());
    }
  }, [loading, success, dispatch]);

  const setDay = (day, patch) =>
    setWorkingHoursData((prev) =>
      prev.map((r) => (r.Day === day ? { ...r, ...patch } : r)),
    );

  // When a day is toggled to "Open" without existing times, seed sensible
  // defaults (08:00 – 23:59) so the user doesn't start from empty pickers.
  const toggleDayOpen = (day) => {
    setWorkingHoursData((prev) =>
      prev.map((r) => {
        if (r.Day !== day) return r;
        const becomingOpen = r.IsClosed; // currently closed → opening
        if (becomingOpen) {
          return {
            ...r,
            IsClosed: false,
            Open: r.Open || parseTimeToDate(DEFAULT_OPEN_HHMM),
            Close: r.Close || parseTimeToDate(DEFAULT_CLOSE_HHMM),
          };
        }
        return { ...r, IsClosed: true };
      }),
    );
  };

  // Copy Monday's open/close into every other day. Anything previously
  // closed gets opened with Monday's hours, and any existing values are
  // overwritten — restaurants almost always run a uniform week, so the
  // user's expectation here is "make Tue–Sun match Monday." Nothing is
  // persisted until the user hits Save, so this stays undoable by just
  // editing individual rows afterwards.
  const applyMondayToAll = () => {
    const monday = workingHoursData.find((r) => r.Day === 1);
    if (!monday || monday.IsClosed || !monday.Open || !monday.Close) {
      toast.error(t("workingHours.apply_to_all_invalid"));
      return;
    }
    setWorkingHoursData((prev) =>
      prev.map((r) =>
        r.Day === 1
          ? r
          : {
              ...r,
              IsClosed: false,
              Open: monday.Open,
              Close: monday.Close,
            },
      ),
    );
    toast.success(t("workingHours.applied_to_all"), {
      id: "workingHours-apply-all",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const invalid = workingHoursData.find(
      (r) => !r.IsClosed && (!r.Open || !r.Close),
    );
    if (invalid) {
      toast.error(t("workingHours.select_time"));
      return;
    }

    const payload = {
      restaurantId: id,
      days: workingHoursData.map((r) => ({
        day: r.Day,
        isClosed: r.IsClosed,
        open: r.IsClosed ? "00:00" : formatTimeHHmm(r.Open),
        close: r.IsClosed ? "23:59" : formatTimeHHmm(r.Close),
      })),
    };

    dispatch(setWorkingHours(payload));
  };

  const dayDefs = [
    {
      label: t("workingHours.monday"),
      short: t("workingHours.monday_short"),
      day: 1,
    },
    {
      label: t("workingHours.tuesday"),
      short: t("workingHours.tuesday_short"),
      day: 2,
    },
    {
      label: t("workingHours.wednesday"),
      short: t("workingHours.wednesday_short"),
      day: 3,
    },
    {
      label: t("workingHours.thursday"),
      short: t("workingHours.thursday_short"),
      day: 4,
    },
    {
      label: t("workingHours.friday"),
      short: t("workingHours.friday_short"),
      day: 5,
    },
    {
      label: t("workingHours.saturday"),
      short: t("workingHours.saturday_short"),
      day: 6,
    },
    {
      label: t("workingHours.sunday"),
      short: t("workingHours.sunday_short"),
      day: 7,
    },
  ];

  const openDayCount = workingHoursData.filter((r) => !r.IsClosed).length;
  const closedDayCount = workingHoursData.length - openDayCount;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Clock className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("workingHours.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {workingHoursData.length > 0
                ? t("workingHours.open_count", {
                    count: openDayCount,
                    closed: closedDayCount,
                  })
                : t("workingHours.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-2">
            {workingHoursData.length > 0 &&
              dayDefs.map(({ label, short, day }) => {
                const row = workingHoursData.find((r) => r.Day === day) || {
                  Day: day,
                  IsClosed: true,
                  Open: null,
                  Close: null,
                };
                const isOpen = !row.IsClosed;

                return (
                  <div
                    key={day}
                    className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                      isOpen
                        ? "border-indigo-200 bg-[--white-1] ring-1 ring-indigo-50 shadow-sm"
                        : "border-[--border-1] bg-[--white-2]/40"
                    }`}
                  >
                    {/* Header row: badge + label + toggle (toggle moves right on mobile) */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <span
                        className={`grid place-items-center size-9 rounded-lg shrink-0 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                          isOpen
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                            : "bg-[--white-2] text-[--gr-1]"
                        }`}
                      >
                        {short}
                      </span>
                      <div className="min-w-0 flex-1 sm:w-32">
                        <div
                          className={`text-sm truncate transition-colors ${
                            isOpen
                              ? "font-semibold text-[--black-1]"
                              : "font-medium text-[--black-2]"
                          }`}
                        >
                          {label}
                        </div>
                        <div className="text-[10px] text-[--gr-2] font-medium uppercase tracking-wider">
                          {isOpen
                            ? t("workingHours.open")
                            : t("workingHours.closed")}
                        </div>
                      </div>
                      <CustomToggle
                        label=""
                        className1="!w-auto !shrink-0 sm:hidden"
                        checked={isOpen}
                        onChange={() => toggleDayOpen(day)}
                      />
                    </div>

                    {/* Toggle (desktop only — mobile version is inside the header row) */}
                    <CustomToggle
                      label=""
                      className1="!w-auto !shrink-0 hidden sm:flex"
                      checked={isOpen}
                      onChange={() => toggleDayOpen(day)}
                    />

                    {/* Time pickers — only when open */}
                    <div
                      className={`flex items-center gap-2 sm:flex-1 sm:min-w-0 sm:justify-end transition-opacity ${
                        isOpen
                          ? "opacity-100"
                          : "opacity-40 pointer-events-none"
                      }`}
                    >
                      <CustomDatePicker
                        label=""
                        timeOnly={true}
                        value={row.Open}
                        placeholder="--:--"
                        isDisabled={!isOpen}
                        className="!mt-0 !py-0 !w-full"
                        className2="!mt-0 !w-full sm:!w-[6.5rem]"
                        onChange={(v) => setDay(day, { Open: v })}
                      />
                      <span className="text-[--gr-2] text-xs font-medium">
                        –
                      </span>
                      <CustomDatePicker
                        label=""
                        timeOnly={true}
                        value={row.Close}
                        placeholder="--:--"
                        isDisabled={!isOpen}
                        className="!mt-0 !py-0 !w-full"
                        className2="!mt-0 !w-full sm:!w-[6.5rem]"
                        onChange={(v) => setDay(day, { Close: v })}
                      />
                    </div>

                    {/* "Apply Monday's hours to every other day" — only on
                        Monday, only when Monday has valid open/close set.
                        Label is shown at every breakpoint so mobile users
                        can tell what the icon-only version meant; the
                        button stretches to full row width on mobile via
                        the parent flex-col's default align-stretch. */}
                    {day === 1 && isOpen && row.Open && row.Close && (
                      <button
                        type="button"
                        onClick={applyMondayToAll}
                        title={t("workingHours.apply_to_all_tooltip")}
                        aria-label={t("workingHours.apply_to_all")}
                        className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 active:bg-indigo-200 transition shrink-0 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
                      >
                        <CopyCheck className="size-3.5" />
                        <span>{t("workingHours.apply_to_all")}</span>
                      </button>
                    )}
                  </div>
                );
              })}
          </div>

          {/* SUBMIT */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[--border-1]">
            <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide">
              {workingHoursData.length > 0
                ? t("workingHours.open_count", {
                    count: openDayCount,
                    closed: closedDayCount,
                  })
                : ""}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: PRIMARY_GRADIENT }}
            >
              {loading ? (
                <Check className="size-4 animate-pulse" />
              ) : (
                <Save className="size-4" />
              )}
              {t("workingHours.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkingHours;
