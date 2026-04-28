//MODULES
import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
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
} from "lucide-react";

// COMPONENTS
import CustomToogle from "../common/customToggle";
import CustomTextarea from "../common/customTextarea";
import SettingsTabs from "./settingsTabs";
import { usePopup } from "../../context/PopupContext";

// REDUX
import {
  getAnnouncementSettings,
  resetGetAnnouncementSettingsSlice,
} from "../../redux/restaurant/getAnnouncementSettingsSlice";
import {
  resetSetAnnouncementSettingsSlice,
  setAnnouncementSettings,
} from "../../redux/restaurant/setAnnouncementSettingsSlice";

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
  const [openPreview, setOpenPreview] = useState(false);

  const handleSubmit = () => {
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
      setSettings(announcementData);
      dispatch(resetGetAnnouncementSettingsSlice());
    }
    if (error) dispatch(resetGetAnnouncementSettingsSlice());
  }, [announcementData, error]);

  //TOAST ANNOUNCEMENT SETTINGS
  useEffect(() => {
    if (success) {
      toast.success(t("announcementSettings.success"));
      dispatch(resetSetAnnouncementSettingsSlice());
    }
    if (err) {
      dispatch(resetSetAnnouncementSettingsSlice());
    }
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
                : t("announcementSettings.preview_disabled")}
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

          {/* EDITOR + PREVIEW (wide HTML) */}
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
                placeholder={t("announcementSettings.html_content_placeholder")}
              />
            </div>

            {/* PREVIEW */}
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 flex flex-col min-h-[28rem] shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-[--border-1] bg-[--white-1]/70">
                <div className="flex items-center gap-2 text-[--gr-1] text-[11px] font-bold uppercase tracking-[0.12em]">
                  <Eye className="size-3.5 text-indigo-600" />
                  {t("announcementSettings.live_preview")}
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    settings?.enabled
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30"
                      : "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      settings?.enabled
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-[--gr-2]"
                    }`}
                  />
                  {settings?.enabled ? "Aktif" : "Pasif"}
                </span>
              </div>
              <div className="flex-1 p-5 relative overflow-y-auto">
                {!settings?.enabled && (
                  <div className="absolute inset-0 z-10 backdrop-blur-[1px] grid place-items-center pointer-events-none">
                    <div className="px-4 py-2 rounded-full bg-[--white-1]/90 shadow-md border border-[--border-1] text-[11px] font-semibold text-[--gr-1] uppercase tracking-wider">
                      {t("announcementSettings.preview_disabled")}
                    </div>
                  </div>
                )}
                <div
                  className="w-full"
                  dangerouslySetInnerHTML={{
                    __html: settings?.htmlContent || "",
                  }}
                />
              </div>
            </div>
          </div>

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
