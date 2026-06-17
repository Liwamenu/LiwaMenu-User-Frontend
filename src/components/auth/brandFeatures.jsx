import { useTranslation } from "react-i18next";
import {
  BadgePercent,
  CalendarCheck,
  CalendarClock,
  ConciergeBell,
  Languages,
  Megaphone,
  Palette,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Utensils,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

// Single source of truth for the auth-screen brand feature list, shown in the
// left panel of Login and every AuthShell page (Register, ForgotPassword,
// SetNewPassword). Icons render uniform-white inside translucent chips so they
// read consistently over both the Login background image and the AuthShell
// gradient. WhatsApp uses its real brand mark (react-icons); the rest lucide.
export const BRAND_FEATURES = [
  { icon: ConciergeBell, key: "auth.feat_waiter_call" },
  { icon: Languages, key: "auth.feat_languages" },
  { icon: Utensils, key: "auth.feat_table_order" },
  { icon: ShoppingBag, key: "auth.feat_takeaway" },
  { icon: FaWhatsapp, key: "auth.feat_whatsapp_order" },
  { icon: CalendarCheck, key: "auth.feat_reservations" },
  { icon: Palette, key: "auth.feat_themes" },
  { icon: BadgePercent, key: "auth.feat_campaigns" },
  { icon: Megaphone, key: "auth.feat_announcements" },
  { icon: CalendarClock, key: "auth.feat_scheduled_menu" },
  { icon: Star, key: "auth.feat_google_review" },
  { icon: Share2, key: "auth.feat_social_media" },
  { icon: Store, key: "auth.feat_working_hours" },
];

// Compact two-column grid sized to fit all 13 items above the panel footer
// even on short laptops (verified at 1366x768).
export const BrandFeatureList = () => {
  const { t } = useTranslation();
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-3">
      {BRAND_FEATURES.map(({ icon: Icon, key }) => (
        <li key={key} className="flex items-center gap-2.5">
          <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <Icon className="size-4" />
          </span>
          <span className="text-sm text-white/90 leading-tight">{t(key)}</span>
        </li>
      ))}
    </ul>
  );
};
