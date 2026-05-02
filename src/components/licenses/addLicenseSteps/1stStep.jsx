//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  Info,
  Package,
  Sparkles,
  Store,
} from "lucide-react";

//COMP
import CustomSelect from "../../common/customSelector";

//UTILS
import {
  formatToPrice,
  formatSelectorData,
  groupedLicensePackages,
} from "../../../utils/utils";
import { getLicenseTypeLabel } from "../../../enums/licenseTypeEnums";

//REDUX
import {
  getLicensePackages,
  resetGetLicensePackages,
} from "../../../redux/licensePackages/getLicensePackagesSlice";
import { getRestaurants } from "../../../redux/restaurants/getRestaurantsSlice";
import {
  getRestaurantLicenses,
  resetGetRestaurantLicenses,
} from "../../../redux/licenses/getRestaurantLicensesSlice";
import {
  addItemToCart,
  removeItemFromCart,
} from "../../../redux/cart/cartSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const FirstStep = ({
  setStep,
  restaurant,
  restaurantData,
  setRestaurantData,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { success, licensePackages } = useSelector(
    (state) => state.licensePackages.getLicensePackages,
  );
  const { restaurants } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );
  const { restaurantLicenses } = useSelector(
    (state) => state.licenses.getRestaurantLicenses,
  );

  const cartItems = useSelector((state) => state.cart.items);

  const [restaurantsData, setRestaurantsData] = useState(null);
  const [licensePackagesData, setLicensePackagesData] = useState(null);

  function getTotalPrice() {
    const result = cartItems.reduce(
      (acc, item) => acc + parseFloat(item.price),
      0,
    );
    return formatToPrice(result);
  }

  // GET LICENSE PACKAGES
  useEffect(() => {
    if (!licensePackagesData) {
      dispatch(getLicensePackages());
    }
  }, [licensePackagesData]);

  // SET PACKAGES
  useEffect(() => {
    if (success) {
      const updatedData = licensePackages.data
        .filter((P) => P.isActive)
        .map((pkg) => ({ ...pkg, price: pkg.userPrice }));
      setLicensePackagesData(groupedLicensePackages(updatedData));
      dispatch(resetGetLicensePackages());
    }
  }, [success]);

  // GET RESTAURANTS
  useEffect(() => {
    if (!restaurant && !restaurantsData) {
      dispatch(getRestaurants({}));
    }
  }, [restaurant, restaurantsData]);

  // SET RESTAURANTS
  useEffect(() => {
    if (restaurants) {
      setRestaurantsData(formatSelectorData(restaurants.data, false));
    }
  }, [restaurants]);

  // FETCH RESTAURANT LICENSES (so we can warn for duplicates)
  useEffect(() => {
    if (restaurantData?.id) {
      dispatch(getRestaurantLicenses({ restaurantId: restaurantData.id }));
    } else {
      dispatch(resetGetRestaurantLicenses());
    }
  }, [restaurantData?.id, dispatch]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!cartItems?.length) {
      toast.error(t("addLicense.cart_empty"), { id: "add-licese" });
      return;
    }
    setStep(2);
  }

  const handleAddToCart = (pkg) => {
    if (!pkg.restaurantId) {
      toast.error(t("addLicense.choose_restaurant_first"), {
        id: "choose_restaurant",
      });
      return;
    }

    const existingPackage = cartItems.find(
      (item) =>
        item.licenseTypeId === pkg.licenseTypeId &&
        item.restaurantId === pkg.restaurantId,
    );

    if (existingPackage) {
      dispatch(
        removeItemFromCart({
          id: existingPackage.id,
          restaurantId: pkg.restaurantId,
        }),
      );
      if (
        existingPackage.id === pkg.id &&
        existingPackage.restaurantId == pkg.restaurantId
      )
        return;
    }

    if (cartItems.some((C) => C.isCourier) && pkg.isCourier) {
      toast.error(t("addLicense.duplicate_courier"), { id: "isCourier" });
      return;
    }

    // Restoranın bu tip aktif (süresi dolmamış) lisansı zaten var mı?
    const existingLicenses = Array.isArray(restaurantLicenses)
      ? restaurantLicenses
      : restaurantLicenses?.data || [];
    const now = Date.now();
    const hasSameType = existingLicenses.some((lic) => {
      if (lic.licenseTypeId !== pkg.licenseTypeId) return false;
      if (lic.isActive === false) return false;
      const end = lic.endDateTime ? new Date(lic.endDateTime).getTime() : 0;
      return end > now;
    });
    if (hasSameType) {
      toast.error(
        t("addLicense.already_has_license", {
          type: pkg.licensePackageType,
        }),
        { id: "already-has-license" },
      );
      return;
    }

    dispatch(addItemToCart(pkg));
    toast.success(
      t("addLicense.added_to_cart", {
        time: pkg.time,
        period:
          pkg.timeId == 1 ? t("addLicense.yearly") : t("addLicense.monthly"),
      }),
      { id: "add-licese" },
    );
  };

  const restaurantSelected = Boolean(restaurantData?.id);
  const cartCount = cartItems.length;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-4 sm:px-5 pt-5 pb-4 space-y-5">
        {/* Restaurant section */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
            <Store className="size-3.5" />
            {t("addLicense.restaurant_section_label")}
          </label>
          <CustomSelect
            required
            className="text-sm"
            value={restaurantData}
            disabled={Boolean(restaurant)}
            options={restaurantsData}
            onChange={setRestaurantData}
            placeholder={t("addLicense.select_restaurant")}
          />
        </div>

        {/* Packages section */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
            <Package className="size-3.5" />
            {t("addLicense.package_section_label")}
          </label>

          {!restaurantSelected ? (
            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3 text-xs text-amber-700 flex items-start gap-2">
              <Info className="size-4 shrink-0 mt-0.5" />
              <span>{t("addLicense.select_restaurant_first")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {licensePackagesData?.map((group, gi) => (
                <PackageGroup
                  key={gi}
                  group={group}
                  cartItems={cartItems}
                  restaurantData={restaurantData}
                  onSelect={handleAddToCart}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer: total + continue */}
      <div className="sticky bottom-0 z-10 border-t border-[--border-1] bg-[--white-1]/95 backdrop-blur-sm px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
            {t("addLicense.total")}
            {cartCount > 0 && (
              <span className="ml-1.5 inline-flex items-center px-1.5 rounded-full bg-[--primary-1]/15 text-[--primary-1] tabular-nums">
                {cartCount}
              </span>
            )}
          </p>
          <p className="text-lg sm:text-xl font-black text-[--black-1] tabular-nums">
            {getTotalPrice()} ₺
          </p>
        </div>
        <button
          type="submit"
          disabled={!cartCount}
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

// ====== Package group ======

const PackageGroup = ({ group, cartItems, restaurantData, onSelect, t }) => {
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-2">
        {group.map((pkg) => {
          const isSelected = cartItems.some(
            (item) =>
              item.id === pkg.id && item.restaurantId === restaurantData?.id,
          );
          const isYearly = pkg.timeId == 1;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() =>
                onSelect({
                  ...pkg,
                  restaurantId: restaurantData.id,
                  restaurantName: restaurantData.label,
                })
              }
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
