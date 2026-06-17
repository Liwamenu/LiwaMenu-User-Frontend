//MOD
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import i18n from "../../../config/i18n";
import {
  Monitor,
  Smartphone,
  Globe,
  MonitorSmartphone,
  MapPin,
  RefreshCw,
  Loader2,
  ShieldAlert,
  LogOut,
} from "lucide-react";

//COMP
import ConfirmActionModal from "../../common/confirmActionModal";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";

//REDUX
import { getAuth } from "../../../redux/api";
import { getUserSessions } from "../../../redux/userSessions/getUserSessionsSlice";
import { deleteUserSession } from "../../../redux/userSessions/deleteUserSessionSlice";
import { deleteOtherUserSessions } from "../../../redux/userSessions/deleteOtherUserSessionsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Pick an icon from the (free-form) deviceType string the backend stores.
const deviceIcon = (deviceType = "") => {
  const d = String(deviceType).toLowerCase();
  if (/ios|android|mobile|phone|tablet/.test(d)) return Smartphone;
  if (/web|desktop|browser|pc|mac|windows|linux/.test(d)) return Monitor;
  return Globe;
};

// Localized relative time for "last active" (Intl, follows the UI language).
const relativeTime = (iso) => {
  if (!iso) return "";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const diffSec = Math.round((ms - Date.now()) / 1000); // past → negative
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(i18n.language || "tr", {
    numeric: "auto",
  });
  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), "day");
  return new Date(iso).toLocaleDateString(i18n.language || "tr");
};

const ActiveSessions = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setSecondPopupContent } = usePopup();

  const { loading, error, sessions } = useSelector(
    (state) => state.userSessions.get,
  );
  const { loading: deleting } = useSelector(
    (state) => state.userSessions.delete,
  );
  const { loading: deletingOthers } = useSelector(
    (state) => state.userSessions.deleteOthers,
  );

  const currentSessionId = getAuth()?.sessionId;

  const refresh = () => dispatch(getUserSessions({ __silent: true }));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = Array.isArray(sessions) ? sessions : [];
  // Prefer the backend's isCurrent; fall back to matching the stored sessionId.
  const isCurrent = (s) =>
    s?.isCurrent === true ||
    (currentSessionId != null && s?.userSessionId === currentSessionId);
  const otherCount = list.filter((s) => !isCurrent(s)).length;

  const locationText = (s) => {
    const parts = [s?.city, s?.country].filter(Boolean);
    return parts.length ? parts.join(", ") : t("activeSessions.unknown_location");
  };
  const deviceLabel = (s) =>
    s?.deviceName || s?.deviceType || t("activeSessions.unknown_device");

  const revokeOne = (s) => {
    setSecondPopupContent(
      <ConfirmActionModal
        variant="danger"
        icon={LogOut}
        title={t("activeSessions.close_confirm_title")}
        targetName={deviceLabel(s)}
        description={t("activeSessions.close_confirm_desc")}
        confirmLabel={t("activeSessions.close")}
        onConfirm={async () => {
          try {
            await dispatch(
              deleteUserSession({ userSessionId: s.userSessionId }),
            ).unwrap();
            toast.success(t("activeSessions.closed"));
            refresh();
          } catch {
            toast.error(t("activeSessions.close_error"));
          } finally {
            setSecondPopupContent(null);
          }
        }}
      />,
    );
  };

  const revokeOthers = () => {
    setSecondPopupContent(
      <ConfirmActionModal
        variant="danger"
        icon={LogOut}
        title={t("activeSessions.close_others_confirm_title")}
        description={t("activeSessions.close_others_confirm_desc")}
        confirmLabel={t("activeSessions.close_others")}
        onConfirm={async () => {
          try {
            await dispatch(deleteOtherUserSessions()).unwrap();
            toast.success(t("activeSessions.others_closed"));
            refresh();
          } catch {
            toast.error(t("activeSessions.others_error"));
          } finally {
            setSecondPopupContent(null);
          }
        }}
      />,
    );
  };

  return (
    <div className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[--white-2]/60 border-b border-[--border-1]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
            <MonitorSmartphone className="size-3.5" />
          </span>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] truncate">
            {t("activeSessions.title")}
          </h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            aria-label={t("activeSessions.refresh")}
            title={t("activeSessions.refresh")}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-2] hover:bg-[--white-2] transition disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {otherCount > 0 && (
            <button
              type="button"
              onClick={revokeOthers}
              disabled={deletingOthers}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-[--red-1] bg-[--status-red] hover:opacity-90 transition disabled:opacity-50"
            >
              {deletingOthers ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <LogOut className="size-3.5" />
              )}
              {t("activeSessions.close_others")}
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3">
        {/* INFO */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[--white-2] ring-1 ring-[--border-1]">
          <ShieldAlert className="size-3.5 shrink-0 mt-0.5 text-[--gr-1]" />
          <p className="text-[11px] leading-snug text-[--gr-1]">
            {t("activeSessions.info")}
          </p>
        </div>

        {/* STATES */}
        {loading && !list.length ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[--gr-1]">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm">{t("activeSessions.loading")}</span>
          </div>
        ) : error && !list.length ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-[--gr-1]">
              {t("activeSessions.load_error")}
            </p>
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-[--black-2] bg-[--white-2] border border-[--border-1] hover:bg-[--gr-3] transition"
            >
              <RefreshCw className="size-3.5" />
              {t("activeSessions.retry")}
            </button>
          </div>
        ) : !list.length ? (
          <p className="py-8 text-center text-sm text-[--gr-1]">
            {t("activeSessions.empty")}
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((s) => {
              const Icon = deviceIcon(s?.deviceType);
              const current = isCurrent(s);
              return (
                <li
                  key={s?.userSessionId || `${s?.deviceType}-${s?.createdAt}`}
                  className={`flex items-center gap-3 p-3 rounded-lg border bg-[--white-1] ${
                    current
                      ? "border-indigo-200 dark:border-indigo-500/40 bg-indigo-50/30 dark:bg-indigo-500/5"
                      : "border-[--border-1]"
                  }`}
                >
                  <span
                    className={`grid place-items-center size-9 rounded-lg shrink-0 ${
                      current
                        ? "text-white"
                        : "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]"
                    }`}
                    style={current ? { background: PRIMARY_GRADIENT } : undefined}
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[--black-1] truncate">
                        {deviceLabel(s)}
                      </p>
                      {current && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                          {t("activeSessions.this_device")}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-[--gr-1] truncate mt-0.5">
                      <MapPin className="size-3 shrink-0" />
                      {locationText(s)}
                      {s?.lastSeenAt && (
                        <>
                          <span className="mx-0.5">·</span>
                          {relativeTime(s.lastSeenAt)}
                        </>
                      )}
                    </p>
                  </div>

                  {!current && (
                    <button
                      type="button"
                      onClick={() => revokeOne(s)}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-[--red-1] border border-[--border-1] hover:bg-[--status-red] transition disabled:opacity-50 shrink-0"
                    >
                      <LogOut className="size-3.5" />
                      {t("activeSessions.close")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActiveSessions;
