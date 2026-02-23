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
import { ListI, DragI, StackI } from "../../../assets/icon";

//COMP
import CategoriesHeader from "./header";
import EditCategory from "./editCategory";
import DeleteCategory from "./deleteCategory";
import CategoryProducts from "./categoryProducts";
import fallbackImg from "../../../assets/img/No_Img.svg";
import { usePopup } from "../../../context/PopupContext";

//REDUX
import {
  getCategories,
  resetGetCategories,
} from "../../../redux/categories/getCategoriesSlice";
import {
  editCategories,
  resetEditCategories,
} from "../../../redux/categories/editCategoriesSlice";

const Categories = ({ data: restaurant }) => {
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { categories } = useSelector((state) => state.categories.get);
  const { success, error } = useSelector((state) => state.categories.edit);

  const [categoriesData, setCategoriesData] = useState(null);
  const [categoriesDataBefore, setCategoriesDataBefore] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(categoriesData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sortOrder
    const updated = items.map((cat, i) => ({ ...cat, sortOrder: i }));

    setCategoriesData(updated);
  };

  const handleEditCategory = (updatedCategory) => {
    const newCategories = categoriesData.map((cat) =>
      cat.id === updatedCategory.id ? { ...cat, ...updatedCategory } : cat,
    );

    const sorted = sortCategoriesByOrder(newCategories);
    setCategoriesData(sorted);
    setCategoriesDataBefore(sorted);
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
      campaign: {
        true: {
          label: t("editCategories.status_active"),
          class: "bg-[--status-green] text-[--green-1]",
        },
        false: {
          label: t("editCategories.status_passive"),
          class: "bg-[--status-gray] text-[--gr-1]",
        },
      },
    };

    const config = configs[type]?.[value || false];
    if (!config) return null;

    return (
      <span className={`px-3 py-1 rounded-full text-xs ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const handleManageProducts = (categoryId) => {
    setPopupContent(
      <CategoryProducts
        categoryId={categoryId}
        onClose={() => setPopupContent(null)}
      />,
    );
  };

  const handleAddCategory = (category) => {
    const newCategories = [
      ...(categoriesData || []),
      {
        ...category,
        sortOrder: categoriesData
          ? categoriesData[categoriesData.length - 1].sortOrder + 1
          : 0,
      },
    ];
    const sorted = sortCategoriesByOrder(newCategories);
    setCategoriesData(sorted);
    setCategoriesDataBefore(sorted);
  };

  const handleDelete = (categoryId) => {
    const newCategories = categoriesData.filter((cat) => cat.id !== categoryId);
    const sorted = sortCategoriesByOrder(newCategories);
    setCategoriesData(sorted);
    setCategoriesDataBefore(sorted);
  };

  const sortCategoriesByOrder = (cats) => {
    return cats.sort((a, b) => a.sortOrder - b.sortOrder);
  };

  //GET CATEGORIES
  useEffect(() => {
    if (!categoriesData) {
      dispatch(getCategories({ restaurantId: params?.id }));
    }
  }, [categoriesData]);

  //SET CATEGORIES WHEN FETCHED
  useEffect(() => {
    if (categories) {
      const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
      setCategoriesData(sorted);
      setCategoriesDataBefore(sorted);
      dispatch(resetGetCategories());
    }
  }, [categories]);

  // TOAST
  useEffect(() => {
    if (success) {
      toast.success(t("editCategories.success"), { id: "categories" });
      setCategoriesDataBefore(categoriesData);
      dispatch(resetEditCategories());
    }
    if (error) dispatch(resetEditCategories());
  }, [success, error]);

  //SAVE NEW ORDER
  const saveNewOrder = (e, index) => {
    e?.preventDefault();

    if (isEqual(categoriesData, categoriesDataBefore) && index === undefined) {
      toast.error(t("editCategories.not_changed"), { id: "categories" });
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
        (prevCat) => !_categories.some((cat) => cat.id === prevCat.id),
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

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col sm:px-14">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editCategories.title", { name: restaurant?.name })}
        </h1>

        {/* <div className="py-4">
          <p className="border border-[--border-1] p-2 rounded-md">
            {t("editCategories.info")}
          </p>
        </div> */}

        <div className="flex justify-between items-center">
          <CategoriesHeader
            id={params?.id}
            restaurant={restaurant}
            onSuccess={handleAddCategory}
          />

          {!isEqual(categoriesData, categoriesDataBefore) && (
            <div className="flex h-max justify-end">
              <button
                onClick={saveNewOrder}
                className="px-4 py-2 text-sm text-white bg-[--green-1] rounded-lg shadow-md hover:bg-[--green-2] transition-all flex items-center gap-2 whitespace-nowrap ml-3"
              >
                <i className="fa-solid fa-check"></i>{" "}
                {t("editCategories.save_order")}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6 w-full overflow-auto">
          {/* Categories List */}
          <div className="bg-[--light-2] border border-[--light-3] rounded-xl min-w-min overflow-clip">
            {/* Header Row */}
            <div className="hidden sm:grid grid-cols-[0.3fr_1fr_3fr_1fr_1fr_2fr] gap-4 p-4 bg-[--light-3] font-semibold text-xs uppercase tracking-wider text-[--black-2] border-b border-[--light-3]">
              <div className="text-center text-[--gr-1]">
                <StackI className="inline size-4" />
              </div>
              <div>{t("editCategories.category_image")}</div>
              <div>{t("editCategories.category_name")}</div>
              <div className="text-center">{t("editCategories.status")}</div>
              <div className="text-center">{t("editCategories.campaign")}</div>
              <div className="text-right pr-4">
                {t("editCategories.actions")}
              </div>
            </div>

            {/* Category Rows with DragDropContext */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`${
                      snapshot.isDraggingOver ? "bg-[--light-3]" : ""
                    }`}
                  >
                    {!categoriesData ? (
                      <div className="p-8 text-center text-[--gr-1] italic">
                        {t("editCategories.no_categories")}
                      </div>
                    ) : (
                      categoriesData.map((cat) => (
                        <Draggable
                          key={cat.id || `temp-${cat.sortOrder}`}
                          draggableId={cat.id || `temp-${cat.sortOrder}`}
                          index={cat.sortOrder}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 grid grid-cols-[0.3fr_1fr_3fr_1fr_1fr_2fr] gap-4 items-center text-sm border-b border-[--light-3] last:border-b-0 group ${
                                snapshot.isDragging
                                  ? "bg-[--white-1] px-2 py-1 border border-[--primary-1] border-dashed rounded-md"
                                  : "bg-[--white-1]"
                              }`}
                            >
                              <div className="flex justify-center text-[--gr-2] group-hover:text-[--primary-1] transition-colors cursor-move">
                                <DragI className="size-5" />
                              </div>

                              <div className="size-16">
                                <img
                                  src={cat.imageAbsoluteUrl || fallbackImg}
                                  alt={cat.name}
                                />
                              </div>

                              {/* Category Name & Product Count */}
                              <div className="font-medium text-[--black-2] flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-base font-semibold text-[--black-1]">
                                  {cat.name}
                                </span>
                                <span className="text-xs text-[--primary-2] font-medium bg-[--status-primary-2] px-2 py-0.5 rounded-md w-fit whitespace-nowrap">
                                  {t("editCategories.product_count", {
                                    count: cat.productCount || 0,
                                  })}
                                </span>
                              </div>

                              {/* Status */}
                              <div className="text-center">
                                {getStatusBadge(cat.isActive, "isActive")}
                              </div>

                              {/* Featured */}
                              <div className="text-center">
                                {getStatusBadge(cat.campaign, "campaign")}
                              </div>

                              {/* Actions */}
                              <div className="flex space-x-2 justify-end pr-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleManageProducts(cat.id)}
                                  className="p-2 text-[--green-3] bg-[--light-green] hover:bg-[--status-green] rounded-lg transition-colors"
                                  title={t("editCategories.manage_products")}
                                >
                                  <ListI className="size-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setPopupContent(
                                      <EditCategory
                                        category={cat}
                                        id={params?.id}
                                        setCategoriesData={setCategoriesData}
                                        setCategoriesDataBefore={
                                          setCategoriesDataBefore
                                        }
                                        onSuccess={handleEditCategory}
                                      />,
                                    )
                                  }
                                  className="p-2 text-[--primary-1] bg-[--status-primary-1] hover:bg-[--status-primary-2] rounded-lg transition-colors"
                                  title={t("editCategories.edit")}
                                >
                                  <EditI
                                    className="size-[1.1rem]"
                                    strokeWidth={1}
                                  />
                                </button>
                                <button
                                  onClick={() => {
                                    setPopupContent(
                                      <DeleteCategory
                                        category={cat}
                                        onSuccess={handleDelete}
                                      />,
                                    );
                                  }}
                                  className="p-2 text-[--red-1] bg-[--status-red] hover:bg-[--red-2] hover:text-white rounded-lg transition-colors"
                                  title={t("editCategories.delete")}
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
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
