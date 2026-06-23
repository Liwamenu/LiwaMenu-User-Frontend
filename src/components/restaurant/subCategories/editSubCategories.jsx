//MODULES
import _ from "lodash";
import isEqual from "lodash/isEqual";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";

//COMP
import CustomInput from "../../common/customInput";
import { CloudUI, MenuI } from "../../../assets/icon";
import CustomFileInput from "../../common/customFileInput";

//DATA
import {
  getCategories,
  resetGetCategoriesState,
} from "../../../redux/categories/getCategoriesSlice";
import {
  getSubCategories,
  resetGetSubCategories,
} from "../../../redux/subCategories/getSubCategoriesSlice";
import {
  editSubCategories,
  resetEditSubCategories,
} from "../../../redux/subCategories/editSubCategoriesSlice";

const EditSubCategories = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { categories } = useSelector((s) => s.categories.get);
  const { subCategories } = useSelector((s) => s.subCategories.get);
  const { success, error } = useSelector((s) => s.subCategories.edit);

  const [formattedCategoriesData, setFormattedCategoriesData] = useState();
  const [subCategoriesData, setSubCategoriesData] = useState(null);
  const [subCategoriesBefore, setSubCategoriesBefore] = useState(null);

  //GET CATEGORIES
  useEffect(() => {
    if (!formattedCategoriesData && restaurant) {
      dispatch(getCategories({ restaurantId: restaurant?.id }));
    }
  }, [formattedCategoriesData, restaurant]);

  //SET CATEGORIES WHEN FETCHED
  useEffect(() => {
    if (categories?.data) {
      const sorted = [...categories.data].sort(
        (a, b) => a.sortOrder - b.sortOrder
      );

      const formattedCats = sorted.map((cat) => ({
        value: cat.id,
        label: cat.name,
        ...cat,
      }));
      setFormattedCategoriesData(formattedCats);
      dispatch(resetGetCategoriesState());
    }
  }, [categories]);

  // FORMAT SUBCATEGORIES INTO { categoryId: [subCategories] } STRUCTURE
  const formattedCategoriesInit = (formattedCategoriesData) => {
    const outData = formattedCategoriesData.reduce((acc, cat) => {
      const filteredSubs = (subCategories?.data || [])
        .filter((s) => s.categoryId === cat.id)
        .map((sc, idx) => ({ ...sc, sortOrder: sc.sortOrder ?? idx }));

      // Only add to acc if there are subcategories
      if (filteredSubs.length > 0) {
        acc[cat.id] = filteredSubs;
      }

      return acc;
    }, {});

    return outData;
  };

  //GET SUBCATEGORIES
  useEffect(() => {
    if (!subCategoriesData && restaurant) {
      dispatch(getSubCategories({ restaurantId: restaurant?.id }));
    }
  }, [subCategoriesData, restaurant]);

  //SET SUBCATEGORIES
  useEffect(() => {
    if (subCategories && formattedCategoriesData) {
      setSubCategoriesData(formattedCategoriesInit(formattedCategoriesData));
      setSubCategoriesBefore(formattedCategoriesInit(formattedCategoriesData));
      dispatch(resetGetSubCategories());
    }
  }, [subCategories, formattedCategoriesData]);

  // update name or image for a subcategory within its category
  const updateSubCategory = (categoryId, index, key, value) => {
    setSubCategoriesData((prev) => {
      const copy = { ...prev };
      const items = [...(copy[categoryId] || [])];
      items[index] = { ...items[index], [key]: value };
      copy[categoryId] = items;
      return copy;
    });
  };

  const removeSubCategory = (categoryId, index) => {
    setSubCategoriesData((prev) => {
      const copy = { ...prev };
      const items = [...(copy[categoryId] || [])];
      items.splice(index, 1);
      copy[categoryId] = items.map((it, i) => ({ ...it, sortOrder: i }));
      return copy;
    });
  };

  // allow drag/reorder but only inside same category (droppable per category)
  const handleDragEnd = (categoryId, result) => {
    if (!result.destination) return;
    const src = result.source.index;
    const dest = result.destination.index;

    setSubCategoriesData((prev) => {
      const copy = { ...prev };
      const items = [...(copy[categoryId] || [])];
      const [moved] = items.splice(src, 1);
      items.splice(dest, 0, moved);
      copy[categoryId] = items.map((it, i) => ({ ...it, sortOrder: i }));
      return copy;
    });
  };

  //SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEqual(subCategoriesData, subCategoriesBefore)) {
      toast.error(t("editSubCategories.not_changed"), { id: "sub_categories" });
      return;
    }

    // Flatten ALL current subcategories into a single array for update
    const payload = [];

    Object.keys(subCategoriesData).forEach((categoryId) => {
      const currList = subCategoriesData[categoryId] || [];
      currList.forEach((curr, idx) => {
        // Prepare subcategory object for update
        const subCatObj = {
          id: curr.id,
          categoryId: curr.categoryId,
          name: curr.name,
          sortOrder: idx,
        };

        payload.push(subCatObj);
      });
    });

    // Prepare FormData
    const formData = new FormData();
    formData.append("restaurantId", restaurant?.id);

    formData.append("CategoriesData", JSON.stringify(payload));

    // Append image files
    Object.keys(subCategoriesData).forEach((categoryId) => {
      const currList = subCategoriesData[categoryId] || [];
      currList.forEach((curr) => {
        if (curr.image && curr.image instanceof File) {
          console.log(curr);
          formData.append(`${categoryId}_image_${curr.sortOrder}`, curr.image);
        }
      });
    });

    dispatch(editSubCategories(formData));
  };

  // TOAST
  useEffect(() => {
    if (success) {
      toast.success(t("editSubCategories.success"), { id: "sub_categories" });
      dispatch(resetEditSubCategories());
    }
    if (error) dispatch(resetEditSubCategories());
  }, [success, error]);

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col px-4 sm:px-14">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editSubCategories.title", { name: restaurant?.name })}
        </h1>

        <div className="py-4">
          <p className="border border-[--border-1] p-2 rounded-md">
            {t("editSubCategories.info")}
          </p>
        </div>

        <div className=" flex gap-2 my-4">
          <Link
            to={`/restaurant/sub_categories/${restaurant?.id}/edit`}
            className="bg-[--primary-1] text-white p-2"
          >
            {t("editSubCategories.edit")}
          </Link>
          <Link
            to={`/restaurant/sub_categories/${restaurant?.id}/add`}
            className="bg-[--light-3] p-2"
          >
            {t("editSubCategories.add")}
          </Link>
        </div>

        {!_.isEmpty(subCategoriesData) ? (
          <form onSubmit={handleSubmit} className="mt-6 py-3">
            {subCategoriesData &&
              Object.keys(subCategoriesData).map((categoryId) => (
                <div key={categoryId} className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">
                    {formattedCategoriesData.find((c) => c.id === categoryId)
                      ?.name || t("editSubCategories.unknown_category")}
                  </h2>

                  <DragDropContext
                    onDragEnd={(result) => handleDragEnd(categoryId, result)}
                  >
                    <Droppable droppableId={categoryId}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {(subCategoriesData[categoryId] || []).map(
                            (subCat, index) => (
                              <Draggable
                                key={subCat.id || `temp-${categoryId}-${index}`}
                                draggableId={
                                  subCat.id || `temp-${categoryId}-${index}`
                                }
                                index={index}
                              >
                                {(prov, snap) => (
                                  <div
                                    ref={prov.innerRef}
                                    {...prov.draggableProps}
                                    className={`flex gap-2 items-end mb-3 ${
                                      snap.isDragging ? "bg-[--light-1]" : ""
                                    }`}
                                  >
                                    <div
                                      {...prov.dragHandleProps}
                                      className="w-8 flex justify-center pb-3 cursor-move"
                                    >
                                      <MenuI className="text-gray-400 text-xl" />
                                    </div>

                                    <div className="flex gap-4 max-sm:gap-1 w-full max-sm:flex-col">
                                      <div className="flex-1 max-w-md">
                                        <CustomInput
                                          required
                                          type="text"
                                          value={subCat.name}
                                          placeholder={t(
                                            "editSubCategories.subcategory_name"
                                          )}
                                          onChange={(v) =>
                                            updateSubCategory(
                                              categoryId,
                                              index,
                                              "name",
                                              v
                                            )
                                          }
                                          className="mt-[0] sm:mt-[0]"
                                          className2="mt-[0] sm:mt-[0]"
                                        />
                                      </div>

                                      <div className="flex-1 flex">
                                        {(subCat.image ||
                                          subCat.imageAbsoluteUrl) && (
                                          <img
                                            src={
                                              subCat.image
                                                ? URL.createObjectURL(
                                                    subCat.image
                                                  )
                                                : subCat.imageAbsoluteUrl
                                            }
                                            alt={subCat.name}
                                            className="h-[3rem] object-cover rounded"
                                          />
                                        )}
                                        <CustomFileInput
                                          value={subCat.image}
                                          onChange={(file) =>
                                            updateSubCategory(
                                              categoryId,
                                              index,
                                              "image",
                                              file
                                            )
                                          }
                                          accept={"image/png, image/jpeg"}
                                          className="h-[3rem]"
                                          msg={
                                            <div className="flex items-center text-xs">
                                              <CloudUI className="size-[1.5rem] mt-2" />
                                              <p>
                                                {t(
                                                  "addSubCategories.upload_image"
                                                )}
                                              </p>
                                            </div>
                                          }
                                          sliceNameAt={
                                            screen.width < 435
                                              ? 10
                                              : screen.width < 1025
                                              ? 20
                                              : 40
                                          }
                                        />
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSubCategory(categoryId, index)
                                      }
                                      className="text-[--red-1] font-semibold"
                                    >
                                      {t("editSubCategories.delete")}
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            )
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              ))}

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="px-6 py-2 rounded-md bg-[--primary-1] text-white font-semibold"
              >
                {t("editSubCategories.save")}
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
                {t("editSubCategories.no_subcategories")}
              </h3>

              <p className="text-[--gr-1] mb-8 leading-relaxed">
                {t("editSubCategories.no_subcategories_info")}
              </p>

              <div className="mt-8 pt-8 border-t border-[--light-3]">
                <p className="text-sm text-[--gr-1]">
                  💡{" "}
                  <span className="font-medium">
                    {t("editSubCategories.tip_title")}
                  </span>{" "}
                  {t("editSubCategories.tip_content")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditSubCategories;
