//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Settings,
  Globe,
  ShoppingBag,
  UtensilsCrossed,
  Eye,
  Tag,
  Save,
  Check,
  Languages,
  CircleDollarSign,
  Hash,
  ChartLine,
  Quote,
  CreditCard,
  ArrowRight,
  Lock,
  AlertTriangle,
  Pencil,
  HelpCircle,
  Star,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";

//COMP
import CustomToggle from "../common/customToggle";
import CustomSelect from "../common/customSelector";
import LanguagesEnums from "../../enums/languagesEnums";
import SettingsTabs from "./settingsTabs";
import PageHelp from "../common/pageHelp";
import { usePopup } from "../../context/PopupContext";
import { useDirtyTracking } from "../../context/DirtyNavContext";

//REDUX
import {
  setRestaurantSettings,
  resetSetRestaurantSettings,
} from "../../redux/restaurant/setRestaurantSettingsSlice";
import {
  checkTenantAvailability,
  resetCheckTenantAvailability,
} from "../../redux/restaurant/checkTenantAvailabilitySlice";
import { getPaymentMethods } from "../../redux/restaurant/getPaymentMethodsSlice";
import { getRestaurants } from "../../redux/restaurants/getRestaurantsSlice";
import useSmartRevalidate from "../../hooks/useSmartRevalidate";
import GoogleAnalyticsHelp from "./googleAnalyticsHelp";
import GoogleReviewHelp from "./googleReviewHelp";

const inputCls =
  "w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
const labelCls =
  "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide";

const SectionHeader = ({ icon: Icon, label, iconClassName }) => (
  <header className="flex items-center gap-1.5 mb-2.5">
    <Icon className={`size-3.5 ${iconClassName || "text-indigo-600"}`} />
    <h2 className="text-[11px] font-bold text-[--gr-1] uppercase tracking-[0.12em]">
      {label}
    </h2>
  </header>
);

const NumberWithSuffix = ({
  label,
  suffix,
  value,
  onChange,
  placeholder,
  required,
  // When true, the input strips anything that isn't a digit and switches
  // to inputMode="numeric" so the mobile keyboard is the numeric pad.
  // Use this for whole-number fields where the backend rejects locale-
  // formatted strings like "1,000" / "1.000" with a 400 — Turkish users
  // tend to type the thousands separator out of habit and `type=number`
  // round-trips it inconsistently between browsers.
  integerOnly = false,
  // Hard cap on the digit count of the entered value. In integer mode
  // this caps the whole string; in currency mode it caps the digits in
  // the integer part (decimal places are excluded from the count).
  maxDigits,
  // Currency mode: when set to a number (the decimal-place count), the
  // input formats with Intl.NumberFormat("tr-TR") on blur and switches to
  // a raw editable string on focus. Mirrors the PriceInput pattern from
  // priceList.jsx so the field display follows the restaurant's
  // configured Kuruş Hanesi (Genel Ayarlar → Kuruş Hanesi). When set,
  // takes precedence over `integerOnly`.
  currencyDecimals,
}) => {
  const isCurrency = typeof currencyDecimals === "number";

  const formatter = useMemo(
    () =>
      isCurrency
        ? new Intl.NumberFormat("tr-TR", {
            minimumFractionDigits: currencyDecimals,
            maximumFractionDigits: currencyDecimals,
          })
        : null,
    [isCurrency, currencyDecimals],
  );

  // Coerce stored value (may arrive as a Number, a clean integer string,
  // or a stale formatted string) into a plain Number for the formatter.
  // Comma is normalized to dot so parseFloat treats either separator as
  // the decimal mark — TR-style "750,5" parses to 750.5.
  const numericValue = useMemo(() => {
    if (value == null || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const n = parseFloat(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }, [value]);

  const [focused, setFocused] = useState(false);
  const [editStr, setEditStr] = useState("");

  // When the underlying value is empty (no minimum set yet, brand-new
  // restaurant) keep the input visually empty so the placeholder shows
  // instead of a misleading "0,00" that looks like the user already
  // entered zero.
  const isEmpty = value == null || value === "";
  const display = isCurrency
    ? focused
      ? editStr
      : isEmpty
        ? ""
        : formatter.format(numericValue)
    : (value ?? "");

  const handleFocus = (e) => {
    if (!isCurrency) return;
    // Show the raw number while editing so TR thousand separators don't
    // trip up keyboard input. Empty for zero so users don't have to
    // backspace before typing the new amount. Auto-select so a fresh
    // amount replaces the existing one.
    setEditStr(numericValue ? String(numericValue) : "");
    setFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    if (!isCurrency) return;
    setFocused(false);
  };

  const handleChange = (e) => {
    const raw = e.target.value;

    if (isCurrency) {
      // Allow digits + . + , (TR/EN decimal separators); strip the rest.
      // Keep only the FIRST separator so the user can't accidentally
      // produce "1.2.3" by holding the key.
      let cleaned = raw.replace(/[^0-9.,]/g, "");
      const sepIndex = cleaned.search(/[.,]/);
      if (sepIndex !== -1) {
        const intPart = cleaned.slice(0, sepIndex);
        const decPart = cleaned.slice(sepIndex + 1).replace(/[.,]/g, "");
        cleaned = `${intPart}.${decPart}`;
      }
      // Cap the integer-part digit count so the user can't enter
      // absurd amounts like 99 999 999 999.
      if (typeof maxDigits === "number") {
        const dot = cleaned.indexOf(".");
        const intDigits = dot === -1 ? cleaned : cleaned.slice(0, dot);
        const decDigits = dot === -1 ? "" : cleaned.slice(dot);
        if (intDigits.length > maxDigits) {
          cleaned = intDigits.slice(0, maxDigits) + decDigits;
        }
      }
      setEditStr(cleaned);
      const n = parseFloat(cleaned);
      onChange(Number.isFinite(n) ? n : 0);
      return;
    }

    if (!integerOnly) {
      onChange(raw);
      return;
    }

    let digits = String(raw ?? "").replace(/[^\d]/g, "");
    if (typeof maxDigits === "number" && digits.length > maxDigits) {
      digits = digits.slice(0, maxDigits);
    }
    onChange(digits);
  };

  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-stretch rounded-lg border border-[--border-1] bg-[--white-1] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden">
        <input
          // type="text" + inputMode lets us bypass the locale-aware
          // decimal handling of type=number (which was the source of
          // the "1,000" → 400 backend bug). Currency uses inputMode
          // "decimal" to expose the comma key on mobile keypads;
          // integer mode uses "numeric" for digits-only.
          type={isCurrency || integerOnly ? "text" : "number"}
          inputMode={
            isCurrency ? "decimal" : integerOnly ? "numeric" : undefined
          }
          pattern={integerOnly && !isCurrency ? "[0-9]*" : undefined}
          maxLength={
            !isCurrency && integerOnly && maxDigits ? maxDigits : undefined
          }
          className="flex-1 min-w-0 h-10 px-3 outline-none text-sm bg-transparent"
          placeholder={placeholder}
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {/* Hide the pill entirely when suffix is empty — the currency-
            backed inputs feed `moneySign` here, which is "" when the
            user hasn't picked a Para Birimi Sembolü. Rendering an empty
            gray box looked like a broken UI element. */}
        {suffix ? (
          <span className="bg-[--white-2] text-[--gr-1] text-xs font-semibold px-3 grid place-items-center border-l border-[--border-1]">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
};

// Coerce a delivery-zone numeric cell into a plain Number. The km field
// stores a dot-decimal string from a type=number input ("2.5"); the
// currency cells already emit a Number. A comma means a stale TR-formatted
// currency string ("1.500,00") so we strip thousands dots only then.
const toZoneNumber = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (v == null || v === "") return 0;
  const s = String(v).trim();
  const n = s.includes(",")
    ? parseFloat(s.replace(/\./g, "").replace(",", "."))
    : parseFloat(s);
  return Number.isFinite(n) ? n : 0;
};

// Seed the zone editor: prefer a saved `deliveryZones` array (sorted), else
// derive a single zone from the legacy flat fields (maxDistance / deliveryFee
// / minOrderAmount), else a sensible default. Tolerates PascalCase keys in
// case the backend serializes the array that way.
const seedDeliveryZones = (inData) => {
  const z = inData?.deliveryZones;
  if (Array.isArray(z) && z.length) {
    return z
      .map((x) => ({
        maxDistanceKm: x?.maxDistanceKm ?? x?.MaxDistanceKm ?? "",
        minOrderAmount: x?.minOrderAmount ?? x?.MinOrderAmount ?? "",
        deliveryFee: x?.deliveryFee ?? x?.DeliveryFee ?? "",
      }))
      .sort(
        (a, b) => (Number(a.maxDistanceKm) || 0) - (Number(b.maxDistanceKm) || 0),
      );
  }
  return [
    {
      maxDistanceKm: inData?.maxDistance ?? 5,
      minOrderAmount: inData?.minOrderAmount ?? 0,
      deliveryFee: inData?.deliveryFee ?? 0,
    },
  ];
};

// Upper-bound distance tiers for Paket Sipariş. Each row is "up to N km →
// this minimum + this delivery fee"; rows auto-chain from the previous row's
// km so gaps/overlaps are impossible. The last row's km is the delivery
// radius (beyond it = out of range). Reuses NumberWithSuffix so the currency
// cells follow the restaurant's Kuruş Hanesi like the rest of the form.
const DeliveryZonesEditor = ({ zones, onChange, moneySign, decimalPoint, t }) => {
  const decimals = Number.isFinite(Number(decimalPoint))
    ? Number(decimalPoint)
    : 2;
  const list =
    Array.isArray(zones) && zones.length
      ? zones
      : [{ maxDistanceKm: "", minOrderAmount: "", deliveryFee: "" }];

  const update = (i, patch) =>
    onChange(list.map((z, idx) => (idx === i ? { ...z, ...patch } : z)));
  const remove = (i) => {
    if (list.length <= 1) return;
    onChange(list.filter((_, idx) => idx !== i));
  };
  const add = () => {
    const lastKm = Number(list[list.length - 1]?.maxDistanceKm) || 0;
    onChange([
      ...list,
      { maxDistanceKm: lastKm ? lastKm + 5 : 5, minOrderAmount: "", deliveryFee: "" },
    ]);
  };

  const lastKm = list[list.length - 1]?.maxDistanceKm;

  return (
    <div className="space-y-2.5">
      <div className="text-xs font-semibold text-[--black-1]">
        {t("restaurantSettings.delivery_zones_title")}
      </div>
      {list.map((z, i) => {
        const fromKm = i === 0 ? 0 : Number(list[i - 1]?.maxDistanceKm) || 0;
        const hasTo = z.maxDistanceKm !== "" && z.maxDistanceKm != null;
        return (
          <div
            key={i}
            className="rounded-lg border border-sky-200/70 bg-[--white-1] p-2.5 dark:border-sky-900/40"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {hasTo
                  ? t("restaurantSettings.delivery_zone_range", {
                      from: fromKm,
                      to: z.maxDistanceKm,
                    })
                  : t("restaurantSettings.delivery_zone_up_to")}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={list.length <= 1}
                title={t("restaurantSettings.remove_zone")}
                className="p-1 text-rose-500 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <NumberWithSuffix
                label={t("restaurantSettings.delivery_zone_up_to")}
                suffix="km"
                value={z.maxDistanceKm}
                onChange={(v) => update(i, { maxDistanceKm: v })}
                placeholder="5"
              />
              <NumberWithSuffix
                label={t("restaurantSettings.min_order_amount")}
                suffix={moneySign}
                value={z.minOrderAmount}
                onChange={(v) => update(i, { minOrderAmount: v })}
                currencyDecimals={decimals}
                maxDigits={9}
              />
              <NumberWithSuffix
                label={t("restaurantSettings.delivery_fee")}
                suffix={moneySign}
                value={z.deliveryFee}
                onChange={(v) => update(i, { deliveryFee: v })}
                currencyDecimals={decimals}
                maxDigits={9}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-300"
        >
          <Plus className="size-4" />
          {t("restaurantSettings.add_zone")}
        </button>
        {Number(lastKm) > 0 && (
          <span className="text-[11px] text-[--gr-2]">
            {t("restaurantSettings.delivery_zone_beyond", { km: lastKm })}
          </span>
        )}
      </div>
      <p className="text-[11px] text-[--gr-2] leading-relaxed">
        {t("restaurantSettings.delivery_zones_hint")}
      </p>
    </div>
  );
};

const RestaurantSettings = ({ data: inData }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setSecondPopupContent } = usePopup();
  const restaurantId = useParams()["*"]?.split("/")[1];

  // This same component backs two tabs: "Genel" (/settings) and "Sipariş
  // Ayarları" (/orderSettings). BOTH build and save the FULL settings object
  // via SetRestaurantSettings, so neither tab wipes the other's fields — only
  // which cards are visible differs by route.
  const routeLocation = useLocation();
  const isOrderTab = routeLocation.pathname.includes("/orderSettings/");
  const showOrder = isOrderTab;
  const showGeneral = !isOrderTab;

  // The tenant slug doubles as the QR code URL — once it's been published,
  // changing it silently breaks every printed QR. Lock the field by default
  // when the restaurant already has a tenant; require an explicit warning
  // confirmation before letting the user edit it.
  const [tenantUnlocked, setTenantUnlocked] = useState(false);
  const tenantLocked = !!inData?.tenant && !tenantUnlocked;

  const openTenantUnlockModal = () => {
    setSecondPopupContent(
      <TenantUnlockConfirm
        t={t}
        onCancel={() => setSecondPopupContent(null)}
        onConfirm={() => {
          setTenantUnlocked(true);
          setSecondPopupContent(null);
        }}
      />,
    );
  };
  const { success, error } = useSelector(
    (state) => state.restaurant.setRestaurantSettings,
  );
  const {
    loading: isCheckingTenant,
    success: tenantCheckSuccess,
    data: tenantCheckData,
    error: tenantCheckError,
  } = useSelector((state) => state.restaurant.checkTenantAvailability);

  // Payment methods (needed to gate Paket Sipariş toggle)
  const paymentMethods = useSelector(
    (s) => s.restaurant.getPaymentMethods?.data,
  );
  const hasEnabledPaymentMethod =
    Array.isArray(paymentMethods) && paymentMethods.some((pm) => pm.enabled);

  // Fetch payment methods once so we can validate online-order toggle.
  useEffect(() => {
    if (restaurantId && !paymentMethods) {
      dispatch(getPaymentMethods({ restaurantId }));
    }
  }, [restaurantId, paymentMethods, dispatch]);

  const initialData = useMemo(
    () => ({
      restaurantId: inData?.id,
      name: inData?.name,
      tenant: inData?.tenant,
      // New-restaurant defaults below use `??` (null/undefined only) so
      // an existing owner's deliberately-saved value — including 0 or
      // false — is never clobbered. `addRestaurant.jsx` already seeds
      // these at creation; the fallbacks here just cover the case
      // where the backend hands back a raw null for an unconfigured
      // field. See the user-facing default spec: menuLang "tr",
      // moneySign null, decimalPoint 2, maxDistance 5 km,
      // maxTableOrderDistanceMeter 500 m.
      maxDistance: inData?.maxDistance ?? 5,
      googleAnalytics: inData?.googleAnalytics,
      googleReviewLink: inData?.googleReviewLink,
      // `||` not `??` for menuLang — the language picker can't render
      // an empty string, and "" is a meaningless value here (unlike a
      // numeric 0). null / undefined / "" all fall back to "tr".
      menuLang: inData?.menuLang || "tr",
      onlineOrder: inData?.onlineOrder ?? false,
      inPersonOrder: inData?.inPersonOrder ?? false,
      hide: inData?.hide,
      slogan1: inData?.slogan1,
      slogan2: inData?.slogan2,
      onlineOrderDiscountRate: inData?.onlineOrderDiscountRate,
      tableOrderDiscountRate: inData?.tableOrderDiscountRate,
      isSpecialPriceActive: inData?.isSpecialPriceActive,
      specialPriceName: inData?.specialPriceName,

      // Additional fields
      deliveryFee: inData?.deliveryFee,
      tableNumber: inData?.tableNumber,
      // Currency symbol — explicitly null for a fresh restaurant so
      // the owner picks their own (₺, $, €, …). `?? null` just
      // normalises `undefined` → `null`; a saved symbol passes through.
      moneySign: inData?.moneySign ?? null,
      // Number of digits shown after the decimal point in money figures
      // (e.g. ₺100,00 → 2). Defaults to 2 (kuruş) for the TR market.
      decimalPoint: inData?.decimalPoint ?? 2,
      maxTableOrderDistanceMeter: inData?.maxTableOrderDistanceMeter ?? 500,
      checkTableOrderDistance: inData?.checkTableOrderDistance,
      minOrderAmount: inData?.minOrderAmount,
      // Distance-based delivery tiers (Paket Sipariş). Seeded from a saved
      // `deliveryZones` array, or derived from the legacy flat fields above
      // so existing restaurants open with one pre-filled tier. See
      // DELIVERY_ZONES_BRIEF.md for the backend contract.
      deliveryZones: seedDeliveryZones(inData),
      // Default ON — customers expect the "Garson Çağır" button to be
      // available unless the owner explicitly turns it off (typically a
      // restaurant that doesn't run table service via QR menus).
      // `??` so an existing `false` is preserved.
      showWaiterCallButton: inData?.showWaiterCallButton ?? true,
      // When waiter calls are on, auto-resolve each incoming call a few
      // seconds after it arrives (handled admin-side by WaiterCallsProvider).
      // Default ON. `??` preserves an existing `false`.
      autoResolveWaiterCalls: inData?.autoResolveWaiterCalls ?? true,
      // WhatsApp Sipariş — Paket Sipariş'in kardeşi, ayrı kanal. Sipariş
      // kaydı oluşturulmaz; müşteri tarafı sepeti wa.me linkiyle WhatsApp'a
      // aktarır. Bu alanlar yalnızca yapılandırma; backend taşır.
      whatsappOrder: inData?.whatsappOrder ?? false,
      whatsappOrderPhone: inData?.whatsappOrderPhone,
      whatsappOrderDiscountRate: inData?.whatsappOrderDiscountRate,
      whatsappOrderDeliveryFee: inData?.whatsappOrderDeliveryFee,
      whatsappOrderMinAmount: inData?.whatsappOrderMinAmount,
      whatsappOrderMaxDistance: inData?.whatsappOrderMaxDistance ?? 5,
    }),
    [inData],
  );

  const [restaurantData, setRestaurantData] = useState(initialData);
  const [restaurantDataBefore, setRestaurantDataBefore] = useState(initialData);

  // Push dirty state into the shared context so SettingsTabs can
  // warn the user before they tab away with unsaved changes.
  useDirtyTracking(restaurantData, restaurantDataBefore);

  const handleToggleOnlineOrder = () => {
    const next = !restaurantData?.onlineOrder;
    if (next && !hasEnabledPaymentMethod) {
      toast.error(
        (toastT) => (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[--black-1]">
                {t("restaurantSettings.payment_required_title")}
              </p>
              <p className="text-xs text-[--gr-1] mt-0.5">
                {t("restaurantSettings.payment_required_desc")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(toastT.id);
                navigate(`/restaurant/payments/${restaurantId}`);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-semibold hover:brightness-110 active:brightness-95 transition shrink-0"
            >
              <CreditCard className="size-3.5" />
              {t("restaurantSettings.payment_required_cta")}
              <ArrowRight className="size-3" />
            </button>
          </div>
        ),
        { id: "online-order-payment-required", duration: 6000 },
      );
      return;
    }
    setRestaurantData((prev) => ({ ...prev, onlineOrder: next }));
  };

  const handleCheckTenantAvailability = async () => {
    const tenantValue = restaurantData?.tenant?.trim();

    if (!tenantValue) {
      toast.error(t("restaurantSettings.tenant_check_empty"));
      return;
    }

    // Backend expects the slug as the `name` query param. Must be wrapped
    // in an object — passing the raw string lets the createApiSlice
    // factory forward it to axios as `{ params: "myslug" }`, which axios
    // rejects with "target must be an object" (params has to be a plain
    // object so it can serialize key/value pairs into the query string).
    dispatch(checkTenantAvailability({ name: tenantValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEqual(restaurantData, restaurantDataBefore)) {
      toast.error(t("restaurantSettings.not_changed"));
      return;
    }

    // Tenant (alt alan adı) zorunlu — QR/menü adresinin temeli. Boşken
    // kaydetmeye izin verme.
    if (!restaurantData?.tenant?.trim()) {
      toast.error(t("restaurantSettings.tenant_required"), {
        id: "tenant-required",
      });
      return;
    }

    // Paket Sipariş açıkken en az bir geçerli teslimat kademesi (km > 0)
    // zorunlu; üst-sınırlı modelde km'ler kesin artan olmalı.
    if (restaurantData?.onlineOrder) {
      const zoneKms = (
        Array.isArray(restaurantData?.deliveryZones)
          ? restaurantData.deliveryZones
          : []
      )
        .map((z) => toZoneNumber(z?.maxDistanceKm))
        .filter((n) => n > 0)
        .sort((a, b) => a - b);
      if (!zoneKms.length) {
        toast.error(t("restaurantSettings.delivery_zones_min_one"), {
          id: "delivery-zones-min-one",
        });
        return;
      }
      if (zoneKms.some((v, i) => i > 0 && v === zoneKms[i - 1])) {
        toast.error(t("restaurantSettings.delivery_zones_ascending"), {
          id: "delivery-zones-ascending",
        });
        return;
      }
    }

    // WhatsApp Sipariş açıkken sipariş numarası zorunlu (müşteri tarafı
    // wa.me/<numara> linkini bu değerden kurar).
    if (
      restaurantData?.whatsappOrder &&
      !restaurantData?.whatsappOrderPhone?.trim()
    ) {
      toast.error(t("restaurantSettings.whatsapp_phone_required"), {
        id: "whatsapp-phone-required",
      });
      return;
    }

    // Paket Sipariş + Masada Sipariş numeric fields must never be sent as null
    // or empty — coerce missing values to 0 at save time.
    const numericDefaults = {
      onlineOrderDiscountRate: 0,
      deliveryFee: 0,
      minOrderAmount: 0,
      maxDistance: 0,
      tableOrderDiscountRate: 0,
      maxTableOrderDistanceMeter: 0,
      whatsappOrderDiscountRate: 0,
      whatsappOrderDeliveryFee: 0,
      whatsappOrderMinAmount: 0,
      whatsappOrderMaxDistance: 0,
    };
    const normalized = { ...restaurantData };
    for (const key of Object.keys(numericDefaults)) {
      const v = normalized[key];
      if (v === null || v === undefined || v === "") {
        normalized[key] = numericDefaults[key];
      }
    }

    // Currency-mode fields (deliveryFee, minOrderAmount) parse user
    // input into a Number on every keystroke, so by the time we get
    // here they're already clean. As a final safety net coerce any
    // stale string ("1.000" loaded from the backend, a paste, etc.)
    // into a numeric value the backend will accept.
    for (const k of [
      "deliveryFee",
      "minOrderAmount",
      "whatsappOrderDeliveryFee",
      "whatsappOrderMinAmount",
    ]) {
      const v = normalized[k];
      if (typeof v === "string") {
        const n = parseFloat(v.replace(",", "."));
        normalized[k] = Number.isFinite(n) ? n : 0;
      }
    }

    // Backend expects `decimalPoint` as a string ("0".."3"), not a
    // Number. The picker stores it as a Number internally so the option
    // lookup matches by identity — coerce at the wire boundary.
    {
      const n = Number(normalized.decimalPoint);
      normalized.decimalPoint = String(Number.isFinite(n) ? n : 2);
    }

    // Teslimat kademeleri (üst-sınırlı): coerce → boş/geçersiz olanları at →
    // km'ye göre artan sırala. Backend + müşteri teması bu diziyi kullanır.
    const normalizedZones = (
      Array.isArray(normalized.deliveryZones) ? normalized.deliveryZones : []
    )
      .map((z) => ({
        maxDistanceKm: toZoneNumber(z?.maxDistanceKm),
        minOrderAmount: toZoneNumber(z?.minOrderAmount),
        deliveryFee: toZoneNumber(z?.deliveryFee),
      }))
      .filter((z) => z.maxDistanceKm > 0)
      .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
    normalized.deliveryZones = normalizedZones;

    // Geriye dönük uyum: güncellenmemiş müşteri tema build'leri hâlâ düz
    // alanları okur. Son kademe = teslimat yarıçapı; ilk (en yakın) kademe =
    // taban ücret/min. Böylece eski tema taban kademeyle çalışmaya devam eder.
    if (normalizedZones.length) {
      normalized.maxDistance =
        normalizedZones[normalizedZones.length - 1].maxDistanceKm;
      normalized.deliveryFee = normalizedZones[0].deliveryFee;
      normalized.minOrderAmount = normalizedZones[0].minOrderAmount;
    }

    // WhatsApp Sipariş, Paket Sipariş ile aynı parametreleri kullanır:
    // iskonto / teslimat / min. tutar / mesafe. Ayrı UI alanı yok — kaydederken
    // Paket (taban kademe) değerlerini WhatsApp alanlarına yansıtıyoruz
    // (müşteri tarafı whatsappOrder* alanlarını okur).
    normalized.whatsappOrderDiscountRate = normalized.onlineOrderDiscountRate;
    normalized.whatsappOrderDeliveryFee = normalized.deliveryFee;
    normalized.whatsappOrderMinAmount = normalized.minOrderAmount;
    normalized.whatsappOrderMaxDistance = normalized.maxDistance;

    setRestaurantData(normalized);
    dispatch(setRestaurantSettings(normalized));
  };

  // Re-seed the form when the cached restaurant entity changes — but
  // never while the user has unsaved edits. Before smart-revalidate
  // this only fired on first load / id change so a blind reset was
  // safe; now the entity is refreshed on tab focus / nav (cross-device
  // sync), and an unconditional reset would wipe what the user is
  // typing. Guard: only re-seed when the form is pristine. Last-write-
  // wins on Save is the expected behaviour for a form they're actively
  // editing.
  useEffect(() => {
    if (!isEqual(restaurantData, restaurantDataBefore)) return;
    setRestaurantData(initialData);
    setRestaurantDataBefore(initialData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // Cross-device / returning-to-tab freshness for the restaurant
  // entity. `inData` (moneySign, decimalPoint, …) comes from the
  // getRestaurants LIST slice via restaurantHome's `myRestaurant`, so
  // we refetch the LIST — not the single GetRestaurantById, which only
  // updates the lower-priority `stateRest` fallback and would leave
  // `myRestaurant` stale. restaurantHome runs the same revalidate on
  // window focus; this one fires on in-app navigation TO Genel Ayarlar
  // (restaurantHome stays mounted across sub-tab switches so its mount
  // effect wouldn't re-run). Shared throttle key `restaurant:<id>`
  // dedupes the two so they never double-fetch within the window.
  useSmartRevalidate(
    restaurantId ? `restaurant:${restaurantId}` : null,
    // Match the sidebar's list paging ({ pageNumber: 1, pageSize: 50 })
    // so the refetch refreshes the same cached list `inData` resolves
    // from instead of replacing it with a different page.
    () =>
      dispatch(getRestaurants({ pageNumber: 1, pageSize: 50, __silent: true })),
  );

  // TOAST SUCCESS
  useEffect(() => {
    if (success) {
      // Detect "just activated Özel Fiyat" — the previous saved
      // snapshot had it off, this save flipped it on — and surface a
      // dedicated toast naming the column that will now show on the
      // Price List page. Fires alongside the generic "saved" toast.
      if (
        restaurantDataBefore?.isSpecialPriceActive === false &&
        restaurantData?.isSpecialPriceActive === true
      ) {
        const colName =
          restaurantData?.specialPriceName?.trim() ||
          t("priceList.special");
        toast.success(
          t("restaurantSettings.special_price_column_added", {
            name: colName,
          }),
          { id: "special-price-activated", duration: 5000 },
        );
      }
      toast.success(t("restaurantSettings.success"));
      setRestaurantDataBefore(restaurantData);
      dispatch(resetSetRestaurantSettings());
    }
    if (error) dispatch(resetSetRestaurantSettings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error, dispatch, restaurantData]);

  useEffect(() => {
    if (!tenantCheckSuccess && !tenantCheckError) return;

    if (tenantCheckSuccess) {
      // Resolve the "is this tenant slug free to use?" boolean from
      // whatever shape the backend returns. We've seen / can plausibly
      // get any of these in the wild:
      //   true / false                    (bare boolean)
      //   { isAvailable: true|false }
      //   { available: true|false }
      //   { isInUse: true|false }         (inverted — true means taken)
      //   { inUse: true|false }           (inverted)
      //   { exists: true|false }          (inverted — true means taken)
      // Inverted keys are negated so the downstream branch always
      // treats `true = available, false = taken`.
      let isAvailable = null;
      if (typeof tenantCheckData === "boolean") {
        isAvailable = tenantCheckData;
      } else if (tenantCheckData && typeof tenantCheckData === "object") {
        if (typeof tenantCheckData.isAvailable === "boolean") {
          isAvailable = tenantCheckData.isAvailable;
        } else if (typeof tenantCheckData.available === "boolean") {
          isAvailable = tenantCheckData.available;
        } else if (typeof tenantCheckData.isInUse === "boolean") {
          isAvailable = !tenantCheckData.isInUse;
        } else if (typeof tenantCheckData.inUse === "boolean") {
          isAvailable = !tenantCheckData.inUse;
        } else if (typeof tenantCheckData.exists === "boolean") {
          isAvailable = !tenantCheckData.exists;
        }
      }

      if (isAvailable === false) {
        toast.error(t("restaurantSettings.tenant_check_taken"), {
          id: "tenant-check",
        });
      } else {
        toast.success(t("restaurantSettings.tenant_check_available"), {
          id: "tenant-check",
        });
      }
    }

    dispatch(resetCheckTenantAvailability());
  }, [tenantCheckSuccess, tenantCheckData, tenantCheckError, dispatch, t]);

  // Use the user's saved Para Birimi Sembolü literally — no ₺ fallback,
  // since defaulting to ₺ misled users who left the symbol blank into
  // thinking the field was locked to TRY. Empty string flows down to
  // NumberWithSuffix where the suffix pill collapses entirely.
  const moneySign = restaurantData?.moneySign ?? "";

  // Live preview of how money will be rendered for each decimal-places
  // choice. Reads the *raw* input value (no ₺ fallback) so an empty
  // currency field shows just the numbers, and inserts a single non-breaking
  // space between symbol and amount when a symbol is present (regular
  // spaces get collapsed by react-select renderers).
  const previewSymbol = restaurantData?.moneySign ?? "";
  const previewPrefix = previewSymbol ? `${previewSymbol} ` : "";
  const decimalOptions = [0, 1, 2, 3].map((n) => ({
    value: n,
    label:
      n === 0
        ? `0 — ${previewPrefix}100`
        : `${n} — ${previewPrefix}100,${"0".repeat(n)}`,
  }));

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      {/* CARD */}
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* gradient strip */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Settings className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("restaurantSettings.title", {
                name: restaurantData?.name || "",
              })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {restaurantData?.tenant
                ? `${restaurantData.tenant}.liwamenu.com`
                : "—"}
            </p>
          </div>
          <PageHelp pageKey="settings" className="shrink-0" />
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {showGeneral && (
              <>
            {/* GENEL */}
            <div>
              <SectionHeader icon={Globe} label={t("restaurantSettings.tenant")} />

              {/* Tenant URL */}
              <div className="mb-3">
                <label className={labelCls}>
                  {t("restaurantSettings.tenant")}
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div
                    className={`flex flex-1 rounded-lg border transition overflow-hidden ${
                      tenantLocked
                        ? "border-[--border-1] bg-[--white-2]"
                        : "border-[--border-1] bg-[--white-1] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100"
                    }`}
                  >
                    <span className="bg-[--white-2] text-[--gr-1] text-xs font-medium px-2.5 grid place-items-center border-r border-[--border-1] shrink-0">
                      https://
                    </span>
                    <input
                      type="text"
                      placeholder={t("restaurantSettings.tenant_placeholder")}
                      className="flex-1 min-w-0 h-10 px-2 outline-none text-sm bg-transparent disabled:cursor-not-allowed disabled:text-[--gr-1]"
                      value={restaurantData?.tenant ?? ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          tenant: e.target.value,
                        }))
                      }
                      disabled={tenantLocked}
                    />
                    <span className="bg-[--white-2] text-[--gr-1] text-xs font-medium px-2.5 grid place-items-center border-l border-[--border-1] shrink-0">
                      .liwamenu.com
                    </span>
                    {tenantLocked && (
                      <span className="bg-[--white-2] text-[--gr-1] px-2 grid place-items-center border-l border-[--border-1] shrink-0">
                        <Lock className="size-3.5" />
                      </span>
                    )}
                  </div>
                  {tenantLocked ? (
                    <button
                      type="button"
                      onClick={openTenantUnlockModal}
                      className="h-10 px-3.5 rounded-lg border border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition inline-flex items-center justify-center gap-1.5 shrink-0 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30"
                    >
                      <Pencil className="size-3.5" />
                      {t("restaurantSettings.tenant_change", "Değiştir")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCheckTenantAvailability}
                      disabled={isCheckingTenant}
                      className="h-10 px-3.5 rounded-lg border border-[--border-1] bg-[--white-1] text-sm font-medium text-[--black-2] hover:bg-[--white-2] hover:border-indigo-300 transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Check className="size-4 text-indigo-600" />
                      {isCheckingTenant
                        ? t("restaurantSettings.tenant_check_loading")
                        : t("restaurantSettings.tenant_check")}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-indigo-600 mt-1">
                  {t("restaurantSettings.tenant_note", {
                    url: `${restaurantData?.tenant || "restaurant"}.liwamenu.com`,
                  })}
                </p>
              </div>

              {/* Menu Lang + Money Sign + Decimal Places — three fields share
                  one row from sm+ up. Decimal Places sits to the right of
                  Money Sign because it modifies how the symbol's amount is
                  rendered (e.g. ₺ 100,00 vs ₺ 100). */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className={labelCls}>
                    <Languages className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                    {t("restaurantSettings.menu_language")}
                  </label>
                  <CustomSelect
                    className="text-sm"
                    placeholder={t(
                      "restaurantSettings.menu_language_placeholder",
                    )}
                    style={{
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      minHeight: "40px",
                      height: "40px",
                    }}
                    value={
                      LanguagesEnums.find(
                        (L) => L.id == (restaurantData?.menuLang ?? null),
                      ) || {
                        label: t(
                          "restaurantSettings.menu_language_placeholder",
                        ),
                      }
                    }
                    options={LanguagesEnums}
                    onChange={(selectedOption) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        menuLang: selectedOption.id,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <CircleDollarSign className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                    {t("restaurantSettings.money_sign")}
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t(
                      "restaurantSettings.money_sign_placeholder",
                    )}
                    value={restaurantData?.moneySign ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        moneySign: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Hash className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                    {t("restaurantSettings.decimal_places")}
                  </label>
                  <CustomSelect
                    className="text-sm"
                    style={{
                      borderRadius: "0.5rem",
                      borderColor: "#e2e8f0",
                      minHeight: "40px",
                      height: "40px",
                    }}
                    value={
                      // Tolerate both number and string here — the
                      // backend returns it as a string but the picker
                      // sets it as a number on change.
                      decimalOptions.find((o) => {
                        const v = Number(restaurantData?.decimalPoint);
                        return o.value === (Number.isFinite(v) ? v : 2);
                      }) || decimalOptions[2]
                    }
                    options={decimalOptions}
                    onChange={(selected) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        decimalPoint: selected.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Google Analytics + Google yorum bağlantısı (yan yana) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 items-start">
                {/* Google Analytics */}
                <div>
                  <label className={`${labelCls} flex items-center gap-1.5`}>
                    <span>
                      <ChartLine className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                      {t("restaurantSettings.google_analytics")}
                    </span>
                    {/* (?) — opens the step-by-step "how to get a GA
                        Measurement ID" guide modal in the second popup
                        slot, above this settings page. */}
                    <button
                      type="button"
                      onClick={() =>
                        setSecondPopupContent(
                          <GoogleAnalyticsHelp
                            tenant={restaurantData?.tenant || inData?.tenant}
                            onClose={() => setSecondPopupContent(null)}
                          />,
                        )
                      }
                      title={t(
                        "restaurantSettings.google_analytics_help",
                        "Google Analytics kimliği nasıl alınır?",
                      )}
                      aria-label={t(
                        "restaurantSettings.google_analytics_help",
                        "Google Analytics kimliği nasıl alınır?",
                      )}
                      className="grid place-items-center size-4 rounded-full text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-500/15"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t(
                      "restaurantSettings.google_analytics_placeholder",
                    )}
                    value={restaurantData?.googleAnalytics ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        googleAnalytics: e.target.value,
                      }))
                    }
                  />
                  <p className="text-[10px] text-[--gr-1] mt-1">
                    <a
                      href="https://analytics.google.com/analytics/web"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline-offset-2 hover:underline"
                    >
                      analytics.google.com
                    </a>{" "}
                    {t("restaurantSettings.google_analytics_hint")}
                  </p>
                </div>

                {/* Google Yorum Bağlantısı — müşteriyi doğrudan "yorum yaz"
                    ekranına götüren Google İşletme bağlantısı. Tema bu değeri
                    okuyup bir "Değerlendir" butonu gösterecek. */}
                <div>
                  <label className={`${labelCls} flex items-center gap-1.5`}>
                    <span>
                      <Star className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                      {t(
                        "restaurantSettings.google_review_link",
                        "Google Yorum Bağlantısı",
                      )}
                    </span>
                    {/* (?) — opens the step-by-step "how to get your Google
                        review link" guide in the second popup slot. */}
                    <button
                      type="button"
                      onClick={() =>
                        setSecondPopupContent(
                          <GoogleReviewHelp
                            onClose={() => setSecondPopupContent(null)}
                          />,
                        )
                      }
                      title={t(
                        "restaurantSettings.google_review_link_help",
                        "Google yorum bağlantısı nasıl alınır?",
                      )}
                      aria-label={t(
                        "restaurantSettings.google_review_link_help",
                        "Google yorum bağlantısı nasıl alınır?",
                      )}
                      className="grid place-items-center size-4 rounded-full text-indigo-600 hover:bg-indigo-50 transition dark:hover:bg-indigo-500/15"
                    >
                      <HelpCircle className="size-3.5" />
                    </button>
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t(
                      "restaurantSettings.google_review_link_placeholder",
                      "https://g.page/r/XXXXXXXXXXXX/review",
                    )}
                    value={restaurantData?.googleReviewLink ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        googleReviewLink: e.target.value,
                      }))
                    }
                  />
                  <p className="text-[10px] text-[--gr-1] mt-1">
                    <a
                      href="https://business.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 underline-offset-2 hover:underline"
                    >
                      business.google.com
                    </a>{" "}
                    {t(
                      "restaurantSettings.google_review_link_hint",
                      'İşletme profilinizdeki "Yorum iste" bağlantısını yapıştırın; müşteriler doğrudan yorum yazma ekranını görür.',
                    )}
                  </p>
                </div>
              </div>

              {/* Sloganlar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    <Quote className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                    {t("restaurantSettings.slogan1")}
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t("restaurantSettings.slogan1_placeholder")}
                    value={restaurantData?.slogan1 ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        slogan1: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>
                    <Quote className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                    {t("restaurantSettings.slogan2")}
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder={t("restaurantSettings.slogan2_placeholder")}
                    value={restaurantData?.slogan2 ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        slogan2: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {showOrder && (
              <>
            {/* ONLINE SİPARİŞ */}
            <div>
              <SectionHeader
                icon={ShoppingBag}
                label={t("restaurantSettings.online_order")}
                iconClassName="text-sky-600"
              />
              {/* Sky tint distinguishes the Paket Sipariş card from the
                  amber-tinted Masada Sipariş card directly below — owners
                  often missed which toggle they were flipping when both
                  cards shared the same neutral white background. */}
              <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900/40 dark:bg-sky-950/20">
                <div
                  className={`flex items-center justify-between gap-3 ${
                    restaurantData?.onlineOrder
                      ? "pb-3 mb-3 border-b border-sky-200/70 dark:border-sky-900/40"
                      : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[--black-1] whitespace-nowrap">
                    {t("restaurantSettings.online_order")}
                  </span>
                  <CustomToggle
                    label=""
                    swap
                    className1="!w-auto !shrink-0"
                    checked={restaurantData?.onlineOrder}
                    onChange={handleToggleOnlineOrder}
                  />
                </div>
                {restaurantData?.onlineOrder && (
                  <div className="space-y-3">
                    {/* İskonto global kalır (mesafeye bağlı değil); min. tutar
                        ve teslimat ücreti aşağıdaki kademe editöründe. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <NumberWithSuffix
                        label={t("restaurantSettings.online_order_discount")}
                        suffix="%"
                        value={restaurantData?.onlineOrderDiscountRate}
                        onChange={(v) =>
                          setRestaurantData((prev) => ({
                            ...prev,
                            onlineOrderDiscountRate: v,
                          }))
                        }
                        placeholder={t(
                          "restaurantSettings.online_order_discount_placeholder",
                        )}
                      />
                    </div>
                    <DeliveryZonesEditor
                      zones={restaurantData?.deliveryZones}
                      onChange={(z) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          deliveryZones: z,
                        }))
                      }
                      moneySign={moneySign}
                      decimalPoint={restaurantData?.decimalPoint}
                      t={t}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* MASA SİPARİŞ */}
            <div>
              <SectionHeader
                icon={UtensilsCrossed}
                label={t("restaurantSettings.in_person_order")}
                iconClassName="text-amber-600"
              />
              {/* Amber tint pairs with the sky-tinted Paket Sipariş card
                  above so the two order channels are visually distinct. */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div
                  className={`flex items-center justify-between gap-3 ${
                    restaurantData?.inPersonOrder
                      ? "pb-3 mb-3 border-b border-amber-200/70 dark:border-amber-900/40"
                      : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[--black-1] whitespace-nowrap">
                    {t("restaurantSettings.in_person_order")}
                  </span>
                  <CustomToggle
                    label=""
                    swap
                    className1="!w-auto !shrink-0"
                    checked={restaurantData?.inPersonOrder}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        inPersonOrder: !restaurantData.inPersonOrder,
                      }))
                    }
                  />
                </div>
                {restaurantData?.inPersonOrder && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <NumberWithSuffix
                        label={t("restaurantSettings.table_order_discount")}
                        suffix="%"
                        value={restaurantData?.tableOrderDiscountRate}
                        onChange={(v) =>
                          setRestaurantData((prev) => ({
                            ...prev,
                            tableOrderDiscountRate: v,
                          }))
                        }
                        placeholder={t(
                          "restaurantSettings.table_order_discount_placeholder",
                        )}
                      />
                      {restaurantData?.checkTableOrderDistance && (
                        <NumberWithSuffix
                          label={t(
                            "restaurantSettings.max_table_order_distance_meter",
                          )}
                          suffix="m"
                          value={restaurantData?.maxTableOrderDistanceMeter}
                          onChange={(v) =>
                            setRestaurantData((prev) => ({
                              ...prev,
                              maxTableOrderDistanceMeter: v,
                            }))
                          }
                          placeholder={t(
                            "restaurantSettings.max_table_order_distance_meter_placeholder",
                          )}
                        />
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-200/70 dark:border-amber-900/40">
                      <CustomToggle
                        label={t(
                          "restaurantSettings.check_table_order_distance",
                        )}
                        className2="text-sm font-medium text-[--black-1]"
                        checked={restaurantData?.checkTableOrderDistance}
                        onChange={() =>
                          setRestaurantData((prev) => ({
                            ...prev,
                            checkTableOrderDistance:
                              !restaurantData.checkTableOrderDistance,
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* WHATSAPP SİPARİŞ */}
            <div>
              <SectionHeader
                icon={MessageCircle}
                label={t("restaurantSettings.whatsapp_order")}
                iconClassName="text-emerald-600"
              />
              {/* Emerald tint (WhatsApp markası) — Paket (mavi) ve Masa
                  (kehribar) yanında üçüncü sipariş kanalı. Sipariş kaydı
                  oluşmaz; müşteri sepeti wa.me linkiyle WhatsApp'a aktarır,
                  bu alanlar yapılandırma olarak tema tarafından kullanılır. */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                <div
                  className={`flex items-center justify-between gap-3 ${
                    restaurantData?.whatsappOrder
                      ? "pb-3 mb-3 border-b border-emerald-200/70 dark:border-emerald-900/40"
                      : ""
                  }`}
                >
                  <span className="text-sm font-medium text-[--black-1] whitespace-nowrap">
                    {t("restaurantSettings.whatsapp_order")}
                  </span>
                  <CustomToggle
                    label=""
                    swap
                    className1="!w-auto !shrink-0"
                    checked={restaurantData?.whatsappOrder}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        whatsappOrder: !restaurantData.whatsappOrder,
                      }))
                    }
                  />
                </div>
                {restaurantData?.whatsappOrder && (
                  <div className="space-y-3">
                    {/* Sipariş alınacak WhatsApp numarası (zorunlu). */}
                    <div>
                      <label className={`${labelCls} flex items-center gap-1`}>
                        <Phone className="size-3 text-emerald-600" />
                        {t(
                          "restaurantSettings.whatsapp_order_phone",
                          "WhatsApp Sipariş Numarası",
                        )}
                      </label>
                      <input
                        type="text"
                        inputMode="tel"
                        autoComplete="off"
                        className={inputCls}
                        placeholder={t(
                          "restaurantSettings.whatsapp_order_phone_placeholder",
                          "Ülke kodlu, örn. 905551112233",
                        )}
                        value={restaurantData?.whatsappOrderPhone ?? ""}
                        onChange={(e) =>
                          setRestaurantData((prev) => ({
                            ...prev,
                            whatsappOrderPhone: e.target.value,
                          }))
                        }
                      />
                      <p className="text-[10px] text-[--gr-1] mt-1">
                        {t(
                          "restaurantSettings.whatsapp_order_phone_hint",
                          "Sipariş bu numaraya WhatsApp üzerinden iletilir. Ülke kodu dahil, sadece rakam.",
                        )}
                      </p>
                    </div>
                    {/* İskonto / Teslimat / Min. Tutar / Mesafe için ayrı alan
                        yok — WhatsApp siparişi bu değerlerde Paket Sipariş ile
                        aynısını kullanır (kaydederken otomatik eşitlenir). */}
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                      {t(
                        "restaurantSettings.whatsapp_uses_package",
                        "İskonto, teslimat ücreti, minimum tutar ve mesafe Paket Sipariş ile aynı kullanılır.",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
              </>
            )}

            {showGeneral && (
              <>
            {/* GÖRÜNÜRLÜK & ÖZEL FİYAT */}
            <div>
              <SectionHeader
                icon={Eye}
                label={t("restaurantSettings.special_price_section")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3">
                  <CustomToggle
                    label={t("restaurantSettings.is_special_price_active")}
                    className2="text-sm font-medium text-[--black-1]"
                    checked={restaurantData?.isSpecialPriceActive}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        isSpecialPriceActive:
                          !restaurantData.isSpecialPriceActive,
                      }))
                    }
                  />
                  <p className="text-[11px] text-[--gr-1] mt-1.5 leading-snug">
                    {t("restaurantSettings.special_price_help")}
                  </p>
                </div>
                {/* Goes red when ON — "out of service" is an active alarm
                    state the owner should immediately notice (the whole card
                    tints rose, not just the toggle). */}
                <div
                  className={`rounded-xl border p-3 transition-colors ${
                    restaurantData?.hide
                      ? "border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20"
                      : "border-[--border-1] bg-[--white-1]"
                  }`}
                >
                  <CustomToggle
                    label={t("restaurantSettings.hide_restaurant")}
                    className2={`text-sm font-medium ${
                      restaurantData?.hide
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-[--black-1]"
                    }`}
                    checked={restaurantData?.hide}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        hide: !restaurantData.hide,
                      }))
                    }
                  />
                  <p
                    className={`text-[11px] mt-1.5 leading-snug ${
                      restaurantData?.hide
                        ? "text-rose-700/90 dark:text-rose-300/90"
                        : "text-[--gr-1]"
                    }`}
                  >
                    {t("restaurantSettings.hide_restaurant_help")}
                  </p>
                </div>
                {/* "Garson Çağır" customer-side button visibility.
                    Backend default is true (customer expects to be able
                    to call a waiter); off-switch is for restaurants
                    that don't run table service via QR. The flag is
                    consumed by the customer-facing theme repo, not
                    this admin app. */}
                <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3">
                  <CustomToggle
                    label={t(
                      "restaurantSettings.show_waiter_call_button",
                      "Garson Çağır Butonu Göster",
                    )}
                    className2="text-sm font-medium text-[--black-1]"
                    checked={restaurantData?.showWaiterCallButton}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        showWaiterCallButton: !prev?.showWaiterCallButton,
                      }))
                    }
                  />
                  {/* Sub-setting: only meaningful while waiter calls are on.
                      When enabled, an incoming call is auto-marked resolved
                      ~1 min after it arrives (WaiterCallsProvider handles the
                      timer admin-side). */}
                  {restaurantData?.showWaiterCallButton && (
                    <div className="mt-3 pt-3 border-t border-[--border-1]">
                      <CustomToggle
                        label={t(
                          "restaurantSettings.auto_resolve_waiter_calls",
                          "Çağrıları Otomatik Çöz",
                        )}
                        className2="text-sm font-medium text-[--black-1]"
                        checked={restaurantData?.autoResolveWaiterCalls}
                        onChange={() =>
                          setRestaurantData((prev) => ({
                            ...prev,
                            autoResolveWaiterCalls: !prev?.autoResolveWaiterCalls,
                          }))
                        }
                      />
                      <p className="text-[11px] text-[--gr-1] mt-1.5 leading-snug">
                        {t(
                          "restaurantSettings.auto_resolve_waiter_calls_hint",
                          "Açıkken, gelen garson çağrısı 1 dakika sonra otomatik olarak çözüldü işaretlenir.",
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {restaurantData?.isSpecialPriceActive && (
                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tag className="size-3.5 text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-[0.12em]">
                      {t("restaurantSettings.special_price_label")}
                    </span>
                  </div>
                  <input
                    type="text"
                    className="w-full h-10 px-3 rounded-lg border border-amber-200 bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                    placeholder={t(
                      "restaurantSettings.special_price_placeholder",
                    )}
                    value={restaurantData.specialPriceName || ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        specialPriceName: e.target.value,
                      }))
                    }
                  />
                  <p className="text-[10px] text-amber-700/80 mt-1.5 italic">
                    {t("restaurantSettings.special_price_note")}
                  </p>
                </div>
              )}
            </div>
              </>
            )}

            {/* SUBMIT */}
            <div className="flex justify-end pt-3 border-t border-[--border-1]">
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
                }}
              >
                <Save className="size-4" />
                {t("restaurantSettings.save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Confirmation dialog shown before unlocking the tenant input. Changing the
// tenant slug breaks any QR codes already in circulation, so we want a
// deliberate, hard-to-mistakenly-confirm warning before proceeding.
const TenantUnlockConfirm = ({ t, onCancel, onConfirm }) => (
  <main className="flex justify-center">
    <div className="bg-[--white-2] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[480px] flex flex-col items-center text-center shadow-2xl">
      <div className="size-16 bg-rose-50 dark:bg-rose-500/15 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle
          className="size-8 text-rose-600 dark:text-rose-300"
          strokeWidth={1.8}
        />
      </div>
      <h2 className="text-xl font-bold mb-3 tracking-tight text-rose-700 dark:text-rose-200">
        {t("restaurantSettings.tenant_change_title", "Tenant Değiştir")}
      </h2>
      <p className="text-[--gr-1] text-sm sm:text-base mb-8 leading-relaxed px-2 font-medium">
        {t(
          "restaurantSettings.tenant_change_warning",
          "Daha önceden kaydettiğiniz alt domain (Tenant)'ı değiştirmek oluşturduğunuz QR kodların çalışmayacağı anlamına gelir! Tenant değiştirmek istediğinize emin misiniz?",
        )}
      </p>
      <div className="flex gap-3 w-full text-sm">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--white-1] transition-colors"
        >
          {t("deleteProduct.cancel", "Vazgeç")}
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-6 py-2.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-500/25"
        >
          {t("restaurantSettings.tenant_change_confirm", "Evet, Değiştir")}
        </button>
      </div>
    </div>
  </main>
);

export default RestaurantSettings;
