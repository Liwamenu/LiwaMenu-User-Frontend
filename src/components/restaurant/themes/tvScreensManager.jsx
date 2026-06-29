// Additional TV screens manager (screen 2+).
//
// Screen 1 is the restaurant's own TV setup, edited on the TV theme page
// above. This card manages every EXTRA screen — one per additional TV
// license — each with its own theme (tvMenuId), page duration, transition
// style and optional name. Backend contract (Brief 2):
//   GET    Restaurants/GetTvDisplays?restaurantId=         → { tvLicenseCount, displays[] }
//   PUT    Restaurants/UpsertTvDisplay                     → full save of one screen (displayNo >= 2)
//   DELETE Restaurants/DeleteTvDisplay?restaurantId=&displayNo=
// A screen with displayNo > tvLicenseCount is configured but NOT licensed
// (isActive:false) → we surface a "license required" hint. Each physical TV
// opens `{tenant}.liwamenu.tv/?tv={displayNo}`.
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Tv,
  Plus,
  Trash2,
  Loader2,
  Copy,
  Check,
  Lock,
  Globe,
  MonitorPlay,
} from "lucide-react";

import {
  THEMES,
  buildTenantUrl,
  clampDurationMs,
  normalizeTransitionStyle,
} from "./tvThemeConstants";
import {
  getTvDisplays,
  resetGetTvDisplays,
} from "../../../redux/restaurant/getTvDisplaysSlice";
import {
  upsertTvDisplay,
  resetUpsertTvDisplay,
} from "../../../redux/restaurant/upsertTvDisplaySlice";
import {
  deleteTvDisplay,
  resetDeleteTvDisplay,
} from "../../../redux/restaurant/deleteTvDisplaySlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Page-duration choices offered per screen (ms). Empty = use the theme's
// own default (null sent to the backend).
const DURATIONS = [
  5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000,
];

const TRANSITIONS = [
  ["fade", "tvThemeSelector.transition_fade"],
  ["slide", "tvThemeSelector.transition_slide"],
  ["none", "tvThemeSelector.transition_none"],
];

// One editable screen card. Holds its own draft state (Upsert is a full
// save, not a patch) and reports save/delete up to the manager, which owns
// the shared redux thunks + refetch.
function TvScreenCard({
  display, // server display, or null for a not-yet-saved draft
  displayNo,
  tenant,
  tvLicenseCount,
  busy, // any save/delete in flight → lock inputs
  savingNo,
  deletingNo,
  onSave,
  onDelete,
  isNew,
  t,
}) {
  const licensed = displayNo <= tvLicenseCount;
  const baseDuration =
    display?.pageDurationMs != null
      ? clampDurationMs(display.pageDurationMs)
      : null;

  const [tvMenuId, setTvMenuId] = useState(display?.tvMenuId ?? null);
  const [pageDurationMs, setPageDurationMs] = useState(baseDuration);
  const [transitionStyle, setTransitionStyle] = useState(
    normalizeTransitionStyle(display?.transitionStyle),
  );
  const [name, setName] = useState(display?.name ?? "");
  const [copied, setCopied] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const url = `${buildTenantUrl(tenant)}/?tv=${displayNo}`;
  const saving = savingNo === displayNo;
  const deleting = deletingNo === displayNo;

  const dirty =
    isNew ||
    (tvMenuId ?? null) !== (display?.tvMenuId ?? null) ||
    (pageDurationMs ?? null) !== (baseDuration ?? null) ||
    transitionStyle !== normalizeTransitionStyle(display?.transitionStyle) ||
    (name || "") !== (display?.name || "");
  const canSave = tvMenuId != null && dirty && !busy;

  const selectedTheme = THEMES.find((th) => th.id === tvMenuId) || null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — non-fatal */
    }
  };

  const inputCls =
    "w-full h-9 rounded-lg border border-[--border-1] bg-[--white-2] text-sm px-2 text-[--black-1] outline-none focus:border-[--primary-1] disabled:opacity-60";

  return (
    <div
      className={`rounded-xl border p-3.5 transition-colors ${
        licensed
          ? "border-[--border-1] bg-[--white-1]"
          : "border-amber-300 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20"
      }`}
    >
      {/* Header: screen no + license badge + delete */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center size-8 rounded-lg bg-[--white-2] ring-1 ring-[--border-1] text-indigo-600 shrink-0">
            <MonitorPlay className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[--black-1] truncate">
              {t("tvScreens.screen_label", { no: displayNo })}
              {name ? (
                <span className="text-[--gr-1] font-normal"> · {name}</span>
              ) : null}
            </p>
            {licensed ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <Check className="size-3" strokeWidth={3} />
                {t("tvScreens.licensed_badge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <Lock className="size-3" />
                {t("tvScreens.needs_license")}
              </span>
            )}
          </div>
        </div>

        {!isNew &&
          (confirmDel ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onDelete(displayNo);
                  setConfirmDel(false);
                }}
                disabled={busy}
                className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                {t("tvScreens.confirm_yes")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(false)}
                disabled={busy}
                className="h-7 px-2 rounded-md text-[11px] font-semibold text-[--gr-1] bg-[--white-2] border border-[--border-1] hover:text-[--black-1]"
              >
                {t("tvScreens.confirm_no")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDel(true)}
              disabled={busy}
              title={t("tvScreens.delete")}
              aria-label={t("tvScreens.delete")}
              className="grid place-items-center size-7 rounded-md text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition disabled:opacity-50 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30 shrink-0"
            >
              <Trash2 className="size-3.5" />
            </button>
          ))}
      </div>

      {/* Config grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Theme */}
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1">
            {t("tvScreens.theme_label")} *
          </label>
          <div className="flex items-center gap-2">
            <span
              className="size-9 rounded-md shrink-0 ring-1 ring-[--border-1]"
              style={{
                backgroundColor: selectedTheme?.color || "var(--white-2)",
              }}
            />
            <select
              value={tvMenuId ?? ""}
              onChange={(e) =>
                setTvMenuId(e.target.value === "" ? null : Number(e.target.value))
              }
              disabled={busy}
              className={inputCls}
            >
              <option value="">{t("tvScreens.theme_placeholder")}</option>
              {THEMES.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1">
            {t("tvScreens.name_label")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
            maxLength={40}
            placeholder={t("tvScreens.name_placeholder")}
            className="w-full h-9 rounded-lg border border-[--border-1] bg-[--white-2] text-sm px-3 text-[--black-1] outline-none focus:border-[--primary-1] disabled:opacity-60"
          />
        </div>

        {/* Page duration */}
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1">
            {t("tvScreens.duration_label")}
          </label>
          <select
            value={pageDurationMs ?? ""}
            onChange={(e) =>
              setPageDurationMs(
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            disabled={busy}
            className={inputCls}
          >
            <option value="">{t("tvScreens.duration_default")}</option>
            {DURATIONS.map((ms) => (
              <option key={ms} value={ms}>
                {ms / 1000} {t("tvThemeSelector.seconds_short")}
              </option>
            ))}
          </select>
        </div>

        {/* Transition */}
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1">
            {t("tvScreens.transition_label")}
          </label>
          <div className="grid grid-cols-3 gap-0.5 p-0.5 rounded-lg bg-[--white-2] border border-[--border-1] h-9">
            {TRANSITIONS.map(([id, key]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTransitionStyle(id)}
                disabled={busy}
                className={`rounded-md text-[11px] font-semibold transition disabled:opacity-50 ${
                  transitionStyle === id
                    ? "bg-[--white-1] text-indigo-700 shadow-sm ring-1 ring-[--border-1] dark:bg-indigo-500/20 dark:text-indigo-200"
                    : "text-[--gr-1] hover:text-[--black-1]"
                }`}
              >
                {t(key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* URL + Save */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 rounded-lg bg-[--white-2] border border-[--border-1] px-2 h-9">
          <Globe className="size-3.5 text-indigo-600 shrink-0" />
          <span className="text-[11px] text-[--gr-1] font-mono truncate">
            {url}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            title={t("tvScreens.copy")}
            aria-label={t("tvScreens.copy")}
            className="ml-auto grid place-items-center size-6 rounded-md text-[--gr-1] hover:text-indigo-600 shrink-0"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-600" strokeWidth={3} />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            onSave({ displayNo, tvMenuId, pageDurationMs, transitionStyle, name })
          }
          disabled={!canSave}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[--primary-1] hover:bg-[--primary-2] transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          {t("tvScreens.save")}
        </button>
      </div>

      {!licensed && (
        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
          {t("tvScreens.needs_license_hint")}
        </p>
      )}
    </div>
  );
}

const TvScreensManager = ({ data }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = useParams().id;
  const tenant = data?.tenant;

  const { data: tvData, loading: listLoading } = useSelector(
    (s) => s.restaurant.getTvDisplays,
  );
  const upsert = useSelector((s) => s.restaurant.upsertTvDisplay);
  const del = useSelector((s) => s.restaurant.deleteTvDisplay);

  const tvLicenseCount = tvData?.tvLicenseCount ?? 0;
  const displays = Array.isArray(tvData?.displays) ? tvData.displays : [];
  // Screen 1 lives on the TV theme page above; this card owns 2+.
  const extra = displays
    .filter((d) => d.displayNo >= 2)
    .sort((a, b) => a.displayNo - b.displayNo);

  const [drafts, setDrafts] = useState([]); // [{ displayNo }] not-yet-saved
  const [savingNo, setSavingNo] = useState(null);
  const [deletingNo, setDeletingNo] = useState(null);

  const busy = upsert.loading || del.loading;

  // Initial list fetch (silent → no full-screen loader on page load).
  useEffect(() => {
    if (restaurantId)
      dispatch(getTvDisplays({ restaurantId, __silent: true }));
    return () => {
      dispatch(resetUpsertTvDisplay());
      dispatch(resetDeleteTvDisplay());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Upsert result → toast, drop the saved draft, refetch the list.
  useEffect(() => {
    if (upsert.success) {
      toast.success(t("tvScreens.save_success"), { id: "tv-upsert-success" });
      setDrafts((prev) => prev.filter((d) => d.displayNo !== savingNo));
      setSavingNo(null);
      dispatch(resetUpsertTvDisplay());
      dispatch(getTvDisplays({ restaurantId, __silent: true }));
    } else if (upsert.error) {
      // The api interceptor already toasted the backend message.
      setSavingNo(null);
      dispatch(resetUpsertTvDisplay());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [upsert.success, upsert.error]);

  // Delete result → toast + refetch.
  useEffect(() => {
    if (del.success) {
      toast.success(t("tvScreens.delete_success"), { id: "tv-delete-success" });
      setDeletingNo(null);
      dispatch(resetDeleteTvDisplay());
      dispatch(getTvDisplays({ restaurantId, __silent: true }));
    } else if (del.error) {
      setDeletingNo(null);
      dispatch(resetDeleteTvDisplay());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [del.success, del.error]);

  const handleSave = (cfg) => {
    if (cfg.tvMenuId == null) {
      toast.error(t("tvScreens.theme_required"), { id: "tv-theme-required" });
      return;
    }
    setSavingNo(cfg.displayNo);
    dispatch(
      upsertTvDisplay({
        restaurantId,
        displayNo: cfg.displayNo,
        tvMenuId: cfg.tvMenuId,
        pageDurationMs: cfg.pageDurationMs ?? null,
        transitionStyle: cfg.transitionStyle || "fade",
        name: cfg.name?.trim() || null,
      }),
    );
  };

  const handleDelete = (displayNo) => {
    // Draft (never saved) → just drop it locally, no network call.
    if (!extra.some((d) => d.displayNo === displayNo)) {
      setDrafts((prev) => prev.filter((d) => d.displayNo !== displayNo));
      return;
    }
    setDeletingNo(displayNo);
    dispatch(deleteTvDisplay({ restaurantId, displayNo }));
  };

  const handleAdd = () => {
    const used = [
      ...extra.map((d) => d.displayNo),
      ...drafts.map((d) => d.displayNo),
    ];
    const next = used.length ? Math.max(...used) + 1 : 2;
    setDrafts((prev) => [...prev, { displayNo: next }]);
  };

  const totalShown = extra.length + drafts.length;

  return (
    <div className="mt-6 bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
      <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

      {/* Header */}
      <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <MonitorPlay className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
            {t("tvScreens.title")}
          </h2>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {t("tvScreens.subtitle")}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30 shrink-0">
          <Tv className="size-3.5" />
          {t("tvScreens.licensed_count", { count: tvLicenseCount })}
        </span>
      </div>

      <div className="p-4 space-y-3">
        {tvLicenseCount <= 1 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3 text-[12px] text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-200">
            {t("tvScreens.single_license_note")}
          </div>
        )}

        {listLoading && !tvData ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[--gr-1]">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-xs">{t("tvScreens.loading")}</span>
          </div>
        ) : totalShown === 0 ? (
          <div className="rounded-xl border border-dashed border-[--border-1] p-6 text-center">
            <p className="text-sm font-semibold text-[--black-1]">
              {t("tvScreens.empty_title")}
            </p>
            <p className="text-[12px] text-[--gr-1] mt-1">
              {t("tvScreens.empty_hint")}
            </p>
          </div>
        ) : (
          <>
            {extra.map((d) => (
              <TvScreenCard
                key={`s-${d.displayNo}`}
                display={d}
                displayNo={d.displayNo}
                tenant={tenant}
                tvLicenseCount={tvLicenseCount}
                busy={busy}
                savingNo={savingNo}
                deletingNo={deletingNo}
                onSave={handleSave}
                onDelete={handleDelete}
                isNew={false}
                t={t}
              />
            ))}
            {drafts.map((d) => (
              <TvScreenCard
                key={`d-${d.displayNo}`}
                display={null}
                displayNo={d.displayNo}
                tenant={tenant}
                tvLicenseCount={tvLicenseCount}
                busy={busy}
                savingNo={savingNo}
                deletingNo={deletingNo}
                onSave={handleSave}
                onDelete={handleDelete}
                isNew={true}
                t={t}
              />
            ))}
          </>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-50 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-400/30"
        >
          <Plus className="size-4" />
          {t("tvScreens.add_screen")}
        </button>
      </div>
    </div>
  );
};

export default TvScreensManager;
