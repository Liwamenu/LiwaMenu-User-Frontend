import axios from "axios";
import toast from "react-hot-toast";
import i18n from "../config/i18n";

const baseURL = import.meta.env.VITE_BASE_URL;
const KEY = import.meta.env.VITE_LOCAL_KEY;

// Pick the localized backend message when both are present.
// Falls back through: <lang>-specific > TR > generic message > undefined.
const pickBackendMessage = (data) => {
  if (!data) return null;
  const lang = (i18n.language || "tr").toLowerCase();
  if (lang.startsWith("en") && data.message_EN) return data.message_EN;
  if (data.message_TR) return data.message_TR;
  if (data.message_EN) return data.message_EN;
  return data.message || null;
};

const api = axios.create({
  baseURL: baseURL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

const axiosPrivate = axios.create({
  baseURL: baseURL,
  withCredentials: false,
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

export const privateApi = () => {
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
      return config;
    },
    (error) => {
      console.log(error);
      return Promise.reject({ ...error });
    }
  );

  axiosPrivate.interceptors.response.use(
    (response) => response,
    async (error, response) => {
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
    }
  );

  return axiosPrivate;
};

export default api;
