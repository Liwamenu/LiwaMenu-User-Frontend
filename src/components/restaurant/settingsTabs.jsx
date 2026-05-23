// Tab strip shown at the top of every "Genel Ayarlar" sub-page so the user
// can hop between Genel, Rezervasyon, Duyuru, Anket, Çalışma Saatleri,
// Sosyal Medya and Ödeme Yöntemleri without bouncing back to the sidebar.
//
// Each tab is a real Link so deep links and browser back/forward keep
// working — we just stop showing the same items in the sub-sidebar.
import { Link, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Settings,
  CalendarClock,
  Megaphone,
  ClipboardList,
  Clock,
  Share2,
  CreditCard,
  Layout,
} from "lucide-react";

import { useDirtyNav } from "../../context/DirtyNavContext";

const SettingsTabs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { confirmAndNavigate } = useDirtyNav();
  // Routes look like /restaurant/<slug>/<id>; the slug is what we match on.
  const segments = location.pathname.split("/").filter(Boolean);
  const slug = segments[1] || "";
  const id =
    useParams()["*"]?.split("/")[1] ||
    useParams().id ||
    segments[2] ||
    "";

  const tabs = [
    {
      slug: "settings",
      to: `/restaurant/settings/${id}`,
      icon: Settings,
      label: t("settingsTabs.general", "Genel"),
    },
    {
      slug: "reservationSettings",
      to: `/restaurant/reservationSettings/${id}`,
      icon: CalendarClock,
      label: t("settingsTabs.reservation", "Rezervasyon"),
    },
    {
      slug: "announcementSettings",
      to: `/restaurant/announcementSettings/${id}`,
      icon: Megaphone,
      label: t("settingsTabs.announcement", "Duyuru"),
    },
    {
      slug: "surveySettings",
      to: `/restaurant/surveySettings/${id}`,
      icon: ClipboardList,
      label: t("settingsTabs.survey", "Anket"),
    },
    {
      slug: "externalPage",
      to: `/restaurant/externalPage/${id}`,
      icon: Layout,
      label: t("settingsTabs.external_page", "Harici Sayfa"),
    },
    {
      slug: "hours",
      to: `/restaurant/hours/${id}`,
      icon: Clock,
      label: t("settingsTabs.hours", "Çalışma Saatleri"),
    },
    {
      slug: "social",
      to: `/restaurant/social/${id}`,
      icon: Share2,
      label: t("settingsTabs.social", "Sosyal Medya"),
    },
    {
      slug: "payments",
      to: `/restaurant/payments/${id}`,
      icon: CreditCard,
      label: t("settingsTabs.payments", "Ödeme Yöntemleri"),
    },
  ];

  return (
    // Tabs "hang" off this top line: each one pulls up 2px to sit on it,
    // with squared tops, rounded bottoms and a thick top accent on the
    // active tab. Wraps to multiple rows on narrow widths.
    <div className="mb-3 border-t-2 border-[--border-1]">
      <div className="flex flex-wrap gap-[3px] px-1">
          {tabs.map(({ slug: tabSlug, to, icon: Icon, label }) => {
            const active = slug === tabSlug;
            return (
              <Link
                key={tabSlug}
                to={to}
                // Intercept the navigation so the DirtyNav context can
                // prompt the user before they leave a page with unsaved
                // form changes. The active tab early-returns (clicking
                // your own tab is a no-op, but we still don't want to
                // fire the confirm).
                onClick={(e) => {
                  if (active) return;
                  if (!confirmAndNavigate()) {
                    e.preventDefault();
                  }
                }}
                className={`-mt-[2px] inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-none rounded-b-[6px] border border-t-4 text-xs sm:text-sm font-medium shadow-md transition-all duration-300 active:scale-[0.97] ${
                  active
                    ? "z-10 bg-indigo-600 text-white border-indigo-600 border-t-indigo-400"
                    : "z-0 bg-[--white-2] text-[--gr-1] border-[--border-1] border-t-transparent hover:bg-[--white-1] hover:text-indigo-600 hover:border-t-[--border-1]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
      </div>
    </div>
  );
};

export default SettingsTabs;
