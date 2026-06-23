// MODULES
import { Fragment, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, ChevronRight, Sparkles } from "lucide-react";

//COMP
import StepFrame from "../../common/stepFrame";
import PaymentTypes from "../../../enums/paymentTypes";

//STEPS
import FirstStep from "../extendLicenseSteps/1stStep";
import SecondStep from "../extendLicenseSteps/2ndStep";
import ThirdStep from "../extendLicenseSteps/3rdStep";
import FourthStep from "../extendLicenseSteps/4thStep";
import FifthStep from "../extendLicenseSteps/5thStep";

//REDUX
import { clearCart } from "../../../redux/cart/cartSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";
const SUCCESS_GRADIENT = "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)";

const ExtendLicensePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, restaurant } = location.state || {};
  const currentPath = location.pathname;

  const cartItems = useSelector((state) => state.cart.items);

  const [step, setStep] = useState(1);
  const [steps] = useState(5);
  const [userData, setUserData] = useState(null);
  const [userInvData, setUserInvData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [restaurantData, setRestaurantData] = useState({
    label: t("addLicense.select_restaurant"),
  });
  const [licensePackageData, setLicensePackageData] = useState({
    value: null,
    label: t("extendLicense.package_section_label"),
    id: null,
    time: null,
  });
  const [paymentMethod, setPaymentMethod] = useState({
    selectedOption: PaymentTypes[0],
    options: PaymentTypes,
  });

  // CLEAR CART on unmount
  useEffect(() => {
    return () => {
      if (cartItems) dispatch(clearCart());
    };
  }, []);

  const handleBack = () => navigate(currentPath.replace("/extend-license", ""));

  const stepLabels = [
    t("extendLicense.step_1"),
    t("extendLicense.step_2"),
    t("extendLicense.step_3"),
    t("extendLicense.step_4"),
    t("extendLicense.step_5"),
  ];

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] section_row">
      {/* BREADCRUMB */}
      <nav className="flex flex-wrap items-center gap-1 text-xs text-[--gr-1] pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 hover:text-[--primary-1] transition"
        >
          <ArrowLeft className="size-3.5" />
          {t("addLicense.back")}
        </button>
        <ChevronRight className="size-3 text-[--gr-1]/60" />
        {currentPath.includes("users") && (
          <>
            <span className="text-[--gr-1]">
              {user?.fullName || t("addLicense.breadcrumb_users")}
            </span>
            <ChevronRight className="size-3 text-[--gr-1]/60" />
          </>
        )}
        {currentPath.includes("restaurants") && (
          <>
            <span className="text-[--gr-1]">
              {restaurant?.name || t("addLicense.breadcrumb_restaurants")}
            </span>
            <ChevronRight className="size-3 text-[--gr-1]/60" />
          </>
        )}
        <span className="text-[--gr-1]">
          {t("addLicense.breadcrumb_root")}
        </span>
        <ChevronRight className="size-3 text-[--gr-1]/60" />
        <span className="font-semibold text-[--black-1]">
          {t("extendLicense.breadcrumb_current")}
        </span>
      </nav>

      {/* HERO HEADER */}
      <header className="flex items-start gap-3 sm:gap-4 mt-4 mb-6">
        <div
          className="grid place-items-center size-11 sm:size-12 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Sparkles className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[--black-1] leading-tight">
            {t("extendLicense.title")}
          </h1>
          <p className="mt-1 text-sm text-[--gr-1]">
            {t("extendLicense.subtitle")}
          </p>
        </div>
      </header>

      {/* STEP INDICATOR */}
      <StepIndicator step={step} totalSteps={steps} labels={stepLabels} />

      {/* STEP CONTAINER */}
      <div className="mt-6 bg-[--white-1] border border-[--border-1] rounded-2xl shadow-sm overflow-hidden">
        <div className="w-full">
          <StepFrame
            step={step}
            steps={steps}
            component={[
              <FirstStep
                key={0}
                setStep={setStep}
                paymentMethod={paymentMethod}
                restaurantData={restaurantData}
                setPaymentMethod={setPaymentMethod}
                setRestaurantData={setRestaurantData}
                licensePackageData={licensePackageData}
                setLicensePackageData={setLicensePackageData}
              />,
              <SecondStep
                key={1}
                step={step}
                setStep={setStep}
                userData={userData}
                setUserData={setUserData}
                userInvData={userInvData}
                setUserInvData={setUserInvData}
              />,
              <ThirdStep
                key={2}
                step={step}
                setStep={setStep}
                userData={userData}
                userInvData={userInvData}
                paymentMethod={paymentMethod}
              />,
              <FourthStep
                key={3}
                step={step}
                user={userData}
                setStep={setStep}
                paymentMethod={paymentMethod}
                setPaymentStatus={setPaymentStatus}
                userInvData={userInvData}
              />,
              <FifthStep
                key={4}
                step={step}
                paymentMethod={paymentMethod}
                paymentStatus={paymentStatus}
              />,
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default ExtendLicensePage;

// ====== Modern Step Indicator (mirror of AddLicensePage) ======

const StepIndicator = ({ step, totalSteps, labels }) => {
  return (
    <div className="flex items-start gap-1 sm:gap-2 px-1">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const num = i + 1;
        const completed = step > num;
        const active = step === num;
        const isLast = i === totalSteps - 1;
        return (
          <Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`grid place-items-center size-8 sm:size-9 rounded-full text-xs font-bold transition-all ${
                  completed
                    ? "text-white shadow-md shadow-emerald-500/20"
                    : active
                      ? "text-white shadow-md shadow-indigo-500/30 ring-4 ring-[--primary-1]/15"
                      : "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]"
                }`}
                style={
                  completed
                    ? { background: SUCCESS_GRADIENT }
                    : active
                      ? { background: PRIMARY_GRADIENT }
                      : undefined
                }
              >
                {completed ? (
                  <Check className="size-4" strokeWidth={3} />
                ) : (
                  num
                )}
              </div>
              {labels?.[i] && (
                <span
                  className={`hidden sm:block text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${
                    active
                      ? "text-[--primary-1]"
                      : completed
                        ? "text-emerald-600"
                        : "text-[--gr-1]"
                  }`}
                >
                  {labels[i]}
                </span>
              )}
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mt-4 sm:mt-[18px] rounded-full bg-[--white-2] overflow-hidden ring-1 ring-[--border-1] min-w-2">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: completed ? "100%" : "0%",
                    background: SUCCESS_GRADIENT,
                  }}
                />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
};
