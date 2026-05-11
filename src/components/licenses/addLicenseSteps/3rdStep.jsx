// Add License — invoice step.
//
// Identical form to Extend License's step 2 (same fields, same validation,
// same i18n keys under `extendLicense.*` which are generic enough for both
// flows — "Fatura Bilgileri" / "Billing Information"). Re-exported instead
// of cloned so the two paths stay in lockstep — any future field tweak
// (new tax field, identity validation change, etc.) lands in both at once.
//
// Step indicator label is already "Billing" / "Fatura" in both locales
// (`addLicense.step_3`), and addLicensePage.jsx already wires this slot
// with the exact prop shape this component expects:
//   { step, setStep, userData, setUserData, userInvData, setUserInvData }

export { default } from "../extendLicenseSteps/2ndStep";
