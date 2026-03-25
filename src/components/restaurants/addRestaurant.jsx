//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { getAuth } from "../../redux/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import { CancelI } from "../../assets/icon";
import { googleMap } from "../../utils/utils";
import CustomInput from "../common/customInput";
import CustomSelect from "../common/customSelector";
import CustomTextarea from "../common/customTextarea";
import { usePopup } from "../../context/PopupContext";
import CustomFileInput from "../common/customFileInput";
import CustomPhoneInput from "../common/customPhoneInput";

// REDUX
import {
  getNeighs,
  resetGetNeighsState,
} from "../../redux/data/getNeighsSlice";
import {
  getLocation,
  resetGetLocationState,
} from "../../redux/data/getLocationSlice";
import {
  getDistricts,
  resetGetDistrictsState,
} from "../../redux/data/getDistrictsSlice";
import {
  addRestaurant,
  resetAddRestaurantState,
} from "../../redux/restaurants/addRestaurantSlice";
import { getCities } from "../../redux/data/getCitiesSlice";
import {
  getUserAddress,
  resetGetUserAddress,
} from "../../redux/data/getUserAddressSlice";

const AddRestaurant = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const handleClick = () => {
    setPopupContent(<AddRestaurantPopup onSuccess={onSuccess} />);
  };

  return (
    <button
      className="h-11 whitespace-nowrap text-[--primary-2] px-3 rounded-md text-sm font-normal border-[1.5px] border-solid border-[--primary-2]"
      onClick={handleClick}
    >
      {t("restaurants.add")}
    </button>
  );
};

export default AddRestaurant;

// EDIT RESTAURANT POPUP
function AddRestaurantPopup({ onSuccess }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toastId = useRef();
  const localUser = getAuth()?.isManager;

  const { setPopupContent } = usePopup();

  const { loading, success, error } = useSelector(
    (state) => state.restaurants.addRestaurant,
  );

  const { cities: citiesData } = useSelector((state) => state.data.getCities);

  const { districts: districtsData, success: districtsSuccess } = useSelector(
    (state) => state.data.getDistricts,
  );

  const { neighs: neighsData, success: neighsSuccess } = useSelector(
    (state) => state.data.getNeighs,
  );

  const { address, error: addressErr } = useSelector(
    (state) => state.data.getUserAddress,
  );

  const {
    error: locationError,
    loading: locationLoading,
    success: locationSuccess,
    location,
  } = useSelector((state) => state.data.getLocation);

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationData, setLocationData] = useState({
    location: null,
    before: null,
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [neighs, setNeighs] = useState([]);
  const [document, setDocument] = useState("");
  const [preview, setPreview] = useState(null);
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    phoneNumber: "",
    latitude: "",
    longitude: "",
    city: null,
    district: null,
    neighbourhood: null,
    address: "",
    isActive: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("Name", restaurantData.name);
    formData.append("PhoneNumber", restaurantData.phoneNumber);
    formData.append("Latitude", restaurantData.latitude);
    formData.append("Longitude", restaurantData.longitude);
    formData.append("City", restaurantData.city.value);
    formData.append("District", restaurantData.district.value);
    formData.append("Neighbourhood", restaurantData.neighbourhood.value);
    formData.append("Address", restaurantData.address);
    formData.append("IsActive", restaurantData.isActive);
    formData.append("Image", document);

    // console.log(restaurantData);
    dispatch(addRestaurant({ formData }));
  };

  async function handleOpenMap() {
    if (locationData.location) {
      setIsMapOpen(true);
      googleMap(lat, lng, setLat, setLng, locationData.location);
    }
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

  // TOAST
  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading("İşleniyor 🤩...");
    }
    if (error) {
      toast.dismiss(toastId.current);
      dispatch(resetAddRestaurantState());
    } else if (success) {
      onSuccess();
      setPopupContent(null);
      toast.dismiss(toastId.current);
      dispatch(resetAddRestaurantState());
      toast.success("Restoran başarıyla eklendi 🥳🥳");
    }
  }, [loading, success, error]);

  // GET AND SET CITIES IF THERE IS NO CITIES
  useEffect(() => {
    if (!citiesData) {
      dispatch(getCities());
    } else {
      setCities(citiesData);
    }
  }, [citiesData]);

  // GET DISTRICTS WHENEVER USER'S CITY CHANGES
  useEffect(() => {
    if (restaurantData.city?.id) {
      dispatch(getDistricts({ cityId: restaurantData.city.id }));
      setRestaurantData((prev) => {
        return {
          ...prev,
          district: null,
        };
      });
    }
  }, [restaurantData.city]);

  // SET DISTRICTS
  useEffect(() => {
    if (districtsSuccess) {
      setDistricts(districtsData);
      dispatch(resetGetDistrictsState());
    }
  }, [districtsSuccess]);

  // GET NEIGHBOURHOODS WHENEVER THE INVOICE DISTRICT CHANGES
  useEffect(() => {
    if (restaurantData.district?.id && restaurantData.city?.id) {
      dispatch(
        getNeighs({
          cityId: restaurantData.city.id,
          districtId: restaurantData.district.id,
        }),
      );
      setRestaurantData((prev) => {
        return {
          ...prev,
          neighbourhood: null,
        };
      });
    }
  }, [restaurantData.district]);

  // SET NEIGHBOURHOODS
  useEffect(() => {
    if (neighsSuccess) {
      setNeighs(neighsData);
      dispatch(resetGetNeighsState());
    }
  }, [neighsSuccess]);

  // GET LOACTION IF THE NEIGH CHANGED
  useEffect(() => {
    const city = restaurantData.city;
    const district = restaurantData.district;
    const neighbourhood = restaurantData.neighbourhood;

    if (city?.id && district?.id && neighbourhood?.id) {
      const address = `${city.value}, ${district.value}, ${neighbourhood.value}`;
      console.log(address);
      if (!isEqual(address, locationData.before)) {
        dispatch(getLocation(address));
        setLocationData((prev) => {
          return {
            ...prev,
            before: address,
          };
        });
      }
    }
  }, [restaurantData.neighbourhood]);

  // SET LOCATION
  useEffect(() => {
    if (locationSuccess) {
      const averageLat = (
        location.reduce((sum, loc) => sum + loc.lat, 0) / location.length
      ).toFixed(6);
      const averageLng = (
        location.reduce((sum, loc) => sum + loc.lng, 0) / location.length
      ).toFixed(6);

      setRestaurantData((prev) => {
        return {
          ...prev,
          latitude: averageLat,
          longitude: averageLng,
        };
      });
      setLocationData((prev) => {
        return {
          ...prev,
          location,
        };
      });
      setLat(averageLat);
      setLng(averageLng);
      dispatch(resetGetLocationState());
    }
  }, [locationSuccess]);

  //GET THE USER LOC
  useEffect(() => {
    if (!restaurantData.city) {
      dispatch(getUserAddress());
    }
  }, [restaurantData.city]);

  //SET THE USER ADDRESS
  useEffect(() => {
    if (address) {
      const city_ = address.city;
      const district_ = address.district;
      const neigh_ = address.neighbourhood;

      setRestaurantData((prev) => {
        return {
          ...prev,
          city: { label: city_, value: city_, id: null },
          district: {
            label: district_,
            value: district_,
            id: null,
          },
          neighbourhood: {
            label: neigh_,
            value: neigh_,
            id: null,
          },
          longitude: address.lng,
          latitude: address.lat,
          address: address.address,
        };
      });
      setLocationData((prev) => {
        return {
          ...prev,
          before: address.address,
        };
      });

      const address_ = `${city_}, ${district_}, ${neigh_}`;
      dispatch(getLocation(address_));
      dispatch(resetGetUserAddress());
    }
    if (address || addressErr) {
      dispatch(resetGetUserAddress());
    }
  }, [address, addressErr]);

  //PREVIEW
  useEffect(() => {
    if (!document) return;

    // Create a preview URL
    const objectUrl = URL.createObjectURL(document);
    setPreview(objectUrl);

    // Free memory when the component unmounts or doc changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [document]);

  return (
    <div className=" w-full pt-12 pb-8 bg-[--white-1] rounded-lg border-2 border-solid border-[--border-1] text-[--black-2] text-base overflow-y-auto relative max-h-[95dvh] mx-auto max-w-3xl">
      <div className="flex flex-col bg-[--white-1] relative">
        <div className="absolute -top-6 right-3 z-[50]">
          <div
            className="text-[--primary-2] p-2 border border-solid border-[--primary-2] rounded-full cursor-pointer hover:bg-[--primary-2] hover:text-[--white-1] transition-colors"
            onClick={() => setPopupContent(null)}
          >
            <CancelI />
          </div>
        </div>

        <div
          className={`absolute bg-black/15 w-full -top-12 -bottom-8 z-[999] rounded-lg flex flex-col justify-start items-center ${
            !isMapOpen && "hidden"
          }`}
        >
          <div id="map" className="size-full rounded-t-md"></div>

          <div className="w-full px-2 py-1 pt-2 flex bg-[--light-1] rounded-b-md">
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

        <h1 className="self-center text-2xl font-bold">
          {t("restaurants.add")}
        </h1>
        <div className="flex flex-col px-4 sm:px-14 mt-9 w-full text-left customInput">
          <form onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">
              <CustomInput
                required
                label={t("restaurants.name")}
                placeholder={t("restaurants.name")}
                className="py-[.45rem] text-sm"
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
                required
                label={t("restaurants.phone")}
                placeholder={t("restaurants.phone")}
                className="py-[.45rem] text-sm"
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

              <CustomSelect
                required
                label={t("restaurants.city")}
                style={{ padding: "1px 0px" }}
                className="text-sm"
                value={
                  restaurantData.city
                    ? restaurantData.city
                    : { value: null, label: t("restaurants.city_select") }
                }
                options={[
                  { value: null, label: t("restaurants.city_select") },
                  ...cities,
                ]}
                onChange={(selectedOption) => {
                  setRestaurantData((prev) => {
                    return {
                      ...prev,
                      city: selectedOption,
                    };
                  });
                }}
              />

              <CustomSelect
                required
                label={t("restaurants.district")}
                style={{ padding: "1px 0px" }}
                className="text-sm"
                value={
                  restaurantData.district
                    ? restaurantData.district
                    : {
                        value: null,
                        label: t("restaurants.district_select"),
                      }
                }
                options={[
                  { value: null, label: t("restaurants.district_select") },
                  ...districts,
                ]}
                onChange={(selectedOption) => {
                  setRestaurantData((prev) => {
                    return {
                      ...prev,
                      district: selectedOption,
                    };
                  });
                }}
              />

              <CustomSelect
                required
                label={t("restaurants.neighbourhood")}
                style={{ padding: "1px 0px" }}
                className="text-sm"
                value={
                  restaurantData.neighbourhood
                    ? restaurantData.neighbourhood
                    : {
                        value: null,
                        label: t("restaurants.neighbourhood_select"),
                      }
                }
                options={[
                  {
                    value: null,
                    label: t("restaurants.neighbourhood_select"),
                  },
                  ...neighs,
                ]}
                onChange={(selectedOption) => {
                  setRestaurantData((prev) => {
                    return {
                      ...prev,
                      neighbourhood: selectedOption,
                    };
                  });
                }}
              />
              <CustomTextarea
                required
                label={t("restaurants.address")}
                placeholder={t("restaurants.address")}
                className={`text-sm max-sm:h-14 bg-transparent ${!localUser ? "h-14" : "h-9"}`}
                className2={`${localUser && "col-span-full"}`}
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
              <div className={`flex gap-4 pointer-events-none`}>
                <CustomInput
                  required
                  label={t("restaurants.latitude")}
                  placeholder={t("restaurants.latitude")}
                  className="py-[.45rem] text-sm"
                  className2="mt-[.5rem] sm:mt-[.5rem]"
                  value={restaurantData.latitude}
                  onChange={() => {}}
                  onClick={() => {}}
                  readOnly={true}
                />
                <CustomInput
                  required
                  label={t("restaurants.longitude")}
                  placeholder={t("restaurants.longitude")}
                  className="py-[.45rem] text-sm"
                  className2="mt-[.5rem] sm:mt-[.5rem]"
                  value={restaurantData.longitude}
                  onChange={() => {}}
                  onClick={() => {}}
                  readOnly={true}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center">
              {preview && (
                <div className="w-full max-w-40">
                  <img src={preview} alt="preview_liwamenu" />
                </div>
              )}

              <CustomFileInput
                className="h-[8rem] p-4"
                value={document}
                onChange={setDocument}
                accept={"image/png, image/jpeg"}
                required={!document}
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
        </div>
      </div>
    </div>
  );
}
