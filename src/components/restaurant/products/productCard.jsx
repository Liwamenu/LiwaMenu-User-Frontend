// MODULES
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Pencil,
  Trash2,
  TrendingUp,
} from "lucide-react";

// COMP
import DeleteProduct from "./deleteProduct";
import { usePopup } from "../../../context/PopupContext";

const ProductCard = ({ product }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const { setSecondPopupContent } = usePopup();
  const { t } = useTranslation();

  const isHidden = !!product.hide;
  const portionCount = Array.isArray(product.portions)
    ? product.portions.length
    : 0;

  return (
    <div
      className={`group flex flex-col sm:flex-row gap-3 p-3 rounded-xl border bg-white transition ${
        isHidden
          ? "border-rose-100 bg-rose-50/20"
          : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      {/* LEFT: image + name + meta */}
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="size-16 sm:size-20 rounded-lg ring-1 ring-slate-200 bg-slate-50 grid place-items-center overflow-hidden shrink-0">
          {!product.imageURL || imgError ? (
            <ImageIcon className="size-6 text-slate-300" />
          ) : (
            <img
              src={product.imageURL}
              alt={product.name}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          )}
        </div>

        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold text-slate-900 truncate flex-1 min-w-0">
              {product.name}
            </h3>
            <span
              className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
                isHidden
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                  : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              }`}
            >
              {isHidden
                ? t("editCategories.status_closed")
                : t("editCategories.status_open")}
            </span>
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {product.categoryName && (
              <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md">
                {product.categoryName}
              </span>
            )}
            {portionCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-medium text-slate-600 bg-slate-50 ring-1 ring-slate-200 px-1.5 py-0.5 rounded-md">
                {t("productCard.portion_count", { count: portionCount })}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-1 text-[11px] text-slate-500 italic line-clamp-2 leading-snug">
              "{product.description}"
            </p>
          )}
        </div>
      </div>

      {/* MIDDLE: portions list */}
      {portionCount > 0 && (
        <div className="flex flex-col gap-1 sm:w-[14rem] md:w-[16rem] shrink-0">
          {product.portions.slice(0, 4).map((portion) => (
            <div
              key={portion.id}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-100"
            >
              <span className="text-xs font-medium text-slate-700 truncate min-w-0">
                {portion.name}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-slate-900 tabular-nums">
                  {Number(portion.price).toLocaleString("tr-TR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {portion.campaignPrice > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-1 py-0.5 rounded">
                    <TrendingUp className="size-2.5" strokeWidth={3} />
                    {Number(portion.campaignPrice).toLocaleString("tr-TR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>
            </div>
          ))}
          {portionCount > 4 && (
            <span className="text-[10px] text-slate-400 italic px-1">
              +{portionCount - 4}
            </span>
          )}
        </div>
      )}

      {/* RIGHT: action buttons */}
      <div className="flex sm:flex-col gap-1 sm:gap-1 sm:justify-center shrink-0 sm:border-l sm:border-slate-100 sm:pl-2">
        <button
          type="button"
          onClick={() =>
            navigate(`/restaurant/products/${id}/edit/${product.id}`, {
              state: { product },
            })
          }
          title={t("editCategories.edit")}
          className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            setSecondPopupContent(<DeleteProduct product={product} />)
          }
          title={t("editCategories.delete")}
          className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
