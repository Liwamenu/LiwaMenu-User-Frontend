import { combineReducers } from "@reduxjs/toolkit";
import getLicensePackagesSlice from "./getLicensePackagesSlice";

const licensePackagesSlice = combineReducers({
  getLicensePackages: getLicensePackagesSlice,
});

export default licensePackagesSlice;
