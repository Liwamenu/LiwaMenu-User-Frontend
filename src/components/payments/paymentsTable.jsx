//MODULES
import {
  Banknote,
  CreditCard,
  ExternalLink,
  FileText,
  Gift,
  Hash,
  Mail,
  Monitor,
  Phone,
  QrCode,
  Receipt,
  Sparkles,
  Store,
} from "lucide-react";
import { useTranslation } from "react-i18next";

//UTILS
import {
  copyToClipboard,
  formatDateString,
  formatPrice,
} from "../../utils/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Each meta map stores a translation key, not a baked TR string, so the
// labels switch with the active language at render time.
const METHOD_META = {
  CreditCard: { icon: CreditCard, labelKey: "paymentsPage.method_credit_card" },
  BankTransfer: { icon: Banknote, labelKey: "paymentsPage.method_bank_transfer" },
  PayTR: { icon: CreditCard, labelKey: "paymentsPage.method_pay_tr" },
  Free: { icon: Gift, labelKey: "paymentsPage.method_free" },
};

const STATUS_META = {
  Success: {
    labelKey: "paymentsPage.status_success",
    cls: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/30",
    dot: "bg-emerald-500",
  },
  Waiting: {
    labelKey: "paymentsPage.status_waiting",
    cls: "text-amber-600 bg-amber-500/10 ring-amber-500/30",
    dot: "bg-amber-500",
  },
  Failed: {
    labelKey: "paymentsPage.status_failed",
    cls: "text-rose-600 bg-rose-500/10 ring-rose-500/30",
    dot: "bg-rose-500",
  },
  Refunded: {
    labelKey: "paymentsPage.status_refunded",
    cls: "text-sky-600 bg-sky-500/10 ring-sky-500/30",
    dot: "bg-sky-500",
  },
};

// Backend may emit either the string ("Success") or the numeric id (0)
// per `src/enums/statuses.js`. Normalize to the string key before the
// STATUS_META lookup so both shapes render correctly.
const STATUS_BY_ID = ["Success", "Failed", "Waiting", "Refunded"];
const resolveStatusKey = (raw) => {
  if (typeof raw === "number") return STATUS_BY_ID[raw];
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return STATUS_BY_ID[Number(raw)];
  }
  return raw;
};

const TYPE_META = {
  ExtendLicense: {
    labelKey: "paymentsPage.type_extend_license",
    cls: "text-indigo-600 bg-indigo-500/10 ring-indigo-500/30",
  },
  NewLicense: {
    labelKey: "paymentsPage.type_new_license",
    cls: "text-violet-600 bg-violet-500/10 ring-violet-500/30",
  },
  Link: {
    labelKey: "paymentsPage.type_link",
    cls: "text-cyan-600 bg-cyan-500/10 ring-cyan-500/30",
  },
};

const LICENSE_PKG_META = {
  QRLicensePackage: { icon: QrCode, labelKey: "paymentsPage.license_qr" },
  TVLicensePackage: { icon: Monitor, labelKey: "paymentsPage.license_tv" },
};

const PaymentsTable = ({ payments }) => {
  const { t } = useTranslation();
  if (!payments?.length) {
    return (
      <div className="grid place-items-center min-h-[20rem] rounded-2xl border border-[--border-1] bg-[--white-1]">
        <div className="text-center px-6">
          <div className="mx-auto mb-3 grid place-items-center size-12 rounded-2xl bg-[--white-2] ring-1 ring-[--border-1] text-[--gr-1]">
            <Receipt className="size-6" />
          </div>
          <p className="text-[--black-1] font-semibold">
            {t("paymentsPage.empty_title")}
          </p>
          <p className="text-xs text-[--gr-1] mt-1">
            {t("paymentsPage.empty_desc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {payments.map((p) => (
        <PaymentRow key={p.id} p={p} t={t} />
      ))}
    </ul>
  );
};

export default PaymentsTable;

const PaymentRow = ({ p, t }) => {
  const method = METHOD_META[p.paymentMethod] || METHOD_META.Free;
  const status =
    STATUS_META[resolveStatusKey(p.status)] || STATUS_META.Waiting;
  const type = TYPE_META[p.licenseType] || TYPE_META.NewLicense;
  const MethodIcon = method.icon;

  const items = parseBasket(p.basketItems);
  const formattedAmount = formatPrice(p.amount ?? 0);

  return (
    <li className="rounded-2xl border border-[--border-1] bg-[--white-1] hover:border-[--primary-1]/30 hover:shadow-md hover:shadow-indigo-500/5 transition-all">
      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 p-4 sm:p-5">
        {/* AVATAR */}
        <div
          className="grid place-items-center size-10 sm:size-12 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <MethodIcon className="size-5" strokeWidth={2.2} />
        </div>

        {/* MAIN */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[--black-1] truncate">
              {p.userName || p.customerName || "—"}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${type.cls}`}
            >
              {t(type.labelKey)}
            </span>
          </div>

          {p.restaurantName && (
            <p className="mt-0.5 text-xs text-[--gr-1] inline-flex items-center gap-1.5 max-w-full">
              <Store className="size-3 shrink-0" />
              <span className="truncate">{p.restaurantName}</span>
            </p>
          )}

          {/* Order number + date */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[--gr-1]">
            <button
              type="button"
              onClick={() => copyToClipboard({ text: p.orderNumber })}
              className="inline-flex items-center gap-1 font-mono tracking-tight hover:text-[--primary-1] transition truncate max-w-[14rem]"
              title={t("paymentsPage.copy_order_number")}
            >
              <Hash className="size-3 shrink-0" />
              <span className="truncate">{p.orderNumber}</span>
            </button>
            <span className="text-[--border-1]">·</span>
            <span className="tabular-nums">
              {formatDateString({
                dateString: p.createdDateTime,
                joint: "/",
                hour: true,
                min: true,
              })}
            </span>
          </div>

          {/* Contact */}
          {(p.customerEmail || p.customerPhone) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[--gr-1]">
              {p.customerEmail && (
                <button
                  type="button"
                  onClick={() => copyToClipboard({ text: p.customerEmail })}
                  className="inline-flex items-center gap-1 hover:text-[--primary-1] transition max-w-full"
                >
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{p.customerEmail}</span>
                </button>
              )}
              {p.customerPhone && (
                <button
                  type="button"
                  onClick={() => copyToClipboard({ text: p.customerPhone })}
                  className="inline-flex items-center gap-1 hover:text-[--primary-1] transition"
                >
                  <Phone className="size-3 shrink-0" />
                  <span>{p.customerPhone}</span>
                </button>
              )}
            </div>
          )}

          {/* Basket items */}
          {items.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {items.map((it, i) => {
                const pkg = LICENSE_PKG_META[it.LicensePackageType];
                const PkgIcon = pkg?.icon || Sparkles;
                const pkgLabel = pkg ? t(pkg.labelKey) : it.LicensePackageType;
                return (
                  <li
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[--white-2] border border-[--border-1] text-[10px] text-[--black-1]"
                  >
                    <PkgIcon className="size-3 text-[--primary-1]" />
                    <span className="font-semibold">{pkgLabel}</span>
                    {it.LicensePackageTime ? (
                      <>
                        <span className="text-[--gr-1]">·</span>
                        <span>
                          {it.LicensePackageTime} {t("paymentsPage.year_short")}
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Card mask (online payments) */}
          {p.cardMask && (
            <p className="mt-1.5 text-[11px] text-[--gr-1] font-mono tracking-wide">
              {p.cardMask}
              {p.installmentCount && p.installmentCount > 1
                ? ` · ${t("paymentsPage.installment", { count: p.installmentCount })}`
                : ""}
            </p>
          )}

          {/* Error message */}
          {p.errorMessage && (
            <p className="mt-2 text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
              {p.errorMessage}
            </p>
          )}

          {/* MOBILE: footer line with amount + status */}
          <div className="sm:hidden mt-3 pt-3 border-t border-[--border-1] flex items-center justify-between gap-2">
            <p className="font-bold text-[--black-1] text-base">
              {formattedAmount} ₺
            </p>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 whitespace-nowrap ${status.cls}`}
            >
              <span className={`size-1.5 rounded-full ${status.dot}`} />
              {t(status.labelKey)}
            </span>
          </div>
          {p.receiptAbsoluteUrl && (
            <div className="sm:hidden mt-2">
              <a
                href={p.receiptAbsoluteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-[--primary-1] bg-[--primary-1]/10 hover:bg-[--primary-1]/15 ring-1 ring-[--primary-1]/30 transition"
              >
                <FileText className="size-3" />
                {t("paymentsPage.receipt")}
                <ExternalLink className="size-2.5" />
              </a>
            </div>
          )}
        </div>

        {/* DESKTOP RIGHT */}
        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
          <p className="font-bold text-[--black-1] text-base sm:text-lg whitespace-nowrap">
            {formattedAmount} ₺
          </p>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 whitespace-nowrap ${status.cls}`}
          >
            <span className={`size-1.5 rounded-full ${status.dot}`} />
            {t(status.labelKey)}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[--gr-1] whitespace-nowrap">
            <MethodIcon className="size-3" />
            {t(method.labelKey)}
          </span>
          {p.receiptAbsoluteUrl && (
            <a
              href={p.receiptAbsoluteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold text-[--primary-1] bg-[--primary-1]/10 hover:bg-[--primary-1]/15 ring-1 ring-[--primary-1]/30 transition"
            >
              <FileText className="size-3" />
              {t("paymentsPage.receipt")}
              <ExternalLink className="size-2.5" />
            </a>
          )}
        </div>
      </div>
    </li>
  );
};

function parseBasket(basketItems) {
  if (!basketItems) return [];
  try {
    const parsed =
      typeof basketItems === "string" ? JSON.parse(basketItems) : basketItems;
    const baskets = Array.isArray(parsed) ? parsed : [parsed];
    const result = [];
    for (const r of baskets) {
      const lic = r?.Licenses;
      if (!lic) continue;
      if (Array.isArray(lic)) result.push(...lic);
      else result.push(lic);
    }
    return result;
  } catch {
    return [];
  }
}
