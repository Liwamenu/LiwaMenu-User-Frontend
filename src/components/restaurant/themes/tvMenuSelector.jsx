import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Tv,
  Monitor,
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
// Use the TV-specific slice (NOT the shared setRestaurantTheme) so the
// backend can route TV writes to a dedicated endpoint that only touches
// `tvMenuId` — picking a TV theme used to silently switch the QR theme
// because both selectors hit the same endpoint and the missing
// `themeId` was being defaulted/nulled.
import {
  setRestaurantTvTheme,
  resetSetRestaurantTvTheme,
} from "../../../redux/restaurant/setRestaurantTvThemeSlice";
import PageHelp from "../../common/pageHelp";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const THEMES = [
  {
    id: 0,
    name: "Tema 1",
    color: "hsl(24 95% 53%)",
    tagKey: "tvThemeSelector.tag_classic",
  },
  {
    id: 1,
    name: "Tema 2",
    color: "hsl(270 65% 65%)",
    tagKey: "tvThemeSelector.tag_modern",
  },
  {
    id: 2,
    name: "Tema 3",
    color: "hsl(142 58% 26%)",
    tagKey: "tvThemeSelector.tag_natural",
  },
  {
    id: 3,
    name: "Tema 4",
    color: "hsl(48 100% 50%)",
    tagKey: "tvThemeSelector.tag_sunny",
  },
  {
    id: 4,
    name: "Tema 5",
    color: "hsl(120 100% 25%)",
    tagKey: "tvThemeSelector.tag_fresh",
  },
  // Placeholders 6-30 — temporary slots so owners can save a TV themeId
  // in the database and preview from the TV theme app while real themes
  // are being built. Replace each entry as the matching theme ships.
  { id: 5, name: "Tema 6", color: "hsl(38 75% 52%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 6, name: "Tema 7", color: "hsl(186 80% 45%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 7, name: "Tema 8", color: "hsl(330 75% 55%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 8, name: "Tema 9", color: "hsl(160 65% 40%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 9, name: "Tema 10", color: "hsl(0 70% 55%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 10, name: "Tema 11", color: "hsl(150 60% 35%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 11, name: "Tema 12", color: "hsl(250 60% 60%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 12, name: "Tema 13", color: "hsl(210 75% 50%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 13, name: "Tema 14", color: "hsl(20 50% 35%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 14, name: "Tema 15", color: "hsl(290 65% 55%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 15, name: "Tema 16", color: "hsl(140 40% 55%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 16, name: "Tema 17", color: "hsl(30 60% 30%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 17, name: "Tema 18", color: "hsl(40 70% 45%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 18, name: "Tema 19", color: "hsl(195 70% 50%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 19, name: "Tema 20", color: "hsl(50 65% 45%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 20, name: "Tema 21", color: "hsl(310 50% 50%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 21, name: "Tema 22", color: "hsl(220 15% 30%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 22, name: "Tema 23", color: "hsl(335 80% 65%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 23, name: "Tema 24", color: "hsl(8 75% 60%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 24, name: "Tema 25", color: "hsl(45 90% 50%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 25, name: "Tema 26", color: "hsl(140 50% 40%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 26, name: "Tema 27", color: "hsl(230 60% 35%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 27, name: "Tema 28", color: "hsl(280 60% 50%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 28, name: "Tema 29", color: "hsl(120 30% 40%)", tagKey: "tvThemeSelector.tag_placeholder" },
  { id: 29, name: "Tema 30", color: "hsl(15 95% 55%)", tagKey: "tvThemeSelector.tag_placeholder" },
];

const DEVICES = [
  { id: "screen1", icon: Tv, labelKey: "tvThemeSelector.screen1" },
  { id: "screen2", icon: Monitor, labelKey: "tvThemeSelector.screen2" },
  { id: "screen3", icon: Monitor, labelKey: "tvThemeSelector.screen3" },
];

// Build the tenant-facing live URL — used as the iframe preview source.
// TV menus live on the dedicated *.liwamenu.tv domain (separate from the
// QR menu's *.liwamenu.com domain — TV themes are rendered by a different
// theme app served from .tv).
const buildTenantUrl = (tenant, fallback = "demo") => {
  const t = (tenant || fallback).trim();
  return `https://${t}.liwamenu.tv`;
};

const ThemeSelector = ({ data }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = params.id;
  const iframeRef = useRef(null);

  const { success, loading } = useSelector(
    (s) => s.restaurant.setRestaurantTvTheme,
  );

  const [device, setDevice] = useState("screen1");
  const [isLoading, setIsLoading] = useState(true);
  // null until the server returns a saved tvMenuId or the user picks one —
  // we do NOT default to Tema 1, so nothing is auto-selected/applied.
  const [selectedThemeId, setSelectedThemeId] = useState(
    data?.tvMenuId ?? null,
  );
  const [activeThemeId, setActiveThemeId] = useState(data?.tvMenuId ?? null);
  const [pendingThemeId, setPendingThemeId] = useState(null);

  const activeTheme = THEMES.find((th) => th.id === activeThemeId) || null;

  const tenant = data?.tenant;
  const liveUrl = buildTenantUrl(tenant);
  const iframeUrl =
    activeThemeId != null
      ? `${liveUrl}?v=${activeThemeId}&mode=tv`
      : `${liveUrl}?mode=tv`;

  const isPending = (id) => pendingThemeId === id && loading;

  // Click a theme card → optimistic select + dispatch save immediately.
  const handlePickTheme = (themeId) => {
    if (loading) return;
    if (themeId === activeThemeId) return;
    setSelectedThemeId(themeId);
    setPendingThemeId(themeId);
    dispatch(
      setRestaurantTvTheme({
        tvMenuId: themeId,
        restaurantId,
      }),
    );
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

  // Reset loading state when the saved theme or device changes.
  useEffect(() => {
    setIsLoading(true);
  }, [activeThemeId, device]);

  // Initialize from server data
  useEffect(() => {
    if (data?.tvMenuId !== undefined && data?.tvMenuId !== null) {
      setSelectedThemeId(data.tvMenuId);
      setActiveThemeId(data.tvMenuId);
    }
  }, [data]);

  // Reset any leftover redux state from previous saves (e.g. user came from
  // QR themes which uses the same slice) so the success-effect below doesn't
  // fire spuriously on mount.
  useEffect(() => {
    dispatch(resetSetRestaurantTvTheme());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast on success + commit active theme. Guarded by `pendingThemeId` so a
  // stale `success` state from another page can't fake a save here. The
  // parent's cached restaurant.tvMenuId is kept in sync centrally via the
  // restaurantEntityPatchers matcher — no callback needed.
  useEffect(() => {
    if (success && pendingThemeId !== null) {
      toast.success(t("tvThemeSelector.success_updated"), {
        id: "set-tv-theme-success",
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
              {t("tvThemeSelector.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("tvThemeSelector.subtitle")}
            </p>
          </div>
          <PageHelp pageKey="tvThemes" />
          {loading && (
            <span className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30">
              <Loader2 className="size-3.5 animate-spin" />
              {t("tvThemeSelector.saving")}
            </span>
          )}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[20rem_1fr] min-h-[680px]">
          {/* LEFT — Theme cards + active summary */}
          <div className="border-b lg:border-b-0 lg:border-r border-[--border-1] flex flex-col">
            {/* Active (saved) theme summary */}
            <div className="p-4 border-b border-[--border-1] bg-[--white-2]/60">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
                {t("tvThemeSelector.saved_state")}
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
                    {t("tvThemeSelector.active_badge")}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center size-11 rounded-xl bg-[--white-2] ring-1 ring-[--border-1] text-[--gr-2] shrink-0">
                    <Palette className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[--black-1] truncate">
                      {t("tvThemeSelector.no_theme_title")}
                    </p>
                    <p className="text-[11px] text-[--gr-1] truncate">
                      {t("tvThemeSelector.no_theme_hint")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Theme list — capped so the page doesn't grow with theme
                count. ~10 cards fit inside ~680px (each card is
                p-2.5 + size-10 ≈ 60px tall, plus a 6px gap). The
                `min(...)` guard switches to a viewport-relative cap on
                short laptop screens so the list never pushes the
                preview iframe off-screen. `flex-1` is kept so the
                pane still fills available column space when fewer than
                10 themes are registered. */}
            <div className="p-3 flex-1 max-h-[min(680px,75dvh)] overflow-y-auto space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] px-1 mb-1.5">
                {t("tvThemeSelector.select_theme")}
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
                  {t("tvThemeSelector.live_url")}
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
                {t("tvThemeSelector.open_new_tab")}
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
                  {t("tvThemeSelector.preview_title")}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
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
                  title={t("tvThemeSelector.refresh")}
                  aria-label={t("tvThemeSelector.refresh")}
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
                  // iframe src in place so the screen frame stays put.
                  key={device}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.03, y: -10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="relative z-10"
                >
                  <ScreenFrame variant={device}>
                    <ScaledIframe
                      iframeRef={iframeRef}
                      src={iframeUrl}
                      onLoad={() => setIsLoading(false)}
                      scale={tvScaleFor(device)}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 grid place-items-center bg-[--white-1]/85 backdrop-blur-sm z-20 transition-opacity">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="size-7 text-indigo-600 animate-spin" />
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[--gr-1]">
                            {t("tvThemeSelector.loading_theme")}
                          </p>
                        </div>
                      </div>
                    )}
                  </ScreenFrame>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inverse zoom factor that maps the iframe content into the visible pixel
// dimensions of the chosen TV/Monitor frame. The frame itself is rendered
// at a fixed visual size (~720×405 px) so the layout doesn't blow up.
const tvScaleFor = (variant) => {
  switch (variant) {
    case "screen1":
      return 0.5; // 1080p → render iframe at 50% zoom inside the frame
    case "screen2":
      return 0.4; // 1440p → smaller text density
    case "screen3":
      return 0.3; // 4K → smallest text density
    default:
      return 0.5;
  }
};

// Renders the iframe at the given scale and clips its scrollbars.
const ScaledIframe = ({ iframeRef, src, onLoad, scale = 0.5 }) => {
  const inv = 1 / scale; // e.g. scale 0.5 → 200% size, then transform back to 100%
  return (
    <iframe
      ref={iframeRef}
      src={src}
      title="Theme preview"
      onLoad={onLoad}
      scrolling="auto"
      style={{
        width: `calc(${inv * 100}% + 24px)`,
        height: `calc(${inv * 100}% + 24px)`,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        border: 0,
        display: "block",
      }}
    />
  );
};

// Visual TV / monitor frame at fixed display size (16:9 ratio).
const ScreenFrame = ({ variant, children }) => {
  // Same outer pixel size for all variants — what changes is the iframe scale
  // (so 4K shows more content per pixel = smaller text).
  const outer = "w-[600px] h-[338px] sm:w-[720px] sm:h-[405px]";

  if (variant === "screen1") {
    // Classic TV with bezel + stand
    return (
      <div className="flex flex-col items-center">
        <div
          className={`relative ${outer} bg-black rounded-2xl border-[10px] border-gray-900 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)] ring-1 ring-white/10 dark:ring-white/5`}
        >
          {/* Brand dot */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-700 rounded-full z-30" />
          <div className="absolute inset-0 rounded-md overflow-hidden bg-[--white-1]">
            {children}
          </div>
        </div>
        {/* Stand */}
        <div className="w-24 h-1.5 bg-gray-800 rounded-b" />
        <div className="w-40 h-1.5 bg-gray-700 rounded-b" />
      </div>
    );
  }

  if (variant === "screen2") {
    // Slim monitor with thin bezel
    return (
      <div className="flex flex-col items-center">
        <div
          className={`relative ${outer} bg-gray-900 rounded-xl border-[6px] border-gray-800 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)] ring-1 ring-white/5`}
        >
          <div className="absolute inset-0 rounded-md overflow-hidden bg-[--white-1]">
            {children}
          </div>
        </div>
        <div className="w-12 h-2 bg-gray-800 rounded-b" />
      </div>
    );
  }

  // screen3 — Ultra-thin 4K monitor
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative ${outer} bg-gray-900 rounded-lg border-[4px] border-gray-800 shadow-[0_40px_100px_-25px_rgba(0,0,0,0.4)] ring-1 ring-white/5`}
      >
        <div className="absolute inset-0 rounded-sm overflow-hidden bg-[--white-1]">
          {children}
        </div>
      </div>
      <div className="w-16 h-1.5 bg-gray-800 rounded-b" />
    </div>
  );
};

export default ThemeSelector;
