import { isEqual } from "lodash";
import AddSubCategory from "./addSubCategory";
import { usePopup } from "../../../context/PopupContext";
import { CancelI } from "../../../assets/icon";
import CheckI from "../../../assets/icon/check";
import { useTranslation } from "react-i18next";

const SubCategoriesHeader = ({
  onSuccess,
  before,
  after,
  saveNewOrder,
  restaurant,
}) => {
  const { setPopupContent } = usePopup();
  const { t } = useTranslation();

  const handleAddSubCategory = () => {
    setPopupContent(
      <AddSubCategory onSuccess={onSuccess} restaurant={restaurant} />,
    );
  };

  return (
    <div className="flex justify-between items-center max-sm:flex-col">
      <div className="w-full">
        <h2 className="text-lg font-semibold text-[--black-1]">
          {t("editSubCategories.header_title")}
        </h2>
        <p className="text-xs text-[--gr-1] mt-1">
          {t("editSubCategories.header_subtitle")}
        </p>
      </div>

      <div className="py-4 flex items-center justify-start sm:justify-end sm:text-sm w-full max-sm:text-xs">
        <button
          onClick={handleAddSubCategory}
          className="px-2 py-2 font-medium text-white bg-[--primary-1] rounded-lg shadow-md hover:bg-[--primary-2] transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <CancelI className="size-[1.1rem] rotate-45" />
          {t("editSubCategories.add_button")}
        </button>

        {!isEqual(before, after) && (
          <div className="flex h-max justify-end">
            <button
              onClick={saveNewOrder}
              className="px-4 py-2 text-white bg-[--green-1] rounded-lg shadow-md hover:bg-[--green-2] transition-all flex items-center gap-2 whitespace-nowrap ml-2"
            >
              <CheckI className="size-[1.1rem]" />
              {t("editSubCategories.save_changes")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubCategoriesHeader;
