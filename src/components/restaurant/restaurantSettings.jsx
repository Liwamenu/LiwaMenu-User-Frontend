//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";

//COMP
import CustomToggle from "../common/customToggle";
import CustomSelect from "../common/customSelector";
import LanguagesEnums from "../../enums/languagesEnums";
import SettingsTabs from "./settingsTabs";
import { usePopup } from "../../context/PopupContext";

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

const RestaurantSettings = ({ data: inData }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { setSecondPopupContent } = usePopup();
  const restaurantId = useParams()["*"]?.split("/")[1];

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
      maxDistance: inData?.maxDistance,
      googleAnalytics: inData?.googleAnalytics,
      menuLang: inData?.menuLang,
      onlineOrder: inData?.onlineOrder,
      inPersonOrder: inData?.inPersonOrder,
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
      moneySign: inData?.moneySign,
      // Number of digits shown after the decimal point in money figures
      // (e.g. ₺100,00 → 2). Defaults to 2 (kuruş) for the TR market.
      decimalPoint: inData?.decimalPoint ?? 2,
      maxTableOrderDistanceMeter: inData?.maxTableOrderDistanceMeter,
      checkTableOrderDistance: inData?.checkTableOrderDistance,
      minOrderAmount: inData?.minOrderAmount,
    }),
    [inData],
  );

  const [restaurantData, setRestaurantData] = useState(initialData);
  const [restaurantDataBefore, setRestaurantDataBefore] = useState(initialData);

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

    if (
      restaurantData?.onlineOrder &&
      !(Number(restaurantData?.maxDistance) > 0)
    ) {
      toast.error(t("restaurantSettings.max_distance_required"), {
        id: "max-distance-required",
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
    for (const k of ["deliveryFee", "minOrderAmount"]) {
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

    setRestaurantData(normalized);
    dispatch(setRestaurantSettings(normalized));
  };

  // Update state when inData changes
  useEffect(() => {
    setRestaurantData(initialData);
    setRestaurantDataBefore(initialData);
  }, [initialData]);

  // TOAST SUCCESS
  useEffect(() => {
    if (success) {
      toast.success(t("restaurantSettings.success"));
      setRestaurantDataBefore(restaurantData);
      dispatch(resetSetRestaurantSettings());
    }
    if (error) dispatch(resetSetRestaurantSettings());
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
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

              {/* Google Analytics */}
              <div className="mb-3">
                <label className={labelCls}>
                  <ChartLine className="size-3 inline-block -mt-0.5 mr-1 text-indigo-600" />
                  {t("restaurantSettings.google_analytics")}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                    <NumberWithSuffix
                      label={t("restaurantSettings.delivery_fee")}
                      suffix={moneySign}
                      value={restaurantData?.deliveryFee}
                      onChange={(v) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          deliveryFee: v,
                        }))
                      }
                      placeholder={t(
                        "restaurantSettings.delivery_fee_placeholder",
                      )}
                      currencyDecimals={
                        Number.isFinite(Number(restaurantData?.decimalPoint))
                          ? Number(restaurantData.decimalPoint)
                          : 2
                      }
                      maxDigits={9}
                    />
                    <NumberWithSuffix
                      label={t("restaurantSettings.min_order_amount")}
                      suffix={moneySign}
                      value={restaurantData?.minOrderAmount}
                      onChange={(v) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          minOrderAmount: v,
                        }))
                      }
                      placeholder={t(
                        "restaurantSettings.min_order_amount_placeholder",
                      )}
                      // Currency mode keeps the input in lock-step with
                      // the restaurant's Kuruş Hanesi (Genel Ayarlar).
                      // Stored as a Number, displayed with locale
                      // separators on blur (e.g. 1500 → "1.500,00" when
                      // decimalPoint=2, or "1.500" when 0).
                      currencyDecimals={
                        Number.isFinite(Number(restaurantData?.decimalPoint))
                          ? Number(restaurantData.decimalPoint)
                          : 2
                      }
                      maxDigits={9}
                    />
                    <NumberWithSuffix
                      label={t("restaurantSettings.max_distance")}
                      suffix="km"
                      required
                      value={restaurantData?.maxDistance}
                      onChange={(v) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          maxDistance: v,
                        }))
                      }
                      placeholder={t(
                        "restaurantSettings.max_distance_placeholder",
                      )}
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

            {/* GÖRÜNÜRLÜK & ÖZEL FİYAT */}
            <div>
              <SectionHeader
                icon={Eye}
                label={t("restaurantSettings.special_price_section")}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>
                <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3">
                  <CustomToggle
                    label={t("restaurantSettings.hide_restaurant")}
                    className2="text-sm font-medium text-[--black-1]"
                    checked={restaurantData?.hide}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        hide: !restaurantData.hide,
                      }))
                    }
                  />
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
