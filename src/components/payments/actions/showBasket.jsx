// Read-only basket viewer popup for the Payments list.
//
// The shape comes from `Payment.basketItems` — see ./parseBasket.js for
// the normalizer that maps both the unified buildLicenseBasket() shape
// and the legacy capitalized flat object into the same envelope this
// component renders.
//
// Pure view: no dispatch, no refetch, no edit. Mounted via PopupContext
// (`setPopupContent(<ShowBasket payment={p} />)`).

import { useTranslation } from "react-i18next";
import {
  Building2,
  FileText,
  Hash,
  Monitor,
  QrCode,
  Receipt,
  RefreshCw,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { formatPrice } from "../../../utils/utils";
import { pickLocalizedPackageName } from "../../../utils/localizedNames";

import {
  basketGrandTotal,
  basketHasInvoice,
  parsePaymentBasket,
} from "./parseBasket";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Type chip metadata. Tag-based identityType (legacy: "tc" / "vergi";
// some payloads use numeric 0/1) maps consistently to the right field.
const TYPE_CHIP = {
  NewLicense: {
    icon: Sparkles,
    labelKey: "paymentsPage.type_new_license",
    cls: "text-emerald-700 bg-emerald-50 ring-emerald-200",
  },
  ExtendLicense: {
    icon: RefreshCw,
    labelKey: "paymentsPage.type_extend_license",
    cls: "text-amber-700 bg-amber-50 ring-amber-200",
  },
};

const PKG_ICON = {
  QRLicensePackage: QrCode,
  TVLicensePackage: Monitor,
};

const PKG_LABEL_KEY = {
  QRLicensePackage: "paymentsPage.license_qr",
  TVLicensePackage: "paymentsPage.license_tv",
};

// 0 = Ay (month), 1 = Yıl (year). Matches src/enums/licensePackagesTimeId.js
// — do NOT invert.
const timeUnitLabelKey = (id) =>
  Number(id) === 1 ? "paymentsPage.basket_time_year" : "paymentsPage.basket_time_month";

// Truthy when the identity is a "vergi" (tax-number) record rather
// than a personal TCKN. Tolerant of legacy enum values.
const isTaxIdentity = (it) => {
  if (it == null) return false;
  const v = String(it).toLowerCase();
  return v === "vergi" || v === "1" || v === "tax";
};

const ShowBasket = ({ payment }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const basket = parsePaymentBasket(payment?.basketItems, {
    userName: payment?.userName || payment?.customerName,
    restaurantName: payment?.restaurantName,
    type: payment?.licenseType,
  });

  const close = () => setPopupContent(null);

  // Defensive fallback — if JSON was unreadable, surface a placeholder
  // instead of blanking the popup.
  if (!basket) {
    return (
      <Frame onClose={close} title={t("paymentsPage.basket_title")}>
        <div className="px-4 sm:px-5 py-10 grid place-items-center text-center">
          <Receipt className="size-8 text-[--gr-1] mb-2" />
          <p className="text-sm text-[--gr-1]">
            {t("paymentsPage.basket_unreadable")}
          </p>
        </div>
      </Frame>
    );
  }

  const typeMeta = TYPE_CHIP[basket.type] || TYPE_CHIP.NewLicense;
  const TypeIcon = typeMeta.icon;

  const restaurantSummary =
    basket.items.length === 1
      ? basket.items[0].restaurantName || "—"
      : t("paymentsPage.basket_restaurants_count", {
          count: basket.items.length,
        });

  const total = basketGrandTotal(basket);
  const showInvoice = basketHasInvoice(basket);
  const showMultiRestaurantHeader = basket.items.length > 1;

  return (
    <Frame onClose={close} title={t("paymentsPage.basket_title")}>
      {/* Type chip */}
      <div className="px-4 sm:px-5 pt-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ${typeMeta.cls}`}
        >
          <TypeIcon className="size-3.5" />
          {t(typeMeta.labelKey)}
        </span>
      </div>

      {/* Summary card */}
      <div className="px-4 sm:px-5 pt-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-xl border border-[--border-1] bg-[--white-2]/40 p-3">
          <SummaryCell
            icon={User}
            label={t("paymentsPage.basket_user")}
            value={basket.username || payment?.userName || "—"}
          />
          <SummaryCell
            icon={Store}
            label={t("paymentsPage.basket_restaurant")}
            value={restaurantSummary}
          />
        </div>
      </div>

      {/* Per-restaurant blocks — plain document flow. No inner scroll
          region, no flex sizing. The earlier flex-1 + max-h-[55dvh]
          combo was forcing the middle to ~500px regardless of how
          little content sat inside it. For huge baskets the OUTER
          Frame handles overflow with its own overflow-y-auto. */}
      <div className="px-4 sm:px-5 pt-3 space-y-3">
        {basket.items.length === 0 ? (
          <p className="text-xs text-[--gr-1] italic">
            {t("paymentsPage.basket_unreadable")}
          </p>
        ) : (
          basket.items.map((it, idx) => (
            <RestaurantBlock
              key={`${it.restaurantId || idx}`}
              item={it}
              showHeader={showMultiRestaurantHeader}
              isExtend={basket.type === "ExtendLicense"}
              t={t}
            />
          ))
        )}

        {/* Optional fatura block */}
        {showInvoice && (
          <InvoiceBlock invoice={basket.faturaBilgileri} t={t} />
        )}
      </div>

      {/* Grand total */}
      <div
        className="mt-3 mx-4 sm:mx-5 mb-4 rounded-xl text-white shadow-md shadow-indigo-500/25 flex items-center justify-between px-4 py-3"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <span className="text-[11px] font-bold uppercase tracking-wider opacity-90">
          {t("paymentsPage.basket_total")}
        </span>
        <span className="text-lg sm:text-xl font-black tabular-nums">
          {formatPrice(total)} ₺
        </span>
      </div>
    </Frame>
  );
};

export default ShowBasket;

// ====== sub-components ======

const Frame = ({ title, onClose, children }) => (
  // Natural document flow inside. The popup mount wraps this in its
  // own `bg-[--btn-txt] w-full` container, so we cap width with
  // `max-w-xl mx-auto` to keep the visible card narrow. Height is
  // entirely content-driven — `max-h-[90dvh]` caps for the rare huge
  // basket and `overflow-y-auto` scrolls the whole popup in that case.
  // The earlier flex-col + flex-1 inner scroll region was inflating
  // the middle to ~500px even for a single-row table.
  <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-xl mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-y-auto max-h-[90dvh]">
    <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />
    <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 sticky top-0 bg-[--white-1] z-10">
      <span
        className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <Receipt className="size-4" />
      </span>
      <h2 className="text-sm sm:text-base font-bold tracking-tight truncate flex-1">
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
      >
        <X className="size-4" />
      </button>
    </header>
    {children}
  </div>
);

const SummaryCell = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 min-w-0">
    <span className="grid place-items-center size-7 rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30 shrink-0">
      <Icon className="size-3.5" />
    </span>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
        {label}
      </p>
      <p className="text-[--black-1] text-sm font-semibold truncate">
        {value}
      </p>
    </div>
  </div>
);

const RestaurantBlock = ({ item, showHeader, isExtend, t }) => {
  const shortId =
    isExtend && item.licenseId
      ? String(item.licenseId).slice(0, 8)
      : null;
  return (
    // <div>, not <section> — the global `section { min-height: 100dvh }`
    // rule in index.css is for page-level layout sections and inflates
    // any nested <section> to a full viewport. Already burned us once.
    <div className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden">
      {showHeader && (
        <div className="px-3 py-2 border-b border-[--border-1] bg-[--white-2]/60 flex items-center gap-2">
          <Building2 className="size-3.5 text-[--gr-1] shrink-0" />
          <p className="text-xs font-semibold text-[--black-1] truncate">
            {item.restaurantName || "—"}
          </p>
        </div>
      )}
      {shortId && (
        <p className="px-3 pt-2 text-[11px] text-[--gr-1] inline-flex items-center gap-1.5">
          <Hash className="size-3" />
          {t("paymentsPage.basket_extending", { id: shortId })}
        </p>
      )}
      <PackagesTable packages={item.packages} t={t} />
    </div>
  );
};

const PackagesTable = ({ packages, t }) => {
  if (!packages || packages.length === 0) {
    return (
      <p className="px-3 py-3 text-xs text-[--gr-1] italic">
        {t("paymentsPage.basket_no_packages")}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="bg-[--white-2]/60 text-[--gr-1]">
          <tr>
            <Th>{t("paymentsPage.basket_col_package")}</Th>
            <Th>{t("paymentsPage.basket_col_type")}</Th>
            <Th>{t("paymentsPage.basket_col_duration")}</Th>
            <Th className="text-right">
              {t("paymentsPage.basket_col_price")}
            </Th>
          </tr>
        </thead>
        <tbody>
          {packages.map((p, i) => {
            const TypeIcon = PKG_ICON[p.licensePackageType] || Sparkles;
            const typeLabel = PKG_LABEL_KEY[p.licensePackageType]
              ? t(PKG_LABEL_KEY[p.licensePackageType])
              : p.licensePackageType || "—";
            return (
              <tr
                key={`${p.licensePackageId || i}`}
                className="border-t border-[--border-1]"
              >
                <Td>
                  <span className="font-semibold text-[--black-1]">
                    {/* Picks `licensePackageName` (TR) or
                        `licensePackageNameEn` (anything else) based on
                        the active i18n language. Fallback to the other
                        when one side is missing. */}
                    {pickLocalizedPackageName(p) || "—"}
                  </span>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1 text-[--black-2]">
                    <TypeIcon className="size-3 text-[--primary-1]" />
                    {typeLabel}
                  </span>
                </Td>
                <Td>
                  {p.licensePackageTime
                    ? `${p.licensePackageTime} ${t(timeUnitLabelKey(p.licensePackageTimeUnitId))}`
                    : "—"}
                </Td>
                <Td className="text-right tabular-nums font-semibold text-[--black-1]">
                  {formatPrice(p.licensePackagePrice)} ₺
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const Th = ({ children, className = "" }) => (
  <th
    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left ${className}`}
  >
    {children}
  </th>
);

const Td = ({ children, className = "" }) => (
  <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>
);

const InvoiceBlock = ({ invoice, t }) => {
  const isTax = isTaxIdentity(invoice.identityType);
  // Only render rows for fields that have a non-empty value — invoice
  // payloads commonly skip taxOffice/taxNumber for personal-TCKN ones.
  const rows = [
    { labelKey: "paymentsPage.basket_fatura_title_label", value: invoice.title },
    {
      labelKey: isTax
        ? "paymentsPage.basket_fatura_vergi"
        : "paymentsPage.basket_fatura_tckn",
      value: invoice.identityNumber,
    },
    isTax
      ? {
          labelKey: "paymentsPage.basket_fatura_tax_office",
          value: invoice.taxOffice,
        }
      : null,
    { labelKey: "paymentsPage.basket_fatura_address", value: invoice.address },
    { labelKey: "paymentsPage.basket_fatura_city", value: invoice.city },
    {
      labelKey: "paymentsPage.basket_fatura_district",
      value: invoice.district,
    },
  ]
    .filter(Boolean)
    .filter((r) => r.value != null && String(r.value).trim().length > 0);

  if (rows.length === 0) return null;

  return (
    // <div>, not <section> — same min-height: 100dvh trap as above.
    <div className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden">
      <div className="px-3 py-2 border-b border-[--border-1] bg-[--white-2]/60 flex items-center gap-2">
        <FileText className="size-3.5 text-[--gr-1] shrink-0" />
        <p className="text-xs font-semibold text-[--black-1] truncate">
          {t("paymentsPage.basket_fatura_title")}
        </p>
      </div>
      <dl className="divide-y divide-[--border-1]">
        {rows.map((r) => (
          <div
            key={r.labelKey}
            className="grid grid-cols-[8rem_1fr] gap-2 px-3 py-2 text-xs"
          >
            <dt className="text-[--gr-1] font-medium">{t(r.labelKey)}</dt>
            <dd className="text-[--black-1] break-words">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

