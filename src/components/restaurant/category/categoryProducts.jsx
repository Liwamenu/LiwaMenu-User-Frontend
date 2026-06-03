// "Ürünleri Yönet" modal — restructured into a two-column picker:
//   • LEFT  — every product in the restaurant that is NOT currently in
//             this category. Clicking "Ekle" links that product to
//             this category WITHOUT touching its other category
//             memberships (true many-to-many).
//   • RIGHT — products that ARE in this category. Drag-drop reorder is
//             supported here, plus inline edit / "move to another
//             category" (= add to target + remove from this).
// A single search box at the top filters BOTH columns by product name
// (Turkish-aware diacritic folding so "ızgara" matches "izgara", etc.).
//
// Endpoint wiring (post many-to-many migration):
//   • "Ekle"            → POST   /Products/{id}/Categories
//   • "Bu kategoriden çıkar" via the move picker
//                          → POST /Products/{id}/Categories (target)
//                          + DELETE /Products/{id}/Categories/{this}
//   • "Sıralamayı Kaydet" → PUT  /Categories/{id}/ProductOrder
// All three were previously overloaded onto editProduct as single-cat
// moves. The new flow respects the per-junction model — a product can
// live in multiple categories with a distinct sortOrder per row.
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
  ArrowRight,
  PackagePlus,
  PackageCheck,
  Inbox,
  ArrowRightLeft,
  Check,
  CheckCheck,
  AlertTriangle,
  Layers,
  FolderPlus,
} from "lucide-react";

import EditProduct from "../products/editProduct";
import { usePopup } from "../../../context/PopupContext";

import {
  getProductsByCategoryId,
  resetGetProductsByCategoryIdState,
} from "../../../redux/products/getProductsByCategoryIdSlice";
import { getProductsLite } from "../../../redux/products/getProductsLiteSlice";
import {
  addProductToCategory,
  resetAddProductToCategory,
} from "../../../redux/products/addProductToCategorySlice";
import {
  removeProductFromCategory,
  resetRemoveProductFromCategory,
} from "../../../redux/products/removeProductFromCategorySlice";
import {
  reorderCategoryProducts,
  resetReorderCategoryProducts,
} from "../../../redux/categories/reorderCategoryProductsSlice";
import {
  addCategory,
  resetAddCategory,
} from "../../../redux/categories/addCategorySlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { getMenus } from "../../../redux/menus/getMenusSlice";

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
  // Categories list — needed by the move-to-category picker so we can
  // offer the user a destination category (backend rejects empty
  // categoryId, so a product can NEVER be uncategorised; "remove from
  // this category" is therefore really "move to another category"). The
  // parent page already populates this slice on mount.
  const { categories } = useSelector((s) => s.categories.get);
  // Menus — used only to decide a sensible default menu assignment when
  // the user creates a brand-new destination category inline (mirrors
  // AddCategory: auto-attach the single menu so the new category isn't
  // born hidden; with 0 or 2+ menus we leave it for the user to assign
  // via "Kategori Düzenle", and warn in the create UI).
  const { menus, fetchedFor: menusFetchedFor } = useSelector(
    (s) => s.menus.get,
  );

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

  // Multi-select state — one Set per column (the operations differ:
  // LEFT = bulk-add to this category, RIGHT = bulk-move to another).
  // `bulkBusy` gates a whole batch the way `mutatingId` gates a single
  // row; while a batch is in flight every per-row + bulk action is
  // disabled so optimistic state can't be clobbered by overlapping work.
  const [selectedAvailable, setSelectedAvailable] = useState(() => new Set());
  const [selectedInCategory, setSelectedInCategory] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const toggleAvailable = (id) =>
    setSelectedAvailable((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleInCategory = (id) =>
    setSelectedInCategory((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearAvailableSelection = () => setSelectedAvailable(new Set());
  const clearInCategorySelection = () => setSelectedInCategory(new Set());

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

  // Menus for the inline "create new category" default assignment.
  // Cached by `fetchedFor`, so this is a no-op when the menus slice is
  // already warm from another page.
  useEffect(() => {
    if (restaurantId && (!menus || menusFetchedFor !== restaurantId)) {
      dispatch(getMenus({ restaurantId, __silent: true }));
    }
  }, [restaurantId, menus, menusFetchedFor, dispatch]);

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
  // Sorted alphabetically (Turkish-aware) so the picker stays
  // predictable as the user scrolls — no shuffling after each add.
  const availableProducts = useMemo(() => {
    if (!liteLocal) return null;
    const inHere = new Set((items || []).map((p) => p.id));
    return liteLocal
      .filter((p) => !inHere.has(p.id))
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", "tr", {
          sensitivity: "base",
        }),
      );
  }, [liteLocal, items]);

  // Lookup table for resolving a product's `categoryId` to a display
  // name in the AvailableRow chip ("currently in: …"). The categories
  // list is loaded by the parent page on mount so we don't need a
  // separate fetch here. Falls through to an empty string when the id
  // doesn't match (e.g. a product cached before its category was
  // deleted).
  const categoryNameById = useMemo(() => {
    const map = new Map();
    (categories || []).forEach((c) => {
      if (c?.id) map.set(c.id, c.name || "");
    });
    return map;
  }, [categories]);

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

  // Keep each column's selection valid: drop ids that left the column
  // (added/moved/removed by a single OR bulk op) so a stale id never
  // lingers in the Set and inflates the "N selected" count or targets a
  // product that's no longer there.
  useEffect(() => {
    if (!availableProducts) return;
    const live = new Set(availableProducts.map((p) => p.id));
    setSelectedAvailable((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => (live.has(id) ? next.add(id) : (changed = true)));
      return changed ? next : prev;
    });
  }, [availableProducts]);
  useEffect(() => {
    if (!items) return;
    const live = new Set(items.map((p) => p.id));
    setSelectedInCategory((prev) => {
      let changed = false;
      const next = new Set();
      prev.forEach((id) => (live.has(id) ? next.add(id) : (changed = true)));
      return changed ? next : prev;
    });
  }, [items]);

  // The actual product objects a bulk op will act on — selection can
  // hold ids hidden by the current search (selected under a previous
  // query), so resolve against the FULL column list, not the filtered
  // view, and act on everything still selected.
  const selectedAvailableProducts = useMemo(
    () => (availableProducts || []).filter((p) => selectedAvailable.has(p.id)),
    [availableProducts, selectedAvailable],
  );
  const selectedInCategoryProducts = useMemo(
    () => (items || []).filter((p) => selectedInCategory.has(p.id)),
    [items, selectedInCategory],
  );

  // "Select all" acts on the VISIBLE (filtered) rows only — second click
  // clears them. Other selected-but-hidden ids are left untouched.
  const allAvailableVisibleSelected =
    !!filteredAvailable &&
    filteredAvailable.length > 0 &&
    filteredAvailable.every((p) => selectedAvailable.has(p.id));
  const allInCategoryVisibleSelected =
    !!filteredItems &&
    filteredItems.length > 0 &&
    filteredItems.every((p) => selectedInCategory.has(p.id));

  const toggleSelectAllAvailable = () => {
    const visible = filteredAvailable || [];
    setSelectedAvailable((prev) => {
      const next = new Set(prev);
      const allSel = visible.length > 0 && visible.every((p) => next.has(p.id));
      if (allSel) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  };
  const toggleSelectAllInCategory = () => {
    const visible = filteredItems || [];
    setSelectedInCategory((prev) => {
      const next = new Set(prev);
      const allSel = visible.length > 0 && visible.every((p) => next.has(p.id));
      if (allSel) visible.forEach((p) => next.delete(p.id));
      else visible.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const handleEditProduct = (product) =>
    setSecondPopupContent(<EditProduct product={product} />);

  // Link a left-column product to this category via the new
  // many-to-many junction endpoint. The product stays in its other
  // categories — this is genuinely an ADD, not a move. Optimistic
  // UI: immediately slot it into the right column with the next
  // sortOrder so the user gets feedback before the round-trip
  // completes. Rolls back on failure.
  //
  // `subCategoryId` is carried through if the product already had a
  // subcategory assigned (the alias from normalizeProduct lands on
  // `prod.subCategoryId`). The new endpoint validates that the sub
  // belongs to `categoryId` — if it doesn't, we'd 400; today the
  // lite payload only carries one sub, so the carry-through is a
  // best-effort default and the user can refine in EditProduct later.
  const handleAddToCategory = async (prod) => {
    if (mutatingId) return; // serialise — keeps the optimistic state simple
    setMutatingId(prod.id);

    // Snapshot for rollback. The lite list is the source for the
    // left column — removing the row optimistically prevents it
    // from showing in both columns mid-flight.
    const prevItems = items ?? [];
    const prevLite = liteLocal ?? [];

    const newSortOrder = prevItems.length;
    const added = {
      ...prod,
      categoryId,
      sortOrder: newSortOrder,
    };

    setItems([...prevItems, added]);
    setItemsBefore((prev) => [...(prev ?? []), added]);
    setLiteLocal(prevLite.filter((p) => p.id !== prod.id));

    try {
      const action = await dispatch(
        addProductToCategory({
          productId: prod.id,
          categoryId,
          // Carry-through; backend will reject if mismatched.
          subCategoryId: prod.subCategoryId ?? null,
        }),
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
      setItems(prevItems);
      setItemsBefore(prevItems);
      setLiteLocal(prevLite);
      const msg =
        err?.message_TR || err?.message || t("categoryProducts.add_failed");
      toast.error(msg, { id: "catProdAdd" });
    } finally {
      dispatch(resetAddProductToCategory());
      setMutatingId(null);
    }
  };

  // "Bu kategoriden çıkart" → opens a destination-category picker.
  // Backend rejects empty categoryId, so a product can never be
  // truly uncategorised; we therefore frame the action as a MOVE to
  // another category. The picker only lists categories OTHER than
  // the current one, plus an empty-state when there's only one
  // category in the restaurant. Actual product deletion still lives
  // on the Products page (per UX spec).
  const handleRequestMove = (prod) => {
    setSecondPopupContent(
      <MoveToCategoryPopup
        product={prod}
        currentCategoryId={categoryId}
        categories={categories}
        menuCount={(menus || []).length}
        onCreate={handleCreateCategory}
        t={t}
        onCancel={() => setSecondPopupContent(null)}
        onConfirm={(targetCategoryId) => {
          setSecondPopupContent(null);
          executeMoveToCategory(prod, targetCategoryId);
        }}
      />,
    );
  };

  // Move = ADD to target + REMOVE from current. Two sequential
  // dispatches so we respect the many-to-many model. Ordered
  // add-then-remove (not the reverse) so the orphan guard on
  // DELETE never trips — after the add the product is in two
  // categories, so removing from this one leaves it with one.
  //
  // Optimistic UI: drop the row from the right column immediately,
  // inject it into the lite cache with the new categoryId alias so
  // it appears in the left column of OTHER categories if reopened.
  // Rollback on failure of either step (the modal doesn't try to
  // undo a partial add — backend invalidation will reconcile via
  // refetch on the next list view).
  const executeMoveToCategory = async (prod, targetCategoryId) => {
    if (!targetCategoryId || mutatingId) return;
    setMutatingId(prod.id);

    const prevItems = items ?? [];
    const prevItemsBefore = itemsBefore ?? [];
    const prevLite = liteLocal ?? [];

    setItems(prevItems.filter((p) => p.id !== prod.id));
    setItemsBefore(prevItemsBefore.filter((p) => p.id !== prod.id));
    setLiteLocal([
      ...prevLite.filter((p) => p.id !== prod.id),
      { ...prod, categoryId: targetCategoryId },
    ]);

    try {
      // Step 1: add to the destination category.
      const addAction = await dispatch(
        addProductToCategory({
          productId: prod.id,
          categoryId: targetCategoryId,
          // The destination category may have a different subcategory
          // set; we don't carry the old sub forward to avoid the
          // 400 "sub doesn't belong to category" the backend throws.
          subCategoryId: null,
        }),
      );
      if (addAction?.error) throw addAction.payload || addAction.error;

      // Step 2: remove from this category. Safe — the product is now
      // in 2 categories, so the orphan guard won't trip.
      const removeAction = await dispatch(
        removeProductFromCategory({
          productId: prod.id,
          categoryId,
        }),
      );
      if (removeAction?.error) throw removeAction.payload || removeAction.error;

      const targetCat = (categories || []).find(
        (c) => c.id === targetCategoryId,
      );
      toast.success(
        t("categoryProducts.move_success", {
          name: prod.name,
          category: targetCat?.name || "",
          defaultValue: "{{name}} {{category}} kategorisine taşındı.",
        }),
        { id: "catProdMove" },
      );
    } catch (err) {
      setItems(prevItems);
      setItemsBefore(prevItemsBefore);
      setLiteLocal(prevLite);
      const msg =
        err?.message_TR ||
        err?.message ||
        t("categoryProducts.move_failed");
      toast.error(msg, { id: "catProdMove" });
    } finally {
      dispatch(resetAddProductToCategory());
      dispatch(resetRemoveProductFromCategory());
      setMutatingId(null);
    }
  };

  // === Bulk: add every selected left-column product to this category ===
  // Same many-to-many ADD as the single-row flow, fanned out. Optimistic:
  // move all selected from the left column to the right in one paint, then
  // fire the dispatches in parallel and reconcile per item — only the
  // FAILED ones roll back to the left, successes stay. Mirrors the
  // single-add's optimistic+rollback contract so a partial failure leaves
  // a coherent UI.
  const handleBulkAdd = async () => {
    if (bulkBusy || mutatingId) return;
    const prods = selectedAvailableProducts;
    if (!prods.length) return;
    setBulkBusy(true);

    const prevItems = items ?? [];
    const prevLite = liteLocal ?? [];
    const baseOrder = prevItems.length;
    const added = prods.map((p, i) => ({
      ...p,
      categoryId,
      sortOrder: baseOrder + i,
    }));
    const addIds = new Set(prods.map((p) => p.id));

    // Optimistic move: append to right, drop from left. Update both
    // `items` and `itemsBefore` so the batch doesn't read as unsaved
    // drag order.
    setItems([...prevItems, ...added]);
    setItemsBefore((prev) => [...(prev ?? []), ...added]);
    setLiteLocal(prevLite.filter((p) => !addIds.has(p.id)));

    const results = await Promise.allSettled(
      prods.map((p) =>
        dispatch(
          addProductToCategory({
            productId: p.id,
            categoryId,
            subCategoryId: p.subCategoryId ?? null,
          }),
        ).then((action) => {
          if (action?.error) throw action.payload || action.error;
          return p.id;
        }),
      ),
    );

    const okIds = new Set(
      results.filter((r) => r.status === "fulfilled").map((r) => r.value),
    );
    const failed = prods.filter((p) => !okIds.has(p.id));
    if (failed.length) {
      const failIds = new Set(failed.map((p) => p.id));
      // Roll back ONLY the failures: pull them back out of the right
      // column and restore them to the left.
      setItems((cur) => (cur ?? []).filter((p) => !failIds.has(p.id)));
      setItemsBefore((cur) => (cur ?? []).filter((p) => !failIds.has(p.id)));
      setLiteLocal((cur) => [...(cur ?? []), ...failed]);
    }

    if (okIds.size > 0) {
      toast.success(
        t("categoryProducts.bulk_add_success", {
          count: okIds.size,
          defaultValue: "{{count}} ürün bu kategoriye eklendi.",
        }),
        { id: "catProdBulkAdd" },
      );
    }
    if (failed.length > 0) {
      toast.error(
        t("categoryProducts.bulk_add_partial", {
          count: failed.length,
          defaultValue: "{{count}} ürün eklenemedi.",
        }),
        { id: "catProdBulkAddErr" },
      );
    }

    dispatch(resetAddProductToCategory());
    setSelectedAvailable(new Set());
    setBulkBusy(false);
  };

  // Open the destination picker for a bulk move, then run it. Reuses the
  // single-move picker (it just needs a target category); the `count`
  // prop swaps its copy to the bulk phrasing.
  const handleBulkMoveRequest = () => {
    if (bulkBusy || mutatingId) return;
    const count = selectedInCategoryProducts.length;
    if (!count) return;
    setSecondPopupContent(
      <MoveToCategoryPopup
        product={null}
        count={count}
        currentCategoryId={categoryId}
        categories={categories}
        menuCount={(menus || []).length}
        onCreate={handleCreateCategory}
        t={t}
        onCancel={() => setSecondPopupContent(null)}
        onConfirm={(targetCategoryId) => {
          setSecondPopupContent(null);
          executeBulkMove(targetCategoryId);
        }}
      />,
    );
  };

  // === Bulk: move every selected right-column product to a target cat ===
  // Per product = ADD to target then REMOVE from this (ordered so the
  // orphan guard never trips — same as the single move). Products run in
  // parallel; each is all-or-nothing. Failures roll back into the right
  // column; the backend reconciles any partial add/remove on next view.
  const executeBulkMove = async (targetCategoryId) => {
    if (!targetCategoryId || bulkBusy || mutatingId) return;
    const prods = selectedInCategoryProducts;
    if (!prods.length) return;
    setBulkBusy(true);

    const prevItems = items ?? [];
    const prevItemsBefore = itemsBefore ?? [];
    const prevLite = liteLocal ?? [];
    const moveIds = new Set(prods.map((p) => p.id));

    // Optimistic: drop all selected from the right column, surface them in
    // the lite cache under the target category (so they'd appear on the
    // left if that category is opened later).
    setItems(prevItems.filter((p) => !moveIds.has(p.id)));
    setItemsBefore(prevItemsBefore.filter((p) => !moveIds.has(p.id)));
    setLiteLocal([
      ...prevLite.filter((p) => !moveIds.has(p.id)),
      ...prods.map((p) => ({ ...p, categoryId: targetCategoryId })),
    ]);

    const results = await Promise.allSettled(
      prods.map(async (p) => {
        const addAction = await dispatch(
          addProductToCategory({
            productId: p.id,
            categoryId: targetCategoryId,
            subCategoryId: null,
          }),
        );
        if (addAction?.error) throw addAction.payload || addAction.error;
        const removeAction = await dispatch(
          removeProductFromCategory({ productId: p.id, categoryId }),
        );
        if (removeAction?.error)
          throw removeAction.payload || removeAction.error;
        return p.id;
      }),
    );

    const okIds = new Set(
      results.filter((r) => r.status === "fulfilled").map((r) => r.value),
    );
    const failed = prods.filter((p) => !okIds.has(p.id));
    if (failed.length) {
      const failIds = new Set(failed.map((p) => p.id));
      setItems((cur) => [...(cur ?? []), ...failed]);
      setItemsBefore((cur) => [...(cur ?? []), ...failed]);
      setLiteLocal((cur) => (cur ?? []).filter((p) => !failIds.has(p.id)));
    }

    if (okIds.size > 0) {
      const targetCat = (categories || []).find(
        (c) => c.id === targetCategoryId,
      );
      toast.success(
        t("categoryProducts.bulk_move_success", {
          count: okIds.size,
          category: targetCat?.name || "",
          defaultValue: "{{count}} ürün {{category}} kategorisine taşındı.",
        }),
        { id: "catProdBulkMove" },
      );
    }
    if (failed.length > 0) {
      toast.error(
        t("categoryProducts.bulk_move_partial", {
          count: failed.length,
          defaultValue: "{{count}} ürün taşınamadı.",
        }),
        { id: "catProdBulkMoveErr" },
      );
    }

    dispatch(resetAddProductToCategory());
    dispatch(resetRemoveProductFromCategory());
    setSelectedInCategory(new Set());
    setBulkBusy(false);
  };

  // Create a brand-new destination category inline (from the move picker)
  // and return its id so the caller can move the selection straight into
  // it. `addCategory`'s response shape isn't relied upon — we resolve the
  // new id robustly by snapshotting the current ids, refetching the list,
  // and taking the fresh row that matches the name. Returns the new id, or
  // null on failure (the picker stays open and we've already toasted).
  const handleCreateCategory = async (rawName) => {
    const name = (rawName || "").trim();
    if (!name) return null;

    const prevIds = new Set((categories || []).map((c) => c.id));
    // Mirror AddCategory: auto-attach the single menu so the new category
    // isn't born hidden; otherwise leave menus for the user to assign.
    const menuIds = (menus || []).length === 1 ? [menus[0].id] : [];

    const fd = new FormData();
    fd.append("restaurantId", restaurantId);
    fd.append(
      "categoriesData",
      JSON.stringify([
        { name, isActive: true, featured: false, campaign: false, menuIds },
      ]),
    );

    try {
      const addAction = await dispatch(addCategory(fd));
      if (addAction?.error) throw addAction.payload || addAction.error;

      // Refetch and diff to find the freshly-created row's id.
      const catAction = await dispatch(getCategories({ restaurantId }));
      const fresh = Array.isArray(catAction.payload) ? catAction.payload : [];
      const nName = normalizeSearch(name);
      const created =
        fresh.find(
          (c) => !prevIds.has(c.id) && normalizeSearch(c.name) === nName,
        ) || fresh.find((c) => !prevIds.has(c.id));
      if (!created?.id) throw new Error("created-id-unresolved");

      toast.success(
        t("categoryProducts.create_success", {
          name,
          defaultValue: "{{name}} kategorisi oluşturuldu.",
        }),
        { id: "catProdCreate" },
      );
      return created.id;
    } catch (err) {
      const msg =
        err?.message_TR ||
        err?.message ||
        t("categoryProducts.create_failed", "Kategori oluşturulamadı.");
      toast.error(msg, { id: "catProdCreate" });
      return null;
    } finally {
      dispatch(resetAddCategory());
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

    // Single bulk dispatch — backend assigns sortOrder = 0, 1, 2, ...
    // for each junction in the order we send. Send the FULL current
    // list (every product in the category, in display order) — partial
    // lists get rejected with 400.
    const productIds = items.map((p) => p.id);

    try {
      const action = await dispatch(
        reorderCategoryProducts({ categoryId, productIds }),
      );
      if (action?.error) throw action.payload || action.error;
      setItemsBefore(items);
      toast.success(t("categoryProducts.order_saved"), { id: "prodOrder" });
    } catch (err) {
      const msg =
        err?.message_TR ||
        err?.message ||
        t("categoryProducts.order_save_failed");
      toast.error(msg, { id: "prodOrder" });
    } finally {
      dispatch(resetReorderCategoryProducts());
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
          toolbar={
            <SelectionBar
              visibleCount={filteredAvailable?.length || 0}
              selectedCount={selectedAvailableProducts.length}
              allVisibleSelected={allAvailableVisibleSelected}
              onToggleAll={toggleSelectAllAvailable}
              onClear={clearAvailableSelection}
              busy={bulkBusy}
              t={t}
              action={
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={bulkBusy || !!mutatingId}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: PRIMARY_GRADIENT }}
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  )}
                  {t("categoryProducts.bulk_add", "Seçilenleri Ekle")} (
                  {selectedAvailableProducts.length})
                </button>
              }
            />
          }
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
                  categoryName={categoryNameById.get(prod.categoryId)}
                  t={t}
                  onAdd={handleAddToCategory}
                  adding={mutatingId === prod.id}
                  disabled={bulkBusy || (!!mutatingId && mutatingId !== prod.id)}
                  selected={selectedAvailable.has(prod.id)}
                  onToggleSelect={toggleAvailable}
                  selectionBusy={bulkBusy}
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
          // Strong indigo chip with the current category name — answers
          // "this column = which category?" at a glance, no menu hop
          // needed. Only the right pane gets the chip; the left column
          // title is generic ("Bu Kategoride Olmayan Ürünler") and
          // doesn't need a name.
          chip={categoryName}
          count={filteredItems?.length}
          totalCount={items?.length}
          loading={!items}
          accent="indigo"
          toolbar={
            <SelectionBar
              visibleCount={filteredItems?.length || 0}
              selectedCount={selectedInCategoryProducts.length}
              allVisibleSelected={allInCategoryVisibleSelected}
              onToggleAll={toggleSelectAllInCategory}
              onClear={clearInCategorySelection}
              busy={bulkBusy}
              t={t}
              action={
                <button
                  type="button"
                  onClick={handleBulkMoveRequest}
                  disabled={bulkBusy || !!mutatingId}
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-white shadow-sm shadow-amber-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
                  }}
                >
                  {bulkBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRightLeft className="size-3.5" />
                  )}
                  {t("categoryProducts.bulk_move", "Seçilenleri Taşı")} (
                  {selectedInCategoryProducts.length})
                </button>
              }
            />
          }
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
                  onRequestMove={handleRequestMove}
                  removing={mutatingId === prod.id}
                  disabled={bulkBusy || (!!mutatingId && mutatingId !== prod.id)}
                  selected={selectedInCategory.has(prod.id)}
                  onToggleSelect={toggleInCategory}
                  selectionBusy={bulkBusy}
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
                            onRequestMove={handleRequestMove}
                            removing={mutatingId === prod.id}
                            disabled={
                              bulkBusy ||
                              (!!mutatingId && mutatingId !== prod.id)
                            }
                            selected={selectedInCategory.has(prod.id)}
                            onToggleSelect={toggleInCategory}
                            selectionBusy={bulkBusy}
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

      {/* FOOTER — Save Order shows only when right-column dirty.
          Product count was previously shown here too but it duplicated
          the badge in the right pane header — dropped to keep the
          footer focused on the only thing that actually changes
          here (the drag-to-reorder hint). */}
      <div className="px-3 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-between gap-3 shrink-0 bg-[--white-1]">
        <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide truncate">
          {orderDirty ? t("categoryProducts.drag_to_reorder") : ""}
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

// One column wrapper — header strip + scrollable body. When `chip` is
// supplied, the header swaps its neutral wash for a tinted indigo
// background and renders a solid indigo badge carrying the chip text
// (currently only used by the right pane to surface the active
// category name; the left pane is generic and skips it).
const ColumnPane = ({
  icon: Icon,
  title,
  chip,
  count,
  totalCount,
  loading,
  accent = "slate",
  toolbar,
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
  // When a chip is present, tint the entire header row with a soft
  // indigo wash so the column reads as "scoped to a specific category"
  // rather than just generic. Falls back to neutral for the left pane.
  const headerBg = chip
    ? "bg-indigo-50/60 dark:bg-indigo-500/10"
    : "bg-[--white-2]/40";
  return (
    <div className="flex flex-col min-h-0 max-h-[60dvh] lg:max-h-none overflow-hidden">
      <div
        className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-[--border-1] shrink-0 ${headerBg}`}
      >
        <span
          className={`grid place-items-center size-7 rounded-md ring-1 shrink-0 ${accentMap[accent]}`}
        >
          <Icon className="size-3.5" />
        </span>
        {/* Generic title shrinks first on narrow widths so the
            (more important) category chip stays readable. */}
        <h4 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[--gr-1] truncate min-w-0 hidden sm:block">
          {title}
        </h4>
        {chip && (
          <span
            className="inline-flex items-center text-[11px] sm:text-xs font-bold tracking-wide px-2 py-1 rounded-md text-white shadow-sm shadow-indigo-500/30 truncate min-w-0 max-w-[60%] sm:max-w-[55%]"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
            title={chip}
          >
            <span className="truncate">{chip}</span>
          </span>
        )}
        <div className="flex-1 min-w-0" />
        {showCount && !loading && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] bg-[--white-1] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md shrink-0 tabular-nums">
            {showCount}
          </span>
        )}
      </div>
      {/* Optional selection strip — non-scrolling, sits between the header
          and the list so the bulk action stays reachable while scrolling. */}
      {!loading && toolbar}
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
};

// Small square checkbox used by the row + select-all controls. Stops
// click propagation so ticking it never also fires a row-body toggle.
const RowCheckbox = ({ checked, onChange, disabled, label }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onChange?.();
    }}
    className={`grid place-items-center size-5 rounded-md border-2 transition shrink-0 ${
      checked
        ? "border-indigo-600 bg-indigo-600 text-white"
        : "border-[--border-1] bg-[--white-1] hover:border-indigo-300"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {checked && <Check className="size-3" strokeWidth={3.5} />}
  </button>
);

// Per-column selection strip: select-all toggle + count, and (once
// anything is picked) a Clear button plus the column's bulk action.
// Renders nothing when the column has no visible rows to select.
const SelectionBar = ({
  visibleCount,
  selectedCount,
  allVisibleSelected,
  onToggleAll,
  onClear,
  action,
  busy,
  t,
}) => {
  if (!visibleCount) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[--border-1] bg-[--white-2]/40 shrink-0">
      <RowCheckbox
        checked={allVisibleSelected}
        onChange={onToggleAll}
        disabled={busy}
        label={t("categoryProducts.select_all", "Tümünü seç")}
      />
      <button
        type="button"
        onClick={onToggleAll}
        disabled={busy}
        className="text-[11px] font-semibold text-[--gr-1] hover:text-[--black-1] transition disabled:opacity-60"
      >
        {selectedCount > 0
          ? t("categoryProducts.selected_count", {
              count: selectedCount,
              defaultValue: "{{count}} seçili",
            })
          : t("categoryProducts.select_all", "Tümünü seç")}
      </button>
      <div className="flex-1 min-w-0" />
      {selectedCount > 0 && (
        <>
          <button
            type="button"
            onClick={onClear}
            disabled={busy}
            className="text-[11px] font-medium text-[--gr-1] hover:text-rose-600 transition disabled:opacity-60"
          >
            {t("categoryProducts.clear_selection", "Temizle")}
          </button>
          {action}
        </>
      )}
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
const AvailableRow = ({
  prod,
  categoryName,
  t,
  onAdd,
  adding,
  disabled,
  selected,
  onToggleSelect,
  selectionBusy,
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-xl border bg-[--white-1] transition ${
        selected
          ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/40 dark:bg-indigo-500/10 dark:border-indigo-400/40"
          : adding
            ? "border-indigo-300 ring-2 ring-indigo-100"
            : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <RowCheckbox
        checked={!!selected}
        onChange={() => onToggleSelect?.(prod.id)}
        disabled={selectionBusy}
        label={t("categoryProducts.select_product", "Ürünü seç")}
      />
      <span className="grid place-items-center size-9 rounded-lg bg-[--white-2] text-[--gr-1] shrink-0 ring-1 ring-[--border-1]">
        <Package className="size-4" />
      </span>
      <div
        className={`min-w-0 flex-1 ${
          onToggleSelect && !selectionBusy ? "cursor-pointer" : ""
        }`}
        onClick={() => !selectionBusy && onToggleSelect?.(prod.id)}
      >
        <div className="text-sm font-semibold text-[--black-1] truncate">
          {prod.name}
        </div>
        {/* Show the product's CURRENT category as a chip — replaces the
            old portion count line. Helps the author see at a glance
            "this product is currently in X" before moving it here, so
            they don't accidentally pull a row out of a category that
            still needs it. Backend uses a single categoryId per
            product; if/when many-to-many ships, swap this for a
            chip-strip rendering each linked category. */}
        <div className="mt-0.5 flex items-center gap-1 min-w-0">
          {categoryName ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md max-w-full dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
              <Layers className="size-2.5 shrink-0" strokeWidth={2.25} />
              <span className="truncate">{categoryName}</span>
            </span>
          ) : (
            <span className="inline-flex items-center text-[10px] font-medium text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md">
              {t("categoryProducts.no_category", "Kategorisiz")}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onAdd(prod)}
        disabled={adding || disabled}
        title={t("categoryProducts.add", "Ekle")}
        className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25 shrink-0"
      >
        {/* Label first, then a right-pointing arrow on the right edge —
            visually reinforces the "send this product across to the
            right column" gesture. The arrow sits AFTER the label so
            the eye reads "Ekle →" naturally. The loading spinner
            replaces the arrow (not the label) so the action stays
            recognisable mid-dispatch. */}
        <span className="hidden sm:inline">
          {t("categoryProducts.add", "Ekle")}
        </span>
        {adding ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ArrowRight className="size-3.5" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
};

// Right-column row — drag handle (when draggable) + name + edit +
// "move to another category". The move button opens a destination-
// picker popup (handleRequestMove) instead of dispatching directly,
// because the backend rejects an empty categoryId — every move needs
// a target. Actual product deletion still lives on the Products page.
// Without renderClone, rfd uses this very element for the drag
// avatar.
const InCategoryRow = ({
  prod,
  t,
  provided,
  isDragging,
  onEdit,
  onRequestMove,
  removing,
  disabled,
  selected,
  onToggleSelect,
  selectionBusy,
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
          : selected
            ? "border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/40 dark:bg-indigo-500/10 dark:border-indigo-400/40"
            : removing
              ? "border-amber-300 ring-2 ring-amber-100"
              : "border-[--border-1] hover:border-indigo-200 hover:shadow-sm"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <RowCheckbox
        checked={!!selected}
        onChange={() => onToggleSelect?.(prod.id)}
        disabled={selectionBusy}
        label={t("categoryProducts.select_product", "Ürünü seç")}
      />
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
      <div
        className={`min-w-0 flex-1 ${
          onToggleSelect && !selectionBusy ? "cursor-pointer" : ""
        }`}
        onClick={() => !selectionBusy && onToggleSelect?.(prod.id)}
      >
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
        {/* "Başka kategoriye taşı" — non-destructive (the product stays
            in the system; only its category changes). Amber tone signals
            "warning, but recoverable" — distinct from the rose
            destructive Trash on the Products page. The arrow-right-left
            icon visually says "swap categories". */}
        <button
          type="button"
          onClick={() => onRequestMove(prod)}
          disabled={removing || disabled}
          title={t(
            "categoryProducts.move_to_category",
            "Başka kategoriye taşı",
          )}
          className="grid place-items-center size-8 rounded-md text-amber-700 hover:bg-amber-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:text-amber-300 dark:hover:bg-amber-500/15"
        >
          {removing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ArrowRightLeft className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
};

// Picker modal — lists categories OTHER than the current one so the
// user can pick a destination for the move. Empty state shown when
// there's only one category in the restaurant (nothing to move to —
// the user has to create another category first via the parent page).
const MoveToCategoryPopup = ({
  product,
  // When set (>1), the picker is moving a multi-selection rather than a
  // single product — swaps the subtitle copy accordingly.
  count,
  currentCategoryId,
  categories,
  // How many menus the restaurant has — drives the inline create hint
  // (1 → the new category is auto-attached and visible; otherwise the
  // user must assign menus afterwards or it stays hidden).
  menuCount,
  // async (name) => newCategoryId | null. Creates a category and resolves
  // its id; null means creation failed (already toasted upstream).
  onCreate,
  t,
  onCancel,
  onConfirm,
}) => {
  const isBulk = typeof count === "number" && count >= 1;
  const targetOptions = useMemo(
    () =>
      (categories || [])
        .filter((c) => c?.id && c.id !== currentCategoryId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories, currentCategoryId],
  );
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const isEmpty = targetOptions.length === 0;
  const canConfirm = !!selectedId;

  // Create-and-move: make the category, then reuse the SAME move path
  // (onConfirm) with the new id so the picker closes and the selection
  // lands in the fresh category in one gesture.
  const handleCreate = async () => {
    const name = newName.trim();
    if (!name || creating || !onCreate) return;
    setCreating(true);
    const newId = await onCreate(name);
    setCreating(false);
    if (newId) onConfirm(newId);
  };

  return (
    <div className="bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] w-full max-w-xl mx-auto overflow-hidden flex flex-col max-h-[85dvh]">
      <div
        className="h-0.5 shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
      />
      <header className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-[--border-1] shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-amber-500/25 shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
          }}
        >
          <ArrowRightLeft className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-[--black-1] truncate tracking-tight">
            {t("categoryProducts.move_picker_title", "Kategoriyi Değiştir")}
          </h3>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {isBulk
              ? t("categoryProducts.move_picker_bulk_subtitle", {
                  count,
                  defaultValue: "{{count}} ürün seçildi",
                })
              : product?.name}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("categoryProducts.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-2] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
        {/* Create a brand-new destination category inline (full width, at
            the top), then move the selection straight into it. */}
        {onCreate && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-400/30 dark:bg-indigo-500/10">
            <div className="flex items-center gap-2 mb-2">
              <FolderPlus className="size-4 text-indigo-600 shrink-0" />
              <span className="text-xs font-semibold text-[--black-1]">
                {t("categoryProducts.create_new_title", "Yeni kategori oluştur")}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
                disabled={creating}
                placeholder={t(
                  "categoryProducts.create_placeholder",
                  "Yeni kategori adı",
                )}
                className="flex-1 h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                style={{ background: PRIMARY_GRADIENT }}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FolderPlus className="size-4" />
                )}
                {t("categoryProducts.create_and_move", "Oluştur ve Taşı")}
              </button>
            </div>
            <p className="text-[11px] text-[--gr-1] mt-1.5 leading-snug">
              {menuCount === 1
                ? t(
                    "categoryProducts.create_hint_single_menu",
                    "Yeni kategori menünüze eklenir; görselini sonra Kategori Düzenle'den ekleyebilirsiniz.",
                  )
                : t(
                    "categoryProducts.create_hint_assign_menu",
                    "Müşteri menüsünde görünmesi için yeni kategoriye sonradan menü atayın (Kategori Düzenle).",
                  )}
            </p>
          </div>
        )}

        {/* Why a destination is required */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 flex items-start gap-2 dark:bg-amber-500/10 dark:border-amber-400/30">
          <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
          <p className="text-[12px] text-amber-900 leading-snug dark:text-amber-100">
            {t(
              "categoryProducts.move_picker_hint",
              "Bir ürün kategorisiz kalamaz. Lütfen taşımak istediğiniz hedef kategoriyi seçin.",
            )}
          </p>
        </div>

        {/* Existing categories — rendered in a TWO-COLUMN grid (sm+) so a
            long category list stays short instead of one tall column. */}
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-6 grid place-items-center text-center">
            <span className="grid place-items-center size-10 rounded-xl bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] mb-2">
              <Inbox className="size-5" />
            </span>
            <p className="text-xs text-[--gr-1]">
              {t(
                "categoryProducts.move_picker_no_other",
                "Taşınabilecek başka kategori yok. Önce yeni bir kategori oluşturun.",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] px-0.5">
              {t("categoryProducts.move_existing_title", "Mevcut Kategoriler")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {targetOptions.map((cat) => {
                const active = selectedId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedId(cat.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition ${
                      active
                        ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200 shadow-sm dark:bg-indigo-500/15 dark:border-indigo-400/40 dark:ring-indigo-400/30"
                        : "border-[--border-1] bg-[--white-1] hover:border-indigo-200 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/10 dark:hover:border-indigo-400/40"
                    }`}
                  >
                    <span
                      className={`grid place-items-center size-5 rounded-full border-2 transition shrink-0 ${
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-[--border-1] bg-[--white-1]"
                      }`}
                    >
                      {active && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                    <span
                      className={`text-sm font-semibold truncate flex-1 min-w-0 ${
                        active
                          ? "text-indigo-900 dark:text-indigo-100"
                          : "text-[--black-1]"
                      }`}
                    >
                      {cat.name || "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="px-3 sm:px-5 py-3 border-t border-[--border-1] flex justify-end gap-2 shrink-0 bg-[--white-1]">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("categoryProducts.move_cancel", "İptal")}
        </button>
        <button
          type="button"
          onClick={() => canConfirm && onConfirm(selectedId)}
          disabled={!canConfirm}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <ArrowRightLeft className="size-4" />
          {t("categoryProducts.move_confirm", "Taşı")}
        </button>
      </footer>
    </div>
  );
};

export default CategoryProducts;
