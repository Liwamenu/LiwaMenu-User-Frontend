//MODULES
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Inbox, Mail, MailCheck } from "lucide-react";

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

  const sendLink = (e) => {
    e?.preventDefault();
    dispatch(forgotPassword({ toAddress: email }));
  };

  useEffect(() => {
    if (success) {
      setSent(true);
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
      dispatch(resetForgotPassword());
    }
  }, [success, error, dispatch, t, email]);

  if (sent) {
    return (
      <AuthShell>
        <EmailSentStep
          email={email}
          loading={loading}
          onResend={() => sendLink()}
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
      <form onSubmit={sendLink} className="space-y-4" noValidate>
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

        <button
          type="submit"
          disabled={loading || !email}
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
