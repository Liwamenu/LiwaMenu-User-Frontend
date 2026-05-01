import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Globe,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

// Brand contact number rendered as a click-to-WhatsApp link. Strip
// the leading 0 from the local format and prepend +90 so wa.me opens
// a chat with our line on every platform that has WhatsApp installed.
const WHATSAPP_HREF = "https://wa.me/908508407807";
const WHATSAPP_DISPLAY = "0850 840 78 07";

import i18n from "../../config/i18n";
import LanguagesEnums from "../../enums/languagesEnums";

const LANG_STORAGE_KEY = "liwamenu_lang";

const MAX_W_CLASS = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const AuthShell = ({
  title,
  subtitle,
  children,
  formFooter,
  maxWidth = "md",
}) => {
  const { t } = useTranslation();
  const langRef = useRef(null);

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("0");

  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    let matched = saved
      ? LanguagesEnums.find((l) => l.value === saved)
      : null;
    if (!matched) {
      const currentIso = i18n.language?.split("-")[0]?.toLowerCase();
      matched =
        LanguagesEnums.find((l) => l.id === currentIso) || LanguagesEnums[0];
    }
    setSelectedLang(matched.value);
    i18n.changeLanguage(matched.id.toLowerCase());
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    if (langOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  const handleLangChange = (value, id) => {
    setLangOpen(false);
    setSelectedLang(value);
    localStorage.setItem(LANG_STORAGE_KEY, value);
    i18n.changeLanguage(id.toLowerCase());
  };

  const currentLang = LanguagesEnums.find((l) => l.value === selectedLang);

  const features = [
    { icon: Sparkles, text: t("auth.brand_feature_1") },
    { icon: Zap, text: t("auth.brand_feature_2") },
    { icon: ShieldCheck, text: t("auth.brand_feature_3") },
  ];

  const widthClass = MAX_W_CLASS[maxWidth] || MAX_W_CLASS.md;

  return (
    <section className="light min-h-[100dvh] flex bg-white">
      {/* LEFT — BRAND PANEL (lg+) */}
      <aside
        className="hidden lg:flex relative flex-col justify-between w-1/2 p-12 xl:p-16 text-white overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #06b6d4 100%)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-fuchsia-500/30 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-20 w-[28rem] h-[28rem] rounded-full bg-cyan-400/30 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-indigo-300/20 blur-3xl pointer-events-none"
        />

        <div className="relative z-10">
          <Link to="/" className="font-[conthrax] text-3xl tracking-wide">
            LiwaMenu
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
            {t("auth.brand_headline")}
          </h2>
          <p className="text-white/80 text-base xl:text-lg leading-relaxed mb-10">
            {t("auth.brand_description")}
          </p>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid place-items-center size-9 rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                  <Icon className="size-4" />
                </span>
                <span className="text-white/90">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-white/70">
          {t("auth.footer_credit")} ·{" "}
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white underline-offset-2 hover:underline"
          >
            <MessageCircle className="size-3.5 text-emerald-300" />
            {WHATSAPP_DISPLAY}
          </a>
        </div>
      </aside>

      {/* RIGHT — FORM PANEL */}
      <main className="relative flex-1 flex flex-col w-full lg:w-1/2 min-h-[100dvh] bg-white">
        <header className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-5">
          {/* Mobile / tablet brand badge — desktop hides this and shows
              the brand pill in the left aside instead. Same gradient
              the app uses for primary surfaces, so the brand reads as
              "the app", not just a label. */}
          <Link
            to="/"
            className="lg:hidden inline-flex items-center font-[conthrax] text-2xl tracking-wide text-white px-5 py-1.5 rounded-full shadow-md shadow-indigo-500/25 ring-1 ring-white/15"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            LiwaMenu
          </Link>

          <div className="ml-auto relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition"
            >
              <Globe className="size-3.5" />
              <span className="hidden sm:inline">{currentLang?.label}</span>
              <span className="sm:hidden uppercase">{currentLang?.id}</span>
              <ChevronDown
                className={`size-3.5 transition-transform ${
                  langOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {langOpen && (
              <ul className="absolute right-0 mt-2 w-44 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg ring-1 ring-black/5 py-1 z-50">
                {LanguagesEnums.map((lang) => {
                  const active = selectedLang === lang.value;
                  return (
                    <li key={lang.value}>
                      <button
                        type="button"
                        onClick={() => handleLangChange(lang.value, lang.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition ${
                          active
                            ? "font-semibold text-[--primary-1] bg-indigo-50"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {lang.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-6 sm:py-10">
          <div className={`w-full ${widthClass}`}>
            {(title || subtitle) && (
              <div className="mb-8">
                {title && (
                  <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
                )}
              </div>
            )}
            {children}
            {formFooter && (
              <div className="mt-6 text-center text-sm text-slate-500">
                {formFooter}
              </div>
            )}
          </div>
        </div>

        <footer className="lg:hidden border-t border-slate-100 px-5 sm:px-8 py-4 text-center text-[11px] text-slate-500">
          {t("auth.footer_credit")} ·{" "}
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[--primary-1] font-medium"
          >
            <MessageCircle className="size-3.5 text-emerald-500" />
            {WHATSAPP_DISPLAY}
          </a>
        </footer>
      </main>
    </section>
  );
};

export default AuthShell;
