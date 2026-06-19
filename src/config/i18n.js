import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import LanguagesEnums from "../enums/languagesEnums";

// Import translation files from locales
import trTranslation from "../locales/TR/translation.json";
import enTranslation from "../locales/EN/translation.json";

const KEY = import.meta.env.VITE_LOCAL_KEY;
const userString = localStorage.getItem(KEY);
const { user } = JSON.parse(userString || "null") || {};
const userDefaultLangIso = LanguagesEnums.find(
  (l) => l.value == user?.defaultLang,
)?.id?.toLowerCase();

const resources = {
  tr: { translation: trTranslation },
  en: { translation: enTranslation },
};

const SUPPORTED = Object.keys(resources);

export const setTranslationLanguage = (id) => {
  const lang = LanguagesEnums.find((l) => l.value == id);
  if (!lang) return;
  i18n.changeLanguage(lang.id.toLowerCase());
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Mirror the marketing site's rule: Turkish browser → TR, anything else
    // → EN. The detector returns the browser language; supportedLngs filters
    // it, and an unsupported one (de/fr/ar/…) lands on this fallback. Was
    // "tr", which made every non-TR/non-EN browser open in Turkish while the
    // site opened in English.
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    // If user is logged in with explicit defaultLang, force it (skips detection).
    lng: userDefaultLangIso,
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "liwamenu_lang",
      caches: [],
      convertDetectedLanguage: (lng) => {
        if (lng == null) return undefined;
        // Existing UI stores numeric LanguagesEnums.value (e.g., "0", "1")
        if (/^\d+$/.test(lng)) {
          return LanguagesEnums.find((l) => l.value === lng)?.id || undefined;
        }
        // Navigator returns "tr-TR", "en-US" — strip region
        return String(lng).split("-")[0].toLowerCase();
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
