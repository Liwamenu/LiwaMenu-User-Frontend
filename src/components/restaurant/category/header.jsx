//MODULES
import { useTranslation } from "react-i18next";
// import { Link, useParams } from "react-router-dom";

//COMP
import AddCategory from "./addCategory";
import { CancelI } from "../../../assets/icon";
import { usePopup } from "../../../context/PopupContext";

const CategoriesHeader = ({ id, restaurant, onSuccess }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const headers = [
    { label: "Categories", path: "list" },
    { label: "Add Category", path: "add" },
  ];

  return (
    <div className="w-full flex gap-2 my-4 text-sm">
      <div className="flex justify-end w-full">
        <button
          className="whitespace-nowrap flex gap-2 items-center bg-[--primary-1] text-white px-3 py-2 rounded-md"
          onClick={() => {
            setPopupContent(
              <AddCategory id={id} data={restaurant} onSuccess={onSuccess} />,
            );
          }}
        >
          <CancelI className="rotate-45 size-[1rem]" />
          {t("editCategories.add")}
        </button>
      </div>

      {/* {headers.map((header) => (
        <Link
          key={header.path}
          to={`/restaurant/categories/${restaurant?.id}/${header.path}`}
          className={`px-3 py-2 rounded-md ${
            params["*"]?.split("/")[2] === header.path
              ? "bg-[--primary-1] text-white"
              : "text-[--black-1] bg-[--light-3]"
          }`}
        >
          <div className="flex gap-2 items-center whitespace-nowrap">
            {header.path === "add" ? (
              <CancelI className="rotate-45 size-[1rem]" />
            ) : (
              <EditI className="size-[1rem]" />
            )}
            {header.label}
          </div>
        </Link>
      ))} */}
    </div>
  );
};

export default CategoriesHeader;
