// Locale-aware display-name picker for backend entities that ship both
// a Turkish `name` and an English `nameEn` (LicensePackage is the
// current case; the rule generalizes to any future dual-named entity).
//
// Rule: when the active i18n language is Turkish (`tr*`), return the
// Turkish `name`. Otherwise return `nameEn`, falling back to `name`
// when the English value is missing so the UI never blanks out.
//
// Casing tolerance: .NET payloads sometimes ship PascalCase, briefs may
// quote the field as `nameEN`, and a lite endpoint may use camelCase.
// We accept all common variants in a single lookup so callers don't
// have to normalize the row first.

import i18n from "../config/i18n";

const FIRST = (...vals) => {
  for (const v of vals) {
    if (v != null && v !== "") return v;
  }
  return "";
};

const readName = (obj) =>
  FIRST(obj?.name, obj?.Name);

const readNameEn = (obj) =>
  FIRST(obj?.nameEn, obj?.NameEn, obj?.nameEN, obj?.NameEN);

const isTurkish = (lng) =>
  typeof lng === "string" && lng.toLowerCase().startsWith("tr");

/**
 * Pick the right name for the current language.
 * @param {{ name?: string, nameEn?: string }} obj
 * @param {string} [lng]  Defaults to the current i18n language.
 * @returns {string}
 */
export function pickLocalizedName(obj, lng) {
  if (!obj) return "";
  const lang = lng ?? i18n.language ?? "tr";
  const tr = readName(obj);
  const en = readNameEn(obj);
  if (isTurkish(lang)) return tr || en || "";
  return en || tr || "";
}

/**
 * Variant for basket / payment rows where the columns are prefixed.
 *   licensePackageName   ← TR
 *   licensePackageNameEn ← EN (any casing)
 * Falls back to the prefix-less name pair so a single normalized
 * package object (post-parseBasket) is also accepted.
 */
export function pickLocalizedPackageName(item, lng) {
  if (!item) return "";
  const lang = lng ?? i18n.language ?? "tr";
  const tr = FIRST(
    item.licensePackageName,
    item.LicensePackageName,
    item.name,
    item.Name,
  );
  const en = FIRST(
    item.licensePackageNameEn,
    item.LicensePackageNameEn,
    item.licensePackageNameEN,
    item.LicensePackageNameEN,
    item.nameEn,
    item.NameEn,
    item.nameEN,
    item.NameEN,
  );
  if (isTurkish(lang)) return tr || en || "";
  return en || tr || "";
}
