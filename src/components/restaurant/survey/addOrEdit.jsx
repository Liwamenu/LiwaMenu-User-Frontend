import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { CancelI } from "../../../assets/icon";
import { usePopup } from "../../../context/PopupContext";
import {
  setSurveySettings,
  resetSetSurveySettings,
} from "../../../redux/restaurant/setSurveySettingsSlice";

const AddOrEditCategoryPopup = ({
  id,
  category,
  isActive,
  categories,
  setSettings,
  editingCategory,
}) => {
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { error, success } = useSelector((s) => s.restaurant.setSurveySettings);

  const [formKey, setFormKey] = useState(category?.key || "");
  const [formIcon, setFormIcon] = useState(category?.icon || "");

  function handleSave(e) {
    e.preventDefault();
    dispatch(
      setSurveySettings({
        restaurantId: id,
        categories: editingCategory
          ? categories.map((c) =>
              c.key === category.key
                ? { ...c, key: formKey, icon: formIcon }
                : c,
            )
          : [
              ...categories,
              {
                key: formKey,
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
      setSettings((prev) =>
        editingCategory
          ? prev.map((c) =>
              c.key === category.key
                ? { ...c, key: formKey, icon: formIcon }
                : c,
            )
          : [
              ...prev,
              {
                key: formKey,
                icon: formIcon,
                averageRating: 0,
                ratingCount: 0,
              },
            ],
      );
      dispatch(resetSetSurveySettings());
    }
    if (error) dispatch(resetSetSurveySettings());
  }, [success, error]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h3>
          <button
            onClick={() => setPopupContent(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <CancelI className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Category Key / ID
            </label>
            <input
              type="text"
              required
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder="e.g. food_quality"
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400 italic">
              This identifier is used for system translations.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Display Icon (Emoji)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                maxLength={2}
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-20 px-4 py-2 text-center text-2xl bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
              <div className="flex-grow grid grid-cols-5 gap-1 p-1 bg-gray-50 border border-gray-200 rounded-lg">
                {[
                  "🍕",
                  "✨",
                  "⚡",
                  "👨‍🍳",
                  "🧼",
                  "🍔",
                  "🍷",
                  "🌱",
                  "💰",
                  "🕙",
                ].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setFormIcon(e)}
                    className={`text-lg p-1 rounded hover:bg-white transition-colors ${formIcon === e ? "bg-white shadow-sm ring-1 ring-indigo-200" : ""}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setPopupContent(null)}
              className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
            >
              {editingCategory ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrEditCategoryPopup;
