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
      productCandidates = productList.filter(
        (p) => p.categoryId === rel.categoryId,
      );
    } else {
      productCandidates = productList;
    }

    for (const product of productCandidates) {
      const portionCandidates = allPortions
        ? product.portions || []
        : (product.portions || []).filter((pt) => pt.id === rel.portionId);

      for (const portion of portionCandidates) {
        out.push({
          categoryId: product.categoryId,
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
