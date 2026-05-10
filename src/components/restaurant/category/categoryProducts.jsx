// "Ürünleri Yönet" modal — restructured into a two-column picker:
//   • LEFT  — every product in the restaurant that is NOT currently in
//             this category. Clicking "Ekle" assigns that product to
//             this category.
//   • RIGHT — products that ARE in this category. Drag-drop reorder is
//             supported here, plus inline edit / delete.
// A single search box at the top filters BOTH columns by product name
// (Turkish-aware diacritic folding so "ızgara" matches "izgara", etc.).
//
// Backend contract caveat: the current `editProduct` endpoint only takes
// a single `categoryId`, so "Ekle" is technically a *move* — it sets the
// product's categoryId to this one, removing it from wherever it
// previously lived. The two-column UI works the same way regardless;
// when the backend grows a true many-to-many endpoint the only change
// needed will be inside `handleAddToCategory` (swap the editProduct
// dispatch for an "AddProductToCategory" one).
//
// Mounted via PopupContext.setPopupContent (single-popup slot) — the
// nested EditProduct / DeleteProduct popups go through
// setSecondPopupContent so they stack on top.

import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Package,
  X,
  Pencil,
  Save,
  GripVertical,
  Loader2,
  Search,
  Plus,
  PackagePlus,
  PackageCheck,
  Inbox,
  Unlink,
} from "lucide-react";

import EditProduct from "../products/editProduct";
import { usePopup } from "../../../context/PopupContext";

import {
  getProductsByCategoryId,
  resetGetProductsByCategoryIdState,
} from "../../../redux/products/getProductsByCategoryIdSlice";
import {
  editProduct,
  resetEditProduct,
} from "../../../redux/products/editProductSlice";
import { getProductsLite } from "../../../redux/products/getProductsLiteSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Turkish-aware diacritic folding for client-side search. Mirror of the
// helper in products.jsx — "kavurma" matches "Kâvurma", "ızgara" matches
// "izgara". Keeps menu-search results predictable for native users.
const TR_FOLD = {
  ı: "i", İ: "i", i: "i", I: "i",
  ş: "s", Ş: "s",
  ğ: "g", Ğ: "g",
  ç: "c", Ç: "c",
  ü: "u", Ü: "u",
  ö: "o", Ö: "o",
};
const normalizeSearch = (s) => {
  if (!s) return "";
  let out = "";
  for (const ch of String(s)) out += TR_FOLD[ch] ?? ch.toLowerCase();
  return out.normalize("NFD").replace(/\p{M}+/gu, "");
};

const sortBySortOrder = (list) =>
  [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

const CategoryProducts = ({
  categoryId,
  categoryName,
  restaurantId,
  onClose,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setSecondPopupContent } = usePopup();

  const { products, success, error } = useSelector(
    (s) => s.products.getByCategoryId,
  );
  const {
    products: liteProducts,
    fetchedFor: liteFetchedFor,
  } = useSelector((s) => s.products.getLite);

  // Local state for the category-side list — initialised from the slice
  // and mutated locally so optimistic add / drag-reorder feel snappy
  // without round-tripping the network for every action.
  const [items, setItems] = useState(null);
  const [itemsBefore, setItemsBefore] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Local copy of the lite list so optimistic "remove from left after
  // add" works without re-fetching the entire catalogue. Synced from
  // Redux when the slice payload arrives.
  const [liteLocal, setLiteLocal] = useState(null);
  // Single id-tracker for either an add-to-category or remove-from-
  // category operation. Both flows dispatch the same `editProduct`
  // thunk and have to settle one at a time so the optimistic state
  // doesn't get clobbered by overlapping rollbacks.
  const [mutatingId, setMutatingId] = useState(null);

  // Single search box, filters both columns.
  const [searchVal, setSearchVal] = useState("");

  // The popup wrapper applies `transform: scale(1)` and `backdrop-
  // filter: blur(...)` — both create a new containing block for
  // `position: fixed`, which traps rfd's drag clone and offsets it
  // from the cursor. Neutralize those properties on every ancestor
  // while the modal is mounted, restore on close.
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

  // Initial fetches — products in this category + lite catalogue for
  // the available picker. Both guarded so a re-render doesn't redispatch.
  useEffect(() => {
    if (!items) {
      dispatch(getProductsByCategoryId({ categoryId }));
    }
  }, [items, categoryId, dispatch]);

  useEffect(() => {
    // Lite slice has its own `fetchedFor` cache; re-fetch when it's
    // either empty or scoped to a different restaurant. The slice also
    // self-invalidates on Products/EditProduct/fulfilled, so a successful
    // add will trigger a refetch on the next mount cycle.
    if (
      restaurantId &&
      (!liteProducts || liteFetchedFor !== restaurantId)
    ) {
      dispatch(getProductsLite({ restaurantId }));
    }
  }, [restaurantId, liteProducts, liteFetchedFor, dispatch]);

  // Sync slice → local for the right column.
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

  // Sync slice → local for the lite catalogue.
  useEffect(() => {
    if (liteProducts) setLiteLocal(liteProducts);
  }, [liteProducts]);

  // Derived: products NOT yet in this category (left column source).
  // Excludes anything already shown on the right so nothing appears in
  // both columns even mid-flight while a refetch is settling.
  const availableProducts = useMemo(() => {
    if (!liteLocal) return null;
    if (!items) return liteLocal;
    const inHere = new Set(items.map((p) => p.id));
    return liteLocal.filter((p) => !inHere.has(p.id));
  }, [liteLocal, items]);

  // Search applies to both columns — same query, independently filtered.
  const q = normalizeSearch(searchVal.trim());
  const filteredItems = useMemo(() => {
    if (!items) return null;
    if (!q) return items;
    return items.filter((p) => normalizeSearch(p.name).includes(q));
  }, [items, q]);
  const filteredAvailable = useMemo(() => {
    if (!availableProducts) return null;
    if (!q) return availableProducts;
    return availableProducts.filter((p) => normalizeSearch(p.name).includes(q));
  }, [availableProducts, q]);

  const handleEditProduct = (product) =>
    setSecondPopupContent(<EditProduct product={product} />);

  // Build the bare-minimum FormData payload editProduct expects. We carry
  // the existing values through so the backend doesn't blank them.
  const buildEditPayload = (p, overrides = {}) => {
    const fd = new FormData();
    fd.append("id", p.id);
    if (p.restaurantId || restaurantId)
      fd.append("restaurantId", p.restaurantId || restaurantId);
    fd.append("categoryId", overrides.categoryId ?? p.categoryId ?? "");
    if (p.subCategoryId !== undefined)
      fd.append("subCategoryId", p.subCategoryId ?? "");
    fd.append("name", p.name ?? "");
    fd.append("description", p.description ?? "");
    fd.append("recommendation", String(p.recommendation ?? false));
    fd.append("hide", String(p.hide ?? false));
    fd.append("freeTagging", String(p.freeTagging ?? false));
    fd.append(
      "sortOrder",
      String(overrides.sortOrder ?? p.sortOrder ?? 0),
    );
    if (Array.isArray(p.portions)) {
      fd.append("portions", JSON.stringify(p.portions));
    }
    if (p.image && typeof p.image === "string") {
      fd.append("imageUrl", p.image);
    }
    return fd;
  };

  // Add (=move) a left-column product into this category. Optimistic UI:
  // immediately moves it across so the user gets feedback before the
  // network round-trip completes. Rolls back on failure.
  const handleAddToCategory = async (prod) => {
    if (mutatingId) return; // serialise — keeps the optimistic state simple
    setMutatingId(prod.id);

    // Snapshot for rollback.
    const prevItems = items ?? [];
    const prevLite = liteLocal ?? [];

    const newSortOrder = prevItems.length;
    const moved = {
      ...prod,
      categoryId,
      sortOrder: newSortOrder,
    };

    setItems([...prevItems, moved]);
    setItemsBefore((prev) => [...(prev ?? []), moved]);
    setLiteLocal(prevLite.filter((p) => p.id !== prod.id));

    try {
      const action = await dispatch(
        editProduct(
          buildEditPayload(prod, {
            categoryId,
            sortOrder: newSortOrder,
          }),
        ),
      );
      if (action?.error) throw action.payload || action.error;
      toast.success(
        t("categoryProducts.add_success", {
          name: prod.name,
          defaultValue: "{{name}} bu kategoriye eklendi.",
        }),
        { id: "catProdAdd" },
      );
    } catch (err) {
      // Rollback to pre-add snapshots.
      setItems(prevItems);
      setItemsBefore(prevItems);
      setLiteLocal(prevLite);
      const msg =
        err?.message_TR || err?.message || t("categoryProducts.add_failed");
      toast.error(msg, { id: "catProdAdd" });
    } finally {
      dispatch(resetEditProduct());
      setMutatingId(null);
    }
  };

  // Remove a right-column product from THIS category (it is NOT deleted —
  // actual delete still lives on the Products page). Mirrors handle-
  // AddToCategory in reverse: optimistically pull the row back to the
  // left list, dispatch editProduct with an empty categoryId, roll
  // back on failure. Backend must accept an empty categoryId for the
  // un-categorise to stick; if it rejects with a validation error the
  // row snaps back and the toast surfaces the message.
  const handleRemoveFromCategory = async (prod) => {
    if (mutatingId) return;
    setMutatingId(prod.id);

    const prevItems = items ?? [];
    const prevItemsBefore = itemsBefore ?? [];
    const prevLite = liteLocal ?? [];

    // Optimistic local move: drop from items, push back to lite.
    setItems(prevItems.filter((p) => p.id !== prod.id));
    setItemsBefore(prevItemsBefore.filter((p) => p.id !== prod.id));
    setLiteLocal([
      ...prevLite,
      { ...prod, categoryId: "" },
    ]);

    try {
      const action = await dispatch(
        editProduct(
          buildEditPayload(prod, {
            categoryId: "",
            // sortOrder reset so the product doesn't carry its old
            // position into a future re-categorisation.
            sortOrder: 0,
          }),
        ),
      );
      if (action?.error) throw action.payload || action.error;
      toast.success(
        t("categoryProducts.remove_success", {
          name: prod.name,
          defaultValue: "{{name}} bu kategoriden çıkarıldı.",
        }),
        { id: "catProdRemove" },
      );
    } catch (err) {
      // Rollback on backend reject.
      setItems(prevItems);
      setItemsBefore(prevItemsBefore);
      setLiteLocal(prevLite);
      const msg =
        err?.message_TR ||
        err?.message ||
        t("categoryProducts.remove_failed");
      toast.error(msg, { id: "catProdRemove" });
    } finally {
      dispatch(resetEditProduct());
      setMutatingId(null);
    }
  };

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

  const saveOrder = async () => {
    if (!orderDirty) {
      toast.error(t("categoryProducts.no_changes"), { id: "prodOrder" });
      return;
    }
    setSavingOrder(true);
    toast.loading(t("categoryProducts.saving_order"), { id: "prodOrder" });

    const beforeMap = new Map(itemsBefore.map((p) => [p.id, p.sortOrder ?? 0]));
    const moved = items.filter(
      (p) => beforeMap.get(p.id) !== (p.sortOrder ?? 0),
    );

    try {
      // Sequential to keep error reporting simple and to be friendly to the API.
      for (const p of moved) {
        const action = await dispatch(
          editProduct(buildEditPayload(p, { sortOrder: p.sortOrder ?? 0 })),
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
      className="w-full max-w-5xl mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88dvh]"
    >
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* HEADER */}
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

      {/* SEARCH BAR — filters both columns at once */}
      <div className="px-3 sm:px-4 py-3 border-b border-[--border-1] bg-[--white-2]/30 shrink-0">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-2]">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder={t(
              "categoryProducts.search_placeholder",
              "Her iki sütunda da ürün ara...",
            )}
            className="block w-full pl-9 pr-9 h-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => setSearchVal("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[--gr-2] hover:text-[--gr-1]"
              aria-label={t("categoryProducts.clear_search", "Aramayı temizle")}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* TWO-COLUMN BODY — single column on mobile, side-by-side on lg */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-[--border-1] bg-[--white-1] overflow-hidden">
        {/* LEFT — products NOT in this category */}
        <ColumnPane
          icon={PackagePlus}
          title={t(
            "categoryProducts.available_title",
            "Bu Kategoride Olmayan Ürünler",
          )}
          count={filteredAvailable?.length}
          totalCount={availableProducts?.length}
          loading={!liteLocal}
          accent="slate"
        >
          {!liteLocal ? (
            <ColumnLoader />
          ) : filteredAvailable && filteredAvailable.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={
                q
                  ? t("categoryProducts.no_results", "Aramayla eşleşen ürün yok")
                  : t(
                      "categoryProducts.no_available",
                      "Bu restoranda ekleyebileceğin başka ürün yok",
                    )
              }
            />
          ) : (
            <div className="flex flex-col gap-2 p-3">
              {filteredAvailable.map((prod) => (
                <AvailableRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  onAdd={handleAddToCategory}
                  adding={mutatingId === prod.id}
                  disabled={!!mutatingId && mutatingId !== prod.id}
                />
              ))}
            </div>
          )}
        </ColumnPane>

        {/* RIGHT — products IN this category, drag-reorderable */}
        <ColumnPane
          icon={PackageCheck}
          title={t(
            "categoryProducts.in_category_title",
            "Bu Kategorideki Ürünler",
          )}
          count={filteredItems?.length}
          totalCount={items?.length}
          loading={!items}
          accent="indigo"
        >
          {!items ? (
            <ColumnLoader />
          ) : filteredItems && filteredItems.length === 0 ? (
            <EmptyState
              icon={Package}
              title={
                q
                  ? t("categoryProducts.no_results", "Aramayla eşleşen ürün yok")
                  : t("categoryProducts.no_products")
              }
            />
          ) : q ? (
            // While searching we render a static (non-dnd) list — reordering
            // a filtered view doesn't make sense and rfd indices would lie.
            <div className="flex flex-col gap-2 p-3">
              {filteredItems.map((prod) => (
                <InCategoryRow
                  key={prod.id}
                  prod={prod}
                  t={t}
                  onEdit={handleEditProduct}
                  onRemove={handleRemoveFromCategory}
                  removing={mutatingId === prod.id}
                  disabled={!!mutatingId && mutatingId !== prod.id}
                  draggable={false}
                />
              ))}
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categoryProducts">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-2 p-3 transition-colors ${
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
                          <InCategoryRow
                            prod={prod}
                            t={t}
                            provided={provided}
                            isDragging={snapshot.isDragging}
                            onEdit={handleEditProduct}
                            onRemove={handleRemoveFromCategory}
                            removing={mutatingId === prod.id}
                            disabled={
                              !!mutatingId && mutatingId !== prod.id
                            }
                            draggable
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
        </ColumnPane>
      </div>

      {/* FOOTER — Save Order shows only when right-column dirty */}
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

// One column wrapper — header strip + scrollable body.
const ColumnPane = ({
  icon: Icon,
  title,
  count,
  totalCount,
  loading,
  accent = "slate",
  children,
}) => {
  const accentMap = {
    slate: "bg-[--white-2] text-[--gr-1] ring-[--border-1]",
    indigo:
      "bg-indigo-50 text-indigo-700 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30",
  };
  const showCount =
    typeof count === "number" &&
    typeof totalCount === "number" &&
    count !== totalCount
      ? `${count} / ${totalCount}`
      : typeof totalCount === "number"
        ? `${totalCount}`
        : null;
  return (
    <div className="flex flex-col min-h-0 max-h-[60dvh] lg:max-h-none overflow-hidden">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-[--border-1] bg-[--white-2]/40 shrink-0">
        <span
          className={`grid place-items-center size-7 rounded-md ring-1 shrink-0 ${accentMap[accent]}`}
        >
          <Icon className="size-3.5" />
        </span>
        <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[--gr-1] truncate flex-1 min-w-0">
          {title}
        </h4>
        {showCount && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] bg-[--white-1] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
            {showCount}
          </span>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
};

const ColumnLoader = () => (
  <div className="grid place-items-center py-10 text-[--gr-2]">
    <Loader2 className="size-5 animate-spin" />
  </div>
);

const EmptyState = ({ icon: Icon, title }) => (
  <div className="p-3 sm:p-4">
    <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-6 grid place-items-center text-center">
      <span className="grid place-items-center size-10 rounded-xl bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] mb-2">
        <Icon className="size-5" />
      </span>
      <p className="text-xs text-[--gr-1]">{title}</p>
    </div>
  </div>
);

// Left-column row — name + portions count + Add button.
const AvailableRow = ({ prod, t, onAdd, adding, disabled }) => {
  const portionsCount = Array.isArray(prod.portions) ? prod.portions.length : 0;
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
        adding
          ? "border-indigo-300 ring-2 ring-indigo-100"
          : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span className="grid place-items-center size-9 rounded-lg bg-[--white-2] text-[--gr-1] shrink-0 ring-1 ring-[--border-1]">
        <Package className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[--black-1] truncate">
          {prod.name}
        </div>
        <div className="text-[11px] text-[--gr-1] mt-0.5">
          {t("categoryProducts.portions", { count: portionsCount })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAdd(prod)}
        disabled={adding || disabled}
        title={t("categoryProducts.add", "Ekle")}
        className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25 shrink-0"
      >
        {adding ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Plus className="size-3.5" strokeWidth={2.5} />
        )}
        <span className="hidden sm:inline">
          {t("categoryProducts.add", "Ekle")}
        </span>
      </button>
    </div>
  );
};

// Right-column row — drag handle (when draggable) + name + edit +
// "remove from this category" (NOT delete — actual delete only lives
// on the Products page, per UX spec). Without renderClone, rfd uses
// this very element for the drag avatar.
const InCategoryRow = ({
  prod,
  t,
  provided,
  isDragging,
  onEdit,
  onRemove,
  removing,
  disabled,
  draggable,
}) => {
  const portionsCount = Array.isArray(prod.portions) ? prod.portions.length : 0;
  const wrapperProps = draggable
    ? { ref: provided.innerRef, ...provided.draggableProps }
    : {};
  return (
    <div
      {...wrapperProps}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl border bg-[--white-1] transition ${
        isDragging
          ? "border-indigo-400 ring-2 ring-indigo-200 shadow-xl"
          : removing
            ? "border-amber-300 ring-2 ring-amber-100"
            : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {draggable && (
        <button
          type="button"
          {...provided.dragHandleProps}
          aria-label={t("categoryProducts.drag_to_reorder")}
          className="grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
        >
          <GripVertical className="size-4" />
        </button>
      )}
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
        {/* "Remove from this category" — non-destructive (the product
            stays in the system; only the category link is broken).
            Amber tone signals "warning, but recoverable" — distinct
            from the rose destructive Trash on the Products page. The
            unlink icon is the visual cue for "break association". */}
        <button
          type="button"
          onClick={() => onRemove(prod)}
          disabled={removing || disabled}
          title={t(
            "categoryProducts.remove_from_category",
            "Bu kategoriden çıkart",
          )}
          className="grid place-items-center size-8 rounded-md text-amber-700 hover:bg-amber-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:text-amber-300 dark:hover:bg-amber-500/15"
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Unlink className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default CategoryProducts;
