//MODULES
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Inbox,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

//REDUX
import {
  forgotPassword,
  resetForgotPassword,
} from "../redux/auth/forgotPasswordSlice";

//COMP
import LoadingI from "../assets/anim/loading";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";
const RESEND_COOLDOWN = 60;

// Simple arithmetic captcha (same pattern as Login) — a lightweight guard
// against scripted flooding of the password-reset endpoint. Regenerated
// after every attempt so each send needs a fresh solve.
function generateCaptcha() {
  return {
    num1: Math.floor(Math.random() * 9) + 1,
    num2: Math.floor(Math.random() * 9) + 1,
    answer: "",
  };
}

// Backend error messages sometimes embed a literal "<br/>" to put the
// e-mail address on its own line (e.g. "x@y.com<br/>Adresi ile sistemde
// kayıtlı bir kullanıcı bulunamadı"). react-hot-toast renders a string as
// plain text, so the tag showed up verbatim. Split on the <br> variants
// and insert real line-break nodes. Everything between the tags stays a
// plain string (rendered as escaped text), so no arbitrary backend HTML
// is injected.
const toMessageNodes = (msg) => {
  const text = String(msg ?? "").trim();
  if (!text) return text;
  return text
    .split(/<br\s*\/?>/i)
    .flatMap((part, i) => (i === 0 ? [part] : [<br key={i} />, part]));
};

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { success, loading, error } = useSelector(
    (state) => state.auth.forgotPassword,
  );

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [captcha, setCaptcha] = useState(() => generateCaptcha());

  const captchaValid =
    captcha.answer !== "" &&
    parseInt(captcha.answer, 10) === captcha.num1 + captcha.num2;
  const refreshCaptcha = () => setCaptcha(generateCaptcha());

  // Raw request — used by the resend button, which is gated by its own
  // 60s cooldown rather than the captcha.
  const submitRequest = () => {
    dispatch(forgotPassword({ toAddress: email }));
  };

  // Form submit — captcha-gated to block scripted flooding.
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (loading || !email || !captchaValid) return;
    submitRequest();
  };

  useEffect(() => {
    if (success) {
      setSent(true);
      setCaptcha(generateCaptcha());
      dispatch(resetForgotPassword());
      toast.success(t("forgotPassword.link_sent"));
    }
    if (error) {
      // The backend only reports "user not found" in message_EN; its
      // message_TR is a vague "Şifre sıfırlama e-postası gönderilemedi".
      // Detect that case and show a clearer message with the typed e-mail
      // on its own line; otherwise fall back to the localized message.
      const isUserNotFound = /user\s*not\s*found/i.test(
        error?.data?.message_EN || "",
      );
      const message = isUserNotFound
        ? `${email.trim()}<br/>${t(
            "forgotPassword.user_not_found",
            "Adresi ile sistemde kayıtlı bir kullanıcı bulunamadı",
          )}`
        : error.message;
      toast.error(<span>{toMessageNodes(message)}</span>);
      setCaptcha(generateCaptcha());
      dispatch(resetForgotPassword());
    }
  }, [success, error, dispatch, t, email]);

  if (sent) {
    return (
      <AuthShell>
        <EmailSentStep
          email={email}
          loading={loading}
          onResend={() => submitRequest()}
          onBack={() => setSent(false)}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
      formFooter={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-[--primary-1] hover:underline"
        >
          <ArrowLeft className="size-3.5" />
          {t("forgotPassword.back_to_login")}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <AuthField
          id="email"
          label={t("forgotPassword.email_label")}
          icon={Mail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t("forgotPassword.email_placeholder")}
          autoComplete="email"
        />

        <p className="text-xs text-slate-500 leading-relaxed">
          {t("forgotPassword.help_text")}
        </p>

        {/* Captcha — lightweight flood guard, same pattern as Login */}
        <div
          className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-2.5 transition ${
            captchaValid ? "border-green-200 bg-green-50/40" : "border-slate-200"
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
            id="fp-captcha"
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

        <button
          type="submit"
          disabled={loading || !email || !captchaValid}
          className="group w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-white text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {loading ? (
            <LoadingI className="size-5 text-white fill-white/40" />
          ) : (
            <>
              {t("forgotPassword.send")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;

// ----- Email-sent step -----

const EmailSentStep = ({ email, loading, onResend, onBack }) => {
  const { t } = useTranslation();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown <= 0]);

  const handleResend = () => {
    if (cooldown > 0 || loading) return;
    onResend();
    setCooldown(RESEND_COOLDOWN);
  };

  return (
    <div className="text-center">
      <div className="grid place-items-center size-16 rounded-full bg-indigo-50 text-[--primary-1] mx-auto mb-6">
        <MailCheck className="size-8" />
      </div>

      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
        {t("forgotPassword.email_sent_title")}
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed">
        <span className="font-semibold text-[--primary-1] break-all">
          {email}
        </span>{" "}
        {t("forgotPassword.email_sent_message")}
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-3 text-left">
        <Inbox className="size-5 text-[--primary-1] shrink-0 mt-0.5" />
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm text-slate-700 font-medium leading-snug">
            {t("forgotPassword.email_sent_instruction")}
          </p>
          <p className="text-xs text-slate-500 leading-snug">
            {t("forgotPassword.spam_hint")}
          </p>
        </div>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        {t("forgotPassword.didnt_receive")}{" "}
        {cooldown > 0 ? (
          <span className="text-slate-400">
            {t("forgotPassword.resend_in", { seconds: cooldown })}
          </span>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={handleResend}
            className="font-semibold text-[--primary-1] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {t("forgotPassword.resend")}
          </button>
        )}
      </p>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition"
      >
        <ArrowLeft className="size-3.5" />
        {t("forgotPassword.change_email")}
      </button>
    </div>
  );
};
