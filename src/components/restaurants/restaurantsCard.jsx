import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ImageIcon,
  MapPin,
  Monitor,
  QrCode,
  ShieldCheck,
  Tv,
} from "lucide-react";
import { formatDateDMY, getRemainingDays } from "../../utils/utils";
import { privateApi } from "../../redux/api";
import { usePopup } from "../../context/PopupContext";
import RestaurantLicensesModal from "./restaurantLicensesModal";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";
const baseURL = import.meta.env.VITE_BASE_URL;

// The license types shown on a restaurant card. `activeKey` / `ownedKey`
// are the per-type fields the backend ships on every restaurant read
// (qrLicenseIsActive / qrLicenseId / …). Payment ("Ödeme") was removed at
// the owner's request. `match` substrings map a fetched license record's
// `licensePackageType` to the right row for its own end date.
const LICENSE_TYPES = [
  {
    key: "qr",
    Icon: QrCode,
    titleKey: "restaurants.license_type_qr",
    activeKey: "qrLicenseIsActive",
    ownedKey: "qrLicenseId",
    match: "qr",
  },
  {
    key: "tv",
    Icon: Tv,
    titleKey: "restaurants.license_type_tv",
    activeKey: "tvLicenseIsActive",
    ownedKey: "tvLicenseId",
    match: "tv",
  },
  {
    key: "kiosk",
    Icon: Monitor,
    titleKey: "restaurants.license_type_kiosk",
    activeKey: "kioskLicenseIsActive",
    ownedKey: "kioskLicenseId",
    match: "kiosk",
  },
];

// Derive the visual state for one license-type chip.
//   active   — backend says this type is active AND bundle isn't expired
//   expired  — owned but the bundle date passed
//   inactive — owned but turned off
//   none     — never purchased
const licenseTypeState = (r, type) => {
  const active = !!r?.[type.activeKey] && !r?.licenseIsExpired;
  const owned = !!r?.[type.ownedKey];
  if (active) return "active";
  if (owned && r?.licenseIsExpired) return "expired";
  if (owned) return "inactive";
  return "none";
};

// Per-card fetch of the restaurant's individual license records (each
// carries its OWN endDateTime). The list entity only has a single bundle
// date, so the per-type dates have to come from here. Kept in LOCAL state
// via a direct call (not the shared getRestaurantLicenses slice, which the
// detail modal owns and would clobber across cards). `skipErrorToast` keeps
// it quiet — a card just shows status-only if the call fails.
function useRestaurantLicenses(restaurantId) {
  const [licenses, setLicenses] = useState(null);
  useEffect(() => {
    if (!restaurantId) return;
    let alive = true;
    privateApi()
      .get(`${baseURL}Licenses/GetLicensesByRestaurantId`, {
        params: { restaurantId },
        skipErrorToast: true,
      })
      .then((res) => {
        if (!alive) return;
        const d = res?.data?.data ?? res?.data;
        setLicenses(Array.isArray(d) ? d : []);
      })
      .catch(() => alive && setLicenses([]));
    return () => {
      alive = false;
    };
  }, [restaurantId]);
  return licenses;
}

// Pick the most relevant (latest end date) license record for a type.
const pickRecordForType = (licenses, type) => {
  const matches = (licenses || []).filter((l) =>
    String(l?.licensePackageType || "")
      .toLowerCase()
      .includes(type.match),
  );
  if (!matches.length) return null;
  return matches.reduce((a, b) =>
    new Date(b?.endDateTime || 0) > new Date(a?.endDateTime || 0) ? b : a,
  );
};

// Resolve a row's state + own end date. Prefer the fetched license record
// (accurate per-license date + active flag); fall back to the restaurant
// entity flags when no record is available yet / exists.
const resolveRow = (r, type, licenses) => {
  const rec = pickRecordForType(licenses, type);
  if (rec) {
    const expired = rec.endDateTime && getRemainingDays(rec.endDateTime) <= 0;
    return {
      state: expired ? "expired" : rec.isActive ? "active" : "inactive",
      date: rec.endDateTime || null,
    };
  }
  return { state: licenseTypeState(r, type), date: null };
};

const RestaurantsCard = ({ inData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setPopupContent } = usePopup();

  function handleManageLicenses(e, r) {
    e?.stopPropagation();
    setPopupContent(<RestaurantLicensesModal restaurant={r} />);
  }

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

  function handleCardOpen(r) {
    // Same OR-of-four rule as the sidebar gate: any active license
    // (qr / tv / kiosk / payment) unlocks the restaurant card.
    // Per-feature gating happens inside the relevant editor page (e.g.
    // qrPage separately checks qrLicenseIsActive before allowing edits).
    const anyLicenseActive =
      r.qrLicenseIsActive ||
      r.tvLicenseIsActive ||
      r.kioskLicenseIsActive ||
      r.paymentIntegrationLicenseIsActive;
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
          onManage={(e) => handleManageLicenses(e, r)}
        />
      ))}
    </div>
  );
};

export default RestaurantsCard;

const RestaurantCard = ({ r, t, onOpen, onManage }) => {
  const licenseExpired = Boolean(r.licenseIsExpired);
  // "Active" = ANY of the four per-type license booleans is true. The
  // bundle expiry (`licenseIsExpired`) is the single end-date covering
  // them — when it lapses every per-type chip flips to "expired"
  // regardless of its own active flag.
  const anyLicenseActive =
    r.qrLicenseIsActive ||
    r.tvLicenseIsActive ||
    r.kioskLicenseIsActive ||
    r.paymentIntegrationLicenseIsActive;
  const licenseActive = anyLicenseActive && !licenseExpired;

  // Per-license end dates (each record has its own) — the list entity only
  // carries one bundle date, so fetch the restaurant's licenses here.
  const licenses = useRestaurantLicenses(r.id);

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
          {/* Per-type license status — one row per type (QR / TV / Kiosk /
              Pay) with an explicit Active / Expired / Passive / None badge
              so the owner sees each license's state at a glance. Full
              per-license dates + extend live in the "Manage licenses"
              modal below. */}
          <div className="flex flex-col gap-1.5">
            <dt className="text-[--gr-1]">{t("restaurants.row_licenses")}</dt>
            <dd className="flex flex-col gap-2">
              {LICENSE_TYPES.map((type) => {
                const { state, date } = resolveRow(r, type, licenses);
                return (
                  <LicenseStatusRow
                    key={type.key}
                    type={type}
                    state={state}
                    date={date}
                    endLabel={t("restaurants.row_end_date")}
                    label={t(type.titleKey)}
                    stateLabel={
                      {
                        active: t("restaurants.active"),
                        expired: t("restaurants.license_expired"),
                        inactive: t("restaurants.passive"),
                        none: t("restaurants.license_no"),
                      }[state]
                    }
                  />
                );
              })}
            </dd>
          </div>
        </dl>

        {/* Manage licenses — opens the per-license detail modal (status,
            each license's own end date + per-license extend). Styled
            primary when no active license to nudge purchase/renewal,
            secondary otherwise. */}
        <button
          type="button"
          onClick={onManage}
          className={`mt-auto w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
            licenseActive
              ? "text-[--black-2] bg-[--white-2] border border-[--border-1] hover:bg-[--gr-3]"
              : "text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95"
          }`}
          style={licenseActive ? undefined : { background: PRIMARY_GRADIENT }}
        >
          <ShieldCheck className="size-3.5" />
          {t("restaurants.manage_licenses")}
          <ArrowRight className="size-3.5" />
        </button>
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

// One license-type row: the type (icon + label) with its OWN end date on a
// sub-line on the left, and an explicit status badge on the right. Active =
// emerald, expired = rose, passive (owned but off) = slate, none (never
// purchased) = dim. Showing the state word — not just a color — plus the
// per-license date makes each license unmistakable.
const LicenseStatusRow = ({ type, state, date, endLabel, label, stateLabel }) => {
  const variants = {
    active: {
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    },
    expired: {
      badge: "bg-rose-50 text-rose-700 ring-rose-300",
      dot: "bg-rose-500",
    },
    inactive: {
      badge: "bg-slate-100 text-slate-600 ring-slate-200",
      dot: "bg-slate-400",
    },
    none: {
      badge: "bg-[--white-2] text-[--gr-1] ring-[--border-1]",
      dot: "bg-slate-300",
    },
  };
  const v = variants[state] || variants.none;
  const Icon = type.Icon;
  const expired = state === "expired";
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="flex items-center gap-1.5 text-[--gr-1] min-w-0">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </span>
        {date && (
          <span
            className={`flex items-center gap-1 text-[10px] mt-0.5 pl-5 ${
              expired ? "text-rose-600" : "text-[--gr-1]"
            }`}
          >
            {expired ? (
              <AlertTriangle className="size-2.5 shrink-0" />
            ) : (
              <CalendarDays className="size-2.5 shrink-0" />
            )}
            {endLabel} : {formatDateDMY(date)}
          </span>
        )}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 shrink-0 ${v.badge}`}
      >
        <span className={`size-1.5 rounded-full ${v.dot}`} />
        {stateLabel}
      </span>
    </div>
  );
};
