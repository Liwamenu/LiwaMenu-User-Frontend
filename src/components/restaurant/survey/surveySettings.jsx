//MODULES
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

//COMP
import DeleteSurvey from "./deleteSurvey";
import AddOrEditCategoryPopup from "./addOrEdit";
import { usePopup } from "../../../context/PopupContext";
import { CancelI, DeleteI, EditI, StarI, TrendUpI } from "../../../assets/icon";

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
    if (rating === 0) return "text-gray-400 bg-gray-50 border-gray-100";
    return "text-amber-600 bg-amber-50 border-amber-100";
  };

  const getProgressColor = (rating) => {
    if (rating >= 4.5) return "bg-green-500";
    if (rating >= 4.0) return "bg-blue-500";
    if (rating === 0) return "bg-gray-200";
    return "bg-amber-500";
  };

  return (
    <div className="w-full pb-5 mt-1 bg-white rounded-lg text-gray-800 overflow-hidden shadow-lg border border-gray-200 relative">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-800 text-white py-5 px-6 sm:px-14">
          <h1 className="text-xl font-bold mb-4 sm:mb-0">
            {data?.name} Restaurant Customer Feedback Analytics
          </h1>
        </div>

        <div className="w-full flex justify-end">
          <button
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
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap bg-[--primary-1] text-white m-2"
          >
            <CancelI className="rotate-45 size-[1rem]" />
            Add Survey
          </button>
        </div>

        <div className="px-6 sm:px-14 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {settings &&
              settings.map((category) => (
                <div
                  key={category.key}
                  className="group p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* Action Buttons - Visible on hover */}
                  <div className="flex gap-1 mb-2 justify-end w-full">
                    <button
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
                      className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                      <EditI className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setPopupContent(
                          <DeleteSurvey
                            category={category}
                            categories={settings}
                            setSettings={setSettings}
                          />,
                        )
                      }
                      className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <DeleteI className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <div className="text-3xl p-2 rounded-xl bg-gray-50">
                      {category.icon}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-lg border text-sm font-bold ${getRatingColor(category.averageRating)}`}
                    >
                      {category.averageRating > 0
                        ? category.averageRating.toFixed(1)
                        : "NEW"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight truncate pr-8">
                        {t(category.key)}
                      </h3>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-tighter">
                        {category.ratingCount} reviews
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${getProgressColor(category.averageRating)}`}
                          style={{
                            width: `${(category.averageRating / 5) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarI
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(category.averageRating) ? "text-amber-400 fill-current" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {settings?.length > 0 && (
            <div className="mt-8 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-indigo-200 flex items-center justify-center shrink-0 shadow-sm">
                <TrendUpI className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-bold text-indigo-900 mb-1">
                  Performance Insight
                </h4>
                <p className="text-sm text-indigo-700/80 leading-relaxed max-w-2xl">
                  {settings.some((c) => c.averageRating > 0) ? (
                    <>
                      Your{" "}
                      <strong>
                        {
                          settings.reduce((prev, curr) =>
                            prev.averageRating > curr.averageRating
                              ? prev
                              : curr,
                          ).key
                        }
                      </strong>{" "}
                      rating is currently your strongest category! Keep up the
                      great work in this area.
                    </>
                  ) : (
                    "Start collecting feedback to see detailed analytics and insights about your restaurant performance."
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
