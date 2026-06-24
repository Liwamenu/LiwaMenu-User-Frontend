//MODULES
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Loader2, AlertTriangle, MailCheck } from "lucide-react";

//COMP
import AuthShell from "../components/auth/AuthShell";

//REDUX
import { resetVerifyEmail, verifyEmail } from "../redux/auth/verifyEmailSlice";
import {
  resetSendVerification,
  sendVerificationCode,
} from "../redux/auth/sendVerificationSlice";

// After a terminal state (activated / resent / failed) we hold the message on
// screen for a beat so the user actually reads it, then send them to /login.
const REDIRECT_MS = 4500;

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const { success, error, loading } = useSelector(
    (state) => state.auth.verifyEmail,
  );
  const {
    error: sendErr,
    success: sendSucc,
    loading: sendLoad,
  } = useSelector((state) => state.auth.sendVerification);

  const [credentials, setCredentials] = useState(null);
  const [hasParams, setHasParams] = useState(true);

  // Pull email + token out of the activation link and verify on mount.
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (email && token) {
      setCredentials({ email, token });
      dispatch(verifyEmail({ email, token }));
    } else {
      setHasParams(false);
    }
  }, [location]);

  // Token expired / invalid → auto-request a fresh verification code so the
  // user has an easy next step instead of a dead end.
  useEffect(() => {
    if (error && credentials) {
      dispatch(resetVerifyEmail());
      dispatch(sendVerificationCode(credentials));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Any terminal state → bounce to /login after a short, readable delay.
  useEffect(() => {
    if (!success && !sendSucc && !sendErr) return;
    const id = setTimeout(() => {
      dispatch(resetVerifyEmail());
      dispatch(resetSendVerification());
      navigate("/login");
    }, REDIRECT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, sendSucc, sendErr]);

  // Derive a single display phase from the two slices.
  const phase = !hasParams
    ? "invalid"
    : success
      ? "success"
      : sendSucc
        ? "resent"
        : sendErr
          ? "error"
          : "verifying";

  const VIEW = {
    verifying: {
      Icon: Loader2,
      iconClass: "text-indigo-500 animate-spin",
      title: t("auth.verify_verifying_title"),
      desc: t("auth.verify_verifying_desc"),
    },
    success: {
      Icon: CheckCircle2,
      iconClass: "text-emerald-500",
      title: t("auth.verify_success_title"),
      desc: t("auth.verify_success_desc"),
    },
    resent: {
      Icon: MailCheck,
      iconClass: "text-indigo-500",
      title: t("auth.verify_resent_title"),
      desc: t("auth.verify_resent_desc"),
    },
    error: {
      Icon: AlertTriangle,
      iconClass: "text-rose-500",
      title: t("auth.verify_failed_title"),
      desc: t("auth.verify_failed_desc"),
    },
    invalid: {
      Icon: AlertTriangle,
      iconClass: "text-rose-500",
      title: t("auth.verify_invalid_title"),
      desc: t("auth.verify_invalid_desc"),
    },
  };

  const v = VIEW[phase];
  const isBusy = phase === "verifying" || loading || sendLoad;
  const isTerminal = phase === "success" || phase === "resent";

  return (
    <AuthShell maxWidth="md">
      <div className="text-center">
        <span
          className={`mx-auto grid place-items-center size-16 rounded-2xl bg-slate-50 ring-1 ring-slate-100 ${v.iconClass}`}
        >
          <v.Icon className="size-8" strokeWidth={2} />
        </span>

        <h1 className="mt-6 text-2xl sm:text-3xl font-bold text-slate-900">
          {v.title}
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          {v.desc}
        </p>

        {!isBusy && (
          <Link
            to="/login"
            onClick={() => {
              dispatch(resetVerifyEmail());
              dispatch(resetSendVerification());
            }}
            className="mt-7 inline-flex items-center justify-center h-11 px-6 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            {t("auth.go_to_login")}
          </Link>
        )}

        {isTerminal && (
          <p className="mt-4 text-xs text-slate-400">
            {t("auth.verify_redirecting")}
          </p>
        )}
      </div>
    </AuthShell>
  );
};

export default VerifyEmail;
