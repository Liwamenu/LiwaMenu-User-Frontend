import i18n from "../config/i18n";

// License-package type → translation key. Resolved through i18n at call
// time so labels follow the active language (was previously baked-in TR
// strings: "QR Lisans" / "TV Lisans").
const LICENSE_TYPE_LABEL_KEYS = {
  QRLicensePackage: "paymentsPage.license_qr",
  TVLicensePackage: "paymentsPage.license_tv",
};

export const getLicenseTypeLabel = (type) => {
  const key = LICENSE_TYPE_LABEL_KEYS[type];
  if (!key) return type || "";
  return i18n.t(key);
};

const LicenseTypeEnums = Object.entries(LICENSE_TYPE_LABEL_KEYS).map(
  ([value, labelKey]) => ({ value, labelKey }),
);

export default LicenseTypeEnums;
