//MODULES
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

// COMP
import PaymentCard from "../../payment/card/card";
import PayTRForm from "../../payment/form/PayTRForm";
import { usePopup } from "../../../context/PopupContext";

// REDUX
import { clearCart } from "../../../redux/cart/cartSlice";
import {
  addByOnlinePay,
  resetAddByOnlinePay,
} from "../../../redux/licenses/addLicense/addByOnlinePaySlice";
import {
  extendByOnlinePay,
  resetExtendByOnlinePay,
} from "../../../redux/licenses/extendLicense/extendByOnlinePaySlice";
import { PaymentLoader } from "../stepsAssets/paymentLoader";

// FUNC
import { formatPrice, isValidCardNumber } from "../../../utils/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const OnlinePayment = ({
  step,
  setStep,
  userData,
  actionType,
  userInvData,
  setPaymentStatus,
}) => {
  const { t } = useTranslation();
  const toastId = useRef();
  const dispatch = useDispatch();
  const location = useLocation();
  const { setPopupContent } = usePopup();

  const { currentLicense } = location?.state || {};
  const isPageExtend = actionType === "extend-license";

  const {
    error: addError,
    loading: addLoading,
    success: addSuccess,
  } = useSelector((state) => state.licenses.addByPay);

  const {
    error: extendError,
    loading: extendLoading,
    success: extendSuccess,
  } = useSelector((state) => state.licenses.extendByPay);

  const cartItems = useSelector((state) => state.cart.items);

  const [flip, setFlip] = useState(false);
  const [cardData, setCardData] = useState({
    userName: "",
    cardNumber: "",
    month: "",
    year: "",
    cvv: "",
  });

  const total = useMemo(
    () => cartItems.reduce((acc, it) => acc + parseFloat(it.price || 0), 0),
    [cartItems],
  );

  const cardNumberDigits = cardData.cardNumber.replace(/\D/g, "");
  const cardNumberFilled = cardNumberDigits.length === 16;
  const cardNumberValid =
    cardNumberFilled && isValidCardNumber(cardData.cardNumber);
  const showCardError = cardNumberFilled && !cardNumberValid;

  function handleSubmit(e) {
    e.preventDefault();
    if (addLoading || extendLoading) return;

    const { userName, cardNumber, month, year, cvv } = cardData;

    const addLicenseBasket = cartItems.reduce((result, item) => {
      const existing = result.find(
        (r) => r.restaurantId === item.restaurantId,
      );
      if (existing) {
        existing.licensePackageIds.push(item.id);
      } else {
        result.push({
          restaurantId: item.restaurantId,
          licensePackageIds: [item.id],
        });
      }
      return result;
    }, []);

    const { id: licensePackageId, restaurantId } = cartItems[0];
    const faturaBilgileri = userInvData || {};
    const extendLicenseBasket = {
      licensePackageId,
      restaurantId,
      licenseId: currentLicense?.id,
      faturaBilgileri,
    };
    const newLicenseBasket = {
      items: addLicenseBasket,
      faturaBilgileri,
    };

    const data = {
      userBasket: isPageExtend
        ? JSON.stringify(extendLicenseBasket)
        : JSON.stringify(newLicenseBasket),
      ccOwner: userName,
      cardNumber: cardNumber.replace(/\D/g, ""),
      expiryMonth: month,
      expiryYear: year,
      cvv,
      userAddress: userInvData?.address || "",
    };

    if (isPageExtend) {
      dispatch(extendByOnlinePay(data));
    } else {
      dispatch(addByOnlinePay(data));
    }
  }

  // ADD TOAST
  useEffect(() => {
    if (addLoading) {
      toastId.current = toast.loading("Loading...");
    }
    if (addSuccess) {
      setStep(5);
      toast.remove(toastId.current);
      dispatch(clearCart());
      return;
    }
    if (addError) {
      setStep(6);
      setPaymentStatus("failure");
      toast.remove(toastId.current);
      dispatch(resetAddByOnlinePay());
      dispatch(clearCart());
    }
  }, [addLoading, addSuccess, addError, dispatch]);

  // EXTEND TOAST
  useEffect(() => {
    if (extendLoading) {
      toastId.current = toast.loading("Loading...");
    }
    if (extendSuccess) {
      setStep(4);
      toast.remove(toastId.current);
      dispatch(clearCart());
      return;
    }
    if (extendError) {
      setStep(5);
      setPaymentStatus("failure");
      toast.remove(toastId.current);
      dispatch(resetExtendByOnlinePay());
      dispatch(clearCart());
    }
  }, [extendLoading, extendSuccess, extendError, dispatch]);

  // LOADING ANIMATION
  useEffect(() => {
    if (addLoading || extendLoading) {
      setPopupContent(<PaymentLoader />);
    } else setPopupContent(null);
  }, [addLoading, extendLoading]);

  const handleCardNumberChange = (e) => {
    const formatted = e.target.value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
    setCardData((p) => ({ ...p, cardNumber: formatted }));
  };

  const handleMonthChange = (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 2);
    if (parseInt(v, 10) > 12) v = "12";
    setCardData((p) => ({ ...p, month: v }));
  };

  const handleYearChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 2);
    setCardData((p) => ({ ...p, year: v }));
  };

  const handleCvvChange = (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardData((p) => ({ ...p, cvv: v }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-4 sm:px-5 pt-4 pb-3 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 lg:items-start">
        {/* Card preview column */}
        <div className="flex flex-col items-center gap-3 lg:sticky lg:top-2">
          <PaymentCard flip={flip} cardData={cardData} />
          <div className="flex items-center gap-1.5 text-[11px] text-[--gr-1]">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>{t("payment.ssl_protected")}</span>
          </div>
        </div>

        {/* Form column */}
        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex items-start gap-3">
            <div
              className="grid place-items-center size-10 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <CreditCard className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[--black-1] leading-tight">
                {t("payment.title")}
              </h2>
              <p className="mt-0.5 text-xs text-[--gr-1]">
                {t("payment.subtitle")}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Field
              id="card-holder"
              icon={User}
              label={t("payment.card_holder")}
            >
              <input
                id="card-holder"
                type="text"
                required
                maxLength={30}
                value={cardData.userName}
                onChange={(e) =>
                  setCardData((p) => ({
                    ...p,
                    userName: e.target.value.toLocaleUpperCase("tr"),
                  }))
                }
                onFocus={() => setFlip(false)}
                placeholder={t("payment.card_holder_placeholder")}
                className={`${inputClass} uppercase`}
              />
            </Field>

            <Field
              id="card-number"
              icon={CreditCard}
              label={t("payment.card_number")}
              error={showCardError ? t("payment.invalid_card") : null}
            >
              <input
                id="card-number"
                type="text"
                inputMode="numeric"
                required
                maxLength={19}
                value={cardData.cardNumber}
                onChange={handleCardNumberChange}
                onFocus={() => setFlip(false)}
                placeholder="0000 0000 0000 0000"
                className={`${inputClass} tabular-nums tracking-wider ${
                  showCardError
                    ? "!border-rose-300 focus:!border-rose-500 focus:!ring-rose-100"
                    : ""
                }`}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                id="card-expiry"
                icon={Calendar}
                label={t("payment.expiry")}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={2}
                    value={cardData.month}
                    onChange={handleMonthChange}
                    onFocus={() => setFlip(false)}
                    placeholder="AA"
                    className={`${inputClass} text-center tabular-nums`}
                  />
                  <span className="text-[--gr-1]">/</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={2}
                    value={cardData.year}
                    onChange={handleYearChange}
                    onFocus={() => setFlip(false)}
                    placeholder="YY"
                    className={`${inputClass} text-center tabular-nums`}
                  />
                </div>
              </Field>

              <Field id="card-cvv" icon={Lock} label={t("payment.cvv")}>
                <input
                  id="card-cvv"
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={4}
                  value={cardData.cvv}
                  onChange={handleCvvChange}
                  onFocus={() => setFlip(true)}
                  onBlur={() => setFlip(false)}
                  placeholder="123"
                  className={`${inputClass} text-center tabular-nums`}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
              {t("addLicense.total")}
            </p>
            <p className="text-lg sm:text-xl font-black text-[--black-1] tabular-nums">
              {formatPrice(total)} ₺
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setStep(step - (isPageExtend ? 1 : 2))}
            disabled={addLoading || extendLoading}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition disabled:opacity-50"
          >
            <ArrowLeft className="size-4" />
            {t("addLicense.back")}
          </button>
          <button
            type="submit"
            disabled={addLoading || extendLoading || showCardError}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Sparkles className="size-4" />
            {t("payment.pay_now")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <PayTRForm cardData={cardData} />
    </form>
  );
};

export default OnlinePayment;

// ====== Helpers ======

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-2 focus:ring-indigo-100 text-sm";

const Field = ({ id, icon: Icon, label, error, children }) => (
  <div>
    <label
      htmlFor={id}
      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1"
    >
      {Icon && <Icon className="size-3" />}
      {label}
      {error && (
        <span className="ml-auto text-rose-600 normal-case tracking-normal text-[11px] font-medium">
          {error}
        </span>
      )}
    </label>
    {children}
  </div>
);
