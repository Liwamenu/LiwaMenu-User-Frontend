// MODULES
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Check,
  FileText,
  Lock,
  Mail,
  MailCheck,
  User,
  X,
} from "lucide-react";

// CONTEXT
import { usePopup } from "../context/PopupContext";

// COMP
import PrivacyPolicy from "./privacyPolicy";
import LoadingI from "../assets/anim/loading";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";
import AuthPhoneField from "../components/auth/AuthPhoneField";
import { EmailSuggestion } from "./login";

// FUNC
import { formatEmail, toNameCase } from "../utils/utils";

// REDUX
import { registerUser, resetRgisterState } from "../redux/auth/registerSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const Register = () => {
  const toastId = useRef();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { popupContent, setPopupContent } = usePopup();

  const { loading, success, error } = useSelector(
    (state) => state.auth.register,
  );

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+90");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [checked, setChecked] = useState(false);
  const [toConfirm, setToConfirm] = useState(false);

  const confirmRegister = (e) => {
    e.preventDefault();

    // Full required-field check moved to the top so the confirm modal
    // never opens when any field is empty. Previously only the post-
    // modal `register()` validated this, which let users get all the
    // way to the confirmation step on a half-filled form and then see
    // a quiet toast — they thought registration was succeeding when
    // nothing was actually being dispatched. The form's `noValidate`
    // attribute disables HTML5 `required`, so this JS gate is the
    // only thing actually blocking empty submissions.
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !phoneNumber ||
      !email.trim() ||
      !password ||
      !password2
    ) {
      toast.error(t("register.fill_all_fields"));
      return;
    }
    if (password !== password2) {
      toast.error(t("register.passwords_not_match"));
      return;
    }
    if (phoneNumber.length < 12) {
      toast(t("register.phone_incomplete"));
      return;
    }
    if (!checked) {
      toast.error(t("register.accept_terms"));
      return;
    }
    setPopupContent(
      <Confirm
        email={email}
        popupContent={popupContent}
        setPopupContent={setPopupContent}
        onClick={register}
      />,
    );
  };

  const register = () => {
    setPopupContent(null);
    if (firstName && lastName && phoneNumber && password) {
      dispatch(
        registerUser({
          email,
          phoneNumber,
          password,
          firstName,
          lastName,
        }),
      );
    } else {
      toast(t("register.fill_all_fields"));
    }
  };

  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading(t("register.processing"));
    } else if (success) {
      setToConfirm(true);
      toast.dismiss(toastId.current);
      toast.success(t("register.verification_sent"));
      dispatch(resetRgisterState());
    } else if (error) {
      toast.dismiss(toastId.current);
      toast.error(error.message);
      dispatch(resetRgisterState());
    }
  }, [loading, success, error, dispatch, t]);

  if (toConfirm) {
    return (
      <AuthShell>
        <CheckEmail email={email} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      maxWidth="xl"
      formFooter={
        <>
          {t("register.have_account")}{" "}
          <Link
            to="/login"
            className="font-semibold text-[--primary-1] hover:underline"
          >
            {t("register.login_link")}
          </Link>
        </>
      }
    >
      <form onSubmit={confirmRegister} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="firstName"
            label={t("register.first_name")}
            icon={User}
            value={firstName}
            onChange={(e) => setFirstName(toNameCase(e.target.value))}
            required
            placeholder={t("register.first_name")}
            autoComplete="given-name"
            maxLength={40}
          />
          <AuthField
            id="lastName"
            label={t("register.last_name")}
            icon={User}
            value={lastName}
            onChange={(e) => setLastName(toNameCase(e.target.value))}
            required
            placeholder={t("register.last_name")}
            autoComplete="family-name"
            maxLength={40}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthPhoneField
            id="phoneNumber"
            label={t("register.phone_label", { defaultValue: "Telefon" })}
            value={phoneNumber}
            onChange={(phone) => setPhoneNumber(phone)}
            required
            placeholder={t("register.phone_placeholder")}
          />
          <div>
            <AuthField
              id="email"
              label={t("register.email_label", { defaultValue: "E-Posta" })}
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(formatEmail(e.target.value))}
              required
              placeholder={t("register.email_placeholder")}
              autoComplete="email"
            />
            <EmailSuggestion email={email} onApply={setEmail} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="password"
            label={t("register.password_placeholder")}
            icon={Lock}
            password
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t("register.password_placeholder")}
            autoComplete="new-password"
            minLength={6}
            maxLength={20}
          />
          <AuthField
            id="password2"
            label={t("register.password_confirm_placeholder")}
            icon={Lock}
            password
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            placeholder={t("register.password_confirm_placeholder")}
            autoComplete="new-password"
            minLength={6}
            maxLength={20}
          />
        </div>

        <TermsCheckbox checked={checked} setChecked={setChecked} />

        <button
          type="submit"
          disabled={loading}
          className="group w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-white text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {loading ? (
            <LoadingI className="size-5 text-white fill-white/40" />
          ) : (
            <>
              {t("register.continue")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;

// ----- Subcomponents -----

const TermsCheckbox = ({ checked, setChecked }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const openPrivacy = () =>
    setPopupContent(
      <PrivacyPopup
        onAccept={() => {
          setChecked(true);
          setPopupContent(null);
        }}
      />,
    );

  return (
    <label className="flex items-start gap-3 cursor-pointer text-sm select-none pt-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`mt-0.5 grid place-items-center size-5 shrink-0 rounded-md border-2 transition ${
          checked
            ? "bg-[--primary-1] border-[--primary-1]"
            : "bg-white border-slate-300"
        }`}
      >
        {checked && <Check className="size-3.5 text-white" strokeWidth={3} />}
      </span>
      <span className="text-slate-600 leading-snug">
        <button
          type="button"
          onClick={openPrivacy}
          className="text-[--primary-1] font-medium hover:underline"
        >
          {t("register.terms_button")}
        </button>
        {t("register.terms_suffix")}
      </span>
    </label>
  );
};

const PrivacyPopup = ({ onAccept }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const close = () => setPopupContent(null);

  return (
    <div className="light bg-white shadow-2xl ring-1 ring-slate-200 max-w-3xl w-full mx-auto flex flex-col rounded-none sm:rounded-2xl overflow-hidden max-h-[100dvh] sm:max-h-[90dvh] h-[100dvh] sm:h-auto">
      {/* Top gradient strip */}
      <div
        className="h-1 shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 shrink-0">
        <div className="grid place-items-center size-10 shrink-0 rounded-xl bg-indigo-50 text-[--primary-1]">
          <FileText className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {t("register.terms_modal_title")}
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            {t("register.terms_modal_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="grid place-items-center size-9 shrink-0 -mt-0.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6">
        <PrivacyPolicy />
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 px-5 sm:px-7 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
        <button
          type="button"
          onClick={close}
          className="h-11 sm:h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          {t("register.terms_close")}
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="h-11 sm:h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl text-white font-semibold shadow-md shadow-indigo-500/25 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Check className="size-4" strokeWidth={3} />
          {t("register.terms_accept")}
        </button>
      </div>
    </div>
  );
};

const Confirm = ({ email, setPopupContent, onClick }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-2xl ring-1 ring-slate-100">
      <div className="grid place-items-center size-14 rounded-full bg-indigo-50 text-[--primary-1] mx-auto mb-5">
        <MailCheck className="size-7" />
      </div>
      <p className="text-center text-sm text-slate-500">
        {t("register.confirm_line1")}
      </p>
      <p className="text-center text-base font-semibold text-[--primary-1] break-all mt-1">
        {email}
      </p>
      <p className="text-center text-sm text-slate-500 mt-3 mb-6">
        {t("register.confirm_line2")}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="h-11 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          {t("register.confirm_edit")}
        </button>
        <button
          type="button"
          onClick={onClick}
          className="h-11 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:brightness-110"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {t("register.confirm_yes")}
        </button>
      </div>
    </div>
  );
};

const CheckEmail = ({ email }) => {
  const { t } = useTranslation();
  return (
    <div className="text-center">
      <div className="grid place-items-center size-16 rounded-full bg-indigo-50 text-[--primary-1] mx-auto mb-6">
        <MailCheck className="size-8" />
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
        {t("register.verify_title")}
      </h2>
      <p className="text-slate-500 text-sm leading-relaxed">
        <span className="font-semibold text-[--primary-1] break-all">
          {email}
        </span>{" "}
        {t("register.verify_message")}
      </p>
      <Link
        to="/login"
        className="mt-8 inline-flex items-center justify-center w-full h-12 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:brightness-110"
        style={{ background: PRIMARY_GRADIENT }}
      >
        {t("register.login_link")}
      </Link>
    </div>
  );
};
