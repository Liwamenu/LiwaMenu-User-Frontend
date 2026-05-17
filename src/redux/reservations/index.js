import { combineReducers } from "@reduxjs/toolkit";

import getReservationsSlice from "./getReservationsSlice";
import updateReservationStatusSlice from "./updateReservationStatusSlice";
import deleteReservationSlice from "./deleteReservationSlice";

const reservationsSlice = combineReducers({
  get: getReservationsSlice,
  updateStatus: updateReservationStatusSlice,
  delete: deleteReservationSlice,
});

export default reservationsSlice;
