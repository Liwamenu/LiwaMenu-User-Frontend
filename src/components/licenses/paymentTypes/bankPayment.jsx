//MODULES
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

//COMP
import CustomInput from "../../common/customInput";
import BackButton from "../stepsAssets/backButton";
import { usePopup } from "../../../context/PopupContext";
import ForwardButton from "../stepsAssets/forwardButton";
import CustomFileInput from "../../common/customFileInput";
import { groupByRestaurantId } from "../../../utils/utils";
import { PaymentLoader } from "../stepsAssets/paymentLoader";

//IMAGES
import Getiryemek from "../../../assets/img/packages/Getiryemek.png";
import MigrosYemek from "../../../assets/img/packages/MigrosYemek.png";
import Siparisim from "../../../assets/img/packages/Siparisim.png";
import TrendyolYemek from "../../../assets/img/packages/TrendyolYemek.png";
import GoFody from "../../../assets/img/packages/GoFody.png";
import Yemeksepeti from "../../../assets/img/packages/Yemeksepeti.png";
import Autoronics from "../../../assets/img/packages/Autoronics.png";

//REDUX
import { clearCart } from "../../../redux/cart/cartSlice";
import {
  addByBankPay,
  resetAddByBankPay,
} from "../../../redux/licenses/addLicense/addByBankPaySlice";
import {
  extendByBankPay,
  resetExtendByBankPay,
} from "../../../redux/licenses/extendLicense/extendByBankPaySlice";
import {
  createReceiptLicensePayment,
  resetCreateReceiptLicensePayment,
} from "../../../redux/payments/createReceiptLicensePaymentSlice";

const imageSRCs = [
  { src: Getiryemek, name: "Getiryemek" },
  { src: MigrosYemek, name: "MigrosYemek" },
  { src: TrendyolYemek, name: "TrendyolYemek" },
  { src: Yemeksepeti, name: "Yemeksepeti" },
  { src: GoFody, name: "GoFody" },
  { src: Siparisim, name: "Siparisim" },
  { src: Autoronics, name: "Autoronics" },
];

const BankPayment = ({ user, step, setStep, setPaymentStatus }) => {
  const toastId = useRef();
  const dispatch = useDispatch();
  const location = useLocation();
  const { setPopupContent } = usePopup();
  const pathArray = location.pathname.split("/");
  const actionType = pathArray[pathArray.length - 1];
  const { currentLicense } = location?.state || {};

  const isPageExtend = actionType === "extend-license";

  const cartItems = useSelector((state) => state.cart.items);

  // const {
  //   error: addError,
  //   loading: addLoading,
  //   success: addSuccess,
  // } = useSelector((state) => state.licenses.addByBank);

  // const {
  //   error: extendError,
  //   loading: extendLoading,
  //   success: extendSuccess,
  // } = useSelector((state) => state.licenses.extendByBank);

  const { error, loading, success } = useSelector(
    (state) => state.payments.createReceiptLicensePayment,
  );

  const [document, setDocument] = useState("");
  const [explanation, setExplanation] = useState("");
  const licensePackageData = groupByRestaurantId(cartItems);

  function handleSubmit(e) {
    e.preventDefault();
    // if (addLoading || extendLoading) return;
    if (loading) return;
    // const { city, district, neighbourhood } = user.userInvoiceAddressDTO || {};
    // const paymentAmount = cartItems.reduce(
    //   (acc, item) => acc + parseFloat(item.price),
    //   0,
    // );
    const addLicenseBasket = cartItems.reduce((result, item) => {
      const existingRestaurant = result.find(
        (restaurant) => restaurant.restaurantId === item.restaurantId,
      );

      if (existingRestaurant) {
        existingRestaurant.licensePackageIds.push(item.id);
      } else {
        result.push({
          restaurantId: item.restaurantId,
          licensePackageIds: [item.id],
        });
      }

      return result;
    }, []);

    const { licensePackageId, restaurantId } = cartItems[0];
    const extendLicenseBasket = {
      licensePackageId,
      restaurantId,
      licenseId: currentLicense?.id,
    };

    // Create a FormData object
    const formData = new FormData();
    formData.append(
      "Basket",
      isPageExtend
        ? JSON.stringify(extendLicenseBasket)
        : JSON.stringify(addLicenseBasket),
    );
    formData.append("Type", isPageExtend ? "ExtendLicense" : "NewLicense");
    formData.append("Receipt", document);

    // formData.append("UserName", user.fullName);
    // formData.append("UserEmail", user.email);
    // formData.append("UserPhoneNumber", user.phoneNumber);
    // formData.append("UserAddress", `${city}/${district}/${neighbourhood}`);
    // formData.append("PaymentType", "Bank");
    // formData.append("PaymentAmount", paymentAmount.toString());
    // formData.append("Description", explanation);

    // I'M Still leaving this condition for future use if there will be any difference between add and extend form data. For now, both are same so I'm dispatching same action.
    if (isPageExtend) {
      dispatch(createReceiptLicensePayment(formData));
    } else {
      dispatch(createReceiptLicensePayment(formData));
    }
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

  // // ADD SUCCESS
  // useEffect(() => {
  //   if (addLoading) {
  //     toastId.current = toast.loading("Loading...");
  //   }
  //   if (addSuccess) {
  //     setStep(6);
  //     toast.remove(toastId.current);
  //     setPaymentStatus("success");
  //     dispatch(resetAddByBankPay());
  //   }
  //   if (addError) {
  //     setStep(6);
  //     toast.remove(toastId.current);
  //     setPaymentStatus("failure");
  //     dispatch(resetAddByBankPay());
  //   }

  //   return () => {
  //     if (cartItems) {
  //       dispatch(clearCart());
  //     }
  //   };
  // }, [addLoading, addSuccess, addError]);

  // // EXTEND SUCCESS
  // useEffect(() => {
  //   if (extendLoading) {
  //     toastId.current = toast.loading("Loading...");
  //   }
  //   if (extendSuccess) {
  //     setStep(5);
  //     toast.remove(toastId.current);
  //     setPaymentStatus("success");
  //     dispatch(resetExtendByBankPay());
  //   }
  //   if (extendError) {
  //     setStep(5);
  //     toast.remove(toastId.current);
  //     setPaymentStatus("failure");
  //     dispatch(resetExtendByBankPay());
  //   }

  //   return () => {
  //     if (cartItems) {
  //       dispatch(clearCart());
  //     }
  //   };
  // }, [extendLoading, extendSuccess, extendError, dispatch]);

  //LOADING ANIMATION
  useEffect(() => {
    // if (addLoading || extendLoading) {
    if (loading) {
      setPopupContent(<PaymentLoader type={1} />);
    } else setPopupContent(null);
    // }, [addLoading, extendLoading]);
  }, [loading]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-3xl mx-auto pt-5">
        <div>
          <p>Dekontunuz kontrol edildikten sonra</p>
          {licensePackageData &&
            licensePackageData.map((pkg, i) => (
              <div key={i}>
                <p className="w-max mt-1 mb-1 border-b border-[--primary-1]">
                  <span className="text-[--primary-1] pr-1">
                    {pkg[0].restaurantName}
                  </span>
                  Restoran&apos;a
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 pb-2">
                  {pkg.map((item, i) => (
                    <div key={i} className="flex text-sm">
                      <p className="mt-1 pr-2">
                        {imageSRCs[item.licenseTypeId]?.name}
                      </p>
                      <p className="mt-1">
                        {item.time} Yıllık{i < pkg.length - 1 && ","}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          <p className="pt-1.5 mb-6">Lisans eklenecek.</p>
        </div>

        <div>
          <CustomInput
            label="Açıklama"
            placeholder="Açıklama"
            className="text-sm mb-4"
            className2="mt-[0] sm:mt-[0]"
            value={explanation}
            onChange={(e) => setExplanation(e)}
          />
        </div>
        <div className="">
          <CustomFileInput
            className="h-[8rem] p-4"
            value={document}
            onChange={setDocument}
            accept={"image/png, image/jpeg, application/pdf"}
            required={!document}
          />
        </div>

        {/* BTNS */}
        <div className="flex gap-3 absolute -bottom-16 -right-0">
          <BackButton
            text="Geri"
            letIcon={true}
            onClick={() => setStep(step - 1)}
            // disabled={addLoading || extendLoading}
            disabled={loading}
          />
          <ForwardButton
            text="Devam"
            letIcon={true}
            type="submit"
            // disabled={addLoading || extendLoading}
            disabled={loading}
          />
        </div>
      </div>
    </form>
  );
};

export default BankPayment;
