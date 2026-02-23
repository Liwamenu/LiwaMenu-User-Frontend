//MODULES
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

//COMP
import { DeleteI } from "../../../assets/icon";
import CustomCheckbox from "../../common/customCheckbox";
import { usePopup } from "../../../context/PopupContext";

//REDUX
import {
  deleteCategory,
  resetDeleteCategory,
} from "../../../redux/categories/deleteCategorySlice";

const DeleteCategory = ({ category, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { success, error } = useSelector((s) => s.categories.deleteCategory);

  const [deleteSubItems, setDeleteSubItems] = useState(false);
  const [popCheckbox, setPopCheckbox] = useState(false);

  const handleSubmit = () => {
    if (!deleteSubItems) {
      setPopCheckbox(true);
      const removePop = setTimeout(() => {
        setPopCheckbox(false);
      }, 1000);
      return;
    }
    console.log(category.id, "is to be deleted");
    dispatch(deleteCategory(category.id));
  };

  useEffect(() => {
    if (success) {
      toast.success(t("deleteCategory.deleteSuccess"));
      dispatch(resetDeleteCategory());
      setPopupContent(false);
      onSuccess(category.id);
    }
    if (error) dispatch(resetDeleteCategory());
  }, [success, error]);

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[440px] flex flex-col items-center text-center shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        {/* Icon Circle */}
        <div className="size-16 bg-[--status-red] rounded-full flex items-center justify-center mb-6">
          <DeleteI className="size-[1.8rem] text-[--red-1]" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-3 tracking-tight">
          {t("deleteCategory.title")}
        </h2>

        {/* Description */}
        <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
          <span className="font-bold text-[--red-1]">{category.name}</span>{" "}
          {t("deleteCategory.description")}
        </p>

        {/* Delete sub categories and related items */}
        <div
          className={`mb-10 text-[--red-1] p-2  ${
            popCheckbox
              ? "border border-[--red-1] rounded-lg vibrate_sides bg-[--status-red-1]"
              : "border border-transparent"
          }`}
        >
          <CustomCheckbox
            required
            label={t("deleteCategory.delete_sub_items")}
            checked={deleteSubItems}
            onChange={() => setDeleteSubItems(!deleteSubItems)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 w-full text-sm">
          <button
            type="button"
            onClick={() => setPopupContent(false)}
            className="flex-1 py-2 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--gr-3] transition-colors"
          >
            {t("deleteCategory.cancel")}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 px-6 bg-[--red-1] text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            {t("deleteCategory.delete")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default DeleteCategory;
