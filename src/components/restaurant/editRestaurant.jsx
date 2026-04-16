//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import { googleMap } from "../../utils/utils";
import CustomInput from "../common/customInput";
import CustomTextarea from "../common/customTextarea";
import CustomFileInput from "../common/customFileInput";
import CustomPhoneInput from "../common/customPhoneInput";

//REDUX
import {
  updateRestaurant,
  resetUpdateRestaurant,
} from "../../redux/restaurants/updateRestaurantSlice";

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const stringValue = String(value);
  if (stringValue.includes(".")) {
    return stringValue;
  }

  const cleanedValue = stringValue.replace(/\D/g, "");
  if (cleanedValue.length <= 2) {
    return stringValue;
  }

  return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2)}`;
}

const EditRestaurant = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toastId = useRef();

  // Derive formatted restaurant object
  const formatRestaurant = (restaurant) => {
    if (!restaurant) return null;

    const {
      id: restaurantId,
      dealerId,
      userId,
      name,
      phoneNumber,
      latitude,
      longitude,
      city,
      district,
      neighbourhood,
      address,
      isActive,
      imageAbsoluteUrl,
      logoImageUrl,
    } = restaurant;

    return {
      restaurantId,
      dealerId,
      userId,
      name,
      phoneNumber,
      latitude: formatCoordinate(latitude),
      longitude: formatCoordinate(longitude),
      city,
      district,
      neighbourhood,
      address,
      isActive,
      imageAbsoluteUrl,
      logoImageUrl,
    };
  };

  const { loading, success, error } = useSelector(
    (state) => state.restaurants.updateRestaurant,
  );

  const { success: locationSuccess, location } = useSelector(
    (state) => state.data.getLocation,
  );

  const [lat, setLat] = useState(formatCoordinate(restaurant?.latitude));
  const [lng, setLng] = useState(formatCoordinate(restaurant?.longitude));
  const [document, setDocument] = useState("");
  const [document2, setDocument2] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [restaurantDataBefore, setRestaurantDataBefore] = useState(
    formatRestaurant(restaurant),
  );
  const [restaurantData, setRestaurantData] = useState(
    formatRestaurant(restaurant),
  );
  const [preview, setPreview] = useState();
  const [preview2, setPreview2] = useState();

  const handleSubmit = (e) => {
    e.preventDefault();
    const equalData = isEqual(restaurantDataBefore, restaurantData);
    if (equalData && !document && !document2) {
      toast("Hiç bir değişiklik yapmadınız.");
      return;
    }

    const formData = new FormData();

    formData.append("RestaurantId", restaurantData.restaurantId);
    formData.append("DealerId", restaurantData.dealerId);
    formData.append("UserId", restaurantData.userId);
    formData.append("Name", restaurantData.name);
    formData.append("PhoneNumber", restaurantData.phoneNumber);
    formData.append("Latitude", restaurantData.latitude);
    formData.append("Longitude", restaurantData.longitude);
    formData.append("City", restaurantData.city);
    formData.append("District", restaurantData.district);
    formData.append("Neighbourhood", restaurantData.neighbourhood);
    formData.append("Address", restaurantData.address);
    formData.append("IsActive", restaurantData.isActive);
    document && formData.append("Image", document);
    document2 && formData.append("LogoImage", document2);

    dispatch(updateRestaurant(formData));
  };

  async function handleOpenMap() {
    setIsMapOpen(true);
    googleMap(
      formatCoordinate(lat),
      formatCoordinate(lng),
      setLat,
      setLng,
      null,
      15,
      false,
    );
  }

  function handleSetMap() {
    setRestaurantData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    // console.log(lat, lng);
    setIsMapOpen(false);
  }

  // REFRESH WHEN RESTAURANT CHANGES
  useEffect(() => {
    if (restaurant) {
      const formatted = formatRestaurant(restaurant);
      setRestaurantData(formatted);
      setRestaurantDataBefore(formatted);
      setPreview(formatted?.imageAbsoluteUrl);
      setPreview2(formatted?.logoImageUrl);
    }
  }, [restaurant]);

  // TOAST
  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading("İşleniyor 🤩...");
    }
    if (error) {
      toast.dismiss(toastId.current);
      dispatch(resetUpdateRestaurant());
    } else if (success) {
      toast.dismiss(toastId.current);
      toast.success("Restoran başarıyla güncelendi 🥳🥳");
      dispatch(resetUpdateRestaurant());
    }
  }, [loading, success, error]);

  //PREVIEW
  useEffect(() => {
    let objectUrl;
    let objectUrl2;
    if (document) {
      // Create a preview URL
      objectUrl = URL.createObjectURL(document);
      setPreview(objectUrl);
    }
    if (document2) {
      // Create a preview URL
      objectUrl2 = URL.createObjectURL(document2);
      setPreview2(objectUrl2);
    }

    // Free memory when the component unmounts or doc changes
    return () => {
      if (document) {
        URL.revokeObjectURL(objectUrl);
      }
      if (document2) {
        URL.revokeObjectURL(objectUrl2);
      }
    };
  }, [document, document2]);

  return (
    <div className=" w-full pb-8 mt-1 bg-[--white-1] rounded-lg text-[--black-2] text-base overflow-visible relative">
      <div className="flex flex-col bg-[--white-1] px-4 sm:px-14 relative">
        <div
          className={`fixed bg-[--white-1] border border-[--border-1] w-full top-0 bottom-0 right-0 left-0 max-w-xl max-h-[75dvh] m-auto z-[999] rounded-lg flex flex-col justify-start items-center ${
            !isMapOpen && "hidden"
          }`}
        >
          <div id="map" className="size-full rounded-t-md"></div>

          <div className="w-full px-2 py-1 pt-2 flex rounded-b-md">
            <div className="w-full gap-2 flex">
              <div className="text-sm">
                <span className="text-xs text-[--gr-1]">
                  {t("restaurants.latitude")}
                </span>
                <p className="border border-solid border-[--border-1]  px-2">
                  {lat}
                </p>
              </div>

              <div className="text-sm">
                <span className="text-xs text-[--gr-1]">
                  {t("restaurants.longitude")}
                </span>
                <p className="border border-solid border-[--border-1]  px-2">
                  {lng}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="px-5 py-1 text-sm text-[--red-1] rounded-sm bg-[--status-red] border border-solid border-[--red-1]"
                onClick={() => setIsMapOpen(false)}
              >
                {t("restaurants.map_close")}
              </button>
              <button
                className="px-5 py-1 text-sm text-[--green-1] rounded-sm bg-[--status-green] border border-solid border-[--green-1]"
                onClick={handleSetMap}
              >
                {t("restaurants.map_save")}
              </button>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("restaurants.edit_title", { name: restaurantData?.name })}
        </h1>

        <div className="flex flex-col mt-9 w-full text-left">
          {restaurantData && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex max-sm:flex-col gap-4">
                <CustomInput
                  required={true}
                  label={t("restaurants.name") + "*"}
                  placeholder={t("restaurants.name")}
                  className="py-[.45rem] text-sm bg-[--white-1]"
                  value={restaurantData.name}
                  onChange={(e) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        name: e,
                      };
                    });
                  }}
                />
                <CustomPhoneInput
                  required={true}
                  label={t("restaurants.phone") + "*"}
                  placeholder={t("restaurants.phone")}
                  className="py-[.45rem] text-sm bg-[--white-1]"
                  value={restaurantData.phoneNumber}
                  onChange={(phone) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        phoneNumber: phone,
                      };
                    });
                  }}
                  maxLength={14}
                />
              </div>

              <div className="flex max-sm:flex-col gap-4">
                <CustomInput
                  required
                  label={t("restaurants.city")}
                  placeholder={t("restaurants.city")}
                  className="py-[.45rem] text-sm bg-[--white-1]"
                  value={restaurantData.city}
                  onChange={(e) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        city: e,
                      };
                    });
                  }}
                />
                <CustomInput
                  required
                  label={t("restaurants.district")}
                  placeholder={t("restaurants.district")}
                  className="py-[.45rem] text-sm bg-[--white-1]"
                  value={restaurantData.district}
                  onChange={(e) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        district: e,
                      };
                    });
                  }}
                />
              </div>

              <div className="flex max-sm:flex-col gap-4">
                <CustomInput
                  required
                  label={t("restaurants.neighbourhood")}
                  placeholder={t("restaurants.neighbourhood")}
                  className="py-[.45rem] text-sm bg-[--white-1]"
                  value={restaurantData.neighbourhood}
                  onChange={(e) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        neighbourhood: e,
                      };
                    });
                  }}
                />

                <CustomTextarea
                  required={true}
                  label={t("restaurants.address") + "*"}
                  placeholder={t("restaurants.address")}
                  className="text-sm h-14 bg-[--white-1]"
                  value={restaurantData.address}
                  onChange={(e) => {
                    setRestaurantData((prev) => {
                      return {
                        ...prev,
                        address: e.target.value,
                      };
                    });
                  }}
                />
              </div>

              <div onClick={handleOpenMap}>
                <div className="flex max-sm:flex-col gap-4 pointer-events-none">
                  <CustomInput
                    required={true}
                    label={t("restaurants.latitude") + "*"}
                    placeholder={t("restaurants.latitude")}
                    className="py-[.45rem] text-sm bg-[--white-1]"
                    value={restaurantData.latitude}
                    onChange={() => {}}
                    onClick={() => {}}
                    readOnly={true}
                  />
                  <CustomInput
                    required={true}
                    label={t("restaurants.longitude") + "*"}
                    placeholder={t("restaurants.longitude")}
                    className="py-[.45rem] text-sm bg-[--white-1]"
                    value={restaurantData.longitude}
                    onChange={() => {}}
                    onClick={() => {}}
                    readOnly={true}
                  />
                </div>
              </div>

              <div className="mt-4 flex max-sm:flex-col items-center">
                <div className="w-full max-w-40 mb-2">
                  <img src={preview2} alt="preview_liwamenu_logo" />
                </div>
                <CustomFileInput
                  msg={t("restaurants.logo_msg")}
                  value={document2}
                  onChange={setDocument2}
                  accept={"image/png, image/jpeg, image/gif, image/webp"}
                />
              </div>

              <div className="mt-4 flex max-sm:flex-col items-center">
                <div className="w-full max-w-40 mb-2">
                  <img src={preview} alt="preview_liwamenu" />
                </div>
                <CustomFileInput
                  value={document}
                  onChange={setDocument}
                  accept={"image/png, image/jpeg, image/gif, image/webp"}
                />
              </div>

              <div className="w-full flex justify-end mt-10">
                <button
                  disabled={false}
                  className={`py-2 px-3 bg-[--primary-1] text-white rounded-lg ${
                    isMapOpen && "invisible"
                  }`}
                  type="submit"
                >
                  {t("restaurants.save")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditRestaurant;
