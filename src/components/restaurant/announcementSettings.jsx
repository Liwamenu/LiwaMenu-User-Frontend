//MODULES
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
// import { GoogleGenAI } from "@google/genai";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  Megaphone,
  Sparkles,
  Code2,
  Eye,
  Save,
  Info,
  Power,
  Timer,
  Smartphone,
  Monitor,
  PowerOff,
  AlertTriangle,
} from "lucide-react";

// COMPONENTS
import CustomToogle from "../common/customToggle";
import CustomTextarea from "../common/customTextarea";
import SettingsTabs from "./settingsTabs";
import { usePopup } from "../../context/PopupContext";
import { useDirtyTracking } from "../../context/DirtyNavContext";

// REDUX
import {
  getAnnouncementSettings,
  resetGetAnnouncementSettingsSlice,
} from "../../redux/restaurant/getAnnouncementSettingsSlice";
import {
  resetSetAnnouncementSettingsSlice,
  setAnnouncementSettings,
} from "../../redux/restaurant/setAnnouncementSettingsSlice";
import useSmartRevalidate from "../../hooks/useSmartRevalidate";

// HTML safety helpers (validation + sandboxed preview srcDoc) are shared
// with externalPage.jsx — same authoring surface, same iframe contract
// with the customer side, so any drift between the two would re-create
// the "preview works in one spot, breaks in another" class of bugs.
import {
  detectDangerousContent,
  buildPreviewSrcDoc,
  PREVIEW_SANDBOX,
  PREVIEW_ALLOW,
} from "../../utils/htmlSafety";

const AnnouncementSettings = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const id = useParams()["*"]?.split("/")[1];
  const { setPopupContent } = usePopup();

  const { data: announcementData, error } = useSelector(
    (s) => s.restaurant.getAnnouncementSettings,
  );
  const { success, error: err } = useSelector(
    (s) => s.restaurant.setAnnouncementSettings,
  );

  const [settings, setSettings] = useState(null);
  const [settingsBefore, setSettingsBefore] = useState(null);
  useDirtyTracking(settings, settingsBefore);
  const [openPreview, setOpenPreview] = useState(false);
  // Device-frame width for the live preview. Lets the author confirm
  // their announcement is responsive — most customers see the popup on
  // a phone, but desktop (≥ md) breakpoints should also be checked.
  const [previewMode, setPreviewMode] = useState("mobile");

  // Self-contained HTML document for the preview iframe. Rendering the
  // author's HTML through an iframe (instead of dangerouslySetInnerHTML
  // on a parent <div>) is what stops pasted markup from leaking into the
  // Duyuru page — global <style> tags, unclosed <table>/<tr> trees and
  // CSS that targets `body`/`html` used to bleed into the surrounding
  // tab. The full doc + Tailwind CDN wrapper lives in the shared helper
  // so this preview matches both externalPage.jsx and the customer-side
  // AnnouncementModal.
  const previewSrcDoc = useMemo(
    () => buildPreviewSrcDoc(settings?.htmlContent),
    [settings?.htmlContent],
  );

  const handleSubmit = () => {
    // When the announcement is enabled, both the HTML body and a sane
    // display delay are required — saving an "active but empty" state
    // would push a blank popup to every customer. Skip these checks
    // when the toggle is off so the author can simply turn the
    // announcement off without filling everything in.
    if (settings?.enabled) {
      const hasHtml =
        typeof settings?.htmlContent === "string" &&
        settings.htmlContent.trim().length > 0;
      if (!hasHtml) {
        toast.error(t("announcementSettings.html_required"));
        return;
      }
      const delay = Number(settings?.delayMs);
      if (
        settings?.delayMs === null ||
        settings?.delayMs === undefined ||
        settings?.delayMs === "" ||
        !Number.isFinite(delay) ||
        delay < 0
      ) {
        toast.error(t("announcementSettings.delay_required"));
        return;
      }
    }
    // Block save if the HTML contains XSS- or SQL-injection-shaped
    // patterns. Surface the offending tokens in the toast so the
    // author can fix them immediately rather than guessing.
    const dangerous = detectDangerousContent(settings?.htmlContent);
    if (dangerous.length > 0) {
      toast.error(
        t("announcementSettings.dangerous_content_blocked", {
          items: dangerous.join(", "),
        }),
      );
      return;
    }
    dispatch(
      setAnnouncementSettings({
        restaurantId: id,
        ...settings,
      }),
    );
  };

  //GET ANNOUNCEMENT SETTINGS
  useEffect(() => {
    if (!settings) {
      dispatch(getAnnouncementSettings({ restaurantId: id }));
    }
  }, [settings]);

  // SET ANNOUNCEMENT SETTINGS
  useEffect(() => {
    if (announcementData) {
      // Only re-seed when pristine, so a background revalidate (tab
      // focus / in-app nav / cross-device change) never wipes unsaved
      // edits. On first load both are null → isEqual true → seeds.
      if (isEqual(settings, settingsBefore)) {
        // New restaurants come back with no display delay configured —
        // default it to 5 so the field opens pre-filled with a sensible
        // value instead of blank (matches the validation that requires a
        // delay once the announcement is enabled).
        const d = announcementData?.delayMs;
        const seeded =
          d === null || d === undefined || d === ""
            ? { ...announcementData, delayMs: 5 }
            : announcementData;
        setSettings(seeded);
        setSettingsBefore(seeded);
      }
      dispatch(resetGetAnnouncementSettingsSlice());
    }
    if (error) dispatch(resetGetAnnouncementSettingsSlice());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementData, error]);

  // Cross-device / returning-to-tab freshness — see useSmartRevalidate.
  useSmartRevalidate(
    id ? `announcementSettings:${id}` : null,
    () => dispatch(getAnnouncementSettings({ restaurantId: id, __silent: true })),
  );

  //TOAST ANNOUNCEMENT SETTINGS
  useEffect(() => {
    if (success) {
      toast.success(t("announcementSettings.success"));
      // Re-baseline so the DirtyNav check stops nagging until the
      // user touches the form again.
      setSettingsBefore(settings);
      dispatch(resetSetAnnouncementSettingsSlice());
    }
    if (err) {
      dispatch(resetSetAnnouncementSettingsSlice());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, err]);

  // const generateContentWithAI = async () => {
  //   setIsGenerating(true);
  //   try {
  //     const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  //     const response = await ai.models.generateContent({
  //       model: "gemini-3-flash-preview",
  //       contents:
  //         "Generate a beautiful HTML snippet for a restaurant's 10th anniversary celebration. Use Tailwind CSS classes for a modern look. Keep it concise but elegant. Return ONLY the HTML code inside a div.",
  //       config: {
  //         systemInstruction:
  //           "You are a professional web designer. Output only raw HTML snippets using standard Tailwind classes.",
  //       },
  //     });

  //     const newHtml = response.text || "";
  //     // Clean up markdown code blocks if AI returns them
  //     const cleanedHtml = newHtml.replace(/```html|```/g, "").trim();
  //     setSettings((prev) => ({ ...prev, htmlContent: cleanedHtml }));
  //   } catch (error) {
  //     console.error("AI Generation failed", error);
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };

  const labelCls =
    "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide";

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* gradient strip */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Megaphone className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("announcementSettings.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {settings?.enabled
                ? t("announcementSettings.enable_announcement")
                : t("announcementSettings.editor_hidden_title")}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* TOP ROW: Enable + Delay */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto] gap-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[--border-1] bg-[--white-2]/40 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center size-9 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                  <Power className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[--black-1] truncate">
                    {t("announcementSettings.enable_announcement")}
                  </h3>
                  <p className="text-[11px] text-[--gr-1] truncate">
                    {t("announcementSettings.enable_note")}
                  </p>
                </div>
              </div>
              <CustomToogle
                className1="!w-auto !shrink-0"
                checked={settings?.enabled}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    enabled: !prev?.enabled,
                  }))
                }
              />
            </div>

            <div className="rounded-xl border border-[--border-1] bg-[--white-2]/40 p-3 flex items-center gap-3 sm:w-72">
              <span className="grid place-items-center size-9 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Timer className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <label className={labelCls}>
                  {t("announcementSettings.display_delay")}
                </label>
                <div className="flex items-stretch rounded-lg border border-[--border-1] bg-[--white-1] focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition overflow-hidden h-9">
                  <input
                    type="number"
                    className="flex-1 min-w-0 px-2.5 outline-none text-sm bg-transparent"
                    value={settings?.delayMs ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        delayMs: e.target.value,
                      }))
                    }
                  />
                  <span className="bg-[--white-2] text-[--gr-1] text-xs font-semibold px-2.5 grid place-items-center border-l border-[--border-1]">
                    {t("announcementSettings.display_delay_unit")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* EDITOR + PREVIEW — only rendered when the announcement is
              enabled. Hiding the heavy iframe + dark code editor while
              the toggle is off keeps the screen focused on the single
              decision the author has to make first ("am I publishing an
              announcement?") and removes the visual noise that used to
              sit there with a "Pasif" overlay. */}
          {settings?.enabled ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr,1fr] gap-3">
              {/* HTML EDITOR */}
              <div className="rounded-xl border border-[--border-1] overflow-hidden bg-slate-900 flex flex-col min-h-[28rem] shadow-sm">
                <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-700/60 bg-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-200 text-[11px] font-bold uppercase tracking-[0.12em]">
                    <Code2 className="size-3.5 text-cyan-400" />
                    {t("announcementSettings.html_content_label")}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPopupContent(<PropmtInputPopup />)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 hover:brightness-110 active:brightness-95 transition shadow-sm"
                  >
                    <Sparkles className="size-3" />
                    {t("announcementSettings.magic_generate")}
                  </button>
                </div>
                <CustomTextarea
                  value={settings?.htmlContent ?? ""}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      htmlContent: e.target.value,
                    }))
                  }
                  rows={20}
                  className2="!flex-1 !min-h-0"
                  className="!w-full !flex-1 !p-4 !font-mono !text-xs !bg-slate-900 !text-slate-200 !border-0 !rounded-none focus:!ring-0 !outline-none !resize-none !shadow-none !min-h-[24rem] lg:!min-h-[26rem]"
                  placeholder={t(
                    "announcementSettings.html_content_placeholder",
                  )}
                />
              </div>

              {/* PREVIEW — sandboxed iframe centered inside a fixed-width
                  device frame so authors can confirm their HTML is
                  responsive at both phone and desktop widths. The
                  surrounding container scrolls so a tall announcement
                  is reachable without resizing the panel. */}
              <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 flex flex-col min-h-[28rem] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[--border-1] bg-[--white-1]/70">
                  <div className="flex items-center gap-2 text-[--gr-1] text-[11px] font-bold uppercase tracking-[0.12em] min-w-0">
                    <Eye className="size-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {t("announcementSettings.live_preview")}
                    </span>
                  </div>
                  {/* Device-width toggle. Mimics the customer view where
                      the popup is shown — most opens are on a phone, but
                      desktop must also look right. */}
                  <div className="inline-flex items-center rounded-md border border-[--border-1] bg-[--white-1] p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewMode("mobile")}
                      title={t("announcementSettings.preview_mobile")}
                      aria-pressed={previewMode === "mobile"}
                      className={`inline-flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                        previewMode === "mobile"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-[--gr-1] hover:bg-[--white-2]"
                      }`}
                    >
                      <Smartphone className="size-3" />
                      <span className="hidden sm:inline">
                        {t("announcementSettings.preview_mobile")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode("desktop")}
                      title={t("announcementSettings.preview_desktop")}
                      aria-pressed={previewMode === "desktop"}
                      className={`inline-flex items-center gap-1 px-2 h-6 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                        previewMode === "desktop"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-[--gr-1] hover:bg-[--white-2]"
                      }`}
                    >
                      <Monitor className="size-3" />
                      <span className="hidden sm:inline">
                        {t("announcementSettings.preview_desktop")}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative overflow-auto p-3 grid place-items-start justify-items-center">
                  {/* Device frame. Width is fixed per mode so the iframe
                      renders at a realistic viewport, instead of being
                      stretched to fill whatever column width the layout
                      currently has — that stretching is what made the
                      preview "feel non-responsive". */}
                  <div
                    className={`bg-white rounded-2xl shadow-lg border border-[--border-1] overflow-hidden transition-all duration-300 mx-auto w-full ${
                      previewMode === "mobile"
                        ? "max-w-[360px]"
                        : "max-w-[768px]"
                    }`}
                    style={{ height: "min(28rem, 70vh)" }}
                  >
                    {/* Sandboxed iframe. The full sandbox + Permissions
                        Policy contract lives in PREVIEW_SANDBOX /
                        PREVIEW_ALLOW so the admin preview, the external
                        page preview and the customer-side modal all
                        agree on what's allowed. */}
                    <iframe
                      title={t("announcementSettings.live_preview")}
                      className="w-full h-full border-0 bg-white block"
                      sandbox={PREVIEW_SANDBOX}
                      allow={PREVIEW_ALLOW}
                      srcDoc={previewSrcDoc}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/40 p-6 sm:p-8 flex flex-col items-center text-center gap-3">
              <span className="grid place-items-center size-11 rounded-2xl bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] shadow-sm">
                <PowerOff className="size-5" />
              </span>
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[--black-1]">
                  {t("announcementSettings.editor_hidden_title")}
                </h3>
                <p className="text-[12px] text-[--gr-1] mt-1 leading-relaxed">
                  {t("announcementSettings.editor_hidden_hint")}
                </p>
              </div>
            </div>
          )}

          {/* INFO BANNER */}
          <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 flex items-start gap-3">
            <span className="grid place-items-center size-8 rounded-lg bg-[--white-1] text-indigo-600 ring-1 ring-indigo-100 shrink-0">
              <Info className="size-4" />
            </span>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-indigo-900">
                {t("announcementSettings.did_you_know_title")}
              </h4>
              <p className="text-[11px] text-indigo-700/90 leading-relaxed mt-0.5">
                {t("announcementSettings.did_you_know_text")}
              </p>
            </div>
          </div>

          {/* CUSTOMER-SIDE COMPATIBILITY WARNING — surfaced because the
              admin preview is a sandboxed iframe (full HTML docs +
              <script> + embedded YouTube all work) but the customer
              menu is a separate project that may render the same HTML
              with dangerouslySetInnerHTML. In that case <script> tags
              don't execute and a full <html><head><style>…</style></head>
              loses its head-level CSS, leaving the modal looking blank.
              Without this notice authors think the admin panel has a
              bug ("preview works, mobile doesn't"). */}
          {settings?.enabled && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 flex items-start gap-3 dark:bg-amber-500/10 dark:border-amber-400/30">
              <span className="grid place-items-center size-8 rounded-lg bg-[--white-1] text-amber-600 ring-1 ring-amber-200 shrink-0 dark:bg-amber-500/15 dark:ring-amber-400/40">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {t("announcementSettings.customer_compat_title")}
                </h4>
                <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5 dark:text-amber-100/85">
                  {t("announcementSettings.customer_compat_text")}
                </p>
              </div>
            </div>
          )}

          {/* SUBMIT */}
          <div className="flex justify-end pt-3 border-t border-[--border-1]">
            <button
              type="button"
              onClick={handleSubmit}
              className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
              }}
            >
              <Save className="size-4" />
              {t("announcementSettings.save_changes")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementSettings;

const PropmtInputPopup = () => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const [prompt, setPrompt] = useState("");

  const handleGenerate = () => {};

  return (
    <main className="w-full flex justify-center">
      <div className="p-6 bg-[--white-1] rounded-lg shadow-lg w-full max-w-xl">
        <h2 className="text-lg font-semibold mb-4">
          {t("restaurantReservationSettings.generate_prompt_title")}
        </h2>
        <CustomTextarea
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-40"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t(
            "restaurantReservationSettings.generate_prompt_description",
          )}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setPopupContent(null)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
          >
            {t("restaurantReservationSettings.generate")}
          </button>
        </div>
      </div>
    </main>
  );
};
