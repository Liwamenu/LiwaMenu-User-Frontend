//MODULES
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useTranslation } from "react-i18next";

//COMP
import { MenuI, CloudUI } from "../../../assets/icon";
import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import CustomFileInput from "../../common/customFileInput";

//REDUX
import {
  getCategories,
  resetGetCategoriesState,
} from "../../../redux/categories/getCategoriesSlice";
import {
  addSubCategories,
  resetAddSubCategories,
} from "../../../redux/subCategories/addSubCategoriesSlice";

const AddSubCategories = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories.get);
  const { success, error } = useSelector((state) => state.subCategories.add);
  const [formattedCategoriesData, setFormattedCategoriesData] = useState();

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
        (a, b) => a.sortOrder - b.sortOrder,
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

  // Group rows by categoryId for rendering and payload
  const groupRows = (rows) => {
    const grouped = {};
    rows.forEach((r) => {
      if (!grouped[r.categoryId]) grouped[r.categoryId] = [];
      grouped[r.categoryId].push(r);
    });
    return grouped;
  };

  // Initial row
  const [rows, setRows] = useState([
    {
      categoryId: "",
      name: "",
      image: null,
    },
  ]);

  // Add new row
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        categoryId: formattedCategoriesData?.[0]?.value || "",
        name: "",
        image: null,
      },
    ]);

  // Remove row
  const removeRow = (index) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  // Update row
  const updateRow = (index, key, value) =>
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });

  // Drag and drop logic (per category)
  const handleDragEnd = (categoryId, result) => {
    if (!result.destination) return;
    const grouped = groupRows(rows);
    const items = [...(grouped[categoryId] || [])];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // Update sortOrder after drag
    const updatedItems = items.map((it, i) => ({ ...it, sortOrder: i }));

    // Rebuild rows array with updated order for this category
    let newRows = [];
    Object.keys(grouped).forEach((catId) => {
      if (catId === categoryId) {
        newRows = [...newRows, ...updatedItems];
      } else {
        newRows = [...newRows, ...grouped[catId]];
      }
    });
    setRows(newRows);
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();

    // Group rows by categoryId
    const grouped = groupRows(rows);

    // Build payload with sortOrder starting from 0 for each category
    const payloadSubCats = [];
    Object.keys(grouped).forEach((categoryId) => {
      grouped[categoryId].forEach((r, idx) => {
        payloadSubCats.push({
          categoryId: r.categoryId,
          name: r.name,
          sortOrder: idx,
        });
      });
    });

    formData.append("restaurantId", restaurant?.id);
    formData.append("CategoriesData", JSON.stringify(payloadSubCats));

    // Append images in the same order as payloadSubCats
    Object.keys(grouped).forEach((categoryId) => {
      grouped[categoryId].forEach((r, idx) => {
        if (r.image) {
          formData.append(`${categoryId}_image_${idx}`, r.image);
        }
      });
    });

    dispatch(addSubCategories(formData));

    const debugFormData = {};
    for (const [key, value] of formData.entries()) {
      debugFormData[key] =
        value instanceof File
          ? {
              name: value.name,
              type: value.type,
              size: value.size,
            }
          : value;
    }

    console.log(JSON.stringify(debugFormData, null, 2));
  };

  // TOAST
  useEffect(() => {
    if (success) {
      toast.success(t("addSubCategories.success"), { id: "sub_categories" });
      setRows([
        {
          categoryId: "",
          name: "",
          image: null,
        },
      ]);
      dispatch(resetAddSubCategories());
    }
    if (error) dispatch(resetAddSubCategories());
  }, [success, error]);

  // Render grouped rows per category, with drag-and-drop
  const groupedRows = groupRows(rows);

  return (
    <div className="w-full pb-5 mt-1 bg-[--white-1] rounded-lg text-[--black-2]">
      <div className="flex flex-col px-4 sm:px-14">
        <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("addSubCategories.title", { name: restaurant?.name })}
        </h1>

        <div className="py-4">
          <p className="border border-[--border-1] p-2 rounded-md">
            {t("addSubCategories.info")}
          </p>
        </div>

        <div className="flex gap-2 my-4">
          <Link
            to={`/restaurant/sub_categories/${restaurant?.id}/edit`}
            className="bg-[--light-3] p-2"
          >
            {t("addSubCategories.edit")}
          </Link>
          <Link
            to={`/restaurant/sub_categories/${restaurant?.id}/add`}
            className="bg-[--primary-1] text-white p-2"
          >
            {t("addSubCategories.add")}
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 py-3">
          {formattedCategoriesData &&
            Object.keys(groupedRows).map((categoryId, i) => (
              <div key={categoryId} className="mb-6">
                <h2 className="text-lg font-semibold mb-2">
                  {formattedCategoriesData.find((c) => c.id === categoryId)
                    ?.name ||
                    formattedCategoriesData.find((c) => c.value === categoryId)
                      ?.label ||
                    "Bilinmeyen Kategori"}
                </h2>
                <DragDropContext
                  onDragEnd={(result) => handleDragEnd(categoryId, result)}
                >
                  <Droppable droppableId={`${categoryId}-${i}`}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef}>
                        {(groupedRows[categoryId] || []).map((row, index) => (
                          <Draggable
                            key={`add-${categoryId}-${index}`}
                            draggableId={`add-${categoryId}-${index}`}
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
                                    <CustomSelect
                                      required
                                      value={
                                        formattedCategoriesData?.find(
                                          (c) => c.value === row.categoryId,
                                        ) || {
                                          value: null,
                                          label: "Kategori Seç",
                                        }
                                      }
                                      disabled={!formattedCategoriesData}
                                      className="mt-[0] sm:mt-[0]"
                                      className2="mt-[0] sm:mt-[0]"
                                      options={formattedCategoriesData || []}
                                      onChange={(sel) =>
                                        updateRow(
                                          rows.findIndex(
                                            (r) =>
                                              r.categoryId === categoryId &&
                                              groupedRows[categoryId][index] ===
                                                r,
                                          ),
                                          "categoryId",
                                          sel.value,
                                        )
                                      }
                                      placeholder={t("addSubCategories.select_category")}
                                    />
                                  </div>

                                  <div className="flex-1 max-w-md">
                                    <CustomInput
                                      required
                                      type="text"
                                      value={row.name}
                                      placeholder={t(
                                        "addSubCategories.subcategory_name",
                                      )}
                                      onChange={(v) =>
                                        updateRow(
                                          rows.findIndex(
                                            (r) =>
                                              r.categoryId === categoryId &&
                                              groupedRows[categoryId][index] ===
                                                r,
                                          ),
                                          "name",
                                          v,
                                        )
                                      }
                                      className="mt-[0] sm:mt-[0]"
                                      className2="mt-[0] sm:mt-[0]"
                                    />
                                  </div>

                                  <div className="flex-1 flex">
                                    {(row.image || row.imageAbsoluteUrl) && (
                                      <img
                                        src={
                                          row.image
                                            ? URL.createObjectURL(row.image)
                                            : row.imageAbsoluteUrl
                                        }
                                        alt={row.name}
                                        className="h-[3rem] object-cover rounded"
                                      />
                                    )}
                                    <CustomFileInput
                                      value={row.image}
                                      onChange={(file) =>
                                        updateRow(
                                          rows.findIndex(
                                            (r) =>
                                              r.categoryId === categoryId &&
                                              groupedRows[categoryId][index] ===
                                                r,
                                          ),
                                          "image",
                                          file,
                                        )
                                      }
                                      accept={"image/png, image/jpeg"}
                                      className="h-[3rem]"
                                      msg={
                                        <div className="flex items-center text-xs">
                                          <CloudUI className="size-[1.5rem] mt-2" />
                                          <p>
                                            {t("addSubCategories.upload_image")}
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
                                    removeRow(
                                      rows.findIndex(
                                        (r) =>
                                          r.categoryId === categoryId &&
                                          groupedRows[categoryId][index] === r,
                                      ),
                                    )
                                  }
                                  className="text-[--red-1] font-semibold"
                                >
                                  {t("addSubCategories.delete")}
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            ))}

          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={addRow}
              className="px-6 py-2 rounded-md bg-[--primary-2] text-white font-semibold"
            >
              {t("addSubCategories.add")}
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[--primary-1] text-white font-semibold"
            >
              {t("addSubCategories.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubCategories;
