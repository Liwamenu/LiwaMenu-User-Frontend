// Google Analytics — sidebar page.
//
// SCOPE: this is a smart LAUNCHER, not an embedded analytics
// dashboard. Showing live GA numbers (page views, visitors) in-app
// requires the GA Data API (GA4) + OAuth/Service-Account credentials +
// a backend proxy + a per-restaurant Google authorisation flow — a
// much larger feature than a frontend page. The Measurement ID the
// owner enters in Genel Ayarlar only feeds the customer menu's
// tracking script (data COLLECTION); it can't READ data back. So this
// page does the useful, shippable thing today: surface whether the ID
// is configured, explain what it does, and deep-link the owner to
// their own GA dashboard where the real numbers live. An embedded
// dashboard can replace this once the backend API work lands.

import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ChartLine,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Settings as SettingsIcon,
  ArrowRight,
} from "lucide-react";

import { usePopup } from "../../context/PopupContext";
import GoogleAnalyticsHelp from "./googleAnalyticsHelp";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const GA_URL = "https://analytics.google.com/analytics/web";

const GoogleAnalytics = ({ data: inData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const restaurantId = useParams()["*"]?.split("/")[1];
  const { setPopupContent } = usePopup();

  // Resolve the restaurant the same way the rest of the app does:
  // prefer the prop, fall back to the list/single slices so a deep
  // link (no prop) still shows the right status.
  const restaurant = useSelector((s) => {
    if (inData?.id) return inData;
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    const list = s.restaurants.getRestaurants?.restaurants?.data;
    return list?.find?.((r) => r.id === restaurantId) || inData || null;
  });

  const measurementId = (restaurant?.googleAnalytics || "").trim();
  const isConfigured = measurementId.length > 0;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <ChartLine className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("googleAnalytics.title", "Google Analytics")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "googleAnalytics.subtitle",
                "Menünüzün ziyaretçi istatistikleri",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPopupContent(<GoogleAnalyticsHelp />)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-[--border-1] bg-[--white-1] text-[--gr-1] hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition shrink-0 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200 dark:hover:border-indigo-400/30"
          >
            <AlertTriangle className="size-4" />
            <span className="hidden sm:inline">
              {t("googleAnalytics.how_to", "Nasıl Kurulur?")}
            </span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* Status card */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 ${
              isConfigured
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-400/30 dark:bg-emerald-500/10"
                : "border-amber-200 bg-amber-50/50 dark:border-amber-400/30 dark:bg-amber-500/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`grid place-items-center size-10 rounded-xl shrink-0 ${
                  isConfigured
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200"
                }`}
              >
                {isConfigured ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <AlertTriangle className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[14px] font-bold text-[--black-1]">
                  {isConfigured
                    ? t(
                        "googleAnalytics.status_active_title",
                        "Google Analytics bağlı",
                      )
                    : t(
                        "googleAnalytics.status_inactive_title",
                        "Google Analytics henüz bağlı değil",
                      )}
                </h2>
                <p className="text-[12px] text-[--gr-1] mt-1 leading-relaxed">
                  {isConfigured
                    ? t(
                        "googleAnalytics.status_active_desc",
                        "Menünüz ziyaretçi verilerini topluyor. Detaylı raporlar Google Analytics panelinizde görünür.",
                      )
                    : t(
                        "googleAnalytics.status_inactive_desc",
                        "İstatistik toplamak için Genel Ayarlar'dan Ölçüm Kimliğinizi (Measurement ID) girin.",
                      )}
                </p>
                {isConfigured && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[--white-1] ring-1 ring-emerald-200 dark:bg-[--white-2] dark:ring-emerald-400/30">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
                      {t("googleAnalytics.measurement_id", "Ölçüm Kimliği")}
                    </span>
                    <code className="text-[12px] font-mono font-semibold text-emerald-700 dark:text-emerald-200">
                      {measurementId}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Primary action */}
          <a
            href={GA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <ExternalLink className="size-4" />
            {t("googleAnalytics.open_dashboard", "Google Analytics Panelini Aç")}
          </a>

          {/* Secondary: jump to settings to set/change the ID */}
          <button
            type="button"
            onClick={() => navigate(`/restaurant/settings/${restaurantId}`)}
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[--border-1] bg-[--white-1] text-[--gr-1] text-sm font-semibold hover:bg-[--white-2] transition"
          >
            <SettingsIcon className="size-4" />
            {isConfigured
              ? t("googleAnalytics.change_id", "Ölçüm Kimliğini Değiştir")
              : t("googleAnalytics.set_id", "Ölçüm Kimliğini Gir")}
            <ArrowRight className="size-3.5" />
          </button>

          {/* Why no embedded numbers — set expectations honestly */}
          <div className="rounded-xl bg-[--white-2]/60 border border-[--border-1] p-3.5">
            <p className="text-[11.5px] text-[--gr-1] leading-relaxed">
              {t(
                "googleAnalytics.embed_note",
                "Ayrıntılı grafikler ve ziyaretçi raporları güvenlik nedeniyle doğrudan Google Analytics panelinde sunulur. Yukarıdaki butonla kendi panelinize tek tıkla ulaşabilirsiniz.",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAnalytics;
