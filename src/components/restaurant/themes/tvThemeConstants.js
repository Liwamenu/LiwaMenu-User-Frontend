// Shared TV-theme constants + helpers, used by both the single-screen TV
// theme page (tvMenuSelector.jsx) and the multi-screen manager
// (tvScreensManager.jsx). Kept in one module so the theme catalog stays a
// single source of truth as placeholder themes are replaced by real ones.

export const THEMES = [
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
  // Tema 7-14 — real themes shipping from the TV menu-theme catalog
  // (folders theme-7..theme-14 in the TV themes repo). Tag keys map to
  // the descriptive labels documented in the catalog spec.
  { id: 6, name: "Tema 7", color: "hsl(186 80% 45%)", tagKey: "tvThemeSelector.tag_fast_food_cream" },
  { id: 7, name: "Tema 8", color: "hsl(330 75% 55%)", tagKey: "tvThemeSelector.tag_todays_special" },
  { id: 8, name: "Tema 9", color: "hsl(160 65% 40%)", tagKey: "tvThemeSelector.tag_cafe_board" },
  { id: 9, name: "Tema 10", color: "hsl(0 70% 55%)", tagKey: "tvThemeSelector.tag_lunch_deals_grid" },
  { id: 10, name: "Tema 11", color: "hsl(150 60% 35%)", tagKey: "tvThemeSelector.tag_kebap_fire" },
  { id: 11, name: "Tema 12", color: "hsl(250 60% 60%)", tagKey: "tvThemeSelector.tag_editorial_walkthrough" },
  { id: 12, name: "Tema 13", color: "hsl(210 75% 50%)", tagKey: "tvThemeSelector.tag_featured_combos" },
  { id: 13, name: "Tema 14", color: "hsl(20 50% 35%)", tagKey: "tvThemeSelector.tag_hero_category_grid" },
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

// Build the tenant-facing live URL. TV menus live on the dedicated
// *.liwamenu.tv domain (separate from the QR menu's *.liwamenu.com domain —
// TV themes are rendered by a different theme app served from .tv). Each
// physical screen opens the same subdomain with its screen number:
// `{tenant}.liwamenu.tv/?tv=2`. Screen 1 = no `?tv` (historical default).
export const buildTenantUrl = (tenant, fallback = "demo") => {
  const t = (tenant || fallback).trim();
  return `https://${t}.liwamenu.tv`;
};

// Display-settings constraints, mirroring the backend contract:
//   pageDurationMs : number, 5000–15000 (per-theme default within that range)
//   transitionStyle: 'fade' | 'slide' | 'none' (default 'fade')
export const PAGE_DURATION_MIN_MS = 5000;
export const PAGE_DURATION_MAX_MS = 15000;
export const PAGE_DURATION_STEP_MS = 1000;
export const PAGE_DURATION_DEFAULT_MS = 7000; // mid-range fallback when missing
export const TRANSITION_STYLES = ["fade", "slide", "none"];

export const clampDurationMs = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return PAGE_DURATION_DEFAULT_MS;
  return Math.min(PAGE_DURATION_MAX_MS, Math.max(PAGE_DURATION_MIN_MS, n));
};

export const normalizeTransitionStyle = (v) =>
  TRANSITION_STYLES.includes(v) ? v : "fade";
