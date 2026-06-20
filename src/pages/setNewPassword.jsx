//MODULES
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Lock, ShieldAlert } from "lucide-react";

//REDUX
import {
  setNewPassword,
  resetSetNewPassword,
} from "../redux/auth/setNewPasswordSlice";

//COMP
import LoadingI from "../assets/anim/loading";
import AuthShell from "../components/auth/AuthShell";
import AuthField from "../components/auth/AuthField";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const SetNewPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const { loading, success, error } = useSelector(
    (state) => state.auth.setNewPassword,
  );

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 6) {
      toast.error(t("setNewPassword.too_short"));
      return;
    }
    if (password !== password2) {
      toast.error(t("setNewPassword.passwords_match"));
      return;
    }
    // `email` and `token` come straight from the reset link's query
    // params. Send the token exactly as it arrives — no decode/encode.
    dispatch(
      setNewPassword({ emailOrPhone: email, token, newPassword: password }),
    );
  };

  useEffect(() => {
    if (success) {
      toast.success(t("setNewPassword.success"));
      // Defer the slice reset until the redirect actually fires. Resetting
      // here flips `success` back to false, which re-runs this effect and
      // triggers its cleanup (clearTimeout) before the 1200ms elapses — so
      // the navigate never happened and the user was stuck on this screen.
      const tid = setTimeout(() => {
        dispatch(resetSetNewPassword());
        navigate("/login");
      }, 1200);
      return () => clearTimeout(tid);
    }
    if (error) {
      // The common 400 cause is an expired / already-used token. Point
      // the user back to forgot-password rather than just echoing the
      // raw backend string.
      const expired = Number(error.statusCode) === 400;
      toast.error(
        expired ? t("setNewPassword.link_expired") : error.message,
      );
      dispatch(resetSetNewPassword());
    }
  }, [success, error, dispatch, navigate, t]);

  if (!token) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="grid place-items-center size-16 rounded-full bg-red-50 text-red-500 mx-auto mb-6">
            <ShieldAlert className="size-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t("setNewPassword.invalid_link_title")}
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {t("setNewPassword.invalid_link_message")}
          </p>
          <Link
            to="/forgotPassword"
            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-white font-semibold shadow-lg shadow-indigo-500/25 transition hover:brightness-110"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {t("setNewPassword.request_new")}
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={t("setNewPassword.title")}
      subtitle={t("setNewPassword.subtitle")}
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
      <form onSubmit={submit} className="space-y-4" noValidate>
        {email && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-xs">
            <span className="text-slate-500">
              {t("setNewPassword.account_label")}{" "}
            </span>
            <span className="font-semibold text-slate-900 break-all">
              {email}
            </span>
          </div>
        )}

        <AuthField
          id="password"
          label={t("setNewPassword.password_label")}
          icon={Lock}
          password
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder={t("setNewPassword.password_label")}
          autoComplete="new-password"
          minLength={6}
          maxLength={32}
        />

        <AuthField
          id="password2"
          label={t("setNewPassword.password_confirm_label")}
          icon={Lock}
          password
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          placeholder={t("setNewPassword.password_confirm_label")}
          autoComplete="new-password"
          minLength={6}
          maxLength={32}
        />

        <button
          type="submit"
          disabled={loading || !password || !password2}
          className="group w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl text-white text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-indigo-500/25 disabled:hover:brightness-100 mt-2"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {loading ? (
            <LoadingI className="size-5 text-white fill-white/40" />
          ) : (
            <>
              {t("setNewPassword.submit")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
};

export default SetNewPassword;
