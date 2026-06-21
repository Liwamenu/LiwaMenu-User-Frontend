import i18n from "../config/i18n";

// License-package type → translation key. Resolved through i18n at call
// time so labels follow the active language (was previously baked-in TR
// strings: "QR Lisans" / "TV Lisans"). Kiosk + PaymentIntegration came
// in with the backend's per-type license split — added here so the
// PackageGroup header (and every other type-label reader) stops
// falling through to the raw enum string
// ("KioskLicensePackage" → "Kiosk Lisans" / "Kiosk License").
const LICENSE_TYPE_LABEL_KEYS = {
  QRLicensePackage: "paymentsPage.license_qr",
  TVLicensePackage: "paymentsPage.license_tv",
  KioskLicensePackage: "paymentsPage.license_kiosk",
  PaymentIntegrationLicensePackage: "paymentsPage.license_payment",
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
