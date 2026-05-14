// MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DollarSign,
  Save,
  Layers,
  Loader2,
  Filter,
  CircleDollarSign,
  Tag,
  Search,
  X,
} from "lucide-react";

// COMP
import ProductsHeader from "./header";
import PriceListApplyBulk from "./priceListApplyBulk";
import CustomSelect from "../../common/customSelector";

// REDUX
import {
  updatePriceList,
  resetUpdatePriceList,
} from "../../../redux/products/updatePriceListSlice";
import { getProducts } from "../../../redux/products/getProductsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { getOrderTags } from "../../../redux/orderTags/getOrderTagsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Turkish-aware diacritic folding for client-side product search —
// mirror of the helper in products.jsx ("ızgara" matches "izgara").
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

const PriceList = ({ data: restaurant }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = params.id;
  const containerRef = useRef(null);

  // Decimal precision used to format every price input below. Reads
  // from the restaurant's `decimalPoint` setting (Genel Ayarlar →
  // Kuruş Hanesi); falls back to 2 (the TR default ",00") while the
  // backend hasn't started round-tripping the field yet, so the
  // format rule stays sensible from day one.
  const decimals = Number.isFinite(Number(restaurant?.decimalPoint))
    ? Number(restaurant.decimalPoint)
    : 2;

  const { products } = useSelector((s) => s.products.get);
  // Pull categories so we can hide the Kampanya column / input for any
  // category that has its `campaign` flag turned off — the price list
  // shouldn't let the user enter a campaign price for products whose
  // category isn't running campaigns.
  const { categories, fetchedFor: catFetchedFor } = useSelector(
    (s) => s.categories.get,
  );
  const { success, error, loading } = useSelector(
    (s) => s.products.updatePriceList,
  );
  // Etiket (OrderTag) listesi — fiyatı 0 olan bir porsiyonun aslında
  // etiket seçimleriyle fiyatlandırılıp fiyatlandırılmadığını anlamak
  // için lazım. Order Tags sayfasından da aynı slice okunuyor; burada
  // fetchedFor cache'iyle gereksiz refetch'ten kaçınıyoruz.
  const { orderTags, fetchedFor: tagsFetchedFor } = useSelector(
    (s) => s.orderTags.get,
  );

  // categoryId → boolean: does this category have campaigns enabled?
  // Defaults to `false` for unknown ids (categories that didn't load),
  // so the campaign UI stays hidden until we have proof it's allowed.
  const categoryCampaignMap = useMemo(() => {
    const map = new Map();
    (categories || []).forEach((c) => {
      if (!c?.id) return;
      map.set(c.id, !!c.campaign);
    });
    return map;
  }, [categories]);

  // Özel Fiyat column visibility — driven by the restaurant's
  // isSpecialPriceActive flag in Genel Ayarlar. Mirrors how Kampanya
  // is gated per category, but here it's a single restaurant-wide
  // boolean since the special-price feature isn't per-category.
  const showSpecial = !!restaurant?.isSpecialPriceActive;

  const [list, setList] = useState([]);
  const [listBefore, setListBefore] = useState([]);
  // null = "Tüm Ürünler"; otherwise the selected categoryId
  const [categoryFilter, setCategoryFilter] = useState(null);
  // "Sıfır Fiyatlı Ürünler" — when on, hide every product whose every
  // portion already has a non-zero price. Combined with the category
  // filter (both must pass for a row to render).
  const [showZeroPriceOnly, setShowZeroPriceOnly] = useState(false);
  // Product-name search — narrows the visible rows (Turkish-aware
  // folding) without touching `list`, same as the category /
  // zero-price filters, so bulk apply + Save still target everything.
  const [searchVal, setSearchVal] = useState("");

  const updatePortion = (pIndex, portionIndex, key, value) => {
    setList((prev) => {
      const next = [...prev];
      const portions = [...(next[pIndex].portions || [])];
      portions[portionIndex] = { ...portions[portionIndex], [key]: value };
      next[pIndex] = { ...next[pIndex], portions };
      return next;
    });
  };

  // Fetch products once when the page mounts (and again if the restaurant
  // changes via URL). We deliberately do NOT depend on `list` — when a
  // restaurant has zero products the effect that syncs `products → list`
  // re-creates an empty array each tick, which would re-trigger this fetch
  // forever. Post-save refresh is handled by the success-effect below.
  useEffect(() => {
    dispatch(getProducts({ restaurantId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Categories — only fetch when the slice cache doesn't already have a
  // fresh payload for this restaurant. Used to gate the Kampanya UI
  // per category.campaign flag.
  useEffect(() => {
    if (!categories || catFetchedFor !== restaurantId) {
      dispatch(getCategories({ restaurantId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Etiketler (OrderTags) — used to compute which zero-priced portions
  // are "really priced via tag selections" so we tone the input amber
  // (informational) instead of rose (actually unpriced).
  useEffect(() => {
    if (!orderTags || tagsFetchedFor !== restaurantId) {
      dispatch(getOrderTags({ restaurantId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // On products load, set local editable list and compute groups.
  useEffect(() => {
    const productsList = (products?.data?.length && products.data) || [];
    const initialList = productsList.map((p) => ({
      ...p,
      portions: (p.portions || []).map((pt) => ({
        ...pt,
        name: pt.name ?? "",
        price: pt.price ?? "",
        // Default null/undefined specialPrice to 0 so the input
        // renders "0,00" instead of empty when the special-price
        // feature is later turned on for the restaurant.
        specialPrice: pt.specialPrice ?? 0,
      })),
    }));
    setList(initialList);
    setListBefore(initialList);
  }, [products]);

  const groupedByCategory = useMemo(() => {
    const grouped = new Map();
    list.forEach((product) => {
      const key = product.categoryId || "uncategorized";
      if (!grouped.has(key)) {
        grouped.set(key, {
          categoryId: key,
          categoryName: product.categoryName || "",
          products: [],
        });
      }
      grouped.get(key).products.push(product);
    });
    return Array.from(grouped.values());
  }, [list]);

  // Dropdown options: "Tüm Ürünler" + every category present in the list.
  const categoryOptions = useMemo(
    () => [
      { label: t("priceList.all_categories"), value: null },
      ...groupedByCategory.map((g) => ({
        label: g.categoryName || "—",
        value: g.categoryId,
      })),
    ],
    [groupedByCategory, t],
  );

  // For each (productId|portionId) tuple, decide whether its pricing is
  // actually driven by an OrderTag selection — i.e. there is at least
  // one OrderTag that:
  //   1. Has at least one item with price > 0, AND
  //   2. Has a relation that targets this product (specifically the
  //      portion, the product, or the product's category).
  // Used by PriceInput to tone a zero-price input amber ("priced via
  // tags, not really empty") instead of rose ("genuinely unpriced").
  const tagPricedKeys = useMemo(() => {
    const set = new Set();
    if (!Array.isArray(orderTags) || orderTags.length === 0 || list.length === 0)
      return set;
    for (const tag of orderTags) {
      const hasPricedItem = (tag.items || []).some(
        (it) => Number(it?.price) > 0,
      );
      if (!hasPricedItem) continue;
      const rels = tag.relations || [];
      if (rels.length === 0) continue;
      for (const product of list) {
        for (const portion of product.portions || []) {
          const matches = rels.some((rel) => {
            // Most-specific match first: portion > product > category.
            if (rel.portionId && rel.portionId === portion.id) return true;
            if (
              !rel.portionId &&
              rel.productId &&
              rel.productId === product.id
            )
              return true;
            if (
              !rel.portionId &&
              !rel.productId &&
              rel.categoryId &&
              rel.categoryId === product.categoryId
            )
              return true;
            return false;
          });
          if (matches) set.add(`${product.id}|${portion.id}`);
        }
      }
    }
    return set;
  }, [orderTags, list]);

  // The zero-price filter must NOT react to in-progress edits.
  // Otherwise typing the first digit into a price input flips the
  // portion's price > 0 and the row disappears mid-keystroke before
  // the user can hit Save. Build the inclusion set from `listBefore`
  // — the last-saved snapshot — so the row stays visible while
  // editing, and only re-evaluates after a successful save (which
  // refreshes both `list` and `listBefore`).
  const zeroPriceProductIds = useMemo(() => {
    if (!showZeroPriceOnly) return null;
    const ids = new Set();
    for (const p of listBefore) {
      const hasZero = (p.portions || []).some(
        (pt) => !Number.isFinite(Number(pt.price)) || Number(pt.price) <= 0,
      );
      if (hasZero) ids.add(p.id);
    }
    return ids;
  }, [listBefore, showZeroPriceOnly]);

  // Apply the active filters to what's rendered. We don't filter `list`
  // itself so that bulk-edit + save-changes still target the entire
  // dataset. Order: category filter narrows by group, then the zero-
  // price ID set (computed from listBefore above) narrows products
  // inside each surviving group, then the name search narrows further.
  const visibleGroups = useMemo(() => {
    let groups =
      categoryFilter == null
        ? groupedByCategory
        : groupedByCategory.filter((g) => g.categoryId === categoryFilter);
    if (zeroPriceProductIds) {
      groups = groups
        .map((g) => ({
          ...g,
          products: g.products.filter((p) => zeroPriceProductIds.has(p.id)),
        }))
        .filter((g) => g.products.length > 0);
    }
    const q = normalizeSearch(searchVal.trim());
    if (q) {
      groups = groups
        .map((g) => ({
          ...g,
          products: g.products.filter((p) =>
            normalizeSearch(p.name).includes(q),
          ),
        }))
        .filter((g) => g.products.length > 0);
    }
    return groups;
  }, [groupedByCategory, categoryFilter, zeroPriceProductIds, searchVal]);

  const selectedOption =
    categoryOptions.find((o) => o.value === categoryFilter) ||
    categoryOptions[0];

  // Decide whether to show " - {portion.name}" inline next to the product
  // name. Skip when the product has only one portion AND that portion's name
  // is missing or the bare default ("Normal") — it adds no information.
  const portionNameVisible = (prod, portion) => {
    if (!portion?.name) return false;
    if (prod.portions.length > 1) return true;
    return portion.name.trim().toLowerCase() !== "normal";
  };

  // Submit changed products only — match each portion to original by id.
  const handleSaveAll = () => {
    const changedWithPortions = list
      .filter((prod) => {
        const orig = listBefore.find((p) => p.id === prod.id);
        return !orig || !isEqual(prod, orig);
      })
      .map((prod) => {
        const orig = listBefore.find((p) => p.id === prod.id);
        const changedPortions = (prod.portions || []).filter((pt, index) => {
          const origPortion = (orig?.portions || [])[index];
          return !isEqual(pt, origPortion);
        });
        return {
          id: prod.id,
          portions: changedPortions.map((pt) => ({
            id: pt.id,
            price: pt.price,
            campaignPrice: pt.campaignPrice,
            // Always include specialPrice in the payload — even when
            // the column is hidden in the UI, the backend keeps the
            // existing value untouched. Sending a stale 0 here would
            // wipe a previously-set special price; the slice
            // normalizer turns 0/empty into null so the backend
            // records "no special price".
            specialPrice: pt.specialPrice,
          })),
        };
      });

    dispatch(updatePriceList(changedWithPortions));
  };

  // Vertical navigation between same-column inputs (Enter / Arrow keys).
  const handleKeyDown = (e) => {
    const key = e.key;
    if (!["Enter", "ArrowDown", "ArrowUp"].includes(key)) return;
    e.preventDefault();
    const target = e.target;
    const dataAttr = target.getAttribute("data-edit")
      ? "data-edit"
      : target.getAttribute("data-edit-second")
        ? "data-edit-second"
        : target.getAttribute("data-edit-third")
          ? "data-edit-third"
          : null;
    if (!dataAttr) return;
    const inputs = containerRef.current?.querySelectorAll(`input[${dataAttr}]`);
    if (!inputs?.length) return;
    const arr = Array.from(inputs);
    const currentIndex = arr.indexOf(target);
    if (currentIndex === -1) return;
    let nextIndex =
      key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex >= 0 && nextIndex < arr.length) {
      const next = arr[nextIndex];
      next.focus();
      if (typeof next.select === "function") next.select();
    }
  };

  useEffect(() => {
    if (success) {
      toast.success(t("priceList.success"));
      dispatch(getProducts({ restaurantId }));
      dispatch(resetUpdatePriceList());
    }
    if (error) dispatch(resetUpdatePriceList());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  const dirty = !isEqual(list, listBefore);

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      {/* Top tabs */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div
        className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden"
        ref={containerRef}
      >
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <DollarSign className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("priceList.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {list.length > 0
                ? t("priceList.summary", {
                    count: list.length,
                    categories: groupedByCategory.length,
                  })
                : t("priceList.subtitle")}
            </p>
          </div>
          {dirty && (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={loading}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-emerald-500/25 hover:brightness-110 active:brightness-95 transition shrink-0 disabled:opacity-60 bg-gradient-to-r from-emerald-500 to-emerald-600"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {/* Short "Kaydet" label always visible — the previous
                  `hidden sm:inline` collapsed to icon-only on mobile,
                  which made the action ambiguous. The longer
                  "Değişiklikleri Kaydet" copy moves to the duplicate
                  button at the bottom of the list where there's room. */}
              <span>{t("priceList.save_short", "Kaydet")}</span>
            </button>
          )}
        </div>

        <div className="p-3 sm:p-5 space-y-4">
          <PriceListApplyBulk list={list} setList={setList} />

          {/* Product search — always available when there are products
              (unlike the category/zero-price filters row below, which
              is conditional). Narrows the visible rows by name without
              touching `list`, so bulk apply + Save still target all. */}
          {groupedByCategory.length > 0 && (
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-2]">
                <Search className="size-4" />
              </span>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder={t("priceList.search_placeholder")}
                className="block w-full pl-9 pr-9 h-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
              {searchVal && (
                <button
                  type="button"
                  onClick={() => setSearchVal("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[--gr-2] hover:text-[--gr-1]"
                  aria-label={t("priceList.clear_search")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Filters row — category dropdown (only when there's more than
              one category) + "Sıfır Fiyatlı Ürünler" toggle. Both narrow
              the visible rows but neither touches `list`, so bulk apply
              and Save Changes still target the entire dataset. */}
          {(groupedByCategory.length > 1 ||
            list.some((p) =>
              (p.portions || []).some(
                (pt) => !Number.isFinite(Number(pt.price)) || Number(pt.price) <= 0,
              ),
            )) && (
            <div className="flex flex-col sm:flex-row sm:items-stretch gap-2 sm:gap-3">
              {groupedByCategory.length > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border border-[--border-1] bg-[--white-2]/60 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0 sm:w-44">
                    <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
                      <Filter className="size-3.5" />
                    </span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
                      {t("priceList.category_filter")}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CustomSelect
                      className="text-sm"
                      options={categoryOptions}
                      value={selectedOption}
                      onChange={(opt) => setCategoryFilter(opt?.value ?? null)}
                      isSearchable={false}
                    />
                  </div>
                  {categoryFilter != null && (
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 shrink-0">
                      {visibleGroups[0]?.products.length || 0}{" "}
                      {t("priceList.products")}
                    </span>
                  )}
                </div>
              )}

              {/* Zero-price toggle — same card-style as the Products page
                  duplicate / no-image switches so the visual language is
                  consistent. Tinted rose when active so it immediately
                  reads as "show me the warnings". */}
              <button
                type="button"
                role="switch"
                aria-checked={showZeroPriceOnly}
                onClick={() => setShowZeroPriceOnly((v) => !v)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left sm:w-72 shrink-0 ${
                  showZeroPriceOnly
                    ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 shadow-sm dark:bg-rose-500/15 dark:border-rose-400/40 dark:ring-rose-400/30"
                    : "bg-[--white-1] border-[--border-1] hover:border-rose-300 hover:bg-rose-50/40 dark:hover:bg-rose-500/10 dark:hover:border-rose-400/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition ${
                    showZeroPriceOnly
                      ? "bg-rose-500 border-rose-600"
                      : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
                  }`}
                >
                  <span
                    className={`inline-block size-4 rounded-full bg-white shadow-md transition-transform ${
                      showZeroPriceOnly
                        ? "translate-x-5"
                        : "translate-x-0.5"
                    } translate-y-[1px]`}
                  />
                </span>
                <span
                  className={`grid place-items-center size-8 rounded-lg shrink-0 transition ${
                    showZeroPriceOnly
                      ? "bg-rose-500 text-white shadow-sm shadow-rose-500/30"
                      : "bg-[--white-2] text-[--gr-1]"
                  }`}
                >
                  <CircleDollarSign className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] font-semibold leading-tight ${
                      showZeroPriceOnly
                        ? "text-rose-900 dark:text-rose-100"
                        : "text-[--black-1]"
                    }`}
                  >
                    {t("priceList.zero_price_only", "Sıfır Fiyatlı Ürünler")}
                  </div>
                  <div
                    className={`text-[10px] font-medium mt-0.5 ${
                      showZeroPriceOnly
                        ? "text-rose-700 dark:text-rose-300"
                        : "text-[--gr-1]"
                    }`}
                  >
                    {t(
                      "priceList.zero_price_only_hint",
                      "Yalnızca fiyatı 0 olan ürünleri göster",
                    )}
                  </div>
                </div>
              </button>
            </div>
          )}

          {groupedByCategory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <DollarSign className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("productsList.no_products")}
              </h3>
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <Filter className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("priceList.no_match")}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleGroups.map((group) => {
                // Hide both the Kampanya column header and the per-row
                // emerald input when this category isn't running
                // campaigns. Defaults to false until categories load,
                // so the campaign UI doesn't briefly flash on mount.
                const showCampaign = !!categoryCampaignMap.get(
                  group.categoryId,
                );
                return (
                <div
                  key={group.categoryId}
                  className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden"
                >
                  {/* Category header — strong indigo wash + brand-gradient
                      accent stripe so the user's eye catches every
                      category boundary while scrolling a long list.
                      The previous `bg-[--white-2]/80` blended into the
                      row backgrounds enough that long menus felt like
                      one undifferentiated wall of products. */}
                  <div className="relative flex items-center gap-2 pl-4 pr-3 py-2.5 bg-gradient-to-r from-indigo-100/80 via-indigo-50/70 to-transparent border-b-2 border-indigo-200/80 dark:from-indigo-500/20 dark:via-indigo-500/10 dark:to-transparent dark:border-indigo-400/30">
                    {/* Left accent stripe — pure visual cue, no layout
                        impact. Brand gradient (indigo → cyan) so the
                        header reads as part of the design system, not
                        a one-off decoration. */}
                    <span
                      aria-hidden
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-indigo-600 to-cyan-500"
                    />
                    <span className="grid place-items-center size-7 rounded-md bg-white text-indigo-600 ring-1 ring-indigo-200 shadow-sm shrink-0 dark:bg-indigo-500/25 dark:text-indigo-200 dark:ring-indigo-400/40">
                      <Layers className="size-3.5" />
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-100 truncate min-w-0">
                      {group.categoryName || "—"}
                    </h3>
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-white text-indigo-700 ring-1 ring-indigo-200 shrink-0 dark:bg-indigo-500/20 dark:text-indigo-100 dark:ring-indigo-400/40">
                      {group.products.reduce(
                        (n, p) => n + (p.portions?.length || 0),
                        0,
                      )}
                    </span>
                    <div className="flex-1" />
                    <span className="hidden sm:block w-24 sm:w-28 text-right text-[10px] font-bold uppercase tracking-wider text-[--gr-1] shrink-0">
                      {t("priceList.normal_price")}
                    </span>
                    {showCampaign && (
                      <span className="hidden sm:block w-24 sm:w-28 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">
                        {t("priceList.campaign")}
                      </span>
                    )}
                    {showSpecial && (
                      <span className="hidden sm:block w-24 sm:w-28 text-right text-[10px] font-bold uppercase tracking-wider text-orange-600 shrink-0">
                        {t("priceList.special")}
                      </span>
                    )}
                  </div>

                  {/* Rows */}
                  <div className="flex flex-col">
                    {group.products.map((prod) => {
                      const i = list.findIndex((p) => p.id === prod.id);
                      const currentProd = list[i];
                      if (!currentProd) return null;

                      return (
                        <React.Fragment key={prod.id}>
                          {(currentProd.portions || []).map((portion, pi) => {
                            const showPortion = portionNameVisible(
                              currentProd,
                              portion,
                            );
                            return (
                              <div
                                key={portion.id || pi}
                                // Single row at every breakpoint — name
                                // truncates, price inputs stay compact
                                // and grow with content via field-sizing
                                // on PriceInput. Was flex-col on mobile,
                                // which forced the user to scroll past
                                // the name before reaching the price.
                                className="flex items-center gap-2 sm:gap-3 px-3 py-2 border-b last:border-b-0 border-[--border-1] hover:bg-[--white-2]/60 transition-colors"
                              >
                                {/* Name + portion */}
                                <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                                  <span className="text-sm font-medium text-[--black-1] truncate">
                                    {currentProd.name}
                                  </span>
                                  {showPortion && (
                                    <span className="text-xs text-[--gr-1] truncate">
                                      – {portion.name}
                                    </span>
                                  )}
                                </div>

                                {/* Price inputs */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <PriceInput
                                    label={t("priceList.normal_price")}
                                    value={portion.price ?? ""}
                                    onChange={(v) =>
                                      updatePortion(i, pi, "price", Number(v))
                                    }
                                    onKeyDown={handleKeyDown}
                                    dataAttr="data-edit"
                                    tone="slate"
                                    decimals={decimals}
                                    // Drives the zero-price warning tone
                                    // and the hover tooltip — only the
                                    // Normal price column gets this; an
                                    // empty Kampanya/Özel column is
                                    // expected, not a problem.
                                    isZeroPriceTagged={tagPricedKeys.has(
                                      `${currentProd.id}|${portion.id}`,
                                    )}
                                    zeroPriceTaggedHint={t(
                                      "priceList.zero_priced_via_tag",
                                      "Bu fiyat 0 ama etiket seçimleriyle belirleniyor.",
                                    )}
                                    zeroPriceMissingHint={t(
                                      "priceList.zero_price_no_coverage",
                                      "Fiyat 0 ve hiçbir etiket seçimi de fiyat eklemiyor — bu ürün ücretsiz görünür.",
                                    )}
                                  />
                                  {showCampaign && (
                                    <PriceInput
                                      label={t("priceList.campaign")}
                                      value={portion.campaignPrice ?? ""}
                                      onChange={(v) =>
                                        updatePortion(
                                          i,
                                          pi,
                                          "campaignPrice",
                                          Number(v),
                                        )
                                      }
                                      onKeyDown={handleKeyDown}
                                      dataAttr="data-edit-second"
                                      tone="emerald"
                                      decimals={decimals}
                                    />
                                  )}
                                  {showSpecial && (
                                    <PriceInput
                                      label={t("priceList.special")}
                                      value={portion.specialPrice ?? ""}
                                      onChange={(v) =>
                                        updatePortion(
                                          i,
                                          pi,
                                          "specialPrice",
                                          Number(v),
                                        )
                                      }
                                      onKeyDown={handleKeyDown}
                                      dataAttr="data-edit-third"
                                      tone="orange"
                                      decimals={decimals}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Duplicate save bar at the bottom of the list — appears
              only when there are unsaved changes AND there's at least
              one category to render. Saves the user from scrolling
              back up to the hero header after editing prices on a
              long menu. Bottom button uses the longer
              "Değişiklikleri Kaydet" copy because it has the room. */}
          {dirty && groupedByCategory.length > 0 && (
            <div className="flex justify-end pt-3 border-t border-[--border-1]">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={loading}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-emerald-500/25 hover:brightness-110 active:brightness-95 transition shrink-0 disabled:opacity-60 bg-gradient-to-r from-emerald-500 to-emerald-600"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                {t("priceList.save_changes")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Currency-formatted price input. While not focused, the value is
// rendered with `Intl.NumberFormat("tr-TR")` so a saved 12500 reads
// as "12.500,00"; on focus we swap to a raw editable string ("12500"
// / "12500.5") so the user can type without fighting the locale's
// thousand separator. `decimals` comes from the restaurant's
// `decimalPoint` setting (Genel Ayarlar → Kuruş Hanesi); both
// fraction-digit limits use it so users with a 0-decimal currency
// (e.g. JPY) get a clean integer display.
//
// Width is computed from the displayed string so a long price like
// "999.999,00" pushes the input wider instead of clipping. The old
// `field-sizing: content` style proved unreliable on type="number"
// in production browsers, hence the manual width calc.
const PriceInput = ({
  label,
  value,
  onChange,
  onKeyDown,
  dataAttr,
  tone,
  decimals = 2,
  // Zero-price warning props (only meaningful for the Normal column).
  // When the value is 0 we override the configured `tone` with either
  // amber (priced via OrderTag selections — informational) or rose
  // (genuinely unpriced — actual problem). The hint strings drive the
  // hover tooltip via the `title` attribute.
  isZeroPriceTagged = false,
  zeroPriceTaggedHint = "",
  zeroPriceMissingHint = "",
}) => {
  const tones = {
    slate:
      "border-[--border-1] bg-[--white-1] text-[--black-1] focus:border-indigo-500 focus:ring-indigo-100",
    // Dark variants matter — without them the light bg-emerald-50/40
    // composites with a dark parent into a muddy near-black, and the
    // dark text-emerald-700 disappears into it. Switch to a brighter
    // tinted wash + light emerald text in dark mode.
    emerald:
      "border-emerald-200 bg-emerald-50/40 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20",
    // Orange — Özel Fiyat. Same dark-variant treatment as emerald so
    // the input stays readable on either theme.
    orange:
      "border-orange-200 bg-orange-50/40 text-orange-700 focus:border-orange-500 focus:ring-orange-100 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200 dark:focus:border-orange-400 dark:focus:ring-orange-400/20",
    // Amber — "fiyat 0 ama etiket seçimleriyle fiyatlandırılıyor".
    // Informational, not an error: the row IS priced, just dynamically.
    amber:
      "border-amber-300 bg-amber-50/60 text-amber-800 focus:border-amber-500 focus:ring-amber-100 dark:border-amber-400/40 dark:bg-amber-500/15 dark:text-amber-200 dark:focus:border-amber-400 dark:focus:ring-amber-400/20",
    // Rose — "fiyat 0 ve etiket de yok". Actual problem: the customer
    // would see a zero-price row.
    rose:
      "border-rose-300 bg-rose-50/60 text-rose-800 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-400/40 dark:bg-rose-500/15 dark:text-rose-200 dark:focus:border-rose-400 dark:focus:ring-rose-400/20",
  };

  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );

  const [focused, setFocused] = useState(false);
  const [editStr, setEditStr] = useState("");

  const display = focused ? editStr : formatter.format(numericValue);

  const handleFocus = (e) => {
    // Show the raw number while editing so TR thousand separators
    // don't trip up keyboard input. Empty for zero so users don't
    // have to backspace before typing the new amount.
    setEditStr(numericValue ? String(numericValue) : "");
    setFocused(true);
    // Auto-select so a fresh number replaces the existing one.
    e.target.select();
  };

  const handleChange = (e) => {
    // Only allow digit / dot / comma; comma is the TR decimal sep
    // (mapped to `.` for parseFloat). Discarding other chars stops
    // the user from typing locale separators that would corrupt the
    // parsed value.
    const raw = e.target.value.replace(/[^0-9.,]/g, "");
    setEditStr(raw);
    const normalized = raw.replace(",", ".");
    const n = parseFloat(normalized);
    onChange(Number.isFinite(n) ? n : 0);
  };

  const handleBlur = () => setFocused(false);

  // Width = content + padding + breathing. The `px-2` className adds
  // 1rem of horizontal padding inside the input; without folding that
  // into the explicit `width` the last digit gets clipped (because
  // `width` covers the entire box, not just the text). +1ch on top
  // gives a single character of breathing room on the right edge.
  const contentCh = Math.max(4, display.length); // 4 = "0,00"
  const widthValue = `calc(${contentCh + 1}ch + 1rem)`;

  // Resolve the effective tone + hover tooltip. When the value is 0
  // we override the configured tone with amber (tag-priced) or rose
  // (no coverage); a positive value falls back to whatever the column
  // wanted (slate/emerald/orange).
  const isZero = !Number.isFinite(numericValue) || numericValue <= 0;
  let effectiveTone = tone;
  let titleAttr = label;
  if (isZero && (zeroPriceTaggedHint || zeroPriceMissingHint)) {
    if (isZeroPriceTagged) {
      effectiveTone = "amber";
      titleAttr = zeroPriceTaggedHint;
    } else {
      effectiveTone = "rose";
      titleAttr = zeroPriceMissingHint;
    }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      aria-label={label}
      placeholder={label}
      title={titleAttr}
      {...{ [dataAttr]: true }}
      style={{ width: widthValue }}
      className={`h-9 px-2 text-right text-sm font-semibold tabular-nums rounded-md border outline-none transition focus:ring-4 shrink-0 ${tones[effectiveTone] || tones.slate}`}
    />
  );
};

export default PriceList;
