//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

//COMP
import {
  CancelI,
  CloudUI,
  DeleteI,
  EditI,
  MenuI,
  WarnI,
} from "../../../assets/icon";
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import CustomFileInput from "../../common/customFileInput";

//REDUX
import {
  editCategories,
  resetEditCategories,
} from "../../../redux/categories/editCategoriesSlice";
import {
  getCategories,
  resetGetCategories,
} from "../../../redux/categories/getCategoriesSlice";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";

const EditCategories = ({ data: restaurant }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const { success, error } = useSelector((state) => state.categories.edit);
  const { categories } = useSelector((state) => state.categories.get);

  const [activeToEdit, setActiveToEdit] = useState();
  const [categoriesData, setCategoriesData] = useState(null);
  const [categoriesDataBefore, setCategoriesDataBefore] = useState(null);

  // Update field in a category row
  const updateCategory = (index, key, value) => {
    setCategoriesData((prev) =>
      prev.map((cat, i) => (i === index ? { ...cat, [key]: value } : cat))
    );
  };

  // Remove a category row
  const removeCategory = (index) => {
    setPopupContent(
      <DeletetionWarning
        t={t}
        index={index}
        categoriesData={categoriesData}
        setCategoriesData={setCategoriesData}
        setPopupContent={setPopupContent}
        handleSubmit={handleSubmit}
      />
    );
    // setCategoriesData((prev) =>
    //   prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, sortOrder: i }))
    // );
  };

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = [...categoriesData];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the index values after reorder
    const updated = items.map((item, i) => ({ ...item, sortOrder: i }));
    setCategoriesData(updated);
  };

  const handleSubmit = (e, index) => {
    e?.preventDefault();

    if (isEqual(categoriesData, categoriesDataBefore) && index === undefined) {
      toast.error(t("editCategories.no_changes"), { id: "categories" });
      return;
    }

    try {
      const formData = new FormData();
      let _categories = [...categoriesData];
      if (index !== undefined)
        _categories = _categories
          .filter((_, i) => i !== index)
          .map((c, i) => ({ ...c, sortOrder: i }));
      setCategoriesData(_categories);

      const payloadCategories = _categories.map((cat) => {
        const { image, ...rest } = cat;
        return rest;
      });

      const deletedCategories = categoriesDataBefore.filter(
        (prevCat) => !_categories.some((cat) => cat.id === prevCat.id)
      );

      formData.append("restaurantId", restaurant?.id);
      formData.append("categoriesData", JSON.stringify(payloadCategories));
      formData.append("deletedCategories", JSON.stringify(deletedCategories));

      _categories.forEach((cat, index) => {
        if (cat.image) {
          formData.append(`image_${index}`, cat.image);
        } else if (cat.imageAbsoluteUrl) {
          formData.append(`imageUrl_${index}`, cat.imageAbsoluteUrl);
        }
      });

      dispatch(editCategories(formData));
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  //GET CATEGORIES
  useEffect(() => {
    if (!categoriesData && restaurant) {
      dispatch(getCategories({ restaurantId: restaurant?.id }));
    }
  }, [categoriesData, restaurant]);

  //SET CATEGORIES WHEN FETCHED
  useEffect(() => {
    if (categories?.data) {
      const sorted = [...categories.data].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );
      console.log(sorted);
      setCategoriesData(sorted);
      setCategoriesDataBefore(sorted);
      dispatch(resetGetCategories());
    }
  }, [categories, categoriesData]);

  // TOAST
  useEffect(() => {
    if (success) {
      toast.success(t("editCategories.update_success"), { id: "categories" });
      setCategoriesDataBefore(categoriesData);
      dispatch(resetEditCategories());
    }
    if (error) dispatch(resetEditCategories());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col px-4 sm:px-14">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editCategories.title", { name: restaurant?.name })}
        </h1>

        <div className="py-4">
          <p className="border border-[--border-1] p-2 rounded-md">
            {t("editCategories.info")}
          </p>
        </div>

        <div className="flex gap-2 my-4 text-sm">
          <Link
            to={`/restaurant/categories/${restaurant?.id}/edit`}
            className="bg-[--primary-1] text-white p-2.5 rounded-md flex items-center gap-1"
          >
            <EditI className="size-[1rem]" />
            {t("editCategories.edit")}
          </Link>
          <Link
            to={`/restaurant/categories/${restaurant?.id}/add`}
            className="bg-[--light-3] p-2.5 rounded-md flex items-center gap-1"
          >
            <CancelI className="rotate-45 size-[1rem]" />
            {t("editCategories.add")}
          </Link>
        </div>

        {categoriesData?.length ? (
          <form onSubmit={handleSubmit}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {categoriesData &&
                      categoriesData.map((cat, index) => (
                        <Draggable
                          key={cat.id || `temp-${cat.sortOrder}`}
                          draggableId={cat.id || `temp-${cat.sortOrder}`}
                          index={cat.sortOrder}
                        >
                          {(provided, snapshot) => (
                            <div
                              className={`flex items-center gap-4 max-sm:gap-2 first:rounded-t-md last:rounded-b-md border border-[--light-3] ${
                                snapshot.isDragging
                                  ? "bg-[--light-primary-1] px-2 py-1 border border-[--primary-1] border-dashed rounded-md"
                                  : `p-1 ${
                                      index % 2 === 0
                                        ? "bg-[--light-4]"
                                        : "bg-[--light-1]"
                                    }`
                              }`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="w-8 cursor-move flex items-center"
                              >
                                <MenuI className="text-gray-400 text-xl" />
                              </div>

                              <div className="flex gap-4 sm:items-center max-sm:gap-1 w-full max-sm:flex-col">
                                {activeToEdit == cat.id ? (
                                  <div className="flex flex-2 gap-2">
                                    <CustomInput
                                      required
                                      type="text"
                                      value={cat.name}
                                      className={`py-[.4rem] mt-[0] sm:mt-[0] border-[--primary-1] border-dashed ${
                                        activeToEdit !== cat.id && "border-none"
                                      }`}
                                      className2="mt-[0] sm:mt-[0]"
                                      placeholder={t(
                                        "editCategories.category_name"
                                      )}
                                      onChange={(e) =>
                                        updateCategory(index, "name", e)
                                      }
                                    />
                                    <CustomInput
                                      required
                                      type="text"
                                      value={cat?.description || ""}
                                      className={`py-[.4rem] mt-[0] sm:mt-[0] border-[--primary-1] border-dashed ${
                                        activeToEdit !== cat.id && "border-none"
                                      }`}
                                      className2="mt-[0] sm:mt-[0]"
                                      placeholder={t(
                                        "editCategories.category_desc"
                                      )}
                                      onChange={(e) =>
                                        updateCategory(index, "name", e)
                                      }
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full flex flex-2 max-w-[13.5rem]">
                                    <div className="flex flex-col justify-center">
                                      <div className="flex items-center gap-2">
                                        <p>{cat.name}</p>
                                        <p className="text-xs px-1 py-[2px] text-[--primary-1] bg-[--status-primary-1] rounded-md ">
                                          {cat?.productsNumber || "3 urun"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs">
                                          description...
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex-1 flex justify-center text-sm">
                                  <div className="w-max">
                                    <CustomToggle
                                      label={
                                        index == 0 && t("editCategories.status")
                                      }
                                      checked={cat?.status}
                                      className="scale-[.7]"
                                      className1="flex-col"
                                      onChange={() =>
                                        updateCategory(
                                          index,
                                          "status",
                                          !cat.status
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex-1 flex justify-center text-sm">
                                  <div className="w-max">
                                    <CustomToggle
                                      label={
                                        index == 0 &&
                                        t("editCategories.featured")
                                      }
                                      checked={cat?.featured}
                                      className="scale-[.7]"
                                      className1="flex-col"
                                      onChange={() =>
                                        updateCategory(
                                          index,
                                          "featured",
                                          !cat.featured
                                        )
                                      }
                                    />
                                  </div>
                                </div>

                                <div className="flex-1 flex cursor-pointer">
                                  {(cat.image || cat.imageAbsoluteUrl) && (
                                    <img
                                      src={
                                        cat.image
                                          ? URL.createObjectURL(cat.image)
                                          : cat.imageAbsoluteUrl
                                      }
                                      alt={cat.name}
                                      className="h-[3rem] object-cover rounded"
                                    />
                                  )}
                                  <CustomFileInput
                                    msg={<CustomFileInputMsg />}
                                    showFileDetails={false} //{/* screen.width > 435 */}
                                    sliceNameAt={
                                      screen.width < 435
                                        ? 10
                                        : screen.width < 1025
                                        ? 20
                                        : 40
                                    }
                                    value={cat.image}
                                    onChange={(file) =>
                                      updateCategory(index, "image", file)
                                    }
                                    accept={"image/png, image/jpeg"}
                                    className="h-[3rem]"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveToEdit(
                                      activeToEdit ? null : cat.id
                                    )
                                  }
                                  className="text-[--primary-1] font-semibold bg-[--status-primary-1] p-1 rounded-md"
                                >
                                  <EditI
                                    strokeWidth={1.6}
                                    className="size-[1.2rem]"
                                  />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeCategory(index)}
                                  className="text-[--red-1] font-semibold bg-[--status-red] p-1 rounded-md"
                                >
                                  {/* {t("editCategories.delete")} */}
                                  <DeleteI
                                    strokeWidth={1.5}
                                    className="size-[1.3rem]"
                                  />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex items-center pt-4 mt-6 justify-end">
              <button
                type="submit"
                className="px-6 py-2 rounded-md bg-[--primary-1] text-white font-semibold"
              >
                {t("editCategories.save")}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="bg-[--light-4] rounded-2xl p-12 max-w-2xl w-full text-center shadow-sm border border-[--light-2]">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto bg-[--gr-4] rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-[--black-2] mb-3">
                {t("editCategories.no_categories")}
              </h3>

              <p className="text-[--gr-1] mb-8 leading-relaxed">
                {t("editCategories.no_categories_info")}
              </p>

              {/* <div className="mt-8 pt-8 border-t border-[--light-3]">
                <p className="text-sm text-[--gr-1]">
                  💡 <span className="font-medium">İpucu:</span>{" "}
                </p>
              </div> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCategories;

function CustomFileInputMsg() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center text-xs">
      <CloudUI className="size-[1.5rem] mt-2" strokeWidth={1.5} />
      <p>{t("editCategories.upload_image_msg")}</p>
    </div>
  );
}

function DeletetionWarning({
  index,
  categoriesData,
  setPopupContent,
  handleSubmit,
  t,
}) {
  return (
    <div className="bg-[--light-4] text-[--black-2] border border-[--light-2] p-4 rounded-md">
      <div className=" flex justify-center">
        <div className="w-20 text-[--red-1]">
          <WarnI />
        </div>
      </div>
      <h2 className="text-lg text-center font-bold mb-4">
        {t("editCategories.delete_title")}
      </h2>
      <div className="mb-6 text-center">
        <p className="text-[--red-1]">{categoriesData[index]?.name}</p>
        <p>{t("editCategories.delete_confirm")}</p>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setPopupContent(null)}
          className="px-4 py-2 bg-[--gr-3] text-black rounded-md"
        >
          {t("editCategories.cancel")}
        </button>
        <button
          onClick={() => {
            handleSubmit(null, index);
            setPopupContent(null);
          }}
          className="px-8 py-2 bg-[--red-1] text-white rounded-md"
        >
          {t("editCategories.delete")}
        </button>
      </div>
    </div>
  );
}
