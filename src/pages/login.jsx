//MODULES
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

// Brand WhatsApp link reused from the AuthShell pattern — Login keeps
// its own custom auth shell so the constants are duplicated here
// rather than imported from AuthShell to avoid a back-edge.
const WHATSAPP_HREF = "https://wa.me/908508407807";
const WHATSAPP_DISPLAY = "0850 840 78 07";

//REDUX
import { getAuth } from "../redux/api";
import { login, resetLoginState } from "../redux/auth/loginSlice";

//UTILS
import { suggestEmailDomain } from "../utils/utils";

// CONTEXT
import { useFirebase } from "../context/firebase";

// CONFIG / ENUMS
import i18n from "../config/i18n";
import LanguagesEnums from "../enums/languagesEnums";

// ICONS
import LoadingI from "../assets/anim/loading";

const LANG_STORAGE_KEY = "liwamenu_lang";

function generateCaptcha() {
  return {
    num1: Math.floor(Math.random() * 9) + 1,
    num2: Math.floor(Math.random() * 9) + 1,
    answer: "",
  };
}

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pushToken, notificationPermission, requestNotificationAccess } =
    useFirebase();

  const langRef = useRef(null);
  const token = getAuth()?.token;
  const { success, loading, error } = useSelector((state) => state.auth.login);

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("0");
  const [captcha, setCaptcha] = useState(() => generateCaptcha());

  const captchaValid =
    captcha.answer !== "" &&
    parseInt(captcha.answer, 10) === captcha.num1 + captcha.num2;

  const refreshCaptcha = () => setCaptcha(generateCaptcha());

  // Language: load + outside-click close
  useEffect(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    let matched = saved
      ? LanguagesEnums.find((l) => l.value === saved)
      : null;
    if (!matched) {
      // No manual selection — defer to i18n's resolved language (detector → navigator)
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

  const handleEnableNotifications = async () => {
    const { permission, token: pushTok } = await requestNotificationAccess();
    if (permission === "granted" && pushTok) {
      toast.success(t("auth.notification_granted"));
      return;
    }
    if (permission === "denied") {
      window.alert(t("auth.notification_blocked"));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!emailOrPhone || !password || !captchaValid || loading) return;
    dispatch(login({ emailOrPhone, password, pushToken: pushToken || null }));
  };

  useEffect(() => {
    if (loading) {
      toast.loading(t("auth.login_loading"));
    } else if (error) {
      toast.dismiss();
      if (error?.statusCode == 422) navigate("/verify");
      if (error.statusCode == 403) {
        toast.error(t("auth.login_inactive"));
      } else {
        toast.error(error.message);
      }
      dispatch(resetLoginState());
    } else if (success) {
      navigate("/restaurants");
      toast.dismiss();
      toast.success(t("auth.login_success"));
      dispatch(resetLoginState());
    }
  }, [loading, success, error, dispatch, navigate, t]);

  useEffect(() => {
    if (token) navigate("/restaurants");
  }, [token]);

  const features = [
    { icon: Sparkles, text: t("auth.brand_feature_1") },
    { icon: Zap, text: t("auth.brand_feature_2") },
    { icon: ShieldCheck, text: t("auth.brand_feature_3") },
  ];

  return (
    <section className="light min-h-[100dvh] flex bg-white">
      {/* LEFT — BRAND PANEL (lg+) */}
      <aside
        className="hidden lg:flex relative flex-col justify-between w-1/2 p-12 xl:p-16 text-white overflow-hidden bg-slate-900"
        style={{
          backgroundImage: "url('/images/lwmenuback.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 via-slate-900/70 to-cyan-900/70 pointer-events-none"
        />

        <div className="relative z-10 flex justify-center">
          <Link
            to="/"
            className="font-[conthrax] text-3xl tracking-wide bg-indigo-950/85 ring-1 ring-white/10 px-7 py-2.5 rounded-full shadow-lg shadow-indigo-950/30 backdrop-blur-sm"
          >
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

        <div className="relative z-10 -mx-12 xl:-mx-16 -mb-12 xl:-mb-16 text-center text-xs text-white/85 bg-indigo-950/50 ring-1 ring-white/10 px-5 py-3 backdrop-blur-sm">
          {t("auth.footer_credit")}
          <span className="text-white/50 mx-2">-</span>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-white underline-offset-2 hover:underline"
          >
            <MessageCircle className="size-3.5 text-emerald-300" />
            {WHATSAPP_DISPLAY}
          </a>
          <span className="text-white/50 mx-2">-</span>
          <a
            href="https://www.liwasoft.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline-offset-2 hover:underline"
          >
            www.liwasoft.com
          </a>
        </div>
      </aside>

      {/* RIGHT — FORM PANEL */}
      <main className="relative flex-1 flex flex-col w-full lg:w-1/2 min-h-[100dvh] bg-white">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 sm:px-8 lg:px-10 py-5">
          {/* Mobile / tablet brand badge — same styled pill AuthShell
              uses on its non-Login auth screens, so Login matches the
              Register / ForgotPassword treatment on small viewports. */}
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

        {/* Form body */}
        <div className="flex-1 flex items-center justify-center px-5 sm:px-8 py-6 sm:py-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                {t("auth.login_title")}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {t("auth.login_subtitle")}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              {/* Email/phone — visible label removed (the placeholder is
                  self-explanatory). Kept as a screen-reader-only label so
                  assistive tech still has a proper name to announce. */}
              <div>
                <label htmlFor="emailOrPhone" className="sr-only">
                  {t("auth.email_or_phone_label")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <input
                    id="emailOrPhone"
                    name="emailOrPhone"
                    type="text"
                    required
                    autoComplete="username"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder={t("auth.email_or_phone_placeholder")}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
                <EmailSuggestion
                  email={emailOrPhone}
                  onApply={setEmailOrPhone}
                />
              </div>

              {/* Password — visible label removed (placeholder covers it).
                  "Şifremi unuttum?" sits below the input, right-aligned —
                  natural reading flow: try password first, then notice the
                  recovery link if you can't recall it. */}
              <div>
                <label htmlFor="password" className="sr-only">
                  {t("auth.password_label")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={4}
                    maxLength={20}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.password_placeholder")}
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={
                      showPassword
                        ? t("auth.hide_password")
                        : t("auth.show_password")
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link
                    to="/forgotPassword"
                    className="text-xs font-medium text-[--primary-1] hover:underline"
                  >
                    {t("auth.forgot_password")}
                  </Link>
                </div>
              </div>

              {/* Captcha */}
              <div
                className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 transition ${
                  captchaValid
                    ? "border-green-200 bg-green-50/40"
                    : "border-slate-200"
                }`}
              >
                <ShieldCheck
                  className={`size-5 shrink-0 ${
                    captchaValid ? "text-green-600" : "text-[--primary-1]"
                  }`}
                />
                <span className="text-sm font-semibold text-slate-700 select-none whitespace-nowrap">
                  {captcha.num1} + {captcha.num2} =
                </span>
                <input
                  id="captchaAnswer"
                  name="captchaAnswer"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  value={captcha.answer}
                  onChange={(e) =>
                    setCaptcha((c) => ({
                      ...c,
                      answer: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="w-14 h-9 px-2 text-center rounded-lg border border-slate-200 bg-white text-slate-900 outline-none transition focus:border-[--primary-1] focus:ring-2 focus:ring-indigo-100 font-semibold"
                />
                {captchaValid && (
                  <span className="grid place-items-center size-6 rounded-full bg-green-100 text-green-700">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  aria-label={t("auth.captcha_refresh")}
                  className="ml-auto grid place-items-center size-8 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <RefreshCw className="size-4" />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  loading || !emailOrPhone || !password || !captchaValid
                }
                className="group w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-white text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-indigo-500/25 disabled:hover:brightness-100 mt-2"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
                }}
              >
                {loading ? (
                  <LoadingI className="size-5 text-white fill-white/40" />
                ) : (
                  <>
                    {t("auth.login_button")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t("auth.no_account")}{" "}
              <Link
                to="/register"
                className="font-semibold text-[--primary-1] hover:underline"
              >
                {t("auth.register_link")}
              </Link>
            </p>
          </div>
        </div>

        {/* Notifications CTA — bottom of panel, just before footer */}
        {notificationPermission !== "granted" && (
          <div className="px-5 sm:px-8 lg:px-10 pb-4">
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="w-full flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300 transition px-3.5 py-3 text-left"
            >
              <span className="grid place-items-center size-9 shrink-0 rounded-lg bg-white text-[--primary-1] ring-1 ring-slate-200">
                <Bell className="size-4" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-semibold text-slate-900">
                  {t("auth.enable_notifications_button")}
                </span>
                <span className="block text-[11px] text-slate-500 line-clamp-2">
                  {t("auth.enable_notifications_text")}
                </span>
              </span>
              <ArrowRight className="size-4 text-slate-400 shrink-0" />
            </button>
          </div>
        )}

        {/* Mobile footer */}
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
}

export default Login;

// Reusable email-typo suggestion (used in login + register)
export const EmailSuggestion = ({ email, onApply }) => {
  const { t } = useTranslation();
  const suggestion = suggestEmailDomain(email);
  if (!suggestion) return null;
  return (
    <p className="mt-1.5 text-xs text-slate-500">
      {t("auth.did_you_mean")}{" "}
      <button
        type="button"
        onClick={() => onApply(suggestion)}
        className="font-semibold text-[--primary-1] hover:underline"
      >
        {suggestion}
      </button>
      ?
    </p>
  );
};
