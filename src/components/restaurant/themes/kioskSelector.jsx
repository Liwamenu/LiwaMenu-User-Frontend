// Kiosk / Self-Order theme page.
//
// Functionally a copy of the QR Menu theme selector (qrMenuSelector.jsx):
// same theme catalog, same live-iframe preview of the tenant menu. Now
// persists through its OWN slice (`setRestaurantKioskTheme`) that hits
// `Restaurants/UpdateRestaurantKioskTheme` and writes `kioskThemeId` —
// the same per-type endpoint split TV already uses. Previously it
// reused the QR slice (themeId), which after the QR endpoint rename
// turned every kiosk pick into a silent QR overwrite.
//
// The ONLY visual difference from the QR page is the device "mockups":
// instead of phone/tablet frames, the preview is shown inside DIKEY
// (portrait standing kiosk) and YATAY (landscape counter terminal)
// kiosk frames.
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Globe,
  Loader2,
  ExternalLink,
  RotateCw,
  Monitor,
  RectangleVertical,
  RectangleHorizontal,
  Palette,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  setRestaurantKioskTheme,
  resetSetRestaurantKioskTheme,
} from "../../../redux/restaurant/setRestaurantKioskThemeSlice";
import PageHelp from "../../common/pageHelp";
// Reuse the QR catalog + tenant-URL helper so the two pages never drift.
import { THEMES, buildTenantUrl } from "./qrMenuSelector";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Vertical (portrait standing kiosk) first — that's the most common
// self-order form factor — then the horizontal counter terminal.
const DEVICES = [
  {
    id: "vertical",
    icon: RectangleVertical,
    labelKey: "kioskThemeSelector.vertical",
  },
  {
    id: "horizontal",
    icon: RectangleHorizontal,
    labelKey: "kioskThemeSelector.horizontal",
  },
];

const KioskSelector = ({ data }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = params.id;
  const iframeRef = useRef(null);

  const { success, loading } = useSelector(
    (s) => s.restaurant.setRestaurantKioskTheme,
  );

  const [device, setDevice] = useState("vertical");
  const [isLoading, setIsLoading] = useState(true);
  // The kiosk theme is its own field on the restaurant entity now
  // (`kioskThemeId`). Don't fall back to `themeId` — that's the QR
  // theme and would mis-render the kiosk preview on first mount.
  const [selectedThemeId, setSelectedThemeId] = useState(
    data?.kioskThemeId ?? null,
  );
  const [activeThemeId, setActiveThemeId] = useState(
    data?.kioskThemeId ?? null,
  );

  const activeTheme = THEMES.find((th) => th.id === activeThemeId) || null;

  const tenant = data?.tenant;
  const liveUrl = buildTenantUrl(tenant);
  const iframeUrl =
    activeThemeId != null ? `${liveUrl}?v=${activeThemeId}` : liveUrl;

  const [pendingThemeId, setPendingThemeId] = useState(null);
  const isPending = (id) => pendingThemeId === id && loading;

  // Click a theme card → optimistic select + dispatch save immediately.
  // Writes ONLY `kioskThemeId` — QR and TV themes have their own
  // dedicated endpoints + cached fields.
  const handlePickTheme = (themeId) => {
    if (loading) return;
    if (themeId === activeThemeId) return;
    setSelectedThemeId(themeId);
    setPendingThemeId(themeId);
    dispatch(setRestaurantKioskTheme({ kioskThemeId: themeId, restaurantId }));
  };

  const handleRefreshIframe = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = "about:blank";
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.src = iframeUrl;
      });
    }
  };

  useEffect(() => {
    setIsLoading(true);
  }, [activeThemeId, device]);

  useEffect(() => {
    if (data?.kioskThemeId !== undefined && data?.kioskThemeId !== null) {
      setSelectedThemeId(data.kioskThemeId);
      setActiveThemeId(data.kioskThemeId);
    }
  }, [data]);

  // Clear any leftover redux state on mount so the success-effect below
  // doesn't fire spuriously when navigating into the page (the slice is
  // dedicated to kiosk now, but the reset is cheap insurance).
  useEffect(() => {
    dispatch(resetSetRestaurantKioskTheme());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (success && pendingThemeId !== null) {
      toast.success(t("qrThemeSelector.success_updated"), {
        id: "set-theme-success",
      });
      setActiveThemeId(pendingThemeId);
      setPendingThemeId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  useEffect(() => {
    if (!loading && pendingThemeId !== null && !success) {
      setPendingThemeId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* Gradient strip */}
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Monitor className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("kioskThemeSelector.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("kioskThemeSelector.subtitle")}
            </p>
          </div>
          <PageHelp pageKey="qrThemes" />
          {loading && (
            <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30">
              <Loader2 className="size-3.5 animate-spin" />
              {t("qrThemeSelector.saving")}
            </span>
          )}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] min-h-[680px]">
          {/* LEFT — Theme cards + active summary */}
          <div className="border-b lg:border-b-0 lg:border-r border-[--border-1] flex flex-col">
            <div className="p-4 border-b border-[--border-1] bg-[--white-2]/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
                {t("qrThemeSelector.saved_state")}
              </p>
              {activeTheme ? (
                <div className="flex items-center gap-3">
                  <span
                    className="grid place-items-center size-11 rounded-xl text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: activeTheme.color }}
                  >
                    {activeTheme.name.replace(/\D/g, "") ||
                      activeTheme.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[--black-1] truncate">
                      {activeTheme.name}
                    </p>
                    <p className="text-[11px] text-[--gr-1] truncate">
                      {t(activeTheme.tagKey)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
                    <Check className="size-3" />
                    {t("qrThemeSelector.active_badge")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-11 rounded-xl bg-[--white-2] ring-1 ring-[--border-1] text-[--gr-2] shrink-0">
                    <Palette className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[--black-1] truncate">
                      {t("qrThemeSelector.no_theme_title")}
                    </p>
                    <p className="text-[11px] text-[--gr-1] truncate">
                      {t("qrThemeSelector.no_theme_hint")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 flex-1 max-h-[min(680px,75dvh)] overflow-y-auto space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] px-1 mb-1.5">
                {t("qrThemeSelector.select_theme")}
              </p>
              {THEMES.map((theme) => {
                const isActive = activeThemeId === theme.id;
                const pending = isPending(theme.id);
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handlePickTheme(theme.id)}
                    disabled={loading}
                    className={`group w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left disabled:cursor-wait ${
                      isActive
                        ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-100 shadow-sm dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:ring-indigo-400/20"
                        : "border-[--border-1] bg-[--white-1] hover:border-indigo-200 hover:bg-[--white-2] disabled:opacity-50"
                    }`}
                  >
                    <span
                      className="grid place-items-center size-10 rounded-lg text-white font-bold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    >
                      {theme.name.replace(/\D/g, "") || theme.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isActive
                            ? "text-indigo-700 dark:text-indigo-200"
                            : "text-[--black-1]"
                        }`}
                      >
                        {theme.name}
                      </p>
                      <p className="text-[10px] text-[--gr-1] truncate">
                        {t(theme.tagKey)}
                      </p>
                    </div>
                    {pending ? (
                      <span className="grid place-items-center size-5 rounded-full bg-indigo-600 text-white shrink-0 shadow-sm">
                        <Loader2 className="size-3 animate-spin" />
                      </span>
                    ) : isActive ? (
                      <span className="grid place-items-center size-5 rounded-full bg-emerald-500 text-white shrink-0 shadow-sm">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Live URL footer */}
            <div className="p-3 border-t border-[--border-1] bg-[--white-2]/60 space-y-2">
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300">
                <Globe className="size-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {t("qrThemeSelector.live_url")}
                </span>
              </div>
              <p className="text-[10px] text-[--gr-1] font-mono break-all">
                {liveUrl}
              </p>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-xs font-semibold text-indigo-600 bg-[--white-1] border border-[--border-1] hover:border-indigo-300 hover:text-indigo-700 transition dark:text-indigo-300 dark:hover:text-indigo-200 dark:hover:border-indigo-400/40"
              >
                <ExternalLink className="size-3.5" />
                {t("qrThemeSelector.open_new_tab")}
              </a>
            </div>
          </div>

          {/* RIGHT — Preview */}
          <div className="relative flex flex-col">
            <div className="px-4 py-3 border-b border-[--border-1] flex items-center justify-between gap-3 bg-[--white-1]">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="size-3.5 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] truncate">
                  {t("qrThemeSelector.preview_title")}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Orientation segmented control */}
                <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-[--white-2] border border-[--border-1]">
                  {DEVICES.map(({ id, icon: Icon, labelKey }) => {
                    const isActive = device === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDevice(id)}
                        title={t(labelKey)}
                        aria-label={t(labelKey)}
                        className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-semibold transition ${
                          isActive
                            ? "bg-[--white-1] text-indigo-600 shadow-sm dark:bg-indigo-500/20 dark:text-indigo-200"
                            : "text-[--gr-1] hover:text-[--black-1]"
                        }`}
                      >
                        <Icon className="size-3.5" />
                        <span className="hidden sm:inline">{t(labelKey)}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleRefreshIframe}
                  title={t("qrThemeSelector.refresh")}
                  aria-label={t("qrThemeSelector.refresh")}
                  className="grid place-items-center size-8 rounded-md text-[--gr-1] bg-[--white-2] border border-[--border-1] hover:text-indigo-600 hover:border-indigo-300 transition"
                >
                  <RotateCw className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Mockup area */}
            <div className="flex-1 px-4 py-6 sm:py-8 grid place-items-center overflow-auto relative bg-gradient-to-br from-[--white-2] via-[--white-1] to-[--white-2]">
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-30">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200/60 rounded-full blur-3xl dark:bg-indigo-500/20" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-200/60 rounded-full blur-3xl dark:bg-cyan-500/15" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={device}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.03, y: -10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative z-10"
                >
                  <KioskFrame variant={device}>
                    <ScaledIframe
                      iframeRef={iframeRef}
                      src={iframeUrl}
                      onLoad={() => setIsLoading(false)}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 grid place-items-center bg-[--white-1]/85 backdrop-blur-sm z-20 transition-opacity">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="size-7 text-indigo-600 animate-spin" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[--gr-1]">
                            {t("qrThemeSelector.loading_theme")}
                          </p>
                        </div>
                      </div>
                    )}
                  </KioskFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 1:1 iframe — the kiosk frame's inner screen is already a real, usable
// viewport size (a kiosk is large), so no transform/scale tricks.
const ScaledIframe = ({ iframeRef, src, onLoad }) => (
  <iframe
    ref={iframeRef}
    src={src}
    title="Kiosk theme preview"
    onLoad={onLoad}
    scrolling="auto"
    style={{ width: "100%", height: "100%", border: 0, display: "block" }}
  />
);

// Kiosk mockups. Two physical form factors:
//   • vertical  — a portrait standing self-order terminal on a pedestal.
//   • horizontal — a landscape counter / wall terminal on a short foot.
// Same "milled-metal bezel + glass screen + ambient glow" language as
// the QR phone frames, scaled up to kiosk proportions.
const KioskFrame = ({ variant, children }) => {
  if (variant === "horizontal") {
    return (
      <div className="relative flex flex-col items-center">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 blur-3xl pointer-events-none"
        />

        {/* Screen body (bezel) */}
        <div className="relative w-[600px] h-[375px] rounded-[1.5rem] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6),0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_0_rgba(0,0,0,0.45)] ring-1 ring-white/10 z-10">
          {/* Top edge highlight */}
          <div
            aria-hidden
            className="absolute top-[3px] left-20 right-20 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full"
          />
          {/* Camera / sensor dot, top centre */}
          <div
            aria-hidden
            className="absolute top-[7px] left-1/2 -translate-x-1/2 w-[7px] h-[7px] rounded-full bg-slate-900 z-30 ring-1 ring-slate-700"
          />
          {/* Screen */}
          <div className="absolute inset-[16px] rounded-[0.9rem] overflow-hidden bg-[--white-1]">
            {children}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[15] rounded-[0.9rem] bg-gradient-to-br from-white/[0.08] via-white/0 to-white/[0.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[25] rounded-[0.9rem] ring-1 ring-inset ring-white/10"
            />
          </div>
        </div>

        {/* Foot — short stand the terminal sits on. */}
        <div
          aria-hidden
          className="w-[120px] h-[26px] bg-gradient-to-b from-slate-700 to-slate-800 z-0"
        />
        <div
          aria-hidden
          className="w-[260px] h-[16px] rounded-[10px] bg-gradient-to-b from-slate-700 to-slate-900 shadow-[0_20px_30px_-12px_rgba(0,0,0,0.5)] z-0"
        />
      </div>
    );
  }

  // vertical — tall portrait standing kiosk on a pedestal.
  return (
    <div className="relative flex flex-col items-center">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 blur-3xl pointer-events-none"
      />

      {/* Screen body (bezel) */}
      <div className="relative w-[400px] h-[620px] rounded-[1.8rem] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6),0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_0_rgba(0,0,0,0.45)] ring-1 ring-white/10 z-10">
        {/* Top edge highlight */}
        <div
          aria-hidden
          className="absolute top-[3px] left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full"
        />
        {/* Speaker / sensor bar, top centre */}
        <div
          aria-hidden
          className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[54px] h-[5px] rounded-full bg-slate-700/80 z-30"
        />
        {/* Screen */}
        <div className="absolute inset-[16px] top-[26px] rounded-[1rem] overflow-hidden bg-[--white-1]">
          {children}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[15] rounded-[1rem] bg-gradient-to-br from-white/[0.08] via-white/0 to-white/[0.03]"
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[25] rounded-[1rem] ring-1 ring-inset ring-white/10"
          />
        </div>
      </div>

      {/* Pedestal — neck + base. */}
      <div
        aria-hidden
        className="w-[70px] h-[44px] bg-gradient-to-b from-slate-700 to-slate-800 z-0"
      />
      <div
        aria-hidden
        className="w-[230px] h-[16px] rounded-[10px] bg-gradient-to-b from-slate-700 to-slate-900 shadow-[0_20px_30px_-12px_rgba(0,0,0,0.5)] z-0"
      />
    </div>
  );
};

export default KioskSelector;
