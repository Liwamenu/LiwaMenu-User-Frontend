// MODULES
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  Image as ImageIcon,
  Pencil,
  Trash2,
  TrendingUp,
  Check,
} from "lucide-react";

// COMP
import DeleteProduct from "./deleteProduct";
import { usePopup } from "../../../context/PopupContext";

const ProductCard = ({
  product,
  onDeleted,
  selectable,
  selected,
  onToggleSelect,
}) => {
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
      className={`group flex flex-col sm:flex-row gap-3 p-3 rounded-xl border transition ${
        selected
          ? "border-rose-400 ring-2 ring-rose-100 shadow-sm bg-rose-50/40 dark:bg-rose-500/10 dark:ring-rose-400/20 dark:border-rose-400/40"
          : isHidden
            ? "border-rose-100 bg-rose-50/20 bg-[--white-1]"
            : "border-[--border-1] bg-[--white-1] hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      {selectable && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(product.id)}
          aria-pressed={!!selected}
          aria-label={
            selected
              ? t("productsList.deselect_product", "Seçimi kaldır")
              : t("productsList.select_product", "Seç")
          }
          title={
            selected
              ? t("productsList.deselect_product", "Seçimi kaldır")
              : t("productsList.select_product", "Seç")
          }
          className={`shrink-0 grid place-items-center size-5 sm:size-5 rounded-md border transition ${
            selected
              ? "bg-rose-600 border-rose-600 text-white shadow-sm"
              : "bg-[--white-1] border-[--border-1] text-transparent hover:border-rose-400 hover:text-rose-200"
          } self-start sm:self-center`}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </button>
      )}

      {/* LEFT: image + name + meta */}
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="size-16 sm:size-20 rounded-lg ring-1 ring-[--border-1] bg-[--white-2] grid place-items-center overflow-hidden shrink-0">
          {!product.imageURL || imgError ? (
            <ImageIcon className="size-6 text-[--gr-3]" />
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
            <h3 className="text-sm font-semibold text-[--black-1] truncate flex-1 min-w-0">
              {product.name}
            </h3>
            {/* Only flag CLOSED products — open is the default, no need to
                shout about it on every card. */}
            {isHidden && (
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30">
                {t("editCategories.status_closed")}
              </span>
            )}
          </div>

          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {product.categoryName && (
              <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md">
                {product.categoryName}
              </span>
            )}
            {/* Only flag the portion count when there are multiple — single
                portions are the default and don't need a chip. */}
            {portionCount > 1 && (
              <span className="inline-flex items-center text-[10px] font-medium text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1] px-1.5 py-0.5 rounded-md">
                {t("productCard.portion_count", { count: portionCount })}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-1 text-[11px] text-[--gr-1] italic line-clamp-2 leading-snug">
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
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-[--white-2] border border-[--border-1]"
            >
              <span className="text-xs font-medium text-[--black-2] truncate min-w-0">
                {portion.name}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-bold text-[--black-1] tabular-nums">
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
            <span className="text-[10px] text-[--gr-2] italic px-1">
              +{portionCount - 4}
            </span>
          )}
        </div>
      )}

      {/* RIGHT: action buttons */}
      <div className="flex sm:flex-col gap-1 sm:gap-1 sm:justify-center shrink-0 sm:border-l sm:border-[--border-1] sm:pl-2">
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
            setSecondPopupContent(
              <DeleteProduct product={product} onSuccess={onDeleted} />,
            )
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
