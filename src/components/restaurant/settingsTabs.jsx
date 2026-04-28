// Tab strip shown at the top of every "Genel Ayarlar" sub-page so the user
// can hop between Genel, Rezervasyon, Duyuru, Anket, Çalışma Saatleri,
// Sosyal Medya and Ödeme Yöntemleri without bouncing back to the sidebar.
//
// Each tab is a real Link so deep links and browser back/forward keep
// working — we just stop showing the same items in the sub-sidebar.
import { useEffect, useRef } from "react";
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
} from "lucide-react";

const SettingsTabs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const activeRef = useRef(null);
  const wrapRef = useRef(null);
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

  // On every route change, scroll the active tab into view inside the
  // horizontal scroller. Critical on mobile, where the bar overflows.
  useEffect(() => {
    const node = activeRef.current;
    const wrap = wrapRef.current;
    if (!node || !wrap) return;
    const nodeLeft = node.offsetLeft;
    const nodeRight = nodeLeft + node.offsetWidth;
    const viewLeft = wrap.scrollLeft;
    const viewRight = viewLeft + wrap.clientWidth;
    if (nodeLeft < viewLeft || nodeRight > viewRight) {
      wrap.scrollTo({
        left: nodeLeft - 12,
        behavior: "smooth",
      });
    }
  }, [slug]);

  return (
    <div
      ref={wrapRef}
      className="mb-3 -mx-1 overflow-x-auto scrollbar-thin"
      // Hide native scrollbar visuals on mobile but keep scroll behaviour.
      style={{ scrollbarWidth: "none" }}
    >
      <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-[--border-1] bg-[--white-1] shadow-sm whitespace-nowrap min-w-max">
        {tabs.map(({ slug: tabSlug, to, icon: Icon, label }) => {
          const active = slug === tabSlug;
          return (
            <Link
              key={tabSlug}
              ref={active ? activeRef : null}
              to={to}
              className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs sm:text-sm font-semibold transition shrink-0 ${
                active
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2]"
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
