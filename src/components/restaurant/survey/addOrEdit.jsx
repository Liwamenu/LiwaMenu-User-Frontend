import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ClipboardList, Pencil, X, Check, Loader2 } from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import {
  setSurveySettings,
  resetSetSurveySettings,
} from "../../../redux/restaurant/setSurveySettingsSlice";
import toast from "react-hot-toast";

// Curated picks for restaurant survey categories (taste, service,
// cleanliness, ambiance, price, speed, …). The grid scrolls, and the
// text box + the OS emoji panel cover anything not listed here.
const EMOJI_PRESETS = [
  "🍕", "🍔", "🍟", "🍝", "🍣", "🥗", "🥩", "🍳", "🌮", "🍰",
  "🍩", "☕", "🍷", "🍺", "🥤", "🍹", "🍽️", "👨‍🍳", "👩‍🍳", "🛎️",
  "🤝", "⭐", "✨", "❤️", "👍", "😋", "🔥", "⚡", "🥂", "🎵",
  "🪑", "🌱", "🧼", "✅", "💰", "💳", "🏷️", "🕙", "📍", "🚗",
];

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Backend stores survey keys lowercased — surface them to the user with each
// word's first letter capitalized so editing feels natural.
const toTitleCase = (s) =>
  typeof s === "string"
    ? s.replace(/(^|\s)(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase("tr-TR"))
    : s;

const AddOrEditCategoryPopup = ({
  id,
  category,
  isActive,
  categories,
  setSettings,
  editingCategory,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { error, success, loading } = useSelector(
    (s) => s.restaurant.setSurveySettings,
  );

  const [formKey, setFormKey] = useState(toTitleCase(category?.key || ""));
  const [formIcon, setFormIcon] = useState(category?.icon || "");

  function handleSave(e) {
    e.preventDefault();
    const trimmedKey = formKey.trim();
    if (!trimmedKey) return;

    dispatch(
      setSurveySettings({
        restaurantId: id,
        categories: editingCategory
          ? categories.map((c) =>
              c.key === category.key
                ? { ...c, key: trimmedKey, icon: formIcon }
                : c,
            )
          : [
              ...categories,
              {
                key: trimmedKey,
                icon: formIcon,
                averageRating: 0,
                ratingCount: 0,
              },
            ],
        enabled: isActive,
      }),
    );
  }

  useEffect(() => {
    if (success) {
      setPopupContent(null);
      toast.success(
        editingCategory
          ? t("surveySettings.updated_success")
          : t("surveySettings.added_success"),
        { id: "addOrEditCategorySuccess" },
      );
      const trimmedKey = formKey.trim();
      setSettings((prev) =>
        editingCategory
          ? prev.map((c) =>
              c.key === category.key
                ? { ...c, key: trimmedKey, icon: formIcon }
                : c,
            )
          : [
              ...prev,
              {
                key: trimmedKey,
                icon: formIcon,
                averageRating: 0,
                ratingCount: 0,
                id: Date.now(),
              },
            ],
      );
      dispatch(resetSetSurveySettings());
    }
    if (error) dispatch(resetSetSurveySettings());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  return (
    <div className="w-full max-w-md mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden">
      <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

      <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {editingCategory ? (
            <Pencil className="size-4" />
          ) : (
            <ClipboardList className="size-4" />
          )}
        </span>
        <h2 className="text-sm sm:text-base font-semibold text-[--black-1] flex-1 truncate">
          {editingCategory
            ? t("surveySettings.modal_edit_title")
            : t("surveySettings.modal_add_title")}
        </h2>
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition"
          aria-label={t("surveySettings.cancel")}
        >
          <X className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide">
            {t("surveySettings.name_label")}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            autoFocus
            type="text"
            required
            maxLength={60}
            autoComplete="off"
            spellCheck={false}
            value={formKey}
            onChange={(e) => setFormKey(e.target.value)}
            placeholder={t("surveySettings.name_placeholder")}
            className="w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          <p className="text-[10px] text-[--gr-1] mt-1">
            {t("surveySettings.name_hint")}
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide">
            {t("surveySettings.icon_label")}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <div className="flex items-start gap-2">
            <input
              type="text"
              required
              maxLength={8}
              value={formIcon}
              onChange={(e) => setFormIcon(e.target.value)}
              className="w-16 h-10 text-center text-2xl bg-[--white-1] border border-[--border-1] rounded-lg outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="flex-1 grid grid-cols-5 gap-1 p-1 bg-[--white-2] border border-[--border-1] rounded-lg max-h-32 overflow-y-auto content-start">
              {EMOJI_PRESETS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormIcon(emoji)}
                  className={`text-lg p-1 rounded transition-colors ${
                    formIcon === emoji
                      ? "bg-[--white-1] shadow-sm ring-1 ring-indigo-200"
                      : "hover:bg-[--white-1]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-[--gr-1] mt-1.5 leading-relaxed">
            {t("surveySettings.icon_emoji_hint")}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-[--border-1]">
          <button
            type="button"
            onClick={() => setPopupContent(null)}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
          >
            {t("surveySettings.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !formKey.trim() || !formIcon}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" strokeWidth={3} />
            )}
            {editingCategory
              ? t("surveySettings.update")
              : t("surveySettings.create")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddOrEditCategoryPopup;
