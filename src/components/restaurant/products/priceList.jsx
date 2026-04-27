// MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DollarSign, Save, Layers, Loader2 } from "lucide-react";

// COMP
import ProductsHeader from "./header";
import PriceListApplyBulk from "./priceListApplyBulk";

// REDUX
import {
  updatePriceList,
  resetUpdatePriceList,
} from "../../../redux/products/updatePriceListSlice";
import { getProducts } from "../../../redux/products/getProductsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const PriceList = () => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const restaurantId = params.id;
  const containerRef = useRef(null);

  const { products } = useSelector((s) => s.products.get);
  const { success, error, loading } = useSelector(
    (s) => s.products.updatePriceList,
  );

  const [list, setList] = useState([]);
  const [listBefore, setListBefore] = useState([]);

  const updatePortion = (pIndex, portionIndex, key, value) => {
    setList((prev) => {
      const next = [...prev];
      const portions = [...(next[pIndex].portions || [])];
      portions[portionIndex] = { ...portions[portionIndex], [key]: value };
      next[pIndex] = { ...next[pIndex], portions };
      return next;
    });
  };

  // Fetch products on mount.
  useEffect(() => {
    if (!list.length) {
      dispatch(getProducts({ restaurantId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  // On products load, set local editable list and compute groups.
  useEffect(() => {
    const productsList = (products?.data?.length && products.data) || [];
    const initialList = productsList.map((p) => ({
      ...p,
      portions: (p.portions || []).map((pt) => ({
        ...pt,
        name: pt.name ?? "",
        price: pt.price ?? "",
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
    <div className="w-full pb-8 mt-1 text-slate-900">
      {/* Top tabs */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        ref={containerRef}
      >
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100 flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <DollarSign className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-slate-900 truncate tracking-tight">
              {t("priceList.title")}
            </h1>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
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
              <span className="hidden sm:inline">
                {t("priceList.save_changes")}
              </span>
            </button>
          )}
        </div>

        <div className="p-3 sm:p-5 space-y-4">
          <PriceListApplyBulk list={list} setList={setList} />

          {groupedByCategory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <DollarSign className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900">
                {t("productsList.no_products")}
              </h3>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedByCategory.map((group) => (
                <div
                  key={group.categoryId}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Category header — count sits next to the name; the two
                      price column labels live on the right and align with the
                      input columns below. */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/80 border-b border-slate-100">
                    <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                      <Layers className="size-3.5" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate min-w-0">
                      {group.categoryName || "—"}
                    </h3>
                    <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 shrink-0">
                      {group.products.reduce(
                        (n, p) => n + (p.portions?.length || 0),
                        0,
                      )}
                    </span>
                    <div className="flex-1" />
                    <span className="hidden sm:block w-24 sm:w-28 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">
                      {t("priceList.normal_price")}
                    </span>
                    <span className="hidden sm:block w-24 sm:w-28 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600 shrink-0">
                      {t("priceList.campaign")}
                    </span>
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
                                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2 border-b last:border-b-0 border-slate-100 hover:bg-slate-50/60 transition-colors"
                              >
                                {/* Name + portion */}
                                <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
                                  <span className="text-sm font-medium text-slate-900 truncate">
                                    {currentProd.name}
                                  </span>
                                  {showPortion && (
                                    <span className="text-xs text-slate-500 truncate">
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
                                  />
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
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Single bare input — column labels live in the category header to keep each
// row visually compact. `aria-label` is still set so screen readers know which
// price they are editing.
const PriceInput = ({ label, value, onChange, onKeyDown, dataAttr, tone }) => {
  const tones = {
    slate:
      "border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-indigo-100",
    emerald:
      "border-emerald-200 bg-emerald-50/40 text-emerald-700 focus:border-emerald-500 focus:ring-emerald-100",
  };
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      aria-label={label}
      placeholder={label}
      {...{ [dataAttr]: true }}
      className={`w-24 sm:w-28 h-9 px-2 text-right text-sm font-semibold tabular-nums rounded-md border outline-none transition focus:ring-4 shrink-0 ${tones[tone] || tones.slate}`}
    />
  );
};

export default PriceList;
