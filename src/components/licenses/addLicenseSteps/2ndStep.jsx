//MODULES
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CreditCard,
  Landmark,
  ShoppingCart,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";

//FUNC
import { formatPrice, groupedLicensePackages } from "../../../utils/utils";
import { getLicenseTypeLabel } from "../../../enums/licenseTypeEnums";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const SecondStep = ({
  step,
  setStep,
  setSteps,
  paymentMethod,
  setPaymentMethod,
}) => {
  const { t } = useTranslation();
  const cartItems = useSelector((state) => state.cart.items);
  const [licensePackagesData, setLicensePackagesData] = useState();

  function handleSubmit(e) {
    e.preventDefault();
    setStep(3 + 1);
  }

  useEffect(() => {
    if (cartItems) {
      setLicensePackagesData(groupedLicensePackages(cartItems));
    }
  }, [cartItems]);

  useEffect(() => {
    if (paymentMethod.selectedOption.id === 0 && step == 2) {
      setSteps(6);
    }
  }, [step]);

  const total = cartItems.reduce(
    (acc, item) => acc + parseFloat(item.price),
    0,
  );

  const methodMeta = {
    onlinePayment: {
      icon: CreditCard,
      title: t("addLicense.online_payment"),
      desc: t("addLicense.online_payment_desc"),
    },
    bankPayment: {
      icon: Landmark,
      title: t("addLicense.bank_payment"),
      desc: t("addLicense.bank_payment_desc"),
    },
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-4 sm:px-5 pt-5 pb-4 space-y-5">
        {/* PAYMENT METHOD SELECTION */}
        <div>
          <div className="mb-3">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
              <Wallet className="size-3.5" />
              {t("addLicense.payment_method")}
            </label>
            <p className="mt-1 text-xs text-[--gr-1]">
              {t("addLicense.payment_method_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentMethod.options.map((option) => {
              const meta = methodMeta[option.value] || {
                icon: Wallet,
                title: option.label,
                desc: "",
              };
              const Icon = meta.icon;
              const isSelected =
                option.value === paymentMethod.selectedOption.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPaymentMethod((prev) => ({
                      ...prev,
                      selectedOption: option,
                    }));
                    setSteps(6);
                  }}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? "border-[--primary-1] bg-[--primary-1]/5 ring-2 ring-[--primary-1]/30"
                      : "border-[--border-1] bg-[--white-1] hover:border-[--primary-1]/50 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`grid place-items-center size-10 shrink-0 rounded-lg transition ${
                        isSelected
                          ? "text-white shadow-md shadow-indigo-500/20"
                          : "bg-[--primary-1]/10 text-[--primary-1]"
                      }`}
                      style={
                        isSelected
                          ? { background: PRIMARY_GRADIENT }
                          : undefined
                      }
                    >
                      <Icon className="size-5" strokeWidth={2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          isSelected
                            ? "text-[--primary-1]"
                            : "text-[--black-1]"
                        }`}
                      >
                        {meta.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[--gr-1] leading-snug">
                        {meta.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CART SUMMARY */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
            <ShoppingCart className="size-3.5" />
            {t("addLicense.cart_summary")}
            <span className="ml-auto inline-flex items-center px-1.5 rounded-full bg-[--primary-1]/15 text-[--primary-1] tabular-nums">
              {cartItems.length}
            </span>
          </label>

          <div className="rounded-xl border border-[--border-1] overflow-hidden divide-y divide-[--border-1]">
            {licensePackagesData?.map((group, gi) => (
              <div key={gi}>
                <div className="px-3.5 py-2 bg-[--white-2] flex items-center gap-2">
                  <Sparkles
                    className="size-3.5 text-[--primary-1]"
                    strokeWidth={2.5}
                  />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[--black-1]">
                    {getLicenseTypeLabel(group[0]?.licensePackageType)}
                  </h4>
                </div>
                <ul className="divide-y divide-[--border-1]">
                  {group.map((pkg) => {
                    const isYearly = pkg.timeId == 1;
                    return (
                      <li
                        key={`${pkg.id}-${pkg.restaurantId}`}
                        className="flex items-center gap-3 px-3.5 py-2.5"
                      >
                        <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-[--primary-1]/10 text-[--primary-1]">
                          <Store className="size-4" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[--black-1] truncate">
                            {pkg.restaurantName}
                          </p>
                          <p className="text-[11px] text-[--gr-1]">
                            {pkg.time}{" "}
                            {isYearly
                              ? t("addLicense.yearly")
                              : t("addLicense.monthly")}
                            {pkg.description ? ` · ${pkg.description}` : ""}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-[--black-1] tabular-nums shrink-0">
                          {formatPrice(pkg.price)} ₺
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
            {t("addLicense.total")}
          </p>
          <p className="text-lg sm:text-xl font-black text-[--black-1] tabular-nums">
            {formatPrice(total)} ₺
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition"
          >
            <ArrowLeft className="size-4" />
            {t("addLicense.back")}
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {t("addLicense.continue")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </form>
  );
};

export default SecondStep;
