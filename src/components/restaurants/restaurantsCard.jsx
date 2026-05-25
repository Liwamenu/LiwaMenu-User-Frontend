import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ImageIcon,
  MapPin,
  ShieldCheck,
  ShieldX,
  Sparkles,
} from "lucide-react";
import { formatDateString } from "../../utils/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const RestaurantsCard = ({ inData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function goToLicensePurchase(r) {
    if (r.licenseId) {
      navigate("/licenses/extend-license", {
        state: {
          restaurant: r,
          currentLicense: {
            restaurantName: r.name,
            restaurantId: r.id,
            userId: r.userId,
            id: r.licenseId,
          },
        },
      });
    } else {
      navigate("/licenses/add-license", { state: { restaurant: r } });
    }
  }

  function handleLicenseClick(e, r) {
    e?.stopPropagation();
    goToLicensePurchase(r);
  }

  function handleCardOpen(r) {
    // Same OR-of-three rule as the sidebar gate: any active license
    // (qr / tv / kiosk) unlocks the restaurant card. Per-feature
    // gating happens inside the relevant editor page (e.g. qrPage
    // separately checks qrLicenseIsActive before allowing edits).
    const anyLicenseActive =
      r.qrLicenseIsActive ||
      r.tvLicenseIsActive ||
      r.kioskLicenseIsActive;
    const canOpen = r.isActive && anyLicenseActive && !r.licenseIsExpired;
    if (canOpen) {
      navigate(`/restaurant/edit/${r.id}`, { state: { restaurant: r } });
      return;
    }
    // Blocked → redirect to license purchase + inform user
    toast.dismiss();
    if (!r.isActive) {
      toast(t("sidebar.restaurant_blocked_inactive"), {
        icon: "🔒",
        id: "card-blocked",
      });
    } else {
      toast(t("sidebar.restaurant_blocked_license"), {
        icon: "🔒",
        id: "card-blocked",
      });
    }
    goToLicensePurchase(r);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {inData.map((r) => (
        <RestaurantCard
          key={r.id}
          r={r}
          t={t}
          onOpen={() => handleCardOpen(r)}
          onLicense={(e) => handleLicenseClick(e, r)}
        />
      ))}
    </div>
  );
};

export default RestaurantsCard;

const RestaurantCard = ({ r, t, onOpen, onLicense }) => {
  const licenseExpired = Boolean(r.licenseIsExpired);
  // "Active" = ANY of the three per-type license booleans is true.
  // The card surfaces a single overall badge for now; once the UI is
  // ready for per-type detail (3 chips, or a tooltip listing which
  // license types are active), swap this for a richer derivation.
  const anyLicenseActive =
    r.qrLicenseIsActive ||
    r.tvLicenseIsActive ||
    r.kioskLicenseIsActive;
  const licenseActive = anyLicenseActive && !licenseExpired;
  // `licenseId` is now split into qr/tv/kiosk variants — treat
  // "has at least one of them" as the "user purchased something
  // at some point" signal that distinguishes the inactive vs none
  // badge states.
  const hasAnyLicenseId = !!(
    r.qrLicenseId ||
    r.tvLicenseId ||
    r.kioskLicenseId ||
    r.licenseId
  );
  const licenseState = licenseActive
    ? "active"
    : licenseExpired
      ? "expired"
      : hasAnyLicenseId
        ? "inactive"
        : "none";
  const licenseLabel = {
    active: t("restaurants.active"),
    expired: t("restaurants.license_expired"),
    inactive: t("restaurants.passive"),
    none: t("restaurants.license_no"),
  }[licenseState];

  return (
    <article
      onClick={onOpen}
      className="group flex flex-col bg-[--white-1] border border-[--border-1] rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-0.5 hover:border-[--primary-1]/30"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-[--white-2] overflow-hidden">
        {r.imageAbsoluteUrl ? (
          <img
            src={r.imageAbsoluteUrl}
            alt={r.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="grid place-items-center w-full h-full text-[--gr-1]">
            <ImageIcon className="size-10 opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-[--black-1] leading-tight line-clamp-1 group-hover:text-[--primary-1] transition">
            {r.name}
          </h3>
          <p className="mt-1 text-xs text-[--gr-1] flex items-center gap-1.5 line-clamp-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {[r.city, r.district, r.neighbourhood].filter(Boolean).join(", ")}
            </span>
          </p>
        </div>

        {/* Labeled info rows */}
        <dl className="text-xs space-y-2.5 pt-3 border-t border-[--border-1]">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[--gr-1]">{t("restaurants.row_restaurant")}</dt>
            <dd>
              <StatusPill
                active={r.isActive}
                label={
                  r.isActive
                    ? t("restaurants.active")
                    : t("restaurants.passive")
                }
              />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-[--gr-1]">{t("restaurants.row_license")}</dt>
            <dd>
              <LicensePill state={licenseState} label={licenseLabel} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt
              className={`flex items-center gap-1.5 ${
                licenseExpired ? "text-rose-600" : "text-[--gr-1]"
              }`}
            >
              {licenseExpired ? (
                <AlertTriangle className="size-3.5" />
              ) : (
                <CalendarDays className="size-3.5" />
              )}
              {t("restaurants.row_end_date")}
            </dt>
            <dd
              className={`font-semibold ${
                licenseExpired ? "text-rose-600" : "text-[--black-1]"
              }`}
            >
              {r.licenseEnd
                ? formatDateString({ dateString: r.licenseEnd })
                : "—"}
            </dd>
          </div>
        </dl>

        {/* License CTA — only when not active */}
        {!licenseActive && (
          <button
            type="button"
            onClick={onLicense}
            className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Sparkles className="size-3.5" />
            {r.licenseIsExpired
              ? t("restaurants.license_extend")
              : t("restaurants.license_get")}
            <ArrowRight className="size-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};

const StatusPill = ({ active, label }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
      active
        ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
        : "bg-slate-100 text-slate-700 ring-slate-200"
    }`}
  >
    <span
      className={`size-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`}
    />
    {label}
  </span>
);

const LicensePill = ({ state, label }) => {
  const variants = {
    active: {
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      Icon: ShieldCheck,
      pulse: false,
    },
    expired: {
      cls: "bg-rose-50 text-rose-700 ring-rose-300",
      Icon: AlertTriangle,
      pulse: true,
    },
    inactive: {
      cls: "bg-slate-100 text-slate-700 ring-slate-200",
      Icon: ShieldX,
      pulse: false,
    },
    none: {
      cls: "bg-slate-100 text-slate-700 ring-slate-200",
      Icon: ShieldX,
      pulse: false,
    },
  };
  const v = variants[state] || variants.none;
  const Icon = v.Icon;
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${v.cls}`}
    >
      {v.pulse && (
        <span className="absolute -left-1 -top-1 flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/70" />
          <span className="relative inline-flex size-2.5 rounded-full bg-rose-500" />
        </span>
      )}
      <Icon className="size-3.5" />
      {label}
    </span>
  );
};
