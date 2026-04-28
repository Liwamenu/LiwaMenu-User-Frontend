//MODULES
import { useTranslation } from "react-i18next";
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { User, LogOut, ChevronRight } from "lucide-react";

//COMP
import { usePopup } from "../../context/PopupContext";
import { getTheme, setTheme } from "../../utils/localStorage";
import { SettingsI, MenuI, SunI, MoonI } from "../../assets/icon";

//ENUMS
import LanguagesEnums from "../../enums/languagesEnums";

//REDUX
import { clearAuth } from "../../redux/api";
import {
  updateUserLang,
  resetUpdateUserLangSlice,
} from "../../redux/user/updateUserLangSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Center title — shows the active restaurant's name when the user is inside
// any /restaurant/... route, otherwise falls back to the Liwamenu brand.
// Pulls the name from `getRestaurant.restaurant` first, then falls back to
// the restaurant list (`getRestaurants.restaurants.data`) since not every
// entry path populates the single-restaurant slice.
function BrandOrRestaurantName() {
  const location = useLocation();
  const single = useSelector(
    (s) => s.restaurants.getRestaurant.restaurant,
  );
  const list = useSelector(
    (s) => s.restaurants.getRestaurants.restaurants?.data,
  );
  const inRestaurantArea = location.pathname.startsWith("/restaurant/");

  // Pull the id out of the URL: paths look like /restaurant/<feature>/<id>/...
  const urlId = inRestaurantArea
    ? location.pathname.split("/").filter(Boolean)[2] || null
    : null;

  // Prefer the single-restaurant cache when its id matches the URL; otherwise
  // look it up in the list. Mismatches are common right after the user
  // navigates between restaurants.
  const restaurant =
    (single && (!urlId || single.id === urlId) ? single : null) ||
    (urlId && Array.isArray(list)
      ? list.find((r) => r.id === urlId)
      : null);

  if (inRestaurantArea && restaurant?.name) {
    return (
      <Link
        to="/"
        title={restaurant.name}
        className="flex items-center min-w-0 max-w-[55%] sm:max-w-[60%] gap-2 px-2"
      >
        <span
          className="grid place-items-center size-8 rounded-lg text-white text-xs font-bold shadow-md shadow-indigo-500/20 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
          aria-hidden="true"
        >
          {(restaurant.name || "")
            .split(" ")
            .map((s) => s[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "R"}
        </span>
        <span className="text-base sm:text-lg font-semibold text-[--black-1] truncate tracking-tight">
          {restaurant.name}
        </span>
      </Link>
    );
  }
  return (
    <Link
      to="/"
      className="flex items-center text-3xl max-sm:text-xl text-[--primary-1] font-[conthrax]"
    >
      Liwamenu
    </Link>
  );
}

function Header({ openSidebar, setOpenSidebar }) {
  const langRef = useRef();
  const param = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const headerSettingsRef = useRef();
  const { t, i18n } = useTranslation();

  const KEY = import.meta.env.VITE_LOCAL_KEY;
  const userString = localStorage.getItem(KEY);
  const localData = (userString && JSON.parse(userString)) || {};
  const user = localData.user;
  const [open, setOpen] = useState(false);

  const isAdmin = user?.role === 0;
  const fullName =
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "";
  const initials =
    fullName
      .split(" ")
      .map((s) => s[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  const isProfileActive = location.pathname.startsWith("/profile");

  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(user?.defaultLang || "0");

  const { success: lngSucc, error: lngErr } = useSelector(
    (s) => s.user.updateUserLang,
  );

  // LOGOUT — purely client-side: drop the persisted auth + reset Redux,
  // no backend call so the user can sign out even when offline / when the
  // session has already expired on the server.
  const handleLogout = () => {
    setOpen(false);
    clearAuth();
    dispatch({ type: "LOGOUT" });
    window.location.href = "/login";
  };

  //REF
  const { contentRef, setContentRef } = usePopup();
  useEffect(() => {
    if (headerSettingsRef) {
      const refs = contentRef.filter((ref) => ref.id !== "headerSettings");
      setContentRef([
        ...refs,
        {
          id: "headerSettings",
          outRef: null,
          ref: headerSettingsRef,
          callback: () => setOpen(false),
        },
      ]);
    }
  }, [headerSettingsRef, open]);

  // Handle language change
  const handleLangChange = (code, id) => {
    setLangOpen(false);
    setSelectedLang(code);

    dispatch(updateUserLang({ defaultLang: code }));
    i18n.changeLanguage(id.toLowerCase());
  };

  useEffect(() => {
    if (lngSucc) {
      const setData = JSON.stringify({
        ...localData,
        user: { ...user, defaultLang: selectedLang },
      });
      localStorage.setItem(KEY, setData);
      dispatch(resetUpdateUserLangSlice());
    }
    lngErr && dispatch(resetUpdateUserLangSlice());
  }, [lngSucc, lngErr]);

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
    <>
      <header className="fixed top-0 right-0 left-0 flex flex-col justify-center bg-[--white-1] z-[99]">
        <nav className="w-full h-16 flex justify-between items-center py-3.5 max-md:px-5 px-[4%] border-b border-[--border-1]">
          <div
            className="text-[--gr-1] cursor-pointer"
            onClick={() => setOpenSidebar(!openSidebar)}
          >
            <MenuI
              className={`${param["*"] === "orders" ? "" : "lg:hidden"}`}
            />
          </div>

          <BrandOrRestaurantName />


          <div className="flex items-center gap-4 max-sm:gap-2">
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

            <button
              onClick={() => setTheme(getTheme() == "light" ? "dark" : "light")}
              className="flex justify-center items-center w-10 h-10 bg-[--light-1] text-[--primary-1] rounded-3xl"
            >
              {getTheme() == "light" ? <SunI /> : <MoonI />}
            </button>

            <div
              className="flex justify-center items-center relative"
              ref={headerSettingsRef}
            >
              <button
                type="button"
                aria-label={t("userProfile.menu") || "Hesap"}
                className={`grid place-items-center size-10 rounded-full text-[--gr-1] hover:text-[--primary-1] transition border ${
                  open
                    ? "bg-[--primary-1]/10 border-[--primary-1]/30 text-[--primary-1]"
                    : "bg-[--light-1] border-transparent"
                }`}
                onClick={() => setOpen(!open)}
              >
                <SettingsI strokeWidth={1.5} className="size-6" />
              </button>

              {/* Settings dropdown — user card + actions */}
              <div
                className={`absolute top-12 right-0 z-[100] w-72 rounded-xl border border-[--border-1] bg-[--white-1] shadow-xl overflow-hidden transition-all origin-top-right ${
                  open
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {/* Gradient strip */}
                <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

                {/* User card */}
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-3 border-b border-[--border-1] transition ${
                    isProfileActive
                      ? "bg-indigo-50 dark:bg-indigo-500/10"
                      : "hover:bg-[--white-2]"
                  }`}
                >
                  <span
                    className="grid place-items-center size-11 rounded-full text-white font-semibold text-sm shrink-0 shadow-md shadow-indigo-500/20"
                    style={{ background: PRIMARY_GRADIENT }}
                    aria-hidden="true"
                  >
                    {initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[--black-1] truncate">
                      {fullName || t("userProfile.default_name")}
                    </p>
                    <p className="text-[11px] text-[--gr-1] truncate">
                      {user?.email || (
                        <span>
                          {isAdmin
                            ? t("userProfile.admin")
                            : t("userProfile.user")}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      isProfileActive ? "text-[--primary-1]" : "text-[--gr-2]"
                    }`}
                  />
                </Link>

                {/* Actions */}
                <div className="p-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[--black-2] hover:bg-[--white-2] hover:text-[--primary-1] transition"
                  >
                    <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
                      <User className="size-3.5" />
                    </span>
                    {t("userProfile.profile") || "Profil"}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition dark:hover:bg-rose-500/10"
                  >
                    <span className="grid place-items-center size-7 rounded-md bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300 shrink-0">
                      <LogOut className="size-3.5" />
                    </span>
                    {t("userProfile.logout") || "Çıkış Yap"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Header;
