// MODULES
import { useEffect, useRef, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Package,
  X,
  Pencil,
  Trash2,
  Save,
  GripVertical,
  Loader2,
} from "lucide-react";

// COMPONENTS & FUNCTIONS
import EditProduct from "../products/editProduct";
import DeleteProduct from "../products/deleteProduct";
import { usePopup } from "../../../context/PopupContext";

// REDUX
import {
  getProductsByCategoryId,
  resetGetProductsByCategoryIdState,
} from "../../../redux/products/getProductsByCategoryIdSlice";
import {
  editProduct,
  resetEditProduct,
} from "../../../redux/products/editProductSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const sortBySortOrder = (list) =>
  [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const CategoryProducts = ({ categoryId, categoryName, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { products, success, error } = useSelector(
    (s) => s.products.getByCategoryId,
  );
  const { setSecondPopupContent } = usePopup();

  // Local list of products + a snapshot of the original order so we can
  // detect drag-drop changes and offer a Save Order button.
  const [items, setItems] = useState(null);
  const [itemsBefore, setItemsBefore] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // The popup wrapper applies `transform: scale(1)` (Tailwind `scale-100`)
  // and `backdrop-filter: blur(...)` — both create a new containing block
  // for `position: fixed`, which traps the rfd drag clone and offsets it
  // from the cursor. Instead of using `renderClone` (which hides the
  // in-list row), we just temporarily neutralize those properties on every
  // ancestor while the modal is mounted, then restore them on close.
  const rootRef = useRef(null);
  useEffect(() => {
    if (!rootRef.current) return;
    const overrides = [];
    let el = rootRef.current.parentElement;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.transform && cs.transform !== "none") {
        overrides.push({ el, prop: "transform", original: el.style.transform });
        el.style.transform = "none";
      }
      if (cs.backdropFilter && cs.backdropFilter !== "none") {
        overrides.push({
          el,
          prop: "backdropFilter",
          original: el.style.backdropFilter,
        });
        el.style.backdropFilter = "none";
      }
      if (cs.filter && cs.filter !== "none") {
        overrides.push({ el, prop: "filter", original: el.style.filter });
        el.style.filter = "none";
      }
      el = el.parentElement;
    }
    return () => {
      overrides.forEach((o) => {
        o.el.style[o.prop] = o.original || "";
      });
    };
  }, []);

  useEffect(() => {
    if (!items) {
      dispatch(getProductsByCategoryId({ categoryId }));
    }
  }, [items, categoryId, dispatch]);

  useEffect(() => {
    if (products) {
      const sorted = sortBySortOrder(products.data || []);
      setItems(sorted);
      setItemsBefore(sorted);
      dispatch(resetGetProductsByCategoryIdState());
    }
    if (error) dispatch(resetGetProductsByCategoryIdState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, success, error]);

  const handleDeletedProduct = (deletedId) => {
    setItems((prev) => prev.filter((p) => p.id !== deletedId));
    setItemsBefore((prev) => prev?.filter((p) => p.id !== deletedId));
  };

  const handleEditProduct = (product) =>
    setSecondPopupContent(<EditProduct product={product} />);

  const handleDeleteProduct = (product) =>
    setSecondPopupContent(
      <DeleteProduct product={product} onSuccess={handleDeletedProduct} />,
    );

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    setItems((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination.index, 0, moved);
      return next.map((p, i) => ({ ...p, sortOrder: i }));
    });
  };

  // Detect order dirty by comparing IDs + sortOrder.
  const orderDirty = useMemo(() => {
    if (!items || !itemsBefore) return false;
    if (items.length !== itemsBefore.length) return false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id !== itemsBefore[i].id) return true;
      if ((items[i].sortOrder ?? 0) !== (itemsBefore[i].sortOrder ?? 0))
        return true;
    }
    return false;
  }, [items, itemsBefore]);

  // Build the bare-minimum FormData payload editProduct expects, with the
  // updated sortOrder. We carry through the existing values (name, ids, etc.)
  // so the backend doesn't blank them.
  const buildEditPayload = (p, newSortOrder) => {
    const fd = new FormData();
    fd.append("id", p.id);
    if (p.restaurantId) fd.append("restaurantId", p.restaurantId);
    if (p.categoryId) fd.append("categoryId", p.categoryId);
    if (p.subCategoryId) fd.append("subCategoryId", p.subCategoryId);
    fd.append("name", p.name ?? "");
    fd.append("description", p.description ?? "");
    fd.append("recommendation", String(p.recommendation ?? false));
    fd.append("hide", String(p.hide ?? false));
    fd.append("freeTagging", String(p.freeTagging ?? false));
    fd.append("sortOrder", String(newSortOrder));
    if (Array.isArray(p.portions)) {
      fd.append("portions", JSON.stringify(p.portions));
    }
    if (p.image && typeof p.image === "string") {
      fd.append("imageUrl", p.image);
    }
    return fd;
  };

  const saveOrder = async () => {
    if (!orderDirty) {
      toast.error(t("categoryProducts.no_changes"), { id: "prodOrder" });
      return;
    }
    setSavingOrder(true);
    toast.loading(t("categoryProducts.saving_order"), { id: "prodOrder" });

    // Only push items whose sortOrder actually moved.
    const beforeMap = new Map(itemsBefore.map((p) => [p.id, p.sortOrder ?? 0]));
    const moved = items.filter(
      (p) => beforeMap.get(p.id) !== (p.sortOrder ?? 0),
    );

    try {
      // Sequential to keep error reporting simple and to be friendly to the API.
      for (const p of moved) {
        const action = await dispatch(
          editProduct(buildEditPayload(p, p.sortOrder ?? 0)),
        );
        if (action?.error) throw action.payload || action.error;
      }
      setItemsBefore(items);
      toast.success(t("categoryProducts.order_saved"), { id: "prodOrder" });
    } catch (err) {
      const msg =
        err?.message_TR ||
        err?.message ||
        t("categoryProducts.order_save_failed");
      toast.error(msg, { id: "prodOrder" });
    } finally {
      dispatch(resetEditProduct());
      setSavingOrder(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className="w-full max-w-2xl mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85dvh]"
    >
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* HEADER (sticky relative to the modal) */}
      <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Package className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
            {categoryName
              ? `${t("categoryProducts.title")} — ${categoryName}`
              : t("categoryProducts.title")}
          </h3>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {t("categoryProducts.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("categoryProducts.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* SCROLLABLE BODY */}
      {!items ? (
        <div className="flex-1 min-h-0 grid place-items-center py-10 text-[--gr-2]">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 min-h-0 p-3 sm:p-4">
          <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
            <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
              <Package className="size-6" />
            </span>
            <h3 className="text-sm font-semibold text-[--black-1]">
              {t("categoryProducts.no_products")}
            </h3>
          </div>
        </div>
      ) : (
        // The Droppable's inner element IS the scroll container so rfd's
        // auto-scroll and drop-position math share one node. We don't need
        // renderClone because the modal-wrapper transform/backdrop-filter
        // that was offsetting the drag avatar is neutralized at mount.
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="categoryProducts">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2 transition-colors ${
                  snapshot.isDraggingOver ? "bg-indigo-50/40" : ""
                }`}
              >
                {items.map((prod, index) => (
                  <Draggable
                    key={prod.id}
                    draggableId={String(prod.id)}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <ProductRow
                        prod={prod}
                        t={t}
                        provided={provided}
                        isDragging={snapshot.isDragging}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* FOOTER — Save Order shows only when dirty */}
      <div className="px-3 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-between gap-3 shrink-0 bg-[--white-1]">
        <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide truncate">
          {orderDirty
            ? t("categoryProducts.drag_to_reorder")
            : items?.length
              ? t("categoryProducts.summary", { count: items.length })
              : ""}
        </span>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
          >
            {t("categoryProducts.close")}
          </button>
          {orderDirty && (
            <button
              type="button"
              onClick={saveOrder}
              disabled={savingOrder}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: PRIMARY_GRADIENT }}
            >
              {savingOrder ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("categoryProducts.save_order")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Same row used by the rendered list. Without renderClone, rfd handles
// the drag avatar by transforming this very element to follow the cursor.
const ProductRow = ({ prod, t, provided, isDragging, onEdit, onDelete }) => {
  const portionsCount = Array.isArray(prod.portions) ? prod.portions.length : 0;
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      className={`flex items-center gap-3 p-3 rounded-xl border bg-[--white-1] transition ${
        isDragging
          ? "border-indigo-400 ring-2 ring-indigo-200 shadow-xl"
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
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[--black-1] truncate">
          {prod.name}
        </div>
        <div className="text-[11px] text-[--gr-1] mt-0.5">
          {t("categoryProducts.portions", { count: portionsCount })}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(prod)}
          title={t("categoryProducts.edit")}
          className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(prod)}
          title={t("categoryProducts.delete")}
          className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default CategoryProducts;
