// MODULES
import { isEqual } from "lodash";
import { toast } from "react-hot-toast";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  LayoutGrid,
  Images,
  Save,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  ListOrdered,
  Loader2,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  List,
  Grid3x3,
  Star,
  Tag,
} from "lucide-react";

// COMP
import EditCategory from "./editCategory";
import DeleteCategory from "./deleteCategory";
import AddCategory from "./addCategory";
import CategoryProducts from "./categoryProducts";
import PageHelp from "../../common/pageHelp";
import fallbackImg from "../../../assets/img/No_Img.svg";
import { usePopup } from "../../../context/PopupContext";

// REDUX
import {
  getCategories,
  resetGetCategories,
} from "../../../redux/categories/getCategoriesSlice";
import {
  editCategories,
  resetEditCategories,
} from "../../../redux/categories/editCategoriesSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const ACCEPTED_IMAGES = "image/png,image/jpeg,image/gif,image/webp";
const ACCEPTED_LIST = ACCEPTED_IMAGES.split(",").map((s) => s.trim());

const Categories = ({ data: restaurant }) => {
  const params = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();

  const { categories } = useSelector((state) => state.categories.get);
  const { success, error, loading } = useSelector(
    (state) => state.categories.edit,
  );

  const [activeTab, setActiveTab] = useState("list"); // "list" | "bulk"
  const [categoriesData, setCategoriesData] = useState(null);
  const [categoriesDataBefore, setCategoriesDataBefore] = useState(null);

  // Bulk image-edit state: map of categoryId -> { file, previewUrl }
  const [bulkChanges, setBulkChanges] = useState({});

  // GET CATEGORIES
  useEffect(() => {
    if (!categoriesData) {
      dispatch(getCategories({ restaurantId: params?.id }));
    }
  }, [categoriesData]);

  // SET CATEGORIES WHEN FETCHED
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
      // Clear bulk changes & previews after a successful save
      Object.values(bulkChanges).forEach((c) => {
        if (c.previewUrl) URL.revokeObjectURL(c.previewUrl);
      });
      setBulkChanges({});
      // Refetch fresh image URLs so the new uploads appear
      dispatch(getCategories({ restaurantId: params?.id }));
      dispatch(resetEditCategories());
    }
    if (error) dispatch(resetEditCategories());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(categoriesData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
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

  const handleDelete = (categoryId) => {
    const newCategories = categoriesData.filter((cat) => cat.id !== categoryId);
    const sorted = sortCategoriesByOrder(newCategories);
    setCategoriesData(sorted);
    setCategoriesDataBefore(sorted);
  };

  const sortCategoriesByOrder = (cats) =>
    [...cats].sort((a, b) => a.sortOrder - b.sortOrder);

  const handleManageProducts = (categoryId) => {
    setPopupContent(
      <CategoryProducts
        categoryId={categoryId}
        onClose={() => setPopupContent(null)}
      />,
    );
  };

  const openAddCategoryPopup = () => {
    setPopupContent(
      <AddCategory
        id={params?.id}
        data={restaurant}
        onSuccess={() => {
          setCategoriesData(null); // trigger re-fetch
          setPopupContent(null);
        }}
      />,
    );
  };

  // SAVE NEW ORDER (existing behavior)
  const saveNewOrder = (e) => {
    e?.preventDefault();
    if (isEqual(categoriesData, categoriesDataBefore)) {
      toast.error(t("editCategories.not_changed"), { id: "categories" });
      return;
    }
    const formData = new FormData();
    const payloadCategories = categoriesData.map(({ image, ...rest }) => rest);
    const deletedCategories = categoriesDataBefore.filter(
      (prev) => !categoriesData.some((c) => c.id === prev.id),
    );
    formData.append("restaurantId", restaurant?.id);
    formData.append("categoriesData", JSON.stringify(payloadCategories));
    formData.append("deletedCategories", JSON.stringify(deletedCategories));
    categoriesData.forEach((cat, index) => {
      if (cat.image) formData.append(`image_${index}`, cat.image);
      else if (cat.imageAbsoluteUrl)
        formData.append(`imageUrl_${index}`, cat.imageAbsoluteUrl);
    });
    dispatch(editCategories(formData));
  };

  const orderDirty = !isEqual(categoriesData, categoriesDataBefore);
  const bulkPending = Object.keys(bulkChanges).length;

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
            <LayoutGrid className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("editCategories.title", { name: restaurant?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {categoriesData
                ? t("editCategories.summary", { count: categoriesData.length })
                : t("editCategories.info")}
            </p>
          </div>
          <PageHelp pageKey="categories" />
          <button
            type="button"
            onClick={openAddCategoryPopup}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {t("editCategories.add")}
            </span>
          </button>
        </div>

        {/* TABS */}
        <div className="px-3 sm:px-4 pt-3 border-b border-[--border-1] flex gap-1 overflow-x-auto">
          <TabButton
            active={activeTab === "list"}
            onClick={() => setActiveTab("list")}
            icon={ListOrdered}
            label={t("editCategories.tab_list")}
          />
          <TabButton
            active={activeTab === "bulk"}
            onClick={() => setActiveTab("bulk")}
            icon={Images}
            label={t("editCategories.tab_bulk_images")}
            badge={bulkPending > 0 ? bulkPending : null}
          />
        </div>

        <div className="p-3 sm:p-5">
          {activeTab === "list" && (
            <ListTab
              t={t}
              params={params}
              categoriesData={categoriesData}
              orderDirty={orderDirty}
              saveNewOrder={saveNewOrder}
              loading={loading}
              handleDragEnd={handleDragEnd}
              handleManageProducts={handleManageProducts}
              setPopupContent={setPopupContent}
              setCategoriesData={setCategoriesData}
              setCategoriesDataBefore={setCategoriesDataBefore}
              handleEditCategory={handleEditCategory}
              handleDelete={handleDelete}
            />
          )}

          {activeTab === "bulk" && (
            <BulkImageTab
              t={t}
              restaurant={restaurant}
              categoriesData={categoriesData}
              bulkChanges={bulkChanges}
              setBulkChanges={setBulkChanges}
              dispatch={dispatch}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// =================== TAB BUTTON ===================
const TabButton = ({ active, onClick, icon: Icon, label, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition border-b-2 ${
      active
        ? "text-indigo-700 border-indigo-600 bg-indigo-50/40"
        : "text-[--gr-1] border-transparent hover:text-[--black-2] hover:bg-[--white-2]"
    }`}
  >
    <Icon className="size-4" />
    {label}
    {badge != null && (
      <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
        {badge}
      </span>
    )}
  </button>
);

// =================== LIST TAB ===================
function ListTab({
  t,
  params,
  categoriesData,
  orderDirty,
  saveNewOrder,
  loading,
  handleDragEnd,
  handleManageProducts,
  setPopupContent,
  setCategoriesData,
  setCategoriesDataBefore,
  handleEditCategory,
  handleDelete,
}) {
  // Loading skeleton — actual "no categories" only shown when fetched + empty.
  if (!categoriesData) {
    return (
      <div className="grid place-items-center py-10 text-[--gr-2] text-sm">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (categoriesData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
        <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
          <LayoutGrid className="size-6" />
        </span>
        <h3 className="text-sm font-semibold text-[--black-1]">
          {t("editCategories.no_categories")}
        </h3>
        <p className="text-xs text-[--gr-1] mt-1 max-w-sm">
          {t("editCategories.no_categories_info")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderDirty && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveNewOrder}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-60"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Save className="size-4" />
            {t("editCategories.save_order")}
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="categories">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex flex-col gap-2 p-1.5 rounded-xl transition-colors ${
                snapshot.isDraggingOver
                  ? "bg-indigo-50/60"
                  : "bg-transparent"
              }`}
            >
              {categoriesData.map((cat) => (
                <Draggable
                  key={cat.id || `temp-${cat.sortOrder}`}
                  draggableId={cat.id || `temp-${cat.sortOrder}`}
                  index={cat.sortOrder}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border bg-[--white-1] transition ${
                        snapshot.isDragging
                          ? "border-indigo-300 ring-2 ring-indigo-100 shadow-lg"
                          : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
                      }`}
                    >
                      {/* Drag handle + image + name */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          {...provided.dragHandleProps}
                          aria-label="drag"
                          className="grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
                        >
                          <GripVertical className="size-4" />
                        </button>
                        <div className="size-12 sm:size-14 rounded-lg ring-1 ring-[--border-1] bg-[--white-2] grid place-items-center overflow-hidden shrink-0">
                          <img
                            src={cat.imageAbsoluteUrl || fallbackImg}
                            alt={cat.name}
                            className="size-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[--black-1] truncate">
                            {cat.name}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <StatusBadge
                              active={!!cat.isActive}
                              labelOn={t("editCategories.status_open")}
                              labelOff={t("editCategories.status_closed")}
                            />
                            {cat.featured && (
                              <FeatureBadge
                                icon={Star}
                                label={t("editCategories.featured")}
                                tone="indigo"
                              />
                            )}
                            {cat.campaign && (
                              <FeatureBadge
                                icon={Tag}
                                label={t("editCategories.campaign")}
                                tone="amber"
                              />
                            )}
                            <span className="text-[10px] font-medium text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md">
                              {t("editCategories.product_count", {
                                count: cat.productsCount || 0,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleManageProducts(cat.id)}
                          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold transition"
                          title={t("editCategories.manage_products")}
                        >
                          <ListOrdered className="size-3.5" />
                          <span className="hidden md:inline">
                            {t("editCategories.manage_products")}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPopupContent(
                              <EditCategory
                                category={cat}
                                id={params?.id}
                                setCategoriesData={setCategoriesData}
                                setCategoriesDataBefore={setCategoriesDataBefore}
                                onSuccess={handleEditCategory}
                              />,
                            )
                          }
                          className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                          title={t("editCategories.edit")}
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPopupContent(
                              <DeleteCategory
                                category={cat}
                                onSuccess={handleDelete}
                              />,
                            )
                          }
                          className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                          title={t("editCategories.delete")}
                        >
                          <Trash2 className="size-3.5" />
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
    </div>
  );
}

const StatusBadge = ({ active, labelOn, labelOff, tone }) => {
  const cls = active
    ? tone === "amber"
      ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-[--white-2] text-[--gr-1] ring-1 ring-[--border-1]";
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${cls}`}
    >
      {active ? labelOn : labelOff}
    </span>
  );
};

// A compact "feature" badge — icon + label — for boolean attributes like
// "Featured" or "Campaign" that are only worth showing when truthy.
const FeatureBadge = ({ icon: Icon, label, tone = "indigo" }) => {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${tones[tone] || tones.indigo}`}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {label}
    </span>
  );
};

// =================== BULK IMAGE TAB ===================
function BulkImageTab({
  t,
  restaurant,
  categoriesData,
  bulkChanges,
  setBulkChanges,
  dispatch,
  loading,
}) {
  const maxMB = parseFloat(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 5;
  const fileInputs = useRef({});
  // Default to list view per spec; persist user choice across mounts.
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem("bulkCategoryViewMode") || "list";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bulkCategoryViewMode", viewMode);
    }
  }, [viewMode]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(bulkChanges).forEach((c) => {
        if (c?.previewUrl) URL.revokeObjectURL(c.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!categoriesData) {
    return (
      <div className="grid place-items-center py-10 text-[--gr-2] text-sm">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (categoriesData.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
        <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
          <Images className="size-6" />
        </span>
        <h3 className="text-sm font-semibold text-[--black-1]">
          {t("editCategories.no_categories")}
        </h3>
      </div>
    );
  }

  const pickFile = (catId) => fileInputs.current[catId]?.click();

  const onFileSelected = (cat, file) => {
    if (!file) return;
    if (!ACCEPTED_LIST.includes(file.type)) {
      toast.error(t("editCategories.bulk_invalid_file"), { id: "bulkInvalid" });
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(t("editCategories.bulk_too_large", { size: maxMB }), {
        id: "bulkTooLarge",
      });
      return;
    }
    setBulkChanges((prev) => {
      const prevEntry = prev[cat.id];
      if (prevEntry?.previewUrl) URL.revokeObjectURL(prevEntry.previewUrl);
      return {
        ...prev,
        [cat.id]: { file, previewUrl: URL.createObjectURL(file) },
      };
    });
  };

  const revertChange = (catId) => {
    setBulkChanges((prev) => {
      const next = { ...prev };
      const entry = next[catId];
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      delete next[catId];
      return next;
    });
  };

  const saveAll = (e) => {
    e?.preventDefault();
    const pendingIds = Object.keys(bulkChanges);
    if (pendingIds.length === 0) {
      toast.error(t("editCategories.bulk_no_changes"), { id: "bulkSave" });
      return;
    }

    const formData = new FormData();
    const payloadCategories = categoriesData.map(({ image, ...rest }) => rest);
    formData.append("restaurantId", restaurant?.id);
    formData.append("categoriesData", JSON.stringify(payloadCategories));
    formData.append("deletedCategories", JSON.stringify([]));

    categoriesData.forEach((cat, index) => {
      const change = bulkChanges[cat.id];
      if (change?.file) {
        formData.append(`image_${index}`, change.file);
      } else if (cat.imageAbsoluteUrl) {
        formData.append(`imageUrl_${index}`, cat.imageAbsoluteUrl);
      }
    });

    dispatch(editCategories(formData));
  };

  const pendingCount = Object.keys(bulkChanges).length;

  // Hidden file inputs are mounted once outside the per-row markup so the
  // refs survive switches between list and tile view.
  const fileInputNodes = categoriesData.map((cat) => (
    <input
      key={`fi-${cat.id}`}
      ref={(el) => (fileInputs.current[cat.id] = el)}
      type="file"
      accept={ACCEPTED_IMAGES}
      className="hidden"
      onChange={(e) => {
        onFileSelected(cat, e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  ));

  const SaveBar = ({ position }) => (
    <div
      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-between p-3 rounded-xl border border-[--border-1] bg-[--white-1] ${
        position === "bottom"
          ? "sticky bottom-0 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.08)]"
          : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} t={t} />
        <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide truncate">
          {pendingCount > 0
            ? t("editCategories.bulk_pending", { count: pendingCount })
            : t("editCategories.summary", { count: categoriesData.length })}
        </span>
      </div>
      <button
        type="button"
        onClick={saveAll}
        disabled={loading || pendingCount === 0}
        className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Save className="size-4" />
        )}
        {t("editCategories.bulk_save_all")}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 flex items-start gap-3">
        <span className="grid place-items-center size-8 rounded-lg bg-[--white-1] text-indigo-600 ring-1 ring-indigo-100 shrink-0">
          <Images className="size-4" />
        </span>
        <p className="text-[12px] text-indigo-900/90 leading-relaxed flex-1 min-w-0">
          {t("editCategories.bulk_subtitle")}
        </p>
      </div>

      <SaveBar position="top" />

      {/* Hidden file inputs — kept stable across view-mode switches */}
      <div aria-hidden>{fileInputNodes}</div>

      {viewMode === "tile" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoriesData.map((cat) => {
            const change = bulkChanges[cat.id];
            const previewSrc =
              change?.previewUrl || cat.imageAbsoluteUrl || fallbackImg;
            const dirty = !!change;
            return (
              <div
                key={cat.id}
                className={`relative rounded-xl border bg-[--white-1] overflow-hidden transition-all flex flex-col ${
                  dirty
                    ? "border-indigo-300 ring-2 ring-indigo-100 shadow-md"
                    : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
                }`}
              >
                <div className="relative aspect-square bg-[--white-2]">
                  <img
                    src={previewSrc}
                    alt={cat.name}
                    className="absolute inset-0 size-full object-cover"
                  />
                  {dirty && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      <Upload className="size-3" />
                      NEW
                    </span>
                  )}
                </div>
                <div className="p-2.5 flex flex-col gap-1.5">
                  <div className="text-xs font-semibold text-[--black-1] truncate">
                    {cat.name}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => pickFile(cat.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-8 px-2 rounded-md border border-[--border-1] bg-[--white-1] text-[11px] font-semibold text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition"
                    >
                      {dirty ? (
                        <Pencil className="size-3" />
                      ) : (
                        <ImageIcon className="size-3" />
                      )}
                      {dirty
                        ? t("editCategories.bulk_change_image")
                        : t("editCategories.bulk_pick_image")}
                    </button>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => revertChange(cat.id)}
                        title={t("editCategories.bulk_revert")}
                        aria-label={t("editCategories.bulk_revert")}
                        className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categoriesData.map((cat) => {
            const change = bulkChanges[cat.id];
            const previewSrc =
              change?.previewUrl || cat.imageAbsoluteUrl || fallbackImg;
            const dirty = !!change;
            return (
              <div
                key={cat.id}
                className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
                  dirty
                    ? "border-indigo-300 ring-2 ring-indigo-100 shadow-sm"
                    : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
                }`}
              >
                <div className="relative size-14 sm:size-16 rounded-lg ring-1 ring-[--border-1] bg-[--white-2] grid place-items-center overflow-hidden shrink-0">
                  <img
                    src={previewSrc}
                    alt={cat.name}
                    className="size-full object-cover"
                  />
                  {dirty && (
                    <span className="absolute top-0.5 left-0.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded-sm bg-indigo-600 text-white text-[8px] font-bold uppercase tracking-wider shadow-sm">
                      <Upload className="size-2.5" />
                      NEW
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[--black-1] truncate">
                    {cat.name}
                  </div>
                  <div className="text-[10px] font-medium text-[--gr-2] mt-0.5 uppercase tracking-wider">
                    {dirty ? (
                      <span className="text-indigo-600">
                        {t("editCategories.bulk_change_image")}
                      </span>
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => pickFile(cat.id)}
                    className="inline-flex items-center justify-center gap-1 h-8 px-2.5 rounded-md border border-[--border-1] bg-[--white-1] text-[11px] font-semibold text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition"
                  >
                    {dirty ? (
                      <Pencil className="size-3" />
                    ) : (
                      <ImageIcon className="size-3" />
                    )}
                    <span className="hidden sm:inline">
                      {dirty
                        ? t("editCategories.bulk_change_image")
                        : t("editCategories.bulk_pick_image")}
                    </span>
                  </button>
                  {dirty && (
                    <button
                      type="button"
                      onClick={() => revertChange(cat.id)}
                      title={t("editCategories.bulk_revert")}
                      aria-label={t("editCategories.bulk_revert")}
                      className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                    >
                      <RotateCcw className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SaveBar position="bottom" />
    </div>
  );
}

const ViewToggle = ({ viewMode, setViewMode, t }) => (
  <div className="inline-flex items-center rounded-lg border border-[--border-1] bg-[--white-2] p-0.5 shrink-0">
    <button
      type="button"
      onClick={() => setViewMode("list")}
      title={t("editCategories.view_list")}
      aria-label={t("editCategories.view_list")}
      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold transition ${
        viewMode === "list"
          ? "bg-[--white-1] text-indigo-700 shadow-sm ring-1 ring-[--border-1]"
          : "text-[--gr-1] hover:text-[--black-2]"
      }`}
    >
      <List className="size-3.5" />
      <span className="hidden sm:inline">{t("editCategories.view_list")}</span>
    </button>
    <button
      type="button"
      onClick={() => setViewMode("tile")}
      title={t("editCategories.view_tile")}
      aria-label={t("editCategories.view_tile")}
      className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold transition ${
        viewMode === "tile"
          ? "bg-[--white-1] text-indigo-700 shadow-sm ring-1 ring-[--border-1]"
          : "text-[--gr-1] hover:text-[--black-2]"
      }`}
    >
      <Grid3x3 className="size-3.5" />
      <span className="hidden sm:inline">{t("editCategories.view_tile")}</span>
    </button>
  </div>
);

export default Categories;
