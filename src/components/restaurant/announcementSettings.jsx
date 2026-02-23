//MODULES
import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
// import { GoogleGenAI } from "@google/genai";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

// COMPONENTS
import CustomInput from "../common/customInput";
import CustomToogle from "../common/customToggle";
import CustomTextarea from "../common/customTextarea";
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

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2] overflow-hidden">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold bg-indigo-800 text-white py-5 px-6 sm:px-14">
          {t("announcementSettings.title", { name: data?.name })}
        </h1>

        <div className="px-6 sm:px-14 py-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Controls Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-[--light-1] rounded-xl border border-[--gr-4]">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {t("announcementSettings.enable_announcement")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("announcementSettings.enable_note")}
                </p>
              </div>
              <div>
                <CustomToogle
                  checked={settings?.enabled}
                  onChange={() =>
                    setSettings((prev) => ({
                      ...prev,
                      enabled: !prev?.enabled,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[--gr-1]">
                {t("announcementSettings.display_delay")} (
                {t("announcementSettings.display_delay_unit")})
              </label>
              <div className="relative">
                <CustomInput
                  type="number"
                  className="bg-[--white-1]"
                  value={settings?.delayMs}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      delayMs: e,
                    }))
                  }
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {t("announcementSettings.display_delay_unit")}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {t("announcementSettings.display_delay_help")}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-semibold text-[--gr-1]">
                  {t("announcementSettings.html_content_label")}
                </label>
                <button
                  onClick={() => setPopupContent(<PropmtInputPopup />)}
                  // disabled={isGenerating}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-2 py-1 bg-[--gr-4] rounded-md transition-colors disabled:opacity-50"
                >
                  {t("announcementSettings.magic_generate")}
                </button>
              </div>
              <CustomTextarea
                value={settings?.htmlContent}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    htmlContent: e.target.value,
                  }))
                }
                rows={12}
                className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-300 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none shadow-inner h-52"
                placeholder={t("announcementSettings.html_content_placeholder")}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex flex-col h-full">
            <h3 className="text-sm font-semibold text-[--gr-1] flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>{t("announcementSettings.live_preview")}</span>
            </h3>

            <div className="flex-grow border-2 border-dashed border-[--gr-3] rounded-2xl bg-[--white-1] p-8 overflow-y-auto relative min-h-[500px] shadow-inner flex flex-col justify-center items-center">
              {!settings?.enabled && (
                <div className="absolute inset-0 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-2xl">
                  <div className="bg-[--white-1] px-6 py-3 rounded-full shadow-xl border border-[--gr-1] flex items-center gap-3">
                    <span className="text-red-500 font-bold">●</span>
                    <span className="text-sm font-medium text-[--gr-2] uppercase tracking-wide">
                      {t("announcementSettings.preview_disabled")}
                    </span>
                  </div>
                </div>
              )}
              <div
                className="w-full max-w-md mx-auto"
                dangerouslySetInnerHTML={{ __html: settings?.htmlContent }}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md shadow-[--light-2] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                {t("announcementSettings.save_changes")}
              </button>
            </div>
          </div>
        </div>

        {/* Informational Footer */}
        <div className="bg-[--light-1] p-6 sm:px-14 border-t border-[--light-2] flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[--white-1] flex items-center justify-center text-indigo-600 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900">
              {t("announcementSettings.did_you_know_title")}
            </h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              {t("announcementSettings.did_you_know_text")}
            </p>
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
      <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-xl">
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
