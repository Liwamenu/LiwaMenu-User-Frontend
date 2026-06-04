// MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarClock,
  Clock,
  Users,
  Save,
  Power,
  Code2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Link2,
  AlertTriangle,
} from "lucide-react";

// COMP
import CustomToggle from "../common/customToggle";
import CustomDatePicker from "../common/customdatePicker";
import SettingsTabs from "./settingsTabs";
import { useDirtyTracking } from "../../context/DirtyNavContext";
import useSmartRevalidate from "../../hooks/useSmartRevalidate";

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
  // Baseline snapshot so the DirtyNav context can flag unsaved
  // changes when the user tries to tab away.
  const [reservationDataBefore, setReservationDataBefore] = useState(null);
  useDirtyTracking(reservationData, reservationDataBefore);

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
      // Only re-seed the form when it's pristine, so a background
      // revalidate (tab focus / in-app nav / cross-device change)
      // never wipes unsaved edits. On first load both are null so the
      // isEqual check is true and the form seeds normally.
      if (isEqual(reservationData, reservationDataBefore)) {
        setReservationData(reservationSettings);
        setReservationDataBefore(reservationSettings);
      }
      dispatch(resetGetRestaurantReservationSettingsSlice());
    }
    if (error) dispatch(resetGetRestaurantReservationSettingsSlice());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationSettings, error]);

  // Cross-device / returning-to-tab freshness — see useSmartRevalidate.
  // Silent so the background refresh never flashes the global loader;
  // the dirty-guarded seed effect above keeps unsaved edits intact.
  useSmartRevalidate(
    id ? `reservationSettings:${id}` : null,
    () =>
      dispatch(
        getRestaurantReservationSettings({ restaurantId: id, __silent: true }),
      ),
  );

  // TOAST NOTIFICATIONS
  useEffect(() => {
    if (success) {
      toast.success(t("restaurantReservationSettings.updateSuccess"));
      // Save landed — accept the current state as the new baseline
      // so the DirtyNav check stops nagging until the next edit.
      setReservationDataBefore(reservationData);
    }
    if (error) {
      dispatch(resetSetRestaurantReservationSettings());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── Embed / share ──────────────────────────────────────────────────
  // The standalone reservation form is served by the customer theme at
  // https://<tenant>.liwamenu.com/reservation (form-only, iframe-ready,
  // auto-resizing via postMessage). Restaurants paste these snippets onto
  // their own websites. Requires the tenant (domain name) to be set first —
  // same gate as the QR-menu URL. The HTML/PHP snippets include a tiny
  // listener that resizes the iframe to the form's reported height so there
  // is no inner scrollbar.
  const tenant = (data?.tenant || "").trim();
  const hasTenant = !!tenant;
  const embedUrl = hasTenant
    ? `https://${tenant}.liwamenu.com/reservation`
    : "";
  const htmlSnippet = `<!-- LiwaMenu Rezervasyon Formu -->
<iframe id="liwamenu-reservation"
  src="${embedUrl}"
  title="Rezervasyon" loading="lazy"
  style="width:100%;max-width:480px;min-height:720px;border:0;display:block;margin:0 auto"></iframe>
<script>
window.addEventListener("message", function (e) {
  if (e && e.data && e.data.type === "liwamenu:reservation:height") {
    var f = document.getElementById("liwamenu-reservation");
    if (f) f.style.height = e.data.height + "px";
  }
});
</script>`;
  const phpSnippet = `<?php
// LiwaMenu Rezervasyon Formu
$tenant = ${JSON.stringify(tenant)};
?>
<iframe id="liwamenu-reservation"
  src="https://<?php echo $tenant; ?>.liwamenu.com/reservation"
  title="Rezervasyon" loading="lazy"
  style="width:100%;max-width:480px;min-height:720px;border:0;display:block;margin:0 auto"></iframe>
<script>
window.addEventListener("message", function (e) {
  if (e && e.data && e.data.type === "liwamenu:reservation:height") {
    var f = document.getElementById("liwamenu-reservation");
    if (f) f.style.height = e.data.height + "px";
  }
});
</script>`;

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

      {/* EMBED / SHARE CARD — let the owner embed the reservation form on
          their own website or share a direct link. */}
      <div className="mt-4 bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Share2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("restaurantReservationSettings.embed.title", "Web Siteme Göm / Paylaş")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "restaurantReservationSettings.embed.subtitle",
                "Rezervasyon formunu kendi sitenize ekleyin veya linkini paylaşın",
              )}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          {!hasTenant ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2 dark:bg-amber-500/10 dark:border-amber-400/30">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
              <p className="text-xs text-amber-900 leading-snug dark:text-amber-100">
                {t(
                  "restaurantReservationSettings.embed.noTenant",
                  "Gömme kodu ve link oluşturmak için önce Genel Ayarlar'dan alan adınızı (tenant) belirleyip kaydedin.",
                )}
              </p>
            </div>
          ) : (
            <>
              {!reservationData?.isActive && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2 dark:bg-amber-500/10 dark:border-amber-400/30">
                  <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
                  <p className="text-xs text-amber-900 leading-snug dark:text-amber-100">
                    {t(
                      "restaurantReservationSettings.embed.inactiveWarning",
                      "Rezervasyon şu anda kapalı — gömülen form ziyaretçilere kapalı görünür. Yukarıdan açıp kaydedin.",
                    )}
                  </p>
                </div>
              )}

              <p className="text-xs text-[--gr-1] leading-relaxed">
                {t(
                  "restaurantReservationSettings.embed.hint",
                  "Aşağıdaki linki paylaşabilir veya HTML/PHP kodunu sitenize yapıştırabilirsiniz. Form yüksekliği otomatik ayarlanır.",
                )}
              </p>

              <EmbedSnippet
                icon={Link2}
                title={t("restaurantReservationSettings.embed.linkTitle", "Paylaşım linki")}
                code={embedUrl}
                oneLine
                openHref={embedUrl}
                t={t}
              />
              <EmbedSnippet
                icon={Code2}
                title={t("restaurantReservationSettings.embed.htmlTitle", "HTML (iframe)")}
                code={htmlSnippet}
                t={t}
              />
              <EmbedSnippet
                icon={Code2}
                title={t("restaurantReservationSettings.embed.phpTitle", "PHP")}
                code={phpSnippet}
                t={t}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// One embed-format block: a labelled header (with copy + optional "open"
// buttons) over a read-only code box. Keeps its own short-lived "copied"
// state so the tick feedback is per-block.
const EmbedSnippet = ({ icon: Icon, title, code, oneLine, openHref, t }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(
        t("restaurantReservationSettings.embed.copyFailed", "Kopyalanamadı"),
      );
    }
  };
  return (
    <div className="rounded-xl border border-[--border-1] bg-[--white-2]/40 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[--border-1] bg-[--white-2]/60">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[--black-1] min-w-0">
          <Icon className="size-3.5 text-indigo-600 shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {openHref && (
            <a
              href={openHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold text-[--gr-1] bg-[--white-1] ring-1 ring-[--border-1] hover:bg-[--white-2] transition"
            >
              <ExternalLink className="size-3.5" />
              {t("restaurantReservationSettings.embed.open", "Aç")}
            </a>
          )}
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 hover:bg-indigo-100 transition dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied
              ? t("restaurantReservationSettings.embed.copied", "Kopyalandı")
              : t("restaurantReservationSettings.embed.copy", "Kopyala")}
          </button>
        </div>
      </div>
      <pre
        className={`px-3 py-2.5 text-[11px] leading-relaxed text-[--black-2] overflow-x-auto ${
          oneLine ? "whitespace-pre" : "whitespace-pre-wrap break-words"
        }`}
      >
        {code}
      </pre>
    </div>
  );
};

export default RestaurantReservationSettings;
