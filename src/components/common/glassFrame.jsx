import { Link } from "react-router-dom";
import imgUrl from "../../assets/img/bg-4.png";
import { useEffect, useRef, useState } from "react";
import LanguagesEnums from "../../enums/languagesEnums";
import i18n from "../../config/i18n";

const GlassFrame = ({ component, className, className2 }) => {
  const langRef = useRef();
  const LANG_STORAGE_KEY = "liwamenu_lang";

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("0");

  // Handle language change
  const handleLangChange = (code, id) => {
    setLangOpen(false);
    setSelectedLang(code);

    localStorage.setItem(LANG_STORAGE_KEY, code);

    i18n.changeLanguage(id.toLowerCase());
  };

  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    let matched = savedLang
      ? LanguagesEnums.find((lang) => lang.value === savedLang)
      : null;
    if (!matched) {
      const currentIso = i18n.language?.split("-")[0]?.toLowerCase();
      matched =
        LanguagesEnums.find((lang) => lang.id === currentIso) ||
        LanguagesEnums[0];
    }
    setSelectedLang(matched.value);
    i18n.changeLanguage(matched.id.toLowerCase());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    }
    if (langOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [langOpen]);

  return (
    <section
      className={`px-[4%] pt-36 bg-no-repeat relative bg-black ${className}`}
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div>
        <div className="flex items-center px-4 absolute top-0 left-0 right-0 bg-gradient-to-r from-[--primary-1] to-indigo- bg-clip-text  z-[999]">
          <Link
            to="/"
            className="text-2xl p-4 font-[conthrax] text-center text-white w-full ml-20"
          >
            LiwaMenu
          </Link>

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <div
              className="text-[--black-1] cursor-pointer flex items-center"
              onClick={() => setLangOpen((v) => !v)}
            >
              <span className="ml-1 text-xs font-semibold uppercase">
                {
                  LanguagesEnums.filter((l) => l.value == selectedLang)[0]
                    ?.label
                }
              </span>
            </div>
            {langOpen && (
              <div className="absolute right-0 mt-2 flex flex-col gap-1 px-4 py-1 bg-[--white-1] text-[--black-1] border border-[--border-1] rounded shadow z-50">
                {LanguagesEnums.map((lang) => (
                  <div
                    key={lang.value}
                    className={`text-sm cursor-pointer hover:bg-[--light-3] ${
                      selectedLang === lang.value
                        ? "font-bold text-[--primary-1]"
                        : ""
                    }`}
                    onClick={() => handleLangChange(lang.value, lang.id)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`max-w-md mx-auto p-6 pt-10 text-[--white-1] bg-gray-400 rounded-lg bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-10 border border-[--gr-1] ${className2}`}
      >
        {component}
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-[999] text-white font-extralight p-1 text-xs bg-indigo-500/60 max-sm:text-center">
        LiwaMenu bir LiwaSoft iştirakidir.{" "}
        <span className="max-sm:hidden">- </span>
        <span className="max-sm:block">
          Müşteri Hizmetleri :{" "}
          <a href="tel:08508407807" className="text-lime-400">
            0850 840 78 07
          </a>
        </span>
      </div>
    </section>
  );
};

export default GlassFrame;
