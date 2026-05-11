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
import PageHelp from "../../common/pageHelp";

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
  {
    id: 5,
    name: "Tema 6",
    color: "hsl(38 75% 52%)",
    tagKey: "qrThemeSelector.tag_elegant",
  },
  // Tema 7-18 — real themes shipping from the menu-theme catalog. Each
  // swatch color reflects the dominant accent of the actual theme.
  { id: 6, name: "Tema 7", color: "hsl(140 50% 40%)", tagKey: "qrThemeSelector.tag_natural_green" },
  { id: 7, name: "Tema 8", color: "hsl(230 60% 35%)", tagKey: "qrThemeSelector.tag_indigo_night" },
  { id: 8, name: "Tema 9", color: "hsl(280 60% 50%)", tagKey: "qrThemeSelector.tag_purple_gradient" },
  { id: 9, name: "Tema 10", color: "hsl(8 75% 60%)", tagKey: "qrThemeSelector.tag_cream_coral" },
  { id: 10, name: "Tema 11", color: "hsl(45 90% 50%)", tagKey: "qrThemeSelector.tag_night_gold" },
  { id: 11, name: "Tema 12", color: "hsl(120 30% 40%)", tagKey: "qrThemeSelector.tag_vintage_green" },
  { id: 12, name: "Tema 13", color: "hsl(335 80% 65%)", tagKey: "qrThemeSelector.tag_sweet_heart" },
  { id: 13, name: "Tema 14", color: "hsl(15 95% 55%)", tagKey: "qrThemeSelector.tag_anthracite_orange" },
  { id: 14, name: "Tema 15", color: "hsl(220 15% 30%)", tagKey: "qrThemeSelector.tag_accordion" },
  { id: 15, name: "Tema 16", color: "hsl(140 40% 55%)", tagKey: "qrThemeSelector.tag_tropical_trio" },
  { id: 16, name: "Tema 17", color: "hsl(30 60% 30%)", tagKey: "qrThemeSelector.tag_cafe_pro" },
  { id: 17, name: "Tema 18", color: "hsl(40 70% 45%)", tagKey: "qrThemeSelector.tag_vintage_gold" },
  // Placeholders 19-30 — temporary slots so owners can save a future
  // themeId and preview from the customer-facing app while the actual
  // theme is being built. Replace each entry once the corresponding
  // theme ships (see Tema 7-18 above as the template).
  { id: 18, name: "Tema 19", color: "hsl(186 80% 45%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 19, name: "Tema 20", color: "hsl(330 75% 55%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 20, name: "Tema 21", color: "hsl(160 65% 40%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 21, name: "Tema 22", color: "hsl(0 70% 55%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 22, name: "Tema 23", color: "hsl(150 60% 35%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 23, name: "Tema 24", color: "hsl(250 60% 60%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 24, name: "Tema 25", color: "hsl(210 75% 50%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 25, name: "Tema 26", color: "hsl(20 50% 35%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 26, name: "Tema 27", color: "hsl(290 65% 55%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 27, name: "Tema 28", color: "hsl(195 70% 50%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 28, name: "Tema 29", color: "hsl(50 65% 45%)", tagKey: "qrThemeSelector.tag_placeholder" },
  { id: 29, name: "Tema 30", color: "hsl(310 50% 50%)", tagKey: "qrThemeSelector.tag_placeholder" },
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
  // stale `success` state from another page can't fake a save here. The
  // parent's cached restaurant.themeId is kept in sync centrally via the
  // restaurantEntityPatchers matcher — no callback needed.
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
                      // Tablet renders denser (0.7 → ~143% iframe
                      // size) so the larger screen still shows
                      // crisp text. Phones stay at 0.8, which keeps
                      // the iframe viewport (~425-450px) close to a
                      // real Pro Max device width.
                      scale={device === "tablet" ? 0.7 : 0.8}
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

// Renders the iframe at a configurable scale so the menu fits inside the
// device frame at higher logical resolution. Default 0.8 (renders at
// 125% of container) gives sharper text than rendering at 1:1 because
// the browser composites at higher density and downscales. Tablet
// passes 0.7 to fit a wider menu while still feeling crisp.
const ScaledIframe = ({ iframeRef, src, onLoad, scale = 0.8 }) => (
  <iframe
    ref={iframeRef}
    src={src}
    title="Theme preview"
    onLoad={onLoad}
    scrolling="auto"
    style={{
      width: `calc(100% / ${scale})`,
      height: `calc(100% / ${scale})`,
      transform: `scale(${scale})`,
      transformOrigin: "0 0",
      border: 0,
      display: "block",
    }}
  />
);

// Glass + 3D mockup frames. The earlier version was a single rounded
// div with a flat black bezel — fine for a sketch, but the resulting
// preview looked toy-like next to the slick dashboard around it. The
// current set rebuilds each device with:
//   • A multi-stop gradient body (lit from above) for that "milled
//     metal / titanium" feel rather than a flat slab.
//   • Layered drop + inset shadows so the frame appears lifted off
//     the surface AND has its own internal depth.
//   • A diagonal glass-reflection overlay on the screen, plus a thin
//     inset white ring, so the screen reads as physical glass instead
//     of a flat rectangle. Pointer-events-none keeps the iframe
//     interactive underneath.
//   • Realistic side buttons (power / volume / action) on the iPhone
//     and Android, sized + positioned to mirror the real hardware.
//   • A small ambient glow blob behind the frame, picking up brand
//     colours, so the device feels embedded in the page rather than
//     floating against a flat backdrop.
//
// Tablet was switched from landscape (560x420) to portrait
// (420x560+) — the QR menu is fundamentally a portrait UI, and a
// landscape tablet was forcing the iframe into a viewport size no
// real customer ever uses, which made the layout look broken.
const DeviceFrame = ({ variant, children }) => {
  if (variant === "iphone") {
    return (
      <div className="relative w-[340px] h-[700px] sm:w-[360px] sm:h-[740px]">
        {/* Ambient glow blob — gives the device a sense of depth on
            the page without using a hard drop shadow. */}
        <div
          aria-hidden
          className="absolute -inset-8 rounded-[4rem] bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10 blur-3xl pointer-events-none"
        />

        {/* Hardware buttons — positioned outside the frame edge so
            they read as physical protrusions. */}
        <div
          aria-hidden
          className="absolute top-[120px] -left-[3px] w-[4px] h-[34px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-l shadow-[-1px_0_3px_rgba(0,0,0,0.5)]"
        />
        <div
          aria-hidden
          className="absolute top-[180px] -left-[3px] w-[4px] h-[60px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-l shadow-[-1px_0_3px_rgba(0,0,0,0.5)]"
        />
        <div
          aria-hidden
          className="absolute top-[260px] -left-[3px] w-[4px] h-[60px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-l shadow-[-1px_0_3px_rgba(0,0,0,0.5)]"
        />
        <div
          aria-hidden
          className="absolute top-[200px] -right-[3px] w-[4px] h-[100px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-r shadow-[1px_0_3px_rgba(0,0,0,0.5)]"
        />

        {/* Titanium frame body — gradient + multi-layer shadow gives
            the "lit from above" 3D look. */}
        <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.6),0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.1),inset_0_-3px_0_rgba(0,0,0,0.45)] ring-1 ring-white/10 dark:ring-white/5">
          {/* Top edge highlight — fakes a thin chrome-lit edge. */}
          <div
            aria-hidden
            className="absolute top-[3px] left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-full"
          />

          {/* Screen */}
          <div className="absolute inset-[10px] rounded-[2.4rem] overflow-hidden bg-[--white-1]">
            {children}

            {/* Dynamic Island — the floating pill, NOT a wide notch.
                Sits over the screen so iframe content rolls behind it
                exactly like the real device. */}
            <div
              aria-hidden
              className="absolute top-[10px] left-1/2 -translate-x-1/2 w-[110px] h-[32px] bg-black rounded-full z-30 shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.05)] ring-1 ring-black/80"
            />
            {/* Camera lens — small glassy dot inside the island. */}
            <div
              aria-hidden
              className="absolute top-[18px] left-[calc(50%+30px)] -translate-x-1/2 w-[10px] h-[10px] rounded-full bg-slate-900 z-40 ring-[1.5px] ring-slate-700/40 shadow-inner"
            >
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
              <div className="absolute top-[1px] left-[1.5px] w-[2px] h-[2px] rounded-full bg-white/40" />
            </div>

            {/* Glass reflection — diagonal sheen over the whole
                screen. Pointer-events-none so iframe stays usable. */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[15] rounded-[2.4rem] bg-gradient-to-br from-white/[0.10] via-white/0 to-white/[0.04]"
            />
            {/* Inner edge highlight — simulates the thin glass bevel. */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[25] rounded-[2.4rem] ring-1 ring-inset ring-white/10"
            />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "android") {
    return (
      <div className="relative w-[340px] h-[700px] sm:w-[360px] sm:h-[740px]">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute -inset-8 rounded-[3.5rem] bg-gradient-to-br from-emerald-500/10 via-transparent to-blue-500/10 blur-3xl pointer-events-none"
        />

        {/* Side buttons — Pixel-style: power + volume on the right. */}
        <div
          aria-hidden
          className="absolute top-[160px] -right-[3px] w-[4px] h-[60px] bg-gradient-to-b from-zinc-500 via-zinc-700 to-zinc-600 rounded-r shadow-[1px_0_3px_rgba(0,0,0,0.5)]"
        />
        <div
          aria-hidden
          className="absolute top-[230px] -right-[3px] w-[4px] h-[100px] bg-gradient-to-b from-zinc-500 via-zinc-700 to-zinc-600 rounded-r shadow-[1px_0_3px_rgba(0,0,0,0.5)]"
        />

        {/* Frame body — softer corners than iPhone. */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-zinc-700 via-zinc-900 to-zinc-800 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.55),0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.06),inset_0_-3px_0_rgba(0,0,0,0.4)] ring-1 ring-white/5">
          <div
            aria-hidden
            className="absolute top-[3px] left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-full"
          />

          {/* Screen — slim bezel for that flagship-Android look. */}
          <div className="absolute inset-[8px] rounded-[2.1rem] overflow-hidden bg-[--white-1]">
            {children}

            {/* Punch-hole camera */}
            <div
              aria-hidden
              className="absolute top-3 left-1/2 -translate-x-1/2 w-[14px] h-[14px] rounded-full bg-black z-30 ring-[1.5px] ring-zinc-800 shadow-md"
            >
              <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-zinc-800 via-black to-black" />
              <div className="absolute top-[1.5px] left-[2px] w-[2px] h-[2px] rounded-full bg-white/35" />
            </div>

            {/* Glass + edge highlight */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[15] rounded-[2.1rem] bg-gradient-to-br from-white/[0.08] via-white/0 to-white/[0.03]"
            />
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[25] rounded-[2.1rem] ring-1 ring-inset ring-white/10"
            />
          </div>
        </div>
      </div>
    );
  }

  // Tablet (iPad-Pro inspired) — PORTRAIT. Was landscape before; the
  // QR menu is a portrait UI and a landscape tablet was forcing the
  // iframe into an artificial viewport.
  return (
    <div className="relative w-[420px] h-[560px] sm:w-[460px] sm:h-[620px]">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-3xl pointer-events-none"
      />

      {/* Top edge: power button (portrait orientation puts it on top). */}
      <div
        aria-hidden
        className="absolute -top-[3px] right-[60px] h-[4px] w-[44px] bg-gradient-to-r from-slate-500 via-slate-700 to-slate-600 rounded-t shadow-[0_-1px_3px_rgba(0,0,0,0.4)]"
      />
      {/* Right edge: volume rocker. */}
      <div
        aria-hidden
        className="absolute top-[60px] -right-[3px] w-[4px] h-[40px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-r shadow-[1px_0_3px_rgba(0,0,0,0.4)]"
      />
      <div
        aria-hidden
        className="absolute top-[110px] -right-[3px] w-[4px] h-[40px] bg-gradient-to-b from-slate-500 via-slate-700 to-slate-600 rounded-r shadow-[1px_0_3px_rgba(0,0,0,0.4)]"
      />

      {/* Outer body */}
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-900 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.55),0_25px_50px_-12px_rgba(0,0,0,0.4),inset_0_2px_0_rgba(255,255,255,0.08),inset_0_-3px_0_rgba(0,0,0,0.4)] ring-1 ring-white/10">
        <div
          aria-hidden
          className="absolute top-[3px] left-16 right-16 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
        />

        {/* Screen — uniform thin bezel, iPad-style. */}
        <div className="absolute inset-[14px] rounded-[1.4rem] overflow-hidden bg-[--white-1]">
          {children}

          {/* Front camera dot — top centre in portrait. */}
          <div
            aria-hidden
            className="absolute top-2 left-1/2 -translate-x-1/2 w-[8px] h-[8px] rounded-full bg-slate-900 z-30 ring-1 ring-slate-700"
          >
            <div className="absolute inset-[1.5px] rounded-full bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
          </div>

          {/* Glass + edge */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[15] rounded-[1.4rem] bg-gradient-to-br from-white/[0.08] via-white/0 to-white/[0.03]"
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none z-[25] rounded-[1.4rem] ring-1 ring-inset ring-white/10"
          />
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
