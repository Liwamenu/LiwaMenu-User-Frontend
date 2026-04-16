import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getWorkingHoursSlice from "./getWorkingHoursSlice";
import setWorkingHoursSlice from "./setWorkingHoursSlice";
import getSocialMediasSlice from "./getSocialMediasSlice";
import setSocialMediasSlice from "./setSocialMediasSlice";
import getPaymentMethodsSlice from "./getPaymentMethodsSlice";
import setPaymentMethodsSlice from "./setPaymentMethodsSlice";
import setRestaurantSettings from "./setRestaurantSettingsSlice";
import setRestaurantReservationSettingsSlice from "./setRestaurantReservationSettingsSlice";
import getRestaurantReservationSettingsSlice from "./getRestaurantReservationSettingsSlice";
import getAnnouncementSettingsSlice from "./getAnnouncementSettingsSlice";
import setAnnouncementSettingsSlice from "./setAnnouncementSettingsSlice";
import getSurveySettingsSlice from "./getSurveySettingsSlice";
import setSurveySettingsSlice from "./setSurveySettingsSlice";
import setRestaurantThemeSlice from "./setRestaurantThemeSlice";
import setRestaurantTvMenuSlice from "./setRestaurantTvMenuSlice";

const restaurantSlice = combineReducers({
  getWorkingHours: getWorkingHoursSlice,
  setWorkingHours: setWorkingHoursSlice,
  getSocialMedias: getSocialMediasSlice,
  setSocialMedias: setSocialMediasSlice,
  getPaymentMethods: getPaymentMethodsSlice,
  setPaymentMethods: setPaymentMethodsSlice,
  setRestaurantSettings: setRestaurantSettings,
  setRestaurantReservationSettings: setRestaurantReservationSettingsSlice,
  getRestaurantReservationSettings: getRestaurantReservationSettingsSlice,
  getAnnouncementSettings: getAnnouncementSettingsSlice,
  setAnnouncementSettings: setAnnouncementSettingsSlice,
  getSurveySettings: getSurveySettingsSlice,
  setSurveySettings: setSurveySettingsSlice,
  setRestaurantTheme: setRestaurantThemeSlice,
  setRestaurantTvMenu: setRestaurantTvMenuSlice,
});

export default restaurantSlice;
