//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

//COMP
import CustomInput from "../common/customInput";
import CustomToggle from "../common/customToggle";
import CustomSelect from "../common/customSelector";
import LanguagesEnums from "../../enums/languagesEnums";

//REDUX
import {
  setRestaurantSettings,
  resetSetRestaurantSettings,
} from "../../redux/restaurant/setRestaurantSettingsSlice";

const RestaurantSettings = ({ data: inData }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { success, error } = useSelector(
    (state) => state.restaurant.setRestaurantSettings,
  );

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
      maxTableOrderDistanceMeter: inData?.maxTableOrderDistanceMeter,
      checkTableOrderDistance: inData?.checkTableOrderDistance,
      minOrderAmount: inData?.minOrderAmount,
    }),
    [inData],
  );

  const [restaurantData, setRestaurantData] = useState(initialData);
  const [restaurantDataBefore, setRestaurantDataBefore] = useState(initialData);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isEqual(restaurantData, restaurantDataBefore)) {
      toast.error(t("restaurantSettings.not_changed"));
      return;
    }
    dispatch(setRestaurantSettings(restaurantData));
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

  return (
    <div className="w-full pb-8 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col px-4 sm:px-14">
        {/* <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("restaurantSettings.title", { name: restaurantData?.name })}
        </h1> */}

        <form onSubmit={handleSubmit}>
          <div className="w-full flex max-lg:flex-col gap-x-16 gap-y-3 mt-10">
            {/* LEFT SIDE */}
            <div className="flex-1 flex flex-col gap-y-8 text-sm max-w-md">
              {/* TENANT */}
              <div>
                <label className="text-xs font-semibold tracking-wide text-[--gr-1] max-md:max-w-full text-left">
                  {t("restaurantSettings.tenant")}{" "}
                  <span className="text-[--primary-1]">
                    {t("restaurantSettings.tenant_note", {
                      url: `${
                        restaurantData?.tenant || "restaurant"
                      }.liwamenu.com`,
                    })}
                  </span>
                </label>

                <div className="flex items-end">
                  <span className="bg-[--gr-4] text-[--gr-1] pl-3 py-[7.5px] rounded-l-md">
                    https://
                  </span>
                  <CustomInput
                    type="text"
                    placeholder={t("restaurantSettings.tenant_placeholder")}
                    className="py-[.4rem] px-[2px] rounded-none bg-[--white-1]"
                    value={restaurantData?.tenant ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        tenant: e,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] text-[--gr-1] pr-3 py-[7.5px] rounded-r-md">
                    .liwamenu.com
                  </span>
                </div>
              </div>

              {/* GOOGLE ANALYTICS */}
              <div>
                <CustomInput
                  type="text"
                  label={
                    <span>
                      <a
                        href="https://analytics.google.com/analytics/web"
                        target="_blank"
                        className="text-[--link-1]"
                      >
                        {t("restaurantSettings.google_analytics")}
                      </a>{" "}
                      websitesinden ulaşabilirsiniz.
                    </span>
                  }
                  className="py-[.4rem] bg-[--white-1]"
                  placeholder={t(
                    "restaurantSettings.google_analytics_placeholder",
                  )}
                  value={restaurantData?.googleAnalytics ?? ""}
                  onChange={(e) =>
                    setRestaurantData((prev) => ({
                      ...prev,
                      googleAnalytics: e,
                    }))
                  }
                />
              </div>

              {/* MENU LANGUAGE */}
              <div>
                <CustomSelect
                  type="text"
                  className="text-sm"
                  label={t("restaurantSettings.menu_language")}
                  placeholder={t(
                    "restaurantSettings.menu_language_placeholder",
                  )}
                  style={{ borderRadius: ".4rem", padding: "0rem 0px" }}
                  value={
                    LanguagesEnums.find(
                      (L) => L.value == (restaurantData?.menuLang ?? null),
                    ) || {
                      label: t("restaurantSettings.menu_language_placeholder"),
                    }
                  }
                  options={LanguagesEnums}
                  onChange={(selectedOption) =>
                    setRestaurantData((prev) => ({
                      ...prev,
                      menuLang: selectedOption.value,
                    }))
                  }
                />
              </div>

              {/* MONEY SIGN */}
              <div>
                <CustomInput
                  type="text"
                  label={t("restaurantSettings.money_sign")}
                  placeholder={t("restaurantSettings.money_sign_placeholder")}
                  className="py-[.4rem] bg-[--white-1]"
                  value={restaurantData?.moneySign ?? ""}
                  onChange={(e) =>
                    setRestaurantData((prev) => ({
                      ...prev,
                      moneySign: e,
                    }))
                  }
                />
              </div>

              {/* SLOGAN 1 */}
              <div>
                <CustomInput
                  type="text"
                  label={t("restaurantSettings.slogan1")}
                  placeholder={t("restaurantSettings.slogan1_placeholder")}
                  className="py-[.4rem] bg-[--white-1]"
                  value={restaurantData?.slogan1 ?? ""}
                  onChange={(e) =>
                    setRestaurantData((prev) => ({
                      ...prev,
                      slogan1: e,
                    }))
                  }
                />
              </div>

              {/* SLOGAN 2 */}
              <div>
                <CustomInput
                  label={t("restaurantSettings.slogan2")}
                  placeholder={t("restaurantSettings.slogan2_placeholder")}
                  className="py-[.4rem] bg-[--white-1]"
                  value={restaurantData?.slogan2 ?? ""}
                  onChange={(e) =>
                    setRestaurantData((prev) => ({
                      ...prev,
                      slogan2: e,
                    }))
                  }
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex-1 flex flex-col gap-y-9 text-sm  max-w-md">
              {/* ONLINE ORDER */}
              <main className="max-w-md flex flex-col gap-4 border border-[--border-1] px-2.5 py-4 rounded-md bg-[--light-1]">
                <div>
                  <CustomToggle
                    label={t("restaurantSettings.online_order")}
                    className2="font-medium"
                    checked={restaurantData?.onlineOrder}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        onlineOrder: !restaurantData.onlineOrder,
                      }))
                    }
                  />
                </div>

                {/* ONLINE ORDER DISCOUNT */}
                <div className="flex gap-2 items-end">
                  <CustomInput
                    type="number"
                    label={t("restaurantSettings.online_order_discount")}
                    placeholder={t(
                      "restaurantSettings.online_order_discount_placeholder",
                    )}
                    className="py-[.4rem] bg-[--white-1] mt-2"
                    value={restaurantData?.onlineOrderDiscountRate ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        onlineOrderDiscountRate: e,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] border border-[--border-1] px-3 py-[7px] rounded-md">
                    %
                  </span>
                </div>

                {/* DELIVERY PRICE */}
                <div className="flex gap-2 items-end">
                  <CustomInput
                    type="number"
                    label={t("restaurantSettings.delivery_fee")}
                    placeholder={t(
                      "restaurantSettings.delivery_fee_placeholder",
                    )}
                    className="py-[.4rem] bg-[--white-1] mt-2"
                    value={restaurantData?.deliveryFee ?? ""}
                    onChange={(v) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        deliveryFee: v,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] border border-[--border-1] px-3 py-[7px] rounded-md">
                    {restaurantData?.moneySign || "₺"}
                  </span>
                </div>

                {/* MIN ORDER AMOUNT */}
                <div className="flex gap-2 items-end">
                  <CustomInput
                    type="number"
                    label={t("restaurantSettings.min_order_amount")}
                    placeholder={t(
                      "restaurantSettings.min_order_amount_placeholder",
                    )}
                    className="py-[.4rem] bg-[--white-1] mt-2"
                    value={restaurantData?.minOrderAmount ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        minOrderAmount: e,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] border border-[--border-1] px-3 py-[7px] rounded-md">
                    {restaurantData?.moneySign || "₺"}
                  </span>
                </div>

                {/* MAXIMUM DISTANCE */}
                <div className="flex gap-2 items-end">
                  <CustomInput
                    type="number"
                    label={t("restaurantSettings.max_distance")}
                    placeholder={t(
                      "restaurantSettings.max_distance_placeholder",
                    )}
                    className="py-[.4rem] bg-[--white-1] mt-2"
                    value={restaurantData?.maxDistance ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        maxDistance: e,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] border border-[--border-1] px-3 py-[7px] rounded-md">
                    ㎞
                  </span>
                </div>
              </main>

              {/* IN PERSON ORDER */}
              <main className="max-w-md flex flex-col gap-4 border border-[--border-1] px-2.5 py-4 rounded-md bg-[--light-1]">
                <div>
                  <CustomToggle
                    label={t("restaurantSettings.in_person_order")}
                    className2="font-medium"
                    checked={restaurantData?.inPersonOrder}
                    onChange={() =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        inPersonOrder: !restaurantData.inPersonOrder,
                      }))
                    }
                  />
                </div>

                {/* TABLE ORDER DISCOUNT */}
                <div className="flex items-end gap-2">
                  <CustomInput
                    type="number"
                    label={t("restaurantSettings.table_order_discount")}
                    placeholder={t(
                      "restaurantSettings.table_order_discount_placeholder",
                    )}
                    className="py-[.4rem] bg-[--white-1] mt-2"
                    value={restaurantData?.tableOrderDiscountRate ?? ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        tableOrderDiscountRate: e,
                      }))
                    }
                  />
                  <span className="bg-[--gr-4] px-3 py-[7px] border border-[--border-1] rounded-md">
                    %
                  </span>
                </div>

                {/* CHECK TABLE ORDER DISTANCE */}
                <div>
                  <CustomToggle
                    label={t("restaurantSettings.check_table_order_distance")}
                    className2="font-medium"
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

                {/* MAX TABLE ORDER DISTANCE METER */}
                {restaurantData?.checkTableOrderDistance && (
                  <div>
                    <CustomInput
                      type="number"
                      label={t(
                        "restaurantSettings.max_table_order_distance_meter",
                      )}
                      placeholder={t(
                        "restaurantSettings.max_table_order_distance_meter_placeholder",
                      )}
                      className="py-[.4rem] bg-[--white-1] mt-2"
                      value={restaurantData?.maxTableOrderDistanceMeter ?? ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          maxTableOrderDistanceMeter: e,
                        }))
                      }
                    />
                  </div>
                )}
              </main>
            </div>
          </div>

          {/* The Bottom Section */}
          <main className="text-sm sm:flex sm:max-w-[60rem] w-full items-between gap-4 pt-4 mt-8 max-sm:max-w-md border-t border-[--border-1]">
            {/* HIDE RESTAURANT */}
            <div className="w-full border border-[--border-1] rounded-md p-2.5 mt-3">
              <CustomToggle
                label={t("restaurantSettings.hide_restaurant")}
                checked={restaurantData?.hide}
                onChange={() =>
                  setRestaurantData((prev) => ({
                    ...prev,
                    hide: !restaurantData.hide,
                  }))
                }
              />
            </div>

            {/* IS SPECIAL PRICE ACTIVE */}
            <div className="w-full border border-[--border-1] rounded-md p-2.5 mt-3">
              <CustomToggle
                label={t("restaurantSettings.is_special_price_active")}
                checked={restaurantData?.isSpecialPriceActive}
                onChange={() =>
                  setRestaurantData((prev) => ({
                    ...prev,
                    isSpecialPriceActive: !restaurantData.isSpecialPriceActive,
                  }))
                }
              />
            </div>

            {/* IS RESERVATION LICENSE ACTIVE */}
            {/* <div className="w-full border border-[--border-1] rounded-md p-2.5 mt-3">
              <CustomToggle
                label={t("restaurantSettings.is_reservation_active")}
                checked={restaurantData?.isReservationActive}
                onChange={() =>
                  setRestaurantData((prev) => ({
                    ...prev,
                    isReservationActive: !restaurantData.isReservationActive,
                  }))
                }
              />
            </div> */}
          </main>

          {/* SPECIAL PRICE NAME */}
          <div className="bg-amber-400/15 p-4 rounded-xl border border-amber-400/15 my-4 max-w-[60rem]">
            <span className="text-xs font-semibold text-[--orange-1] uppercase tracking-wider mb-3 block">
              {t("restaurantSettings.special_price_section")}
            </span>
            <CustomInput
              type="text"
              label={t("restaurantSettings.special_price_label")}
              placeholder={t("restaurantSettings.special_price_placeholder")}
              className="w-full border border-[--border-1] rounded-lg px-3 py-[7px] text-sm text-[--black-1] outline-none focus:border-[--orange-1] bg-[--white-1] mt-2"
              value={restaurantData.specialPriceName || ""}
              onChange={(e) =>
                setRestaurantData((prev) => ({
                  ...prev,
                  specialPriceName: e,
                }))
              }
            />
            <p className="text-[10px] text-[--gr-1] mt-1 italic">
              {t("restaurantSettings.special_price_note")}
            </p>
          </div>

          {/* SUBMIT */}
          <div className="w-full flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[--primary-1] text-white"
            >
              {t("restaurantSettings.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSettings;
