// MODULES
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  GripVertical,
  ChevronDown,
  Trash2,
  X,
  Save,
  Plus,
  ListChecks,
  Link2,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";

// COMP
import OptionRow from "./optionRow";
import RelationRow from "./_relationRow";
import { NewOption, NewRelation } from "./constraints";
import CustomCheckbox from "../../../common/customCheckbox";

// REDUX
import {
  editOrderTag,
  resetEditOrderTag,
} from "../../../../redux/orderTags/editOrderTagSlice";
import { addOrderTag } from "../../../../redux/orderTags/addOrderTagSlice";

// UTILS
import { parsePrice } from "../../../../utils/utils";

// Frontend-generated row IDs (used as React keys) start with "New-".
// The backend rejects those — only existing rows should round-trip
// their id back to the server. Mirrors the addMenu/editMenu
// `isClientId` helper.
const isClientId = (id) => !id || String(id).startsWith("New-");

// Items hold price as a raw user-typed string while editing (so backspace
// works and "12,50" doesn't get mangled). Convert to a Number once at the
// dispatch boundary, mirroring the products portion-save pattern.
// Also strip temp ids so the backend can insert new options correctly.
const normalizeItemsForSave = (items) =>
  (items || []).map((it) => {
    const out = { ...it, price: parsePrice(it.price) };
    if (isClientId(out.id)) delete out.id;
    return out;
  });

// Wildcard expansion for relations.
//
// The backend stores ONE relation row per portion — confirmed by
// inspecting the live response, where every relation's `id` field
// equals its `portionId`. There's no server-side notion of a
// wildcard; "this tag applies to all DÜRÜMLER portions" must be
// expanded client-side into N concrete `{categoryId, productId,
// portionId}` rows before the PUT lands. Without expansion, the
// dropdown's `"*"` sentinel (or my prior null-conversion attempt)
// arrives at the backend's required-Guid slots and gets dropped,
// so the user sees a 200 OK and the old relation untouched on next
// refetch — exactly the bug the user reported with İÇECEK SEÇ /
// DÜRÜMLER / Tüm Ürünler / Tüm Porsiyonlar.
//
// Expansion rules per UI relation row:
//   - Pick candidate products: specific id wins, else all products
//     in the chosen category, else every product the restaurant
//     has.
//   - For each candidate product, pick candidate portions: specific
//     id wins (and only kept if it actually belongs to this
//     product), else every portion of that product.
//   - Emit one row per (product, portion) pair with concrete ids
//     resolved from the lite product list.
//
// Output rows omit the `id` field on purpose. Backend identifies
// relations by `(orderTagId, portionId)` natural key — preserving
// the row's old id would prevent it from being replaced when the
// user reshuffled wildcards. Duplicates are filtered by
// (categoryId|productId|portionId) so two overlapping wildcard
// rows (e.g. "all DÜRÜMLER" + "Tavuk Dürüm 1 Lavaş") don't send
// two copies of the same portion.
const isWildcard = (v) => v == null || v === "*";

// Re-collapse a flat list of (cat, prod, port) tuples back into a
// wildcard-aware view. Inverse of `expandRelations` — the backend
// stores ONE row per portion (see the note above expandRelations
// for why) so a tag that was originally saved as
// `{ cat:X, prod:"*", port:"*" }` round-trips as N concrete rows.
// Without compression the user would re-open the tag and see all
// N expanded rows instead of the single wildcard they saved.
//
// Three layers, fine → coarse:
//
//   1. For each (cat, prod) tuple: if every portion of `prod` is
//      present in the set → emit `{ cat, prod, port:"*" }` instead
//      of N individual portion rows.
//   2. For each cat: if every product currently in that category
//      collapsed at step 1 AND no per-portion partial rows leaked
//      through → emit `{ cat, prod:"*", port:"*" }` (single
//      category-wide wildcard).
//   3. `cat === "*"` rows are already maximally wildcarded — pass
//      through unchanged.
//
// Conservative on missing data: a portion or product deleted since
// the wildcard was first saved leaves the set incomplete, so we
// keep the individual rows rather than synthesize a wildcard that
// would silently re-include something the menu owner cleaned out.
// New products added to a category AFTER the wildcard was saved
// auto-include on the next save (expandRelations re-evaluates
// against the latest catalog).
//
// Synthetic React-key ids (`c-…`) are stamped on each output row;
// they never roundtrip — expandRelations strips ids before save.
export const compressRelations = (rawRelations, productList) => {
  if (!Array.isArray(rawRelations) || rawRelations.length === 0) return [];

  // catId → Map<prodId, Set<portionId>>
  const tree = new Map();
  for (const rel of rawRelations) {
    const cat = isWildcard(rel.categoryId) ? "*" : rel.categoryId;
    const prod = isWildcard(rel.productId) ? "*" : rel.productId;
    const port = isWildcard(rel.portionId) ? "*" : rel.portionId;
    if (!tree.has(cat)) tree.set(cat, new Map());
    if (!tree.get(cat).has(prod)) tree.get(cat).set(prod, new Set());
    tree.get(cat).get(prod).add(port);
  }

  // Pre-index categoryId → products (per current catalog) for the
  // layer-2 "all products in category" check. Walks every product
  // once, so layer 2 stays O(1) per category.
  const productsByCategory = new Map();
  for (const p of productList || []) {
    const cats = Array.isArray(p.categories) ? p.categories : [];
    for (const c of cats) {
      if (!c?.categoryId) continue;
      if (!productsByCategory.has(c.categoryId)) {
        productsByCategory.set(c.categoryId, []);
      }
      productsByCategory.get(c.categoryId).push(p);
    }
  }

  const out = [];

  for (const [catId, prodMap] of tree) {
    // Layer 3: cat-wildcards bypass layer 1 + 2.
    if (catId === "*") {
      for (const [prodId, portSet] of prodMap) {
        for (const portId of portSet) {
          out.push({
            categoryId: "*",
            productId: prodId,
            portionId: portId,
          });
        }
      }
      continue;
    }

    // Layer 1: per-product portion collapse.
    const collapsedProducts = new Set(); // products where all portions covered
    const passthroughRows = []; // individual rows that couldn't collapse

    for (const [prodId, portSet] of prodMap) {
      // Product-wildcards never collapse further at layer 1 — they
      // get rolled into category-wildcard at layer 2 (if quorum) or
      // emitted as-is below.
      if (prodId === "*") {
        for (const portId of portSet) {
          passthroughRows.push({
            categoryId: catId,
            productId: "*",
            portionId: portId,
          });
        }
        continue;
      }
      const product = (productList || []).find((p) => p.id === prodId);
      const productPortions = Array.isArray(product?.portions)
        ? product.portions
        : [];
      const allPortionIds = productPortions
        .map((p) => p.id)
        .filter(Boolean);
      // Either the set already contains "*", or it covers every
      // currently-known portion of this product.
      const hasAllPortions =
        portSet.has("*") ||
        (allPortionIds.length > 0 &&
          allPortionIds.every((id) => portSet.has(id)));
      if (hasAllPortions) {
        collapsedProducts.add(prodId);
      } else {
        for (const portId of portSet) {
          passthroughRows.push({
            categoryId: catId,
            productId: prodId,
            portionId: portId,
          });
        }
      }
    }

    // Layer 2: category-wide collapse — every product in the
    // category collapsed at layer 1, AND no partial passthrough
    // rows leaked (a single per-portion row blocks the collapse
    // because the original intent wasn't "all products").
    const catProducts = productsByCategory.get(catId) || [];
    const catProductIds = catProducts.map((p) => p.id);
    const canCollapseCategory =
      catProductIds.length > 0 &&
      catProductIds.every((id) => collapsedProducts.has(id)) &&
      passthroughRows.length === 0;

    if (canCollapseCategory) {
      out.push({ categoryId: catId, productId: "*", portionId: "*" });
    } else {
      for (const prodId of collapsedProducts) {
        out.push({ categoryId: catId, productId: prodId, portionId: "*" });
      }
      out.push(...passthroughRows);
    }
  }

  return out.map((rel, i) => ({
    ...rel,
    id: `c-${i}-${rel.categoryId}-${rel.productId}-${rel.portionId}`,
  }));
};

const expandRelations = (relations, lite) => {
  const productList = lite?.data || [];
  const out = [];
  for (const rel of relations || []) {
    const allCats = isWildcard(rel.categoryId);
    const allProds = isWildcard(rel.productId);
    const allPortions = isWildcard(rel.portionId);

    let productCandidates;
    if (!allProds) {
      const p = productList.find((p) => p.id === rel.productId);
      productCandidates = p ? [p] : [];
    } else if (!allCats) {
      // m2m: a product belongs to the relation's category when ANY of
      // its memberships matches, not just the first one the normalizer
      // surfaces via the flat alias. Without this, multi-category
      // products would silently miss wildcards targeting a non-primary
      // category.
      //
      // Fallback to the flat `categoryId` for products whose backend
      // response carried an empty / missing categories array AND the
      // normalizer didn't manage to synthesize one. Belt and
      // suspenders so wildcard expansion doesn't silently emit zero
      // rows just because data is partial.
      productCandidates = productList.filter((p) => {
        const memberships = p.categories || [];
        if (memberships.some((c) => c?.categoryId === rel.categoryId)) {
          return true;
        }
        return p.categoryId === rel.categoryId;
      });
    } else {
      productCandidates = productList;
    }

    for (const product of productCandidates) {
      const portionCandidates = allPortions
        ? product.portions || []
        : (product.portions || []).filter((pt) => pt.id === rel.portionId);

      // Pick the categoryId to stamp on the emitted relation row.
      // Prefer the explicit `rel.categoryId` when the wildcard wasn't
      // an "all categories", since that's the category the user picked
      // for this relation row. Otherwise fall back to the product's
      // first membership (m2m: pick one, the relation is keyed by
      // (productId, portionId) anyway).
      const emittedCategoryId = !allCats
        ? rel.categoryId
        : (product.categories || [])[0]?.categoryId ?? product.categoryId;
      for (const portion of portionCandidates) {
        out.push({
          categoryId: emittedCategoryId,
          productId: product.id,
          portionId: portion.id,
        });
      }
    }
  }

  const seen = new Set();
  return out.filter((rel) => {
    const key = `${rel.categoryId}|${rel.productId}|${rel.portionId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const OrderTagGroupCard = ({
  group,
  products,
  onUpdate,
  onDelete,
  isDragging,
  categories,
  onCancelNew,
  restaurantId,
  dragHandleProps,
  // Number of decimal places to format price inputs with (sourced
  // from the restaurant's `decimalPoint` setting in the parent).
  // Falls back to 2 when the parent doesn't pass it so older callers
  // and tests don't break.
  decimals = 2,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { success: editSuccess, error: editError } = useSelector(
    (s) => s.orderTags.edit,
  );
  const { success: addSuccess, error: addError } = useSelector(
    (s) => s.orderTags.add,
  );

  const [isCollapsed, setIsCollapsed] = useState(!group.isNew);
  const [activeTab, setActiveTab] = useState("options");
  const hasNoRelations = group.relations.length === 0;

  const updateItem = (index, updates) => {
    const newItems = group.items.map((item, i) =>
      i === index ? { ...item, ...updates } : item,
    );
    onUpdate({ items: newItems, isDirty: true });
  };

  const deleteItem = (index) => {
    const newItems = group.items.filter((_, i) => i !== index);
    onUpdate({ items: newItems, isDirty: true });
  };

  const addItem = () => {
    onUpdate({
      items: [
        ...group.items,
        { ...NewOption(), sortOrder: group.items.length - 1 },
      ],
      isDirty: true,
    });
    if (isCollapsed) setIsCollapsed(false);
  };

  const addRelation = () => {
    onUpdate({ relations: [...group.relations, NewRelation()], isDirty: true });
    if (isCollapsed) setIsCollapsed(false);
    setActiveTab("relations");
  };

  const updateRelation = (relId, updates) => {
    const newRels = group.relations.map((rel) =>
      rel.id === relId ? { ...rel, ...updates } : rel,
    );
    onUpdate({ relations: newRels, isDirty: true });
  };

  const deleteRelation = (relId) => {
    const newRels = group.relations.filter((rel) => rel.id !== relId);
    onUpdate({ relations: newRels, isDirty: true });
  };

  const handleItemDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(group.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    const updatedItems = items.map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    onUpdate({ items: updatedItems, isDirty: true });
  };

  function handleUpdateItem(e) {
    e.preventDefault();
    if (group.relations.length === 0) {
      toast.error(t("orderTags.no_relations_warning"));
      return;
    }
    const expandedRelations = expandRelations(group.relations, products);
    if (expandedRelations.length === 0) {
      // The user picked wildcards (or specific ids that don't match
      // any portion in the lite product list) and we ended up with
      // nothing to send. Better to surface that than silently submit
      // an empty list — backend would treat it as "delete all
      // relations" which is almost certainly not what they meant.
      toast.error(t("orderTags.no_relations_warning"));
      return;
    }
    const payload = {
      ...group,
      items: normalizeItemsForSave(group.items),
      relations: expandedRelations,
      restaurantId,
    };
    // Strip the group's own temp id on first save so the backend
    // assigns its real UUID. Same reason as items / relations:
    // sending an unparseable id makes the .NET endpoint silently
    // drop the row while still returning 200 OK.
    if (isClientId(payload.id)) delete payload.id;
    group?.isNew ? dispatch(addOrderTag(payload)) : dispatch(editOrderTag(payload));
  }

  useEffect(() => {
    if (editSuccess) {
      toast.success(t("orderTags.saved_success"), { id: "edit-order-tag" });
      dispatch(resetEditOrderTag());
      onUpdate({ isDirty: false, isNew: false });
    }
    if (editError) dispatch(resetEditOrderTag());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSuccess, editError]);

  useEffect(() => {
    if (addSuccess) {
      toast.success(t("orderTags.saved_success"), { id: "add-order-tag" });
      dispatch(resetEditOrderTag());
      onUpdate({ isDirty: false, isNew: false });
    }
    if (addError) dispatch(resetEditOrderTag());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSuccess, addError]);

  const borderTone = group.isDirty
    ? "border-rose-300 ring-1 ring-rose-100"
    : hasNoRelations && !group.isNew
      ? "border-rose-300 bg-rose-50/30"
      : "border-[--border-1]";

  return (
    <form onSubmit={handleUpdateItem}>
      <div
        className={`rounded-xl border bg-[--white-1] transition-all overflow-hidden ${borderTone} ${
          isDragging ? "ring-2 ring-indigo-200 shadow-lg" : ""
        }`}
      >
        {/* Brand accent strip — keeps each group card anchored visually
            when the body is expanded with many options/relations rows.
            Without it the header used to blend into the body once the
            user opened either tab. */}
        <div className="h-0.5 bg-gradient-to-r from-indigo-600 via-violet-500 to-cyan-500" />

        {/* HEADER — tinted indigo→cyan wash so it stays clearly distinct
            from the white body when expanded. The name input and the
            min/max + free-tagging chips keep their white-ish backgrounds
            so they pop against the wash. */}
        <div
          className={`p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 bg-gradient-to-r from-indigo-50 via-violet-50 to-cyan-50 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-cyan-500/10 ${
            !isCollapsed
              ? "border-b border-indigo-200/70 dark:border-indigo-400/25"
              : ""
          }`}
        >
          {/* Top row: drag handle + name input + actions (mobile collapsed) */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              {...dragHandleProps}
              aria-label="drag"
              className="grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
            >
              <GripVertical className="size-4" />
            </button>
            <input
              type="text"
              required
              value={group.name}
              onChange={(e) =>
                onUpdate({ name: e.target.value, isDirty: true })
              }
              placeholder={t("orderTags.group_name_placeholder")}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm font-semibold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />

            {/* Mobile-only quick actions (collapse + delete) */}
            <div className="flex items-center gap-0.5 sm:hidden shrink-0">
              {group.isNew ? (
                <button
                  type="button"
                  onClick={onCancelNew}
                  title={t("orderTags.cancel_new")}
                  className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDelete}
                  title={t("orderTags.delete_group")}
                  className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
              {!group.isNew && (
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={
                    isCollapsed
                      ? t("orderTags.expand")
                      : t("orderTags.collapse")
                  }
                  className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                >
                  <ChevronDown
                    className={`size-3.5 transition-transform ${
                      isCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Min/Max + Free Tagging + Save + (desktop) actions.
              Solid white backgrounds (was --white-2/60) so the inputs
              stay readable as inputs against the tinted header wash. */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1 h-9 px-2 rounded-lg border border-[--border-1] bg-[--white-1]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
                {t("orderTags.min")}
              </span>
              <input
                type="number"
                required
                value={group.minSelected}
                onChange={(e) =>
                  onUpdate({
                    minSelected: parseInt(e.target.value) || 0,
                    isDirty: true,
                  })
                }
                className="w-10 text-center text-sm font-bold text-[--black-1] bg-transparent outline-none"
              />
              <span className="text-[--gr-3]">|</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
                {t("orderTags.max")}
              </span>
              <input
                type="number"
                required
                value={group.maxSelected}
                onChange={(e) =>
                  onUpdate({
                    maxSelected: parseInt(e.target.value) || 1,
                    isDirty: true,
                  })
                }
                className="w-10 text-center text-sm font-bold text-[--black-1] bg-transparent outline-none"
              />
            </div>

            <label className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-[--border-1] bg-[--white-1] cursor-pointer">
              <CustomCheckbox
                id={`ft-${group.id}`}
                label=""
                checked={group.freeTagging}
                onChange={(e) =>
                  onUpdate({ freeTagging: e.target.checked, isDirty: true })
                }
                size="4 rounded-[4px]"
              />
              <span className="text-[11px] font-semibold text-[--gr-1] whitespace-nowrap">
                {t("orderTags.free_tagging")}
              </span>
            </label>

            {group.isDirty && (
              <button
                type="submit"
                className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold transition bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25 hover:brightness-110 animate-pulse"
              >
                <Save className="size-3.5" />
                {t("orderTags.save_group")}
              </button>
            )}

            {/* Desktop-only actions */}
            <div className="hidden sm:flex items-center gap-0.5 ml-1">
              {group.isNew ? (
                <button
                  type="button"
                  onClick={onCancelNew}
                  title={t("orderTags.cancel_new")}
                  className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onDelete}
                    title={t("orderTags.delete_group")}
                    className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={
                      isCollapsed
                        ? t("orderTags.expand")
                        : t("orderTags.collapse")
                    }
                    className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <ChevronDown
                      className={`size-3.5 transition-transform ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                    />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* BODY */}
        {!isCollapsed && (
          <div>
            {/* Tabs */}
            <div className="flex gap-0.5 px-2 sm:px-3 pt-2 border-b border-[--border-1] overflow-x-auto">
              <TabButton
                active={activeTab === "options"}
                onClick={() => setActiveTab("options")}
                icon={ListChecks}
                label={`${t("orderTags.tab_options")} (${group.items.length})`}
              />
              <TabButton
                active={activeTab === "relations"}
                onClick={() => setActiveTab("relations")}
                icon={Link2}
                label={`${t("orderTags.tab_relations")} (${group.relations.length})`}
                tone="blue"
              />
            </div>

            <div className="p-3 sm:p-4">
              {activeTab === "options" ? (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addItem}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold transition shadow-md shadow-emerald-500/25 hover:brightness-110 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                    >
                      <Plus className="size-4" />
                      {t("orderTags.add_option")}
                    </button>
                  </div>

                  {/* Desktop column header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 text-[10px] uppercase font-bold tracking-wider text-[--gr-1]">
                    <div className="col-span-1" />
                    <div className="col-span-3">
                      {t("orderTags.col_option_name")}
                    </div>
                    <div className="col-span-2">{t("orderTags.col_price")}</div>
                    <div className="col-span-1 text-center">
                      {t("orderTags.col_default")}
                    </div>
                    <div className="col-span-1 text-center">
                      {t("orderTags.col_required")}
                    </div>
                    <div className="col-span-1 text-center">
                      {t("orderTags.col_min")}
                    </div>
                    <div className="col-span-1 text-center">
                      {t("orderTags.col_max")}
                    </div>
                    <div className="col-span-1" />
                  </div>

                  <DragDropContext onDragEnd={handleItemDragEnd}>
                    <Droppable droppableId={`items-${group.id}`}>
                      {(provided) => (
                        <div
                          className="flex flex-col gap-1.5"
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {group.items.map((item, index) => (
                            <Draggable
                              key={item.id || index}
                              draggableId={item.id || `temp-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  <OptionRow
                                    item={item}
                                    onUpdate={(u) => updateItem(index, u)}
                                    onDelete={() => deleteItem(index)}
                                    dragHandleProps={provided.dragHandleProps}
                                    isDragging={snapshot.isDragging}
                                    decimals={decimals}
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

                  {group.freeTagging && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2.5">
                      <span className="grid place-items-center size-7 rounded-lg bg-[--white-1] text-amber-600 ring-1 ring-amber-200 shrink-0">
                        <Lightbulb className="size-3.5" />
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-amber-900">
                          {t("orderTags.free_tagging_active")}
                        </h4>
                        <p className="text-[11px] text-amber-800/90 mt-0.5">
                          {t("orderTags.free_tagging_info")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={addRelation}
                      className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold transition shadow-md shadow-blue-500/25 hover:brightness-110 bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                    >
                      <Plus className="size-4" />
                      {t("orderTags.add_relation")}
                    </button>
                  </div>

                  {/* Desktop column header */}
                  <div className="hidden md:grid grid-cols-12 gap-2 px-3 text-[10px] uppercase font-bold tracking-wider text-[--gr-1]">
                    <div className="col-span-1" />
                    <div className="col-span-3">
                      {t("orderTags.col_category")}
                    </div>
                    <div className="col-span-4">
                      {t("orderTags.col_product")}
                    </div>
                    <div className="col-span-3">
                      {t("orderTags.col_portion")}
                    </div>
                    <div className="col-span-1" />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {group.relations.map((rel) => (
                      <RelationRow
                        key={rel.id}
                        relation={rel}
                        products={products?.data}
                        categories={categories}
                        onUpdate={(u) => updateRelation(rel.id, u)}
                        onDelete={() => deleteRelation(rel.id)}
                      />
                    ))}
                  </div>

                  {group.relations.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-4 flex items-start gap-2.5">
                      <span className="grid place-items-center size-7 rounded-lg bg-[--white-1] text-rose-600 ring-1 ring-rose-200 shrink-0">
                        <AlertTriangle className="size-3.5" />
                      </span>
                      <p className="text-[11px] text-rose-800 leading-relaxed flex-1 min-w-0">
                        {t("orderTags.no_relations_warning")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label, tone = "indigo" }) => {
  const activeCls =
    tone === "blue"
      ? "text-blue-700 border-blue-600 bg-blue-50/40"
      : "text-indigo-700 border-indigo-600 bg-indigo-50/40";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition border-b-2 ${
        active
          ? activeCls
          : "text-[--gr-1] border-transparent hover:text-[--black-2] hover:bg-[--white-2]"
      }`}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
};

export default OrderTagGroupCard;
