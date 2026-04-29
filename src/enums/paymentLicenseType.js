// `labelKey` (translation key) instead of hardcoded TR label so the chips
// switch with the active language. Call sites resolve via t(item.labelKey).
const paymentLicenseType = [
  {
    value: "ExtendLicense",
    labelKey: "paymentsPage.type_extend_license",
    id: 0,
  },
  { value: "NewLicense", labelKey: "paymentsPage.type_new_license", id: 1 },
  { value: "Link", labelKey: "paymentsPage.type_link", id: 2 },
];

export default paymentLicenseType;
