//MOD
import toast from "react-hot-toast";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  CreditCard,
  Info,
  Landmark,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from "lucide-react";

//FUNC
import {
  formatToPrice,
  groupedLicensePackages,
} from "../../../utils/utils";
import { getLicenseTypeLabel } from "../../../enums/licenseTypeEnums";

// REDUX
import {
  getLicensePackages,
  resetGetLicensePackages,
} from "../../../redux/licensePackages/getLicensePackagesSlice";
import {
  addItemToCart,
  removeItemFromCart,
} from "../../../redux/cart/cartSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const FirstStep = ({
  setStep,
  paymentMethod,
  restaurantData,
  setPaymentMethod,
  setRestaurantData,
  licensePackageData,
  setLicensePackageData,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const location = useLocation();
  const { currentLicense, restaurant } = location?.state || {};
  const { restaurantName, restaurantId, userId } = currentLicense || {};

  const { success, licensePackages } = useSelector(
    (state) => state.licensePackages.getLicensePackages,
  );
  const cartItems = useSelector((state) => state.cart.items);

  const [packagesData, setPackagesData] = useState(null);

  // GET LICENSE PACKAGES
  useEffect(() => {
    if (!packagesData) {
      dispatch(getLicensePackages());
    }
  }, [packagesData]);

  // SET PACKAGES (grouped)
  useEffect(() => {
    if (success && licensePackages?.data) {
      const updated = licensePackages.data
        .filter((p) => p.isActive)
        .map((p) => ({ ...p, price: p.userPrice }));
      setPackagesData(groupedLicensePackages(updated));
      dispatch(resetGetLicensePackages());
    }
  }, [success]);

  // SET RESTAURANT DATA from current license
  useEffect(() => {
    if ((restaurantId || restaurant) && !restaurantData?.value) {
      if (restaurant) {
        setRestaurantData({
          label: restaurant.name,
          value: restaurant.id,
          userId: restaurant.userId,
        });
      } else {
        setRestaurantData({
          label: restaurantName,
          value: restaurantId,
          userId,
        });
      }
    }
  }, [restaurantId, restaurant, restaurantData]);

  const total = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + parseFloat(it.price || 0), 0);
  }, [cartItems]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!cartItems.length) {
      toast.error(t("addLicense.cart_empty"), { id: "extend-empty" });
      return;
    }
    setStep(2);
  }

  const handleSelectPackage = (pkg) => {
    if (!restaurantData?.value) {
      toast.error(t("addLicense.choose_restaurant_first"), {
        id: "choose_restaurant",
      });
      return;
    }

    // Same licenseTypeId for the same restaurant: toggle / replace
    const existing = cartItems.find(
      (it) =>
        it.licenseTypeId === pkg.licenseTypeId &&
        it.restaurantId === restaurantData.value,
    );
    if (existing) {
      dispatch(
        removeItemFromCart({
          id: existing.id,
          restaurantId: existing.restaurantId,
        }),
      );
      // Toggle off when re-clicking the same package
      if (existing.id === pkg.id) return;
    }

    dispatch(
      addItemToCart({
        ...pkg,
        restaurantId: restaurantData.value,
        restaurantName: restaurantData.label,
      }),
    );
    setLicensePackageData(pkg);
  };

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
      <div className="px-4 sm:px-5 pt-4 pb-3 space-y-4">
        {/* Current license / restaurant info */}
        <div className="rounded-xl border border-[--border-1] bg-[--primary-1]/5 px-4 py-3 flex items-center gap-3">
          <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-[--primary-1]/15 text-[--primary-1]">
            <Store className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
              {t("extendLicense.current_license")}
            </p>
            <p className="text-sm font-bold text-[--black-1] truncate">
              {restaurantData?.label || restaurantName || "—"}
            </p>
          </div>
        </div>

        {/* Packages */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
            <Package className="size-3.5" />
            {t("extendLicense.package_section_label")}
          </label>

          {!packagesData?.length ? (
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>{t("extendLicense.no_packages")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {packagesData.map((group, gi) => (
                <PackageGroup
                  key={gi}
                  group={group}
                  cartItems={cartItems}
                  onSelect={handleSelectPackage}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
            <Wallet className="size-3.5" />
            {t("addLicense.payment_method")}
          </label>
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
                  onClick={() =>
                    setPaymentMethod((prev) => ({
                      ...prev,
                      selectedOption: option,
                    }))
                  }
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
                        isSelected ? { background: PRIMARY_GRADIENT } : undefined
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
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
            {t("addLicense.total")}
          </p>
          <p className="text-lg sm:text-xl font-black text-[--black-1] tabular-nums">
            {formatToPrice(total.toFixed(2).replace(".", ","))} ₺
          </p>
        </div>
        <button
          type="submit"
          disabled={!cartItems.length}
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

export default FirstStep;

// ====== Package group (single-select) ======

const PackageGroup = ({ group, cartItems, onSelect, t }) => {
  return (
    <div className="rounded-xl border border-[--border-1] overflow-hidden">
      <div
        className="px-3.5 py-2 flex items-center gap-2"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <span className="grid place-items-center size-6 rounded-md bg-white/15 ring-1 ring-white/25">
          <Sparkles className="size-3 text-white" strokeWidth={2.5} />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">
          {getLicenseTypeLabel(group[0]?.licensePackageType)}
        </h3>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-2 p-2">
        {group.map((pkg) => {
          const isSelected = cartItems.some((item) => item.id === pkg.id);
          const isYearly = pkg.timeId == 1;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => onSelect(pkg)}
              className={`group relative text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? "border-[--primary-1] bg-[--primary-1]/5 ring-2 ring-[--primary-1]/30"
                  : "border-[--border-1] bg-[--white-1] hover:border-[--primary-1]/50 hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <span
                  className="absolute top-1.5 right-1.5 grid place-items-center size-5 rounded-full text-white shadow-md"
                  style={{ background: PRIMARY_GRADIENT }}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              )}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[--black-1] leading-none tabular-nums">
                  {pkg.time}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
                  {isYearly ? t("addLicense.yearly") : t("addLicense.monthly")}
                </span>
              </div>
              <p
                className={`mt-1 text-base font-bold tabular-nums ${
                  isSelected ? "text-[--primary-1]" : "text-[--black-1]"
                }`}
              >
                {pkg.price} ₺
              </p>
              {pkg.description && (
                <p className="mt-1 text-[10px] text-[--gr-1] leading-snug line-clamp-2">
                  {pkg.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
