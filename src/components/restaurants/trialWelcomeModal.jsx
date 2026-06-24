//MOD
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  PartyPopper,
  CheckCircle2,
  CalendarDays,
  Loader2,
  QrCode,
  Tv,
  Monitor,
  ShieldCheck,
} from "lucide-react";

//UTILS / ENUMS
import { formatDateDMY, getRemainingDays } from "../../utils/utils";
import { getLicenseTypeLabel } from "../../enums/licenseTypeEnums";

//CONTEXT / REDUX
import { usePopup } from "../../context/PopupContext";
import { resetGetRestaurantLicenses } from "../../redux/licenses/getRestaurantLicensesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const typeIcon = (type = "") => {
  const d = String(type).toLowerCase();
  if (d.includes("qr")) return QrCode;
  if (d.includes("tv")) return Tv;
  if (d.includes("kiosk")) return Monitor;
  return ShieldCheck;
};

// Shown after a brand-new account creates its FIRST restaurant, where the
// backend grants 21-day QR + TV trial licenses. Reads the licenses the
// AddRestaurant success handler just fetched into
// `licenses.getRestaurantLicenses` and welcomes the owner with what they got.
// If the new restaurant has no licenses (2nd+ restaurant, no trial) it quietly
// falls back to the plain "restaurant added" toast and closes.
const TrialWelcomeModal = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { success, error, restaurantLicenses } = useSelector(
    (s) => s.licenses.getRestaurantLicenses,
  );

  // Dedup by package type so the backend granting duplicates (e.g. 2×QR +
  // 2×TV — a known backend bug, see TRIAL_LICENSE_DEDUP_BRIEF) still reads as
  // one QR + one TV here.
  const licenses = useMemo(() => {
    const raw = Array.isArray(restaurantLicenses?.data)
      ? restaurantLicenses.data
      : Array.isArray(restaurantLicenses)
        ? restaurantLicenses
        : [];
    const seen = new Set();
    const out = [];
    for (const l of raw) {
      const key = String(
        l?.licensePackageType || l?.licenseType || "",
      ).toLowerCase();
      if (key && seen.has(key)) continue;
      seen.add(key);
      out.push(l);
    }
    return out;
  }, [restaurantLicenses]);

  const endDate = useMemo(() => {
    const dates = licenses
      .map((l) => l?.endDateTime)
      .filter(Boolean)
      .sort();
    return dates[0] || null;
  }, [licenses]);
  const days = endDate ? Math.max(0, getRemainingDays(endDate)) : null;

  const close = () => {
    dispatch(resetGetRestaurantLicenses());
    setPopupContent(null);
  };

  // No trial licenses (later restaurants) or a failed fetch → don't show a
  // half-empty modal; just confirm the restaurant was added and close. The
  // restaurant itself was created regardless of how the license fetch went.
  const fallback = !!error || (success && licenses.length === 0);
  useEffect(() => {
    if (fallback) {
      toast.success(t("restaurants.success_add"));
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fallback]);

  // Fetch in flight (or the fallback path resolving) → compact spinner.
  if (!success || fallback) {
    return (
      <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-sm mx-auto shadow-2xl ring-1 ring-[--border-1] p-8 grid place-items-center gap-3">
        <Loader2 className="size-7 animate-spin text-indigo-500" />
        <p className="text-sm text-[--gr-1]">{t("trialWelcome.preparing")}</p>
      </div>
    );
  }

  return (
    <div className="relative bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-md mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden">
      {/* Festive gradient header */}
      <div
        className="px-6 pt-7 pb-6 text-center text-white"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <span className="mx-auto grid place-items-center size-14 rounded-2xl bg-white/15 ring-1 ring-white/25">
          <PartyPopper className="size-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">{t("trialWelcome.title")}</h2>
        <p className="mt-1.5 text-sm text-white/85 leading-relaxed">
          {t("trialWelcome.subtitle")}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {/* Granted trial licenses */}
        <div className="space-y-2">
          {licenses.map((lic) => {
            const Icon = typeIcon(lic?.licensePackageType);
            return (
              <div
                key={lic?.id || lic?.licensePackageType || lic?.endDateTime}
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
              >
                <span className="grid place-items-center size-9 rounded-lg bg-white text-indigo-600 ring-1 ring-emerald-200 shrink-0">
                  <Icon className="size-4.5" />
                </span>
                <span className="flex-1 text-sm font-semibold text-[--black-1]">
                  {getLicenseTypeLabel(lic?.licensePackageType) ||
                    lic?.licensePackageName ||
                    lic?.licensePackageType}
                </span>
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Trial end date */}
        {endDate && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[--gr-1]">
            <CalendarDays className="size-4 text-indigo-500" />
            <span>{t("trialWelcome.ends", { date: formatDateDMY(endDate), count: days })}</span>
          </div>
        )}

        <button
          type="button"
          onClick={close}
          className="mt-6 w-full h-11 inline-flex items-center justify-center rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {t("trialWelcome.cta")}
        </button>
      </div>
    </div>
  );
};

export default TrialWelcomeModal;
