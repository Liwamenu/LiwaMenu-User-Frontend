//MOD
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  X,
  QrCode,
  Tv,
  Monitor,
  CreditCard,
  ShieldCheck,
  CalendarDays,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";

//UTILS / ENUMS
import { formatDateDMY, getRemainingDays } from "../../utils/utils";
import { getLicenseTypeLabel } from "../../enums/licenseTypeEnums";

//CONTEXT
import { usePopup } from "../../context/PopupContext";

//REDUX
import {
  getRestaurantLicenses,
  resetGetRestaurantLicenses,
} from "../../redux/licenses/getRestaurantLicensesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Map a backend licensePackageType ("QRLicensePackage", "TVLicensePackage",
// …) to an icon. Substring match so kiosk/payment packages (whose exact
// enum strings aren't all mapped yet) still get a sensible glyph.
const typeIcon = (type = "") => {
  const d = String(type).toLowerCase();
  if (d.includes("qr")) return QrCode;
  if (d.includes("tv")) return Tv;
  if (d.includes("kiosk")) return Monitor;
  if (d.includes("payment") || d.includes("odeme") || d.includes("öde"))
    return CreditCard;
  return ShieldCheck;
};

// Prominent per-license status: expired (date passed) wins over the
// isActive flag, then active/passive.
const licenseStatus = (lic, t) => {
  const daysLeft = getRemainingDays(lic?.endDateTime);
  if (lic?.endDateTime && daysLeft <= 0)
    return {
      key: "expired",
      label: t("restaurantLicensesModal.status_expired"),
      cls: "bg-rose-50 text-rose-700 ring-rose-300 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-400/30",
      dot: "bg-rose-500",
      daysLeft,
    };
  if (lic?.isActive)
    return {
      key: "active",
      label: t("restaurantLicensesModal.status_active"),
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-400/30",
      dot: "bg-emerald-500",
      daysLeft,
    };
  return {
    key: "passive",
    label: t("restaurantLicensesModal.status_passive"),
    cls: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
    daysLeft,
  };
};

const RestaurantLicensesModal = ({ restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setPopupContent } = usePopup();

  const { loading, error, restaurantLicenses } = useSelector(
    (s) => s.licenses.getRestaurantLicenses,
  );

  useEffect(() => {
    dispatch(getRestaurantLicenses({ restaurantId: restaurant.id }));
    return () => dispatch(resetGetRestaurantLicenses());
  }, [dispatch, restaurant.id]);

  const close = () => setPopupContent(null);

  // Response may be a bare array or a ResponsBase { data: [...] }.
  const rawList = Array.isArray(restaurantLicenses?.data)
    ? restaurantLicenses.data
    : Array.isArray(restaurantLicenses)
      ? restaurantLicenses
      : [];
  // Payment ("Ödeme") licenses are intentionally hidden per the owner's
  // request — keep them out of the management list too.
  const list = rawList.filter(
    (l) =>
      !String(l?.licensePackageType || "")
        .toLowerCase()
        .includes("payment"),
  );

  const goExtend = (license) => {
    close();
    navigate("/licenses/extend-license", {
      state: { restaurant, currentLicense: license },
    });
  };
  const goAdd = () => {
    close();
    navigate("/licenses/add-license", { state: { restaurant } });
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-[--white-1] text-[--black-2] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[88dvh]">
      {/* gradient strip */}
      <div className="h-1 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[--border-1] shrink-0">
        <span
          className="grid place-items-center size-10 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <ShieldCheck className="size-5" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-[--black-1] leading-tight truncate">
            {t("restaurantLicensesModal.title")}
          </h2>
          <p className="text-xs text-[--gr-1] truncate mt-0.5">
            {restaurant?.name}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={t("restaurantLicensesModal.close")}
          className="grid place-items-center size-9 shrink-0 -mt-0.5 rounded-full text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* body */}
      <div className="p-4 sm:p-5 overflow-y-auto">
        {loading && !list.length ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[--gr-1]">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">
              {t("restaurantLicensesModal.loading")}
            </span>
          </div>
        ) : error && !list.length ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-[--gr-1]">
              {t("restaurantLicensesModal.load_error")}
            </p>
            <button
              type="button"
              onClick={() =>
                dispatch(getRestaurantLicenses({ restaurantId: restaurant.id }))
              }
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-[--black-2] bg-[--white-2] border border-[--border-1] hover:bg-[--gr-3] transition"
            >
              {t("restaurantLicensesModal.retry")}
            </button>
          </div>
        ) : !list.length ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="grid place-items-center size-14 rounded-2xl bg-indigo-50 text-[--primary-1] dark:bg-indigo-500/15">
              <ShieldCheck className="size-7" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-[--gr-1] max-w-xs">
              {t("restaurantLicensesModal.empty")}
            </p>
            <button
              type="button"
              onClick={goAdd}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:brightness-110"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Plus className="size-4" />
              {t("restaurantLicensesModal.add")}
            </button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {list.map((lic) => {
              const Icon = typeIcon(lic?.licensePackageType);
              const st = licenseStatus(lic, t);
              const expired = st.key === "expired";
              return (
                <li
                  key={lic?.id || lic?.endDateTime}
                  className="rounded-xl border border-[--border-1] bg-[--white-1] p-4"
                >
                  {/* Type + status */}
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center size-10 shrink-0 rounded-lg bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]">
                      <Icon className="size-5" />
                    </span>
                    <p className="flex-1 min-w-0 text-sm font-semibold text-[--black-1] leading-snug">
                      {getLicenseTypeLabel(lic?.licensePackageType) ||
                        t("restaurantLicensesModal.unknown_type")}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 shrink-0 ${st.cls}`}
                    >
                      <span className={`size-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>

                  {/* Info — one comfortable row per field */}
                  <dl className="mt-3 pt-3 border-t border-[--border-1] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-[--gr-1]">
                        <CalendarDays className="size-3.5 shrink-0" />
                        {t("restaurants.row_end_date")}
                      </dt>
                      <dd
                        className={`font-semibold tabular-nums ${
                          expired ? "text-rose-600" : "text-[--black-1]"
                        }`}
                      >
                        {lic?.endDateTime ? formatDateDMY(lic.endDateTime) : "—"}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-1.5 text-[--gr-1]">
                        <Clock className="size-3.5 shrink-0" />
                        {t("restaurantLicensesModal.remaining")}
                      </dt>
                      <dd
                        className={`font-semibold ${
                          expired
                            ? "text-rose-600"
                            : st.daysLeft <= 30
                              ? "text-amber-600"
                              : "text-[--black-1]"
                        }`}
                      >
                        {expired
                          ? t("restaurantLicensesModal.status_expired")
                          : t("restaurantLicensesModal.days_left", {
                              count: st.daysLeft,
                            })}
                      </dd>
                    </div>
                  </dl>

                  {/* Extend */}
                  <button
                    type="button"
                    onClick={() => goExtend(lic)}
                    className="mt-3 w-full h-10 inline-flex items-center justify-center gap-2 rounded-lg text-white text-sm font-semibold shadow-sm shadow-indigo-500/20 transition hover:brightness-110 active:brightness-95"
                    style={{ background: PRIMARY_GRADIENT }}
                  >
                    <Sparkles className="size-4" />
                    {t("restaurantLicensesModal.extend")}
                    <ArrowRight className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RestaurantLicensesModal;
