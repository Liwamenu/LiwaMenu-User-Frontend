//MODULES
import { isEqual } from "lodash";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

//ICONS
import { DeleteI, EditI } from "../../../assets/icon";
import { DragI, StackI } from "../../../assets/icon";

//COMP
import SubCategoriesHeader from "./header";
import EditSubCategory from "./editSubCategory";
import DeleteSubCategory from "./deleteSubCategory";
import { usePopup } from "../../../context/PopupContext";
import fallbackImg from "../../../assets/img/No_Img.svg";

//REDUX
import {
  updateSubOrders,
  resetUpdateSubOrders,
} from "../../../redux/subCategories/updateSubOrdersSlice";
import { getSubCategories } from "../../../redux/subCategories/getSubCategoriesSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";

const SubCategories = ({ data: restaurant }) => {
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { categories } = useSelector((state) => state.categories.get);

  const { subCategories, error: getError } = useSelector(
    (s) => s.subCategories.get,
  );
  const { success: updateSuccess, error: updateError } = useSelector(
    (s) => s.subCategories.updateSubOrders,
  );

  // Store grouped data directly (array of category groups)
  const [categoriesData, setCategoriesData] = useState(null);
  const [subCategoriesData, setSubCategoriesData] = useState(null);
  const [subCategoriesDataBefore, setSubCategoriesDataBefore] = useState(null);

  // Helper: Convert flat array to grouped structure
  // Uses `categoriesData` if available, otherwise falls back to `categories` from redux
  const groupSubCategories = (flatArray) => {
    const groups = {};
    const cats = categoriesData || categories;
    if (!cats) return [];

    flatArray.forEach((subCat) => {
      const categoryId = subCat.categoryId;
      if (!groups[categoryId]) {
        const category = cats.find((c) => c.id === categoryId);
        groups[categoryId] = {
          category: category || {
            id: categoryId,
            name: t("editSubCategories.unknown_category"),
          },
          subCategories: [],
        };
      }
      groups[categoryId].subCategories.push(subCat);
    });

    // Convert to array and sort each group's subcategories by sortOrder
    return Object.values(groups).map((group) => ({
      ...group,
      subCategories: group.subCategories.sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    }));
  };

  // Helper: Convert grouped structure back to flat array
  const flattenGroupedData = (groupedData) => {
    if (!groupedData) return [];
    return groupedData.flatMap((group) => group.subCategories);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Extract categoryId from droppableId (format: "subCategories#{categoryId}")
    const sourceCategoryId = source.droppableId.split("#")[1];
    const destCategoryId = destination.droppableId.split("#")[1];

    // Only allow reordering within same category
    if (sourceCategoryId !== destCategoryId) return;

    // Clone the groups array
    const updatedGroups = subCategoriesData.map((group) => {
      // Only update the group that matches the source category
      if (group.category.id !== sourceCategoryId) {
        return group;
      }

      // Clone subcategories array for this group
      const newSubCategories = Array.from(group.subCategories);

      // Perform the reorder
      const [movedItem] = newSubCategories.splice(source.index, 1);
      newSubCategories.splice(destination.index, 0, movedItem);

      // Update sortOrder for all items in this category
      const updatedSubCategories = newSubCategories.map((subCat, index) => ({
        ...subCat,
        sortOrder: index,
      }));

      return {
        ...group,
        subCategories: updatedSubCategories,
      };
    });

    setSubCategoriesData(updatedGroups);
  };

  const handleEditSubCategory = (updatedSubCategory) => {
    console.log(updatedSubCategory);
    console.log(subCategoriesData);
    if (!subCategoriesData) return;

    // Find which group currently contains the subcategory (if any)
    let originGroupIndex = -1;
    subCategoriesData.forEach((group, gi) => {
      if (group.subCategories.some((sc) => sc.id === updatedSubCategory.id)) {
        originGroupIndex = gi;
      }
    });

    // If not found, treat as an add to the target category
    if (originGroupIndex === -1) {
      const targetIndex = subCategoriesData.findIndex(
        (g) => g.category.id === updatedSubCategory.categoryId,
      );

      const updatedGroups = subCategoriesData.map((g) => ({ ...g }));
      if (targetIndex !== -1) {
        updatedGroups[targetIndex] = {
          ...updatedGroups[targetIndex],
          subCategories: [
            ...updatedGroups[targetIndex].subCategories,
            {
              ...updatedSubCategory,
              sortOrder: updatedGroups[targetIndex].subCategories.length,
            },
          ],
        };
      } else {
        const category = categoriesData?.find(
          (c) => c.id === updatedSubCategory.categoryId,
        ) || {
          id: updatedSubCategory.categoryId,
          name: t("editSubCategories.unknown_category"),
        };
        updatedGroups.push({
          category,
          subCategories: [{ ...updatedSubCategory, sortOrder: 0 }],
        });
      }

      setSubCategoriesData(updatedGroups);
      setSubCategoriesDataBefore(updatedGroups);
      return;
    }

    const originCategoryId = subCategoriesData[originGroupIndex].category.id;

    // If category didn't change, update in-place preserving sortOrder
    if (originCategoryId === updatedSubCategory.categoryId) {
      const updatedGroups = subCategoriesData.map((group) => ({
        ...group,
        subCategories: group.subCategories.map((subCat) =>
          subCat.id === updatedSubCategory.id
            ? { ...subCat, ...updatedSubCategory }
            : subCat,
        ),
      }));

      setSubCategoriesData(updatedGroups);
      setSubCategoriesDataBefore(updatedGroups);
      return;
    }

    // Category changed: remove from origin and reassign sortOrder in origin
    const removed = subCategoriesData.map((group) => ({
      ...group,
      subCategories: group.subCategories
        .filter((sc) => sc.id !== updatedSubCategory.id)
        .map((sc, idx) => ({ ...sc, sortOrder: idx })),
    }));

    // Insert into target group (append to end) or create new group if missing
    const targetIdx = removed.findIndex(
      (g) => g.category.id === updatedSubCategory.categoryId,
    );
    if (targetIdx !== -1) {
      const target = removed[targetIdx];
      removed[targetIdx] = {
        ...target,
        subCategories: [
          ...target.subCategories,
          { ...updatedSubCategory, sortOrder: target.subCategories.length },
        ],
      };
    } else {
      const category = categoriesData?.find(
        (c) => c.id === updatedSubCategory.categoryId,
      ) || {
        id: updatedSubCategory.categoryId,
        name: t("editSubCategories.unknown_category"),
      };
      removed.push({
        category,
        subCategories: [{ ...updatedSubCategory, sortOrder: 0 }],
      });
    }

    setSubCategoriesData(removed);
    setSubCategoriesDataBefore(removed);
  };

  const handleDelete = (deletedSubCategoryId) => {
    const updatedGroups = subCategoriesData.map((group) => ({
      ...group,
      subCategories: group.subCategories
        .filter((subCat) => subCat.id !== deletedSubCategoryId)
        .map((subCat, index) => ({
          ...subCat,
          sortOrder: index, // Reassign sortOrder after deletion
        })),
    }));

    setSubCategoriesData(updatedGroups);
    setSubCategoriesDataBefore(updatedGroups);
  };

  const getStatusBadge = (value, type) => {
    const configs = {
      isActive: {
        true: {
          label: t("editCategories.status_open"),
          class: "bg-[--status-green] text-[--green-1]",
        },
        false: {
          label: t("editCategories.status_closed"),
          class: "bg-[--status-gray] text-[--gr-1]",
        },
      },
    };

    const config = configs[type]?.[value];
    if (!config) return null;

    return (
      <span className={`px-3 py-1 rounded-full text-xs ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const handleAddSubCategory = (subCategory) => {
    const updatedGroups =
      subCategoriesData?.length > 0 &&
      subCategoriesData.map((group) => {
        // Only add to the matching category group
        if (group.category.id !== subCategory.categoryId) {
          return group;
        }

        const maxSortOrder =
          group.subCategories.length > 0
            ? Math.max(...group.subCategories.map((sc) => sc.sortOrder))
            : -1;

        return {
          ...group,
          subCategories: [
            ...group.subCategories,
            {
              ...subCategory,
              sortOrder: maxSortOrder + 1,
            },
          ],
        };
      });

    setSubCategoriesData(updatedGroups);
    setSubCategoriesDataBefore(updatedGroups);
  };

  //GET SUBCATEGORIES & CATEGORIES
  useEffect(() => {
    if (!subCategoriesData) {
      dispatch(getSubCategories({ restaurantId: restaurant?.id }));
    }
    if (!categoriesData) {
      dispatch(getCategories({ restaurantId: restaurant?.id }));
    }
  }, [subCategoriesData, categoriesData, restaurant]);

  //SET SUBCATEGORIES
  useEffect(() => {
    if (subCategories && categories) {
      const flatData = [...subCategories];
      const grouped = groupSubCategories(flatData);

      setSubCategoriesData(grouped);
      setSubCategoriesDataBefore(grouped);
    }
  }, [subCategories, categories]);

  //SET CATEGORIES
  useEffect(() => {
    if (categories) {
      setCategoriesData(categories);
    }
  }, [categories]);

  // TOAST
  useEffect(() => {
    if (updateSuccess) {
      toast.success(t("editSubCategories.success"), {
        id: "subCategories",
      });
      setSubCategoriesDataBefore(subCategoriesData);
      dispatch(resetUpdateSubOrders());
    }
    if (updateError) {
      dispatch(resetUpdateSubOrders());
    }
  }, [updateSuccess, updateError]);

  //SAVE NEW ORDER
  const saveNewOrder = (e) => {
    e?.preventDefault();

    if (isEqual(subCategoriesData, subCategoriesDataBefore)) {
      toast.error(t("editSubCategories.not_changed"), {
        id: "subCategories",
      });
      return;
    }

    try {
      const formData = new FormData();

      // Flatten both current and before data for comparison
      const currentFlat = flattenGroupedData(subCategoriesData);
      const beforeFlat = flattenGroupedData(subCategoriesDataBefore);

      const changedOnes = currentFlat.filter((a) => {
        const original = beforeFlat.find((b) => b.id === a.id);
        return original && original.sortOrder !== a.sortOrder;
      });

      const dataToSend = changedOnes.map(({ id, categoryId, sortOrder }) => ({
        id,
        categoryId,
        sortOrder,
      }));

      formData.append("restaurantId", restaurant?.id);
      formData.append("subCategoriesData", JSON.stringify(dataToSend));

      console.log("Saving subcategories:", dataToSend);

      dispatch(updateSubOrders(formData));
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col sm:px-14">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editSubCategories.title", { name: restaurant?.name })}
        </h1>

        <SubCategoriesHeader
          restaurant={restaurant}
          after={subCategoriesData}
          saveNewOrder={saveNewOrder}
          before={subCategoriesDataBefore}
          onSuccess={handleAddSubCategory}
        />

        <div className="space-y-4 overflow-x-auto">
          {/* Render each category group */}
          {!subCategoriesData || subCategoriesData.length === 0 ? (
            <div className="p-8 text-center text-[--gr-1] italic bg-[--light-2] rounded-xl">
              {t("editSubCategories.no_subcategories")}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              {subCategoriesData.map((group) => (
                <div
                  key={group.category.id}
                  className="bg-[--light-4] border border-[--light-3] rounded-xl min-w-max overflow-hidden"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-4 p-2 bg-[--light-3] border-b border-[--light-3]">
                    <div className="text-center text-[--primary-1]">
                      <StackI className="size-[1.1rem]" />
                    </div>

                    <div>
                      <p className="uppercase font-semibold text-xs tracking-wider text-[--black-2]">
                        {group.category.name}
                      </p>
                      <p className="text-xs text-[--primary-1] bg-[--status-primary-1] px-2 w-max rounded-md">
                        {t("editSubCategories.subcategory_count", {
                          count: group.subCategories.length,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* SubCategory Rows */}
                  <Droppable droppableId={`subCategories#${group.category.id}`}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`${
                          snapshot.isDraggingOver ? "bg-[--light-3]" : ""
                        }`}
                      >
                        {group.subCategories.length === 0 ? (
                          <div className="p-8 text-center text-[--gr-1] italic">
                            {t(
                              "editSubCategories.no_subcategories_in_category",
                            )}
                          </div>
                        ) : (
                          group.subCategories.map((subCat, index) => (
                            <Draggable
                              key={subCat.id || `temp-${subCat.sortOrder}`}
                              draggableId={
                                subCat.id || `temp-${subCat.sortOrder}`
                              }
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-4 grid grid-cols-[0.3fr_1fr_4fr_1fr_2fr] gap-4 items-center text-sm border-b border-[--light-3] last:border-b-0 group ${
                                    snapshot.isDragging
                                      ? "bg-[--white-1] px-2 py-1 border border-[--primary-1] border-dashed rounded-md"
                                      : "bg-[--white-1]"
                                  }`}
                                >
                                  <div className="flex justify-center text-[--gr-2] group-hover:text-[--primary-1] transition-colors cursor-move">
                                    <DragI className="size-5" />
                                  </div>

                                  <div className="flex items-center size-16">
                                    <img
                                      src={
                                        subCat.imageAbsoluteUrl || fallbackImg
                                      }
                                      alt={subCat.name}
                                    />
                                  </div>

                                  {/* SubCategory Name & Product Count */}
                                  <div className="font-medium text-[--black-2] flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-base font-semibold text-[--black-1] whitespace-nowrap">
                                      {subCat.name}
                                    </span>
                                    <span className="text-xs text-[--primary-2] font-medium bg-[--status-primary-2] px-2 py-0.5 rounded-md w-fit whitespace-nowrap">
                                      {t("editCategories.product_count", {
                                        count: subCat.productCount || 0,
                                      })}
                                    </span>
                                  </div>

                                  {/* Status */}
                                  <div className="text-center">
                                    {getStatusBadge(
                                      subCat.isActive,
                                      "isActive",
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex space-x-2 justify-end pr-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        setPopupContent(
                                          <EditSubCategory
                                            subCategory={subCat}
                                            categories={categoriesData}
                                            onSuccess={handleEditSubCategory}
                                          />,
                                        )
                                      }
                                      className="p-2 text-[--primary-1] bg-[--status-primary-1] hover:bg-[--status-primary-2] rounded-lg transition-colors"
                                      title={t("categoryProducts.edit")}
                                    >
                                      <EditI
                                        className="size-[1.1rem]"
                                        strokeWidth={1}
                                      />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setPopupContent(
                                          <DeleteSubCategory
                                            onSuccess={handleDelete}
                                            subCategory={subCat}
                                          />,
                                        );
                                      }}
                                      className="p-2 text-[--red-1] bg-[--status-red] hover:bg-[--red-2] hover:text-white rounded-lg transition-colors"
                                      title={t("categoryProducts.delete")}
                                    >
                                      <DeleteI
                                        className="size-[1.1rem]"
                                        strokeWidth={1}
                                      />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubCategories;
