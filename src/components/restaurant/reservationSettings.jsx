// MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

// COMP
import { WaitI } from "../../assets/icon";
import CustomInput from "../common/customInput";
import CustomToggle from "../common/customToggle";

// REDUX
import {
  setRestaurantReservationSettings,
  resetSetRestaurantReservationSettings,
} from "../../redux/restaurant/setRestaurantReservationSettingsSlice";
import {
  getRestaurantReservationSettings,
  resetGetRestaurantReservationSettingsSlice,
} from "../../redux/restaurant/getRestaurantReservationSettingsSlice";

const RestaurantReservationSettings = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const id = useParams()["*"]?.split("/")[1];

  const { success, loading } = useSelector(
    (s) => s.restaurant.setRestaurantReservationSettings,
  );
  const { data: reservationSettings, error } = useSelector(
    (s) => s.restaurant.getRestaurantReservationSettings,
  );

  const [reservationData, setReservationData] = useState(null);

  //GET RESERVATION SETTINGS
  useEffect(() => {
    if (!reservationData) {
      dispatch(getRestaurantReservationSettings({ restaurantId: id }));
    }
  }, [reservationData]);

  // HANDLE SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      setRestaurantReservationSettings({
        restaurantId: id,
        ...reservationData,
      }),
    );
  };

  // GET RESERVATION DATA ON SUCCESS OR ERROR
  useEffect(() => {
    if (reservationSettings) {
      setReservationData(reservationSettings);
      dispatch(resetGetRestaurantReservationSettingsSlice());
    }
    if (error) dispatch(resetGetRestaurantReservationSettingsSlice());
  }, [reservationSettings, error]);

  // TOAST NOTIFICATIONS
  useEffect(() => {
    if (success) {
      toast.success(t("restaurantReservationSettings.updateSuccess"));
    }
    if (error) {
      dispatch(resetSetRestaurantReservationSettings());
    }
  }, [success, error]);

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2] overflow-hidden">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold bg-indigo-800 text-white py-5 px-6 sm:px-14">
          {t("restaurantReservationSettings.title", { name: data?.name })}
        </h1>

        <form onSubmit={handleSubmit} className="mt-16 space-y-5">
          <main className="flex flex-col gap-4">
            {/*  Interval Minutes && Max Guests */}
            <div className="max-w-md mb-4">
              <CustomToggle
                label={t("restaurantReservationSettings.is_active_label")}
                checked={reservationData?.isActive}
                onChange={(e) =>
                  setReservationData((prev) => ({
                    ...prev,
                    isActive: e.target.checked,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-3">
              <CustomInput
                type="number"
                min={1}
                placeholder={t(
                  "restaurantReservationSettings.interval_minutes_label",
                )}
                label={t(
                  "restaurantReservationSettings.interval_minutes_label",
                )}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-[--border-1] rounded-lg outline-none focus:border-[--primary-1] bg-[--white-1] text-[--black-1]"
                value={reservationData?.intervalMinutes}
                onChange={(e) =>
                  setReservationData((prev) => ({
                    ...prev,
                    intervalMinutes: e,
                  }))
                }
              />

              <CustomInput
                type="number"
                min={1}
                placeholder={t(
                  "restaurantReservationSettings.max_guests_label",
                )}
                label={t("restaurantReservationSettings.max_guests_label")}
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-[--border-1] rounded-lg outline-none focus:border-[--primary-1] bg-[--white-1] text-[--black-1]"
                value={reservationData?.maxGuests}
                onChange={(e) =>
                  setReservationData((prev) => ({
                    ...prev,
                    maxGuests: e,
                  }))
                }
              />
            </div>

            {/* Times */}
            <div className="flex items-center gap-3">
              <div className="w-full">
                <label htmlFor="startTime" className="text-sm text-[--gr-1]">
                  {t("restaurantReservationSettings.start_time_label")}
                </label>
                <div className="relative flex-1">
                  <WaitI className="size-[1rem] absolute left-2 top-1/2 -translate-y-1/2 text-[--gr-1] text-xs" />
                  <input
                    type="time"
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-[--border-1] rounded-lg outline-none focus:border-[--primary-1] bg-[--white-1] text-[--black-1]"
                    value={reservationData?.startTime}
                    onChange={(e) =>
                      setReservationData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="w-full">
                <label htmlFor="startTime" className="text-sm text-[--gr-1]">
                  {t("restaurantReservationSettings.end_time_label")}
                </label>
                <div className="relative flex-1">
                  <WaitI className="size-[1rem] absolute left-2 top-1/2 -translate-y-1/2 text-[--gr-1] text-xs" />
                  <input
                    type="time"
                    className="w-full pl-7 pr-2 py-1.5 text-sm border border-[--border-1] rounded-lg outline-none focus:border-[--primary-1] bg-[--white-1] text-[--black-1]"
                    value={reservationData?.endTime}
                    onChange={(e) =>
                      setReservationData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </main>
          <div className="w-full flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-md bg-[--primary-1] text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("restaurantReservationSettings.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantReservationSettings;
