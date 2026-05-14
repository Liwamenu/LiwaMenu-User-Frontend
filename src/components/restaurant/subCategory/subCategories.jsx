// MODULES
import { isEqual } from "lodash";
import { toast } from "react-hot-toast";
import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  FolderTree,
  Layers,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Save,
  Loader2,
  Package,
} from "lucide-react";

// COMP
import EditSubCategory from "./editSubCategory";
import DeleteSubCategory from "./deleteSubCategory";
import AddSubCategory from "./addSubCategory";
import SubCategoryProducts from "./subCategoryProducts";
import PageHelp from "../../common/pageHelp";
import { usePopup } from "../../../context/PopupContext";
import fallbackImg from "../../../assets/img/No_Img.svg";

// REDUX
import {
  updateSubOrders,
  resetUpdateSubOrders,
} from "../../../redux/subCategories/updateSubOrdersSlice";
import { getSubCategories } from "../../../redux/subCategories/getSubCategoriesSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const SubCategories = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { categories, fetchedFor: catFetchedFor } = useSelector(
    (state) => state.categories.get,
  );
  const { subCategories, fetchedFor: subFetchedFor } = useSelector(
    (s) => s.subCategories.get,
  );
  const { success: updateSuccess, error: updateError, loading } = useSelector(
    (s) => s.subCategories.updateSubOrders,
  );

  const [categoriesData, setCategoriesData] = useState(null);
  const [subCategoriesData, setSubCategoriesData] = useState(null);
  const [subCategoriesDataBefore, setSubCategoriesDataBefore] = useState(null);

  // Group flat sub-category list by parent category id, preserving sortOrder.
  const groupSubCategories = (flat) => {
    const cats = categoriesData || categories;
    if (!cats) return [];
    const groups = {};
    flat.forEach((sc) => {
      const id = sc.categoryId;
      if (!groups[id]) {
        const cat = cats.find((c) => c.id === id);
        groups[id] = {
          category: cat || { id, name: t("editSubCategories.unknown_category") },
          subCategories: [],
        };
      }
      groups[id].subCategories.push(sc);
    });
    return Object.values(groups).map((g) => ({
      ...g,
      subCategories: g.subCategories.sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    }));
  };

  const flattenGroupedData = (grouped) =>
    grouped ? grouped.flatMap((g) => g.subCategories) : [];

  // GET data — only fetch when redux doesn't already have a fresh payload
  // for THIS restaurant. Both endpoints are slow on the backend (~2s each)
  // and the global loading middleware blocks the entire UI until both
  // resolve, so we lean on the slice cache to make revisits feel instant.
  // Cross-restaurant navigation still triggers a refetch via fetchedFor.
  useEffect(() => {
    if (!restaurant?.id) return;
    if (!subCategories || subFetchedFor !== restaurant.id) {
      dispatch(getSubCategories({ restaurantId: restaurant.id }));
    }
    if (!categories || catFetchedFor !== restaurant.id) {
      dispatch(getCategories({ restaurantId: restaurant.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  useEffect(() => {
    if (subCategories && categories) {
      const grouped = groupSubCategories([...subCategories]);
      setSubCategoriesData(grouped);
      setSubCategoriesDataBefore(grouped);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subCategories, categories]);

  useEffect(() => {
    if (categories) setCategoriesData(categories);
  }, [categories]);

  // Toast
  useEffect(() => {
    if (updateSuccess) {
      toast.success(t("editSubCategories.success"), { id: "subCategories" });
      setSubCategoriesDataBefore(subCategoriesData);
      dispatch(resetUpdateSubOrders());
    }
    if (updateError) dispatch(resetUpdateSubOrders());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateSuccess, updateError]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    const sourceCategoryId = source.droppableId.split("#")[1];
    const destCategoryId = destination.droppableId.split("#")[1];
    if (sourceCategoryId !== destCategoryId) return; // same-category only

    setSubCategoriesData((prev) =>
      prev.map((group) => {
        if (group.category.id !== sourceCategoryId) return group;
        const next = Array.from(group.subCategories);
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return {
          ...group,
          subCategories: next.map((sc, i) => ({ ...sc, sortOrder: i })),
        };
      }),
    );
  };

  const handleEditSubCategory = (updated) => {
    if (!subCategoriesData) return;
    // Refetch from the backend so the slice cache picks up the
    // canonical image URL the server just generated. The local merge
    // below uses the editor's blob preview — fine for this session, but
    // other consumers reading from `s.subCategories.get` would
    // otherwise see the stale URL until next mount. Fired ONCE up
    // front (instead of inside every branch) because each merge path
    // has its own early `return`. Same pattern as
    // handleAddSubCategory below.
    if (restaurant?.id) {
      dispatch(getSubCategories({ restaurantId: restaurant.id }));
    }
    let originGroupIndex = -1;
    subCategoriesData.forEach((group, gi) => {
      if (group.subCategories.some((sc) => sc.id === updated.id)) {
        originGroupIndex = gi;
      }
    });

    if (originGroupIndex === -1) {
      const targetIndex = subCategoriesData.findIndex(
        (g) => g.category.id === updated.categoryId,
      );
      const next = subCategoriesData.map((g) => ({ ...g }));
      if (targetIndex !== -1) {
        next[targetIndex] = {
          ...next[targetIndex],
          subCategories: [
            ...next[targetIndex].subCategories,
            { ...updated, sortOrder: next[targetIndex].subCategories.length },
          ],
        };
      } else {
        const cat =
          categoriesData?.find((c) => c.id === updated.categoryId) || {
            id: updated.categoryId,
            name: t("editSubCategories.unknown_category"),
          };
        next.push({ category: cat, subCategories: [{ ...updated, sortOrder: 0 }] });
      }
      setSubCategoriesData(next);
      setSubCategoriesDataBefore(next);
      return;
    }

    const originCategoryId = subCategoriesData[originGroupIndex].category.id;
    if (originCategoryId === updated.categoryId) {
      const next = subCategoriesData.map((g) => ({
        ...g,
        subCategories: g.subCategories.map((sc) =>
          sc.id === updated.id ? { ...sc, ...updated } : sc,
        ),
      }));
      setSubCategoriesData(next);
      setSubCategoriesDataBefore(next);
      return;
    }

    const removed = subCategoriesData.map((g) => ({
      ...g,
      subCategories: g.subCategories
        .filter((sc) => sc.id !== updated.id)
        .map((sc, i) => ({ ...sc, sortOrder: i })),
    }));
    const targetIdx = removed.findIndex(
      (g) => g.category.id === updated.categoryId,
    );
    if (targetIdx !== -1) {
      const target = removed[targetIdx];
      removed[targetIdx] = {
        ...target,
        subCategories: [
          ...target.subCategories,
          { ...updated, sortOrder: target.subCategories.length },
        ],
      };
    } else {
      const cat =
        categoriesData?.find((c) => c.id === updated.categoryId) || {
          id: updated.categoryId,
          name: t("editSubCategories.unknown_category"),
        };
      removed.push({ category: cat, subCategories: [{ ...updated, sortOrder: 0 }] });
    }
    setSubCategoriesData(removed);
    setSubCategoriesDataBefore(removed);
  };

  const handleDelete = (deletedId) => {
    setSubCategoriesData((prev) =>
      prev.map((g) => ({
        ...g,
        subCategories: g.subCategories
          .filter((sc) => sc.id !== deletedId)
          .map((sc, i) => ({ ...sc, sortOrder: i })),
      })),
    );
    setSubCategoriesDataBefore((prev) =>
      prev?.map((g) => ({
        ...g,
        subCategories: g.subCategories
          .filter((sc) => sc.id !== deletedId)
          .map((sc, i) => ({ ...sc, sortOrder: i })),
      })),
    );
  };

  const handleAddSubCategory = () => {
    // Force a fresh fetch — the slice cache is now stale. We dispatch
    // explicitly because the load effect only depends on `restaurant?.id`,
    // so flipping local state to null is no longer enough.
    if (restaurant?.id) {
      dispatch(getSubCategories({ restaurantId: restaurant.id }));
    }
  };

  const openAddPopup = () => {
    setPopupContent(
      <AddSubCategory
        onSuccess={handleAddSubCategory}
        restaurant={restaurant}
      />,
    );
  };

  // "Ürünler" — opens the two-column picker that assigns the parent
  // category's products to / removes them from this sub-category.
  // `onChanged` only fires when an assignment actually persisted, so a
  // look-and-close doesn't trigger the (slow) getSubCategories refetch;
  // when it does fire we refresh so the `productsCount` badges update.
  const openManageProductsPopup = (subCat, parentCategoryName) => {
    setPopupContent(
      <SubCategoryProducts
        subCategoryId={subCat.id}
        subCategoryName={subCat.name}
        categoryId={subCat.categoryId}
        categoryName={parentCategoryName}
        restaurantId={restaurant?.id}
        onClose={() => setPopupContent(null)}
        onChanged={() => {
          if (restaurant?.id) {
            dispatch(getSubCategories({ restaurantId: restaurant.id }));
          }
        }}
      />,
    );
  };

  // SAVE NEW ORDER — only push items whose sortOrder changed.
  const saveNewOrder = (e) => {
    e?.preventDefault();
    if (isEqual(subCategoriesData, subCategoriesDataBefore)) {
      toast.error(t("editSubCategories.not_changed"), { id: "subCategories" });
      return;
    }
    const currentFlat = flattenGroupedData(subCategoriesData);
    const beforeFlat = flattenGroupedData(subCategoriesDataBefore);
    const changedOnes = currentFlat.filter((a) => {
      const orig = beforeFlat.find((b) => b.id === a.id);
      return orig && orig.sortOrder !== a.sortOrder;
    });
    const dataToSend = changedOnes.map(({ id, categoryId, sortOrder }) => ({
      id,
      categoryId,
      sortOrder,
    }));
    const formData = new FormData();
    formData.append("restaurantId", restaurant?.id);
    formData.append("subCategoriesData", JSON.stringify(dataToSend));
    dispatch(updateSubOrders(formData));
  };

  const orderDirty = useMemo(
    () =>
      subCategoriesData &&
      subCategoriesDataBefore &&
      !isEqual(subCategoriesData, subCategoriesDataBefore),
    [subCategoriesData, subCategoriesDataBefore],
  );

  const totalSubCount = subCategoriesData
    ? subCategoriesData.reduce((s, g) => s + g.subCategories.length, 0)
    : 0;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <FolderTree className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("editSubCategories.title", { name: restaurant?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {subCategoriesData
                ? t("editSubCategories.summary", {
                    groups: subCategoriesData.length,
                    count: totalSubCount,
                  })
                : t("editSubCategories.header_subtitle")}
            </p>
          </div>
          <PageHelp pageKey="subCategories" />
          <button
            type="button"
            onClick={openAddPopup}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {t("editSubCategories.add_button")}
            </span>
          </button>
        </div>

        <div className="p-3 sm:p-5 space-y-3">
          {orderDirty && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveNewOrder}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-60"
                style={{ background: PRIMARY_GRADIENT }}
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {t("editSubCategories.save_order")}
              </button>
            </div>
          )}

          {!subCategoriesData ? (
            <div className="grid place-items-center py-10 text-[--gr-2]">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : subCategoriesData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <FolderTree className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("editSubCategories.no_subcategories")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1 max-w-sm">
                {t("editSubCategories.no_subcategories_info")}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-3">
                {subCategoriesData.map((group) => (
                  <div
                    key={group.category.id}
                    className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden"
                  >
                    {/* Group header */}
                    <div className="flex items-center gap-2.5 px-3 py-2 bg-[--white-2]/80 border-b border-[--border-1]">
                      <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                        <Layers className="size-3.5" />
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[--black-2] truncate flex-1 min-w-0">
                        {group.category.name}
                      </h3>
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 shrink-0">
                        {t("editSubCategories.subcategory_count", {
                          count: group.subCategories.length,
                        })}
                      </span>
                    </div>

                    <Droppable droppableId={`subCategories#${group.category.id}`}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex flex-col gap-2 p-2 transition-colors ${
                            snapshot.isDraggingOver ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          {group.subCategories.length === 0 ? (
                            <div className="text-[11px] text-[--gr-2] italic text-center py-4">
                              {t(
                                "editSubCategories.no_subcategories_in_category",
                              )}
                            </div>
                          ) : (
                            group.subCategories.map((subCat, index) => (
                              <Draggable
                                key={subCat.id || `temp-${subCat.sortOrder}`}
                                draggableId={subCat.id || `temp-${subCat.sortOrder}`}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg border bg-[--white-1] transition ${
                                      snapshot.isDragging
                                        ? "border-indigo-400 ring-2 ring-indigo-200 shadow-lg"
                                        : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      {...provided.dragHandleProps}
                                      aria-label="drag"
                                      className="grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
                                    >
                                      <GripVertical className="size-4" />
                                    </button>
                                    <div className="size-11 sm:size-12 rounded-lg ring-1 ring-[--border-1] bg-[--white-2] grid place-items-center overflow-hidden shrink-0">
                                      <img
                                        src={
                                          subCat.imageAbsoluteUrl || fallbackImg
                                        }
                                        alt={subCat.name}
                                        className="size-full object-cover pointer-events-none"
                                        draggable={false}
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-semibold text-[--black-1] truncate">
                                        {subCat.name}
                                      </div>
                                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                                        <StatusBadge
                                          active={!!subCat.isActive}
                                          labelOn={t(
                                            "editCategories.status_open",
                                          )}
                                          labelOff={t(
                                            "editCategories.status_closed",
                                          )}
                                        />
                                        <span className="text-[10px] font-medium text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md">
                                          {t("editCategories.product_count", {
                                            count: subCat.productsCount || 0,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openManageProductsPopup(
                                            subCat,
                                            group.category.name,
                                          )
                                        }
                                        title={t(
                                          "editSubCategories.manage_products",
                                        )}
                                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
                                      >
                                        <Package className="size-3.5" />
                                        <span className="hidden md:inline">
                                          {t(
                                            "editSubCategories.manage_products",
                                          )}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPopupContent(
                                            <EditSubCategory
                                              subCategory={subCat}
                                              categories={categoriesData}
                                              onSuccess={handleEditSubCategory}
                                            />,
                                          )
                                        }
                                        title={t("categoryProducts.edit")}
                                        className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                                      >
                                        <Pencil className="size-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPopupContent(
                                            <DeleteSubCategory
                                              onSuccess={handleDelete}
                                              subCategory={subCat}
                                            />,
                                          )
                                        }
                                        title={t("categoryProducts.delete")}
                                        className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                                      >
                                        <Trash2 className="size-3.5" />
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
              </div>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ active, labelOn, labelOff }) => (
  <span
    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${
      active
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
        : "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]"
    }`}
  >
    {active ? labelOn : labelOff}
  </span>
);

export default SubCategories;
