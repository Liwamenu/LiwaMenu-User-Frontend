import { combineReducers } from "@reduxjs/toolkit";

import getReservationsSlice from "./getReservationsSlice";
import updateReservationStatusSlice from "./updateReservationStatusSlice";

const reservationsSlice = combineReducers({
  get: getReservationsSlice,
  updateStatus: updateReservationStatusSlice,
});

export default reservationsSlice;
