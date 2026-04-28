import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Smartphone,
  Tablet,
  Globe,
  Loader2,
  ExternalLink,
  RotateCw,
  Palette,
  Sparkles,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  setRestaurantTheme,
  resetSetRestaurantTheme,
} from "../../../redux/restaurant/setRestaurantThemeSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const THEMES = [
  {
    id: 0,
    name: "Tema 1",
    color: "hsl(24 95% 53%)",
    tagKey: "qrThemeSelector.tag_classic",
  },
  {
    id: 1,
    name: "Tema 2",
    color: "hsl(270 65% 65%)",
    tagKey: "qrThemeSelector.tag_modern",
  },
  {
    id: 2,
    name: "Tema 3",
    color: "hsl(142 58% 26%)",
    tagKey: "qrThemeSelector.tag_natural",
  },
  {
    id: 3,
    name: "Tema 4",
    color: "hsl(48 100% 50%)",
    tagKey: "qrThemeSelector.tag_sunny",
  },
  {
    id: 4,
    name: "Tema 5",
    color: "hsl(120 100% 25%)",
    tagKey: "qrThemeSelector.tag_fresh",
  },
];

// Build the tenant-facing live URL — used both as the public link and as the
// iframe preview source (theme is rendered server-side from the saved value).
const buildTenantUrl = (tenant, fallback = "demo") => {
  const t = (tenant || fallback).trim();
  return `https://${t}.liwamenu.com`;
};

const DEVICES = [
  { id: "iphone", icon: Smartphone, labelKey: "qrThemeSelector.iphone" },
  { id: "android", icon: Smartphone, labelKey: "qrThemeSelector.android" },
  { id: "tablet", icon: Tablet, labelKey: "qrThemeSelector.tablet" },
];

const ThemeSelector = ({ data }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = params.id;
  const iframeRef = useRef(null);

  const { success, loading } = useSelector(
    (s) => s.restaurant.setRestaurantTheme,
  );

  const [device, setDevice] = useState("iphone");
  const [isLoading, setIsLoading] = useState(true);
  // null until the server returns a saved themeId or the user picks one —
  // we do NOT default to Tema 1, so nothing is auto-selected/applied.
  const [selectedThemeId, setSelectedThemeId] = useState(
    data?.themeId ?? null,
  );
  const [activeThemeId, setActiveThemeId] = useState(data?.themeId ?? null);

  const selectedTheme = THEMES.find((th) => th.id === selectedThemeId) || null;
  const activeTheme = THEMES.find((th) => th.id === activeThemeId) || null;

  // The iframe always renders the user's actual menu at their tenant URL.
  // Theme changes are applied via auto-save (clicking a theme dispatches
  // setRestaurantTheme), and the iframe is keyed off activeThemeId so it
  // reloads after the save completes — showing the just-saved theme live.
  const tenant = data?.tenant;
  const liveUrl = buildTenantUrl(tenant);
  // Cache-bust only when a saved theme exists; otherwise just hit the live URL.
  const iframeUrl =
    activeThemeId != null ? `${liveUrl}?v=${activeThemeId}` : liveUrl;

  // Track which theme id is currently being saved (for inline spinner).
  const [pendingThemeId, setPendingThemeId] = useState(null);
  const isPending = (id) => pendingThemeId === id && loading;

  // Click a theme card → optimistic select + dispatch save immediately.
  const handlePickTheme = (themeId) => {
    if (loading) return;
    if (themeId === activeThemeId) return; // already saved, no-op
    setSelectedThemeId(themeId);
    setPendingThemeId(themeId);
    dispatch(
      setRestaurantTheme({
        themeId,
        restaurantId,
      }),
    );
  };

  const handleRefreshIframe = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      // Force reload the iframe by re-assigning its src
      iframeRef.current.src = "about:blank";
      requestAnimationFrame(() => {
        if (iframeRef.current) iframeRef.current.src = iframeUrl;
      });
    }
  };

  // Reset loading state when the *saved* theme changes (after auto-save) or
  // when the device switches. Selecting a theme dispatches a save and the
  // iframe reloads only after activeThemeId catches up.
  useEffect(() => {
    setIsLoading(true);
  }, [activeThemeId, device]);

  // SET initial theme from restaurant data
  useEffect(() => {
    if (data?.themeId !== undefined && data?.themeId !== null) {
      setSelectedThemeId(data.themeId);
      setActiveThemeId(data.themeId);
    }
  }, [data]);

  // Reset any leftover redux state from previous saves (e.g. user came from
  // TV themes which uses the same slice) so the success-effect below doesn't
  // fire spuriously on mount.
  useEffect(() => {
    dispatch(resetSetRestaurantTheme());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast on success + commit active theme. Guarded by `pendingThemeId` so a
  // stale `success` state from another page can't fake a save here.
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

  // Clear pending state on failure
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
            <Palette className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("qrThemeSelector.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("qrThemeSelector.subtitle")}
            </p>
          </div>
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
            {/* Active (saved) theme summary — what's currently rendered in the preview */}
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

            {/* Theme list */}
            <div className="p-3 flex-1 overflow-y-auto space-y-1.5">
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
            {/* Preview toolbar */}
            <div className="px-4 py-3 border-b border-[--border-1] flex items-center justify-between gap-3 bg-[--white-1]">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="size-3.5 text-indigo-600 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] truncate">
                  {t("qrThemeSelector.preview_title")}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Device segmented control */}
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
            <div className="flex-1 px-4 py-6 sm:py-8 grid place-items-center overflow-hidden relative bg-gradient-to-br from-[--white-2] via-[--white-1] to-[--white-2]">
              {/* Soft accent blobs */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-30">
                <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-200/60 rounded-full blur-3xl dark:bg-indigo-500/20" />
                <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-200/60 rounded-full blur-3xl dark:bg-cyan-500/15" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  // Animate only on device switch — theme changes update the
                  // iframe src in place so the phone frame stays put.
                  key={device}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.03, y: -10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative z-10"
                >
                  <DeviceFrame variant={device}>
                    <ScaledIframe
                      iframeRef={iframeRef}
                      src={iframeUrl}
                      onLoad={() => setIsLoading(false)}
                    />
                    {/* Loading overlay — covers only the inner screen */}
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
                  </DeviceFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Renders the iframe at 80% zoom and clips the iframe's own scrollbars
// by extending its size past the container's visible area.
const ScaledIframe = ({ iframeRef, src, onLoad }) => (
  <iframe
    ref={iframeRef}
    src={src}
    title="Theme preview"
    onLoad={onLoad}
    scrolling="auto"
    style={{
      // Iframe is 1/0.8 = 125% of container, then scaled 80% → fills visually.
      // Extra ~24px pushes the iframe's native scrollbar past the clipped edge.
      width: "calc(100% / 0.8 + 24px)",
      height: "calc(100% / 0.8 + 24px)",
      transform: "scale(0.8)",
      transformOrigin: "0 0",
      border: 0,
      display: "block",
    }}
  />
);

const DeviceFrame = ({ variant, children }) => {
  if (variant === "iphone") {
    return (
      <div className="relative w-[300px] h-[620px] sm:w-[320px] sm:h-[660px] bg-black rounded-[3rem] border-[10px] border-gray-900 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)] ring-1 ring-white/10 dark:ring-white/5">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-3xl z-30" />
        {/* Camera dot */}
        <div className="absolute top-2 right-7 w-2 h-2 bg-gray-800 rounded-full z-30" />
        <div className="absolute inset-0 rounded-[2.4rem] overflow-hidden bg-[--white-1]">
          {children}
        </div>
      </div>
    );
  }
  if (variant === "android") {
    return (
      <div className="relative w-[300px] h-[620px] sm:w-[320px] sm:h-[660px] bg-gray-900 rounded-[1.75rem] border-[8px] border-gray-800 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)]">
        {/* Punch-hole camera */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-30 ring-1 ring-white/20" />
        <div className="absolute inset-0 rounded-[1.25rem] overflow-hidden bg-[--white-1]">
          {children}
        </div>
      </div>
    );
  }
  // tablet
  return (
    <div className="relative w-[560px] h-[420px] sm:w-[640px] sm:h-[480px] bg-gray-900 rounded-[2rem] border-[10px] border-gray-800 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)]">
      {/* Power button hint */}
      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-8 bg-gray-700 rounded-r-sm" />
      <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-[--white-1]">
        {children}
      </div>
    </div>
  );
};

export default ThemeSelector;
