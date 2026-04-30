import { combineReducers } from "@reduxjs/toolkit";

// Slices
import getLocationSlice from "./getLocationSlice";

// `getLocation` is the only entry left here — it talks to Google Maps for
// reverse-geocoding when the user picks a pin. The previous CityDistrict /
// Neighbourhood / Currency / UserAddress slices were removed: they hit
// api.pentegrasyon.net which is a separate service we no longer rely on.
const dataSlice = combineReducers({
  getLocation: getLocationSlice,
});

export default dataSlice;
