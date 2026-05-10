import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../config/i18n";

const baseURL = import.meta.env.VITE_BASE_URL;
const KEY = import.meta.env.VITE_LOCAL_KEY;

// Pick the localized backend message when both are present.
// Falls back through: <lang>-specific > TR > generic message >
// ASP.NET ProblemDetails validation errors > ProblemDetails title >
// undefined.
// Exported so public-API slices (login / register / password reset) can
// pull error text the same way the private interceptor does, instead of
// reaching into a single hard-coded key.
export const pickBackendMessage = (data) => {
  if (!data) return null;
  const lang = (i18n.language || "tr").toLowerCase();
  if (lang.startsWith("en") && data.message_EN) return data.message_EN;
  if (data.message_TR) return data.message_TR;
  if (data.message_EN) return data.message_EN;
  if (data.message) return data.message;
  // ASP.NET ProblemDetails fallback. The .NET 400 response shape is
  //   { errors: { FieldName: ["error msg", ...], ... }, title, ... }
  // Surfacing those messages turns a useless generic "Bad Request 400"
  // toast into the actual reason ("Tema ID 0-14 aralığında olmalıdır",
  // "Email zaten kayıtlı", etc.). Field name is dropped — backend
  // already includes it in the message text where it matters.
  if (data.errors && typeof data.errors === "object") {
    const msgs = Object.values(data.errors)
      .flat()
      .filter((m) => typeof m === "string" && m.trim().length > 0);
    if (msgs.length) return msgs.join(" · ");
  }
  // Non-validation ProblemDetails (e.g. server errors) usually have a
  // title — better than nothing.
  return data.title || null;
};

// Translate an axios error into a user-readable string. Public-API slices
// (login/register/password reset) catch their own errors instead of going
// through the privateApi response interceptor, so without this helper they
// would surface raw axios strings like "timeout of 30000ms exceeded" or
// "Network Error". Order matters: backend-supplied messages win, then we
// classify by transport (timeout / no response), then fall back to the
// raw axios message and finally a generic Turkish default.
export const pickAxiosErrorMessage = (err) => {
  const t = i18n.t.bind(i18n);
  const backendMsg = pickBackendMessage(err?.response?.data);
  if (backendMsg) return backendMsg;
  // axios sets code === "ECONNABORTED" when it aborts the request because
  // the configured `timeout` elapsed. Some browsers also use ETIMEDOUT.
  if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
    return t("apiErrors.timeout");
  }
  // err.request exists but err.response does not → request left the
  // browser but no answer came back. Treat as transport/network failure.
  if (err?.request && !err?.response) {
    return t("apiErrors.network");
  }
  return err?.message || t("apiErrors.generic", { message: "" }).trim();
};

// 30s request timeout. Without this, axios waits indefinitely when the
// backend hangs or a CORS preflight stalls — the loadingMiddleware never
// sees a /fulfilled or /rejected, so the global LiwaMenu loader stays on
// screen forever (the "Mail Gönder spinner" issue on /register). 30s is
// long enough for cold-start backends and short enough that a real user
// gets clear feedback (toast.error from the rejected branch) instead of a
// frozen UI.
const REQUEST_TIMEOUT_MS = 30000;

const api = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

const axiosPrivate = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

export const getAuth = () => {
  const authItemString = localStorage.getItem(KEY);
  const authItem = JSON.parse(authItemString);
  return authItem;
};

// Merge a partial auth payload (e.g. updated `user`) into the stored auth
// blob, leaving the token/sessionId untouched.
export const setAuth = (patch) => {
  const current = getAuth() || {};
  const next = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
};

export const clearAuth = () => {
  localStorage.removeItem(KEY);
};

// Register the auth + error interceptors ONCE at module load. Previously
// each slice called `privateApi()` at its own module top, which re-registered
// the same interceptors per slice (~100 stacks). Idempotent but wasteful.
// `privateApi()` now just returns the configured singleton.
axiosPrivate.interceptors.request.use(
  (config) => {
    const token = getAuth()?.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      return Promise.reject({
        response: {
          status: 401,
          message: "No token provided. Unauthorized.",
        },
      });
    }
    // FormData ↔ Content-Type fix.
    // The axiosPrivate instance is created with a default
    //   headers: { "Content-Type": "application/json" }
    // which axios then merges into every request. When the caller passes
    // a FormData body, that default sticks unless overridden, so axios
    // sees "application/json" and JSON.stringify's the FormData (the
    // browser would never send a real multipart body, and ASP.NET's
    // [FromForm] binder reports every field as missing).
    //
    // The clean fix is to DELETE the Content-Type for FormData and let
    // the browser set "multipart/form-data; boundary=…" with the right
    // boundary. Existing slices that explicitly pass
    //   { headers: { "Content-Type": "multipart/form-data" } }
    // also pass through this branch — we strip their (boundary-less)
    // header so the browser can supply one.
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData &&
      config.headers
    ) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
      }
    }
    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject({ ...error });
  },
);

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Use the live i18n function so messages follow the user's current
    // language. `i18n.t` is bound at evaluation time, no need for a hook.
    const t = i18n.t.bind(i18n);
    let errorMessage = "";
    toast.dismiss();

    if (error.response?.status === 401) {
      clearAuth();
      errorMessage = t("apiErrors.unauthorized");
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      errorMessage = t("apiErrors.inactive_account");
      toast.error(errorMessage, { id: "403" });
    } else if (error.response) {
      const resErr = pickBackendMessage(error?.response?.data);
      if (resErr) {
        errorMessage = resErr;
      } else {
        switch (error.response.status) {
          case 400:
            errorMessage = t("apiErrors.bad_request");
            break;
          case 404:
            errorMessage = t("apiErrors.not_found");
            break;
          case 500:
            errorMessage = t("apiErrors.server_error");
            break;
          default:
            errorMessage = t("apiErrors.unexpected_status", {
              status: error.response.status,
            });
        }
      }
      toast.error(errorMessage, { id: "api-error" });
    } else if (error.request) {
      errorMessage = t("apiErrors.no_response");
      toast.error(errorMessage, { id: "no-server-error" });
    } else {
      // Avoid stacking the prefix when the message already carries it.
      const prefix = t("apiErrors.generic", { message: "" }).trim();
      if (!error.message.includes(prefix.replace(/[:：]\s*$/, ""))) {
        errorMessage = t("apiErrors.generic", { message: error.message });
      } else {
        errorMessage = error.message;
      }
      toast.error(errorMessage, { id: "random-error" });
    }

    return Promise.reject({ ...error, message: errorMessage });
  },
);

export const privateApi = () => axiosPrivate;

export default api;
