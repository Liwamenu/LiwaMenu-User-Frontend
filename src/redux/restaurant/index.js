import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getWorkingHoursSlice from "./getWorkingHoursSlice";
import setWorkingHoursSlice from "./setWorkingHoursSlice";
import getSocialMediasSlice from "./getSocialMediasSlice";
import setSocialMediasSlice from "./setSocialMediasSlice";
import getPaymentMethodsSlice from "./getPaymentMethodsSlice";
import setPaymentMethodsSlice from "./setPaymentMethodsSlice";
import addPaymentMethodSlice from "./addPaymentMethodSlice";
import deletePaymentMethodSlice from "./deletePaymentMethodSlice";
import setRestaurantSettings from "./setRestaurantSettingsSlice";
import setRestaurantReservationSettingsSlice from "./setRestaurantReservationSettingsSlice";
import getRestaurantReservationSettingsSlice from "./getRestaurantReservationSettingsSlice";
import getAnnouncementSettingsSlice from "./getAnnouncementSettingsSlice";
import setAnnouncementSettingsSlice from "./setAnnouncementSettingsSlice";
import getSurveySettingsSlice from "./getSurveySettingsSlice";
import setSurveySettingsSlice from "./setSurveySettingsSlice";
import setRestaurantThemeSlice from "./setRestaurantThemeSlice";
import setRestaurantTvThemeSlice from "./setRestaurantTvThemeSlice";
import setRestaurantKioskThemeSlice from "./setRestaurantKioskThemeSlice";
import checkTenantAvailabilitySlice from "./checkTenantAvailabilitySlice";

const restaurantSlice = combineReducers({
  getWorkingHours: getWorkingHoursSlice,
  setWorkingHours: setWorkingHoursSlice,
  getSocialMedias: getSocialMediasSlice,
  setSocialMedias: setSocialMediasSlice,
  getPaymentMethods: getPaymentMethodsSlice,
  setPaymentMethods: setPaymentMethodsSlice,
  addPaymentMethod: addPaymentMethodSlice,
  deletePaymentMethod: deletePaymentMethodSlice,
  setRestaurantSettings: setRestaurantSettings,
  setRestaurantReservationSettings: setRestaurantReservationSettingsSlice,
  getRestaurantReservationSettings: getRestaurantReservationSettingsSlice,
  getAnnouncementSettings: getAnnouncementSettingsSlice,
  setAnnouncementSettings: setAnnouncementSettingsSlice,
  getSurveySettings: getSurveySettingsSlice,
  setSurveySettings: setSurveySettingsSlice,
  setRestaurantTheme: setRestaurantThemeSlice,
  // Dedicated slice for TV menu theme saves — see slice file for the
  // rationale (was sharing the QR slice and that caused the QR theme
  // to silently switch when a TV theme was picked).
  setRestaurantTvTheme: setRestaurantTvThemeSlice,
  // Dedicated slice for the Kiosk theme save. Was sharing the QR slice
  // until the Qr/Tv/Kiosk endpoint split — kiosk picks silently
  // overwrote the QR theme; companion slices: setRestaurantTheme (QR),
  // setRestaurantTvTheme (TV).
  setRestaurantKioskTheme: setRestaurantKioskThemeSlice,
  checkTenantAvailability: checkTenantAvailabilitySlice,
});

export default restaurantSlice;
