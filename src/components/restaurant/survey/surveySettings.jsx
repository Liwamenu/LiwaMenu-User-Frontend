//MODULES
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  ClipboardList,
  Plus,
  Star,
  Pencil,
  Trash2,
  TrendingUp,
  Sparkles,
} from "lucide-react";

//COMP
import DeleteSurvey from "./deleteSurvey";
import AddOrEditCategoryPopup from "./addOrEdit";
import SettingsTabs from "../settingsTabs";
import { usePopup } from "../../../context/PopupContext";

//REDUX
import {
  getSurveySettings,
  resetGetSurveySettings,
} from "../../../redux/restaurant/getSurveySettingsSlice";

const SurveySettings = ({ data }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const id = useParams()["*"]?.split("/")[1];

  const {
    error,
    success,
    data: surveys,
  } = useSelector((s) => s.restaurant.getSurveySettings);
  const [settings, setSettings] = useState(null);
  const [isActive, setIsActive] = useState(null);

  //GET Survey Settings
  useEffect(() => {
    if (!settings) {
      dispatch(getSurveySettings({ restaurantId: id }));
    }
  }, [settings]);

  //SET Survey
  useEffect(() => {
    if (success) {
      setIsActive(surveys.enabled);
      setSettings(surveys.categories);
      dispatch(resetGetSurveySettings());
    }
    if (error) dispatch(resetGetSurveySettings());
  }, [success, error]);

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return "text-green-600 bg-green-50 border-green-100";
    if (rating >= 4.0) return "text-blue-600 bg-blue-50 border-blue-100";
    if (rating === 0) return "text-gray-400 bg-[--light-4] border-gray-100";
    return "text-amber-600 bg-amber-50 border-amber-100";
  };

  const getProgressColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500";
    if (rating >= 4.0) return "bg-blue-500";
    if (rating === 0) return "bg-gray-200";
    return "bg-amber-500";
  };

  const ratedCategories =
    settings?.filter((c) => c.averageRating > 0) || [];
  const overallAvg =
    ratedCategories.length > 0
      ? (
          ratedCategories.reduce((sum, c) => sum + c.averageRating, 0) /
          ratedCategories.length
        ).toFixed(1)
      : "—";
  const totalReviews =
    settings?.reduce((sum, c) => sum + (c.ratingCount || 0), 0) || 0;

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
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <ClipboardList className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("surveySettings.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {settings?.length ?? 0} kategori · {totalReviews}{" "}
              {t("surveySettings.reviews")} · ⭐ {overallAvg}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setPopupContent(
                <AddOrEditCategoryPopup
                  id={id}
                  isActive={isActive}
                  categories={settings}
                  editingCategory={false}
                  setSettings={setSettings}
                />,
              )
            }
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {t("surveySettings.add_survey")}
            </span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Empty state */}
          {settings?.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <ClipboardList className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("surveySettings.no_feedback")}
              </h3>
            </div>
          )}

          {/* Stacked rows */}
          {settings?.length > 0 && (
            <div className="flex flex-col gap-2">
              {settings.map((category) => {
                const rating = category.averageRating || 0;
                return (
                  <div
                    key={category.key}
                    className="group flex items-center gap-3 p-3 rounded-xl border border-[--border-1] bg-[--white-1] hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <span className="grid place-items-center size-11 rounded-lg bg-[--white-2] ring-1 ring-[--border-1] text-2xl shrink-0">
                      {category.icon}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-sm text-[--black-1] truncate capitalize">
                          {t(category.key)}
                        </h3>
                        <span className="text-[10px] text-[--gr-2] font-medium uppercase tracking-wider shrink-0">
                          · {category.ratingCount}{" "}
                          {t("surveySettings.reviews")}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[--white-2] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ease-out ${getProgressColor(rating)}`}
                          style={{ width: `${(rating / 5) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`size-3.5 ${
                            star <= Math.round(rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 fill-slate-300 dark:text-slate-600 dark:fill-slate-600"
                          }`}
                          strokeWidth={1.5}
                        />
                      ))}
                    </div>

                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold border shrink-0 ${getRatingColor(rating)}`}
                    >
                      {rating > 0 && <Star className="size-3 fill-current" />}
                      {rating.toFixed(1)}
                    </span>

                    <div className="flex gap-0.5 shrink-0 ml-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() =>
                          setPopupContent(
                            <AddOrEditCategoryPopup
                              id={id}
                              isActive={isActive}
                              category={category}
                              categories={settings}
                              editingCategory={true}
                              setSettings={setSettings}
                            />,
                          )
                        }
                        className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                        aria-label="Düzenle"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPopupContent(
                            <DeleteSurvey
                              id={id}
                              enabled={isActive}
                              category={category}
                              categories={settings}
                              setSettings={setSettings}
                            />,
                          )
                        }
                        className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                        aria-label="Sil"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* INSIGHT BANNER */}
          {settings?.length > 0 && (
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 via-indigo-50/70 to-cyan-50 border border-indigo-100 p-3 flex items-start gap-3">
              <span className="grid place-items-center size-10 rounded-xl bg-[--white-1] ring-1 ring-indigo-100 text-indigo-600 shrink-0 shadow-sm">
                {ratedCategories.length > 0 ? (
                  <TrendingUp className="size-5" />
                ) : (
                  <Sparkles className="size-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-indigo-900">
                  {t("surveySettings.performance_insight")}
                </h4>
                <p className="text-[11px] sm:text-xs text-indigo-700/90 leading-relaxed mt-0.5 [&_strong]:capitalize">
                  {ratedCategories.length > 0 ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: t("surveySettings.strongest_category", {
                          category: t(
                            settings.reduce((prev, curr) =>
                              prev.averageRating > curr.averageRating
                                ? prev
                                : curr,
                            ).key,
                          ),
                        }),
                      }}
                    />
                  ) : (
                    t("surveySettings.no_feedback")
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveySettings;
