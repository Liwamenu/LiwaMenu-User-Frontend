//MODULES
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Monitor,
  QrCode,
  ReceiptText,
  Sparkles,
  Store,
} from "lucide-react";

//COMP
import { usePopup } from "../../../context/PopupContext";
import CustomFileInput from "../../common/customFileInput";
import { groupByRestaurantId } from "../../../utils/utils";
import { buildLicenseBasket } from "./buildLicenseBasket";
import { PaymentLoader } from "../stepsAssets/paymentLoader";
import { getLicenseTypeLabel } from "../../../enums/licenseTypeEnums";

//REDUX
import {
  createReceiptLicensePayment,
  resetCreateReceiptLicensePayment,
} from "../../../redux/payments/createReceiptLicensePaymentSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const LICENSE_TYPE_ICONS = {
  QRLicensePackage: QrCode,
  TVLicensePackage: Monitor,
};

const getLicenseMeta = (item) => ({
  label: getLicenseTypeLabel(item?.licensePackageType),
  Icon: LICENSE_TYPE_ICONS[item?.licensePackageType] || Sparkles,
});

const BankPayment = ({ step, setStep, setPaymentStatus, userInvData }) => {
  const { t } = useTranslation();
  const toastId = useRef();
  const dispatch = useDispatch();
  const location = useLocation();
  const { setPopupContent } = usePopup();
  const pathArray = location.pathname.split("/");
  const actionType = pathArray[pathArray.length - 1];
  const { currentLicense } = location?.state || {};
  const isPageExtend = actionType === "extend-license";

  const cartItems = useSelector((state) => state.cart.items);

  const { error, loading, success } = useSelector(
    (state) => state.payments.createReceiptLicensePayment,
  );

  const [doc, setDoc] = useState("");
  const [explanation, setExplanation] = useState("");
  const licensePackageData = groupByRestaurantId(cartItems);

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    // Unified basket shape — see buildLicenseBasket.js for the contract.
    // Both add + extend flows produce the same structure, so adding a
    // new field is a single-place edit there.
    const basket = buildLicenseBasket({
      cartItems,
      currentLicense,
      faturaBilgileri: userInvData,
      isExtend: isPageExtend,
    });

    const formData = new FormData();
    formData.append("Basket", JSON.stringify(basket));
    formData.append("Type", basket.type);
    formData.append("Receipt", doc);

    dispatch(createReceiptLicensePayment(formData));
  }

  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading("Loading...", { id: "bankPayment" });
    }
    if (success) {
      if (isPageExtend) {
        setStep(5);
      } else {
        setStep(6);
      }
      toast.remove(toastId.current);
      setPaymentStatus("success");
      dispatch(resetCreateReceiptLicensePayment());
    }
    if (error) {
      setStep(5);
      toast.remove(toastId.current);
      setPaymentStatus("failure");
      dispatch(resetCreateReceiptLicensePayment());
    }
  }, [loading, success, error]);

  useEffect(() => {
    if (loading) {
      setPopupContent(<PaymentLoader type={1} />);
    } else setPopupContent(null);
  }, [loading]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-4 sm:px-5 pt-5 pb-4 space-y-5">
        {/* Summary */}
        <div className="rounded-xl border border-[--border-1] bg-[--white-2]/30 overflow-hidden">
          <div className="px-4 py-3 bg-[--primary-1]/10 border-b border-[--border-1]">
            <p className="text-xs text-[--black-1]">
              {t("addLicense.after_check_msg")}
            </p>
          </div>
          <div className="divide-y divide-[--border-1]">
            {licensePackageData?.map((pkg, i) => (
              <div key={i} className="px-4 py-3">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[--black-1]">
                  <Store className="size-4 text-[--primary-1] shrink-0" />
                  <span className="truncate">{pkg[0].restaurantName}</span>
                </p>
                <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 pl-5">
                  {pkg.map((item, j) => {
                    const isYearly = item.timeId == 1;
                    const { label, Icon } = getLicenseMeta(item);
                    return (
                      <li
                        key={j}
                        className="inline-flex items-center gap-1.5 text-xs text-[--gr-1]"
                      >
                        <Icon className="size-3 text-[--primary-1]" />
                        <span className="text-[--black-1] font-medium">
                          {label}
                        </span>
                        <span>·</span>
                        <span>
                          {item.time}{" "}
                          {isYearly
                            ? t("addLicense.yearly")
                            : t("addLicense.monthly")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Note input */}
        <div>
          <label
            htmlFor="bp-note"
            className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5"
          >
            {t("addLicense.note_label")}
          </label>
          <input
            id="bp-note"
            type="text"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder={t("addLicense.note_placeholder")}
            className="w-full h-11 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100 text-sm"
          />
        </div>

        {/* Receipt upload */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
            <ReceiptText className="size-3.5" />
            {t("addLicense.upload_receipt")}
          </label>
          <CustomFileInput
            className="!h-28 !p-3 !rounded-xl !border-[--border-1] hover:!border-[--primary-1]"
            value={doc}
            onChange={setDoc}
            msg={t("addLicense.upload_receipt_msg")}
            accept={"image/png, image/jpeg, application/pdf"}
            required={!doc}
            editIfImage={false}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="size-4" />
          {t("addLicense.back")}
        </button>
        <button
          type="submit"
          disabled={loading || !doc}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {t("addLicense.continue")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
};

export default BankPayment;
