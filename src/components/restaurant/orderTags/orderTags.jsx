// MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Tags, Plus, Save, Loader2 } from "lucide-react";

// COMP
import DeleteOrderTag from "./deleteOrderTag";
import PageHelp from "../../common/pageHelp";
import { usePopup } from "../../../context/PopupContext";
import { NewOrderTagGroup } from "./components/constraints";
import OrderTagGroupCard from "./components/_orderTagGroupCard";

// REDUX
import { addOrderTag } from "../../../redux/orderTags/addOrderTagSlice";
import {
  getOrderTags,
  resetGetOrderTags,
} from "../../../redux/orderTags/getOrderTagsSlice";
import { editOrderTags } from "../../../redux/orderTags/editOrderTagsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { resetEditOrderTags } from "../../../redux/orderTags/editOrderTagsSlice";
import { getProductsLite } from "../../../redux/products/getProductsLiteSlice";

// UTILS
import { parsePrice } from "../../../utils/utils";

// Items hold price as a raw string during editing — convert to Number at
// the dispatch boundary. Mirrors _orderTagGroupCard's per-group save.
const normalizeGroupsForSave = (groups) =>
  (groups || []).map((g) => ({
    ...g,
    items: (g.items || []).map((it) => ({
      ...it,
      price: parsePrice(it.price),
    })),
  }));

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const OrderTags = ({ data: restaurant }) => {
  const params = useParams();
  const restaurantId = params.id;
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  // Mirrors the priceList / settings convention: read the restaurant's
  // configured "Kuruş Hanesi" (decimalPoint) so the OptionRow price
  // input formats / validates with the right precision instead of
  // always defaulting to 2.
  const decimals = Number.isFinite(Number(restaurant?.decimalPoint))
    ? Number(restaurant.decimalPoint)
    : 2;

  const { orderTags, fetchedFor: tagsFetchedFor } = useSelector(
    (s) => s.orderTags.get,
  );
  const { categories, fetchedFor: catFetchedFor } = useSelector(
    (s) => s.categories.get,
  );
  // Lite product list — backed by Products/GetProductsByRestaurantIdLite.
  // Replaced the previous module-level Map + fan-out paginator now that
  // the backend ships a single-shot endpoint with the dropdown shape we
  // actually consume. See getProductsLiteSlice.js for the cache contract.
  const { products: liteProducts, fetchedFor: liteFetchedFor } = useSelector(
    (s) => s.products.getLite,
  );
  const { success, error, loading } = useSelector((s) => s.orderTags.editAll);

  const [state, setState] = useState({
    categories: [],
    products: [],
    tagGroups: [],
  });

  const dirtyCount = state?.tagGroups?.filter((g) => g.isDirty).length || 0;

  const handleUpdateGroup = (groupId, updates) => {
    setState((prev) => ({
      ...prev,
      tagGroups: prev.tagGroups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g,
      ),
    }));
  };

  const handleDeleteGroup = (group) => {
    setPopupContent(
      <DeleteOrderTag
        group={group}
        onDelete={() => {
          setState((prev) => ({
            ...prev,
            tagGroups: prev.tagGroups.filter((g) => g.id !== group.id),
          }));
          // Invalidate the cache so the next visit sees a fresh list from
          // the backend instead of one with the deleted group still in it.
          dispatch(resetGetOrderTags());
        }}
      />,
    );
  };

  const handleAddGroup = () => {
    const hasUnsavedNew = state.tagGroups.some((g) => g.isNew);
    if (hasUnsavedNew) {
      toast.error(t("orderTags.validation_unsaved"));
      return;
    }
    setState((prev) => ({
      ...prev,
      tagGroups: [
        ...prev.tagGroups,
        { ...NewOrderTagGroup(), sortOrder: prev.tagGroups.length - 1 },
      ],
    }));
    setTimeout(
      () =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        }),
      100,
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(state.tagGroups);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
      isDirty: true,
    }));
    setState((prev) => ({ ...prev, tagGroups: updatedItems }));
  };

  const handleSaveAll = () => {
    const invalidGroups = state.tagGroups.filter(
      (g) => !g.name.trim() || g.items.length === 0,
    );
    if (invalidGroups.length > 0) {
      toast.error(t("orderTags.validation_invalid"));
      return;
    }
    const dataToBeAdded = state.tagGroups.filter((g) => g.isNew);
    const dataToBeEdited = state.tagGroups.filter(
      (g) => !g.isNew && g.isDirty,
    );
    if (dataToBeEdited.length > 0) {
      dispatch(
        editOrderTags({
          data: normalizeGroupsForSave(dataToBeEdited),
          restaurantId,
        }),
      );
    }
    if (dataToBeAdded.length > 0) {
      dispatch(
        addOrderTag({
          data: normalizeGroupsForSave(dataToBeAdded),
          restaurantId,
        }),
      );
    }
  };

  // GET data — three parallel slice-cached fetches. Each guards on
  // its own `fetchedFor === restaurantId` check so revisits within
  // the same restaurant skip the network entirely. All three hit the
  // global loadingMiddleware, so cache hits also collapse the global
  // spinner.
  //
  // Dep list intentionally includes the slices' `xxxFetchedFor` keys
  // (and `orderTags` itself for the post-mutation invalidation case):
  // the cross-domain matchers in `getOrderTagsSlice` /
  // `getProductsLiteSlice` / `getCategoriesSlice` clear those caches
  // to null after Add/Edit/Delete fulfills, and without re-running
  // this effect the page would render stale data until a hard reload.
  // The per-line guards keep this loop-safe — once a fresh payload
  // lands, the matching condition flips false and dispatch is
  // skipped on the next tick.
  useEffect(() => {
    if (!restaurantId) return;
    if (!categories || catFetchedFor !== restaurantId) {
      dispatch(getCategories({ restaurantId }));
    }
    if (!liteProducts || liteFetchedFor !== restaurantId) {
      dispatch(getProductsLite({ restaurantId }));
    }
    if (!orderTags || tagsFetchedFor !== restaurantId) {
      dispatch(getOrderTags({ restaurantId }));
    }
  }, [
    restaurantId,
    categories,
    catFetchedFor,
    liteProducts,
    liteFetchedFor,
    orderTags,
    tagsFetchedFor,
    dispatch,
  ]);

  useEffect(() => {
    if (categories) setState((prev) => ({ ...prev, categories }));
    // Wrap the flat lite array in `{ data }` so OrderTagGroupCard's
    // `products?.data` access pattern keeps working unchanged.
    if (liteProducts)
      setState((prev) => ({ ...prev, products: { data: liteProducts } }));
    if (orderTags) setState((prev) => ({ ...prev, tagGroups: orderTags }));
  }, [categories, liteProducts, orderTags]);

  useEffect(() => {
    if (success) {
      toast.success(t("orderTags.saved_success"), { id: "save-order-tags" });
      dispatch(resetEditOrderTags());
      setState((prev) => ({
        ...prev,
        tagGroups: prev.tagGroups.map((g) => ({
          ...g,
          isDirty: false,
          isNew: false,
        })),
      }));
      // Drop the stale slice cache. New groups still hold local temp ids
      // (e.g. "New-1714…") here; only the backend has the real ids, so the
      // next visit must refetch instead of trusting the cache.
      dispatch(resetGetOrderTags());
    }
    if (error) dispatch(resetEditOrderTags());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  const totalCount = state.tagGroups?.length || 0;

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
            <Tags className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("orderTags.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {totalCount > 0
                ? dirtyCount > 0
                  ? t("orderTags.summary", {
                      count: totalCount,
                      dirty: dirtyCount,
                    })
                  : t("orderTags.summary_clean", { count: totalCount })
                : t("orderTags.subtitle")}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <PageHelp pageKey="orderTags" />
            {dirtyCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-rose-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-60 bg-gradient-to-r from-rose-500 to-rose-600"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {t("orderTags.save_all")}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAddGroup}
              disabled={state?.tagGroups?.some((g) => g.isNew)}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">
                {t("orderTags.add_group")}
              </span>
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          {state.tagGroups?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <Tags className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("orderTags.no_groups")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1 max-w-sm">
                {t("orderTags.no_groups_info")}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tag-groups">
                {(provided) => (
                  <div
                    className="flex flex-col gap-3"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {state.tagGroups?.map((group, index) => (
                      <Draggable
                        key={group.id}
                        draggableId={group.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <OrderTagGroupCard
                              group={group}
                              products={state.products}
                              categories={state.categories}
                              restaurantId={restaurantId}
                              decimals={decimals}
                              onUpdate={(u) => handleUpdateGroup(group.id, u)}
                              onDelete={() => handleDeleteGroup(group)}
                              onCancelNew={() =>
                                setState((prev) => ({
                                  ...prev,
                                  tagGroups: prev.tagGroups.filter(
                                    (g) => g.id !== group.id,
                                  ),
                                }))
                              }
                              dragHandleProps={provided.dragHandleProps}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTags;
