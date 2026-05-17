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
  Camera,
  ChefHat,
} from "lucide-react";

// COMP
import DeleteProduct from "./deleteProduct";
import { usePopup } from "../../../context/PopupContext";

const ProductCard = ({
  product,
  onDeleted,
  // Optional: when provided, the Pencil button opens edit via this
  // callback (so the parent list can host EditProduct as a popup
  // and stay mounted, preserving its filter/page state). When not
  // provided, falls back to the legacy full-page navigation.
  onEdit,
  // Optional: when provided, the Camera button opens a quick photo-
  // swap popup via this callback. Without it, the button is hidden
  // (so callers that don't wire the popup don't get a dead button).
  onChangeImage,
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
      className={`group flex flex-col gap-3 p-3 rounded-xl border transition ${
        selected
          ? "border-rose-400 ring-2 ring-rose-100 shadow-sm bg-rose-50/40 dark:bg-rose-500/10 dark:ring-rose-400/20 dark:border-rose-400/40"
          : isHidden
            ? "border-rose-100 bg-rose-50/20 bg-[--white-1]"
            : "border-[--border-1] bg-[--white-1] hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      {/* Top region: checkbox + product info + portions. Buttons used to
          live on the right edge here (desktop) or stacked at the bottom
          on mobile, but the desktop placement was small and the mobile
          one was easy to thumb-miss. They've been moved to a dedicated
          horizontal strip below so they're always large, consistent and
          tappable. */}
      <div className="flex flex-col sm:flex-row gap-3">
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
            {/* One chip per category membership. m2m products can sit
                under multiple categories; surfacing all of them avoids
                the misleading "this product is only in X" impression
                you'd get if we kept reading the flat `categoryName`
                alias (which is just memberships[0].categoryName). */}
            {(product.categories || [])
              .filter((c) => c?.categoryName)
              .map((c) => (
                <span
                  key={c.categoryId || c.categoryName}
                  className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1.5 py-0.5 rounded-md"
                >
                  {c.categoryName}
                </span>
              ))}
            {/* Chef's pick — same chip family as the others, amber tone +
                ChefHat icon. Surfaces the `recommendation` flag the user
                already sets on the Edit Product form so it's visible at
                a glance without opening the product. */}
            {product.recommendation && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-1.5 py-0.5 rounded-md dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
                <ChefHat className="size-3" strokeWidth={2.25} />
                {t("productCard.chef_recommended", "Şef Tavsiyesi")}
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

      </div>

      {/* BOTTOM: action buttons. Center-aligned horizontal strip below
          the card content. Each button has a tinted default background
          + ring so it reads as a real button at rest (the previous
          ghost-text-only state was easy to miss); hover deepens the
          tint. Mobile collapses labels to icons only to keep the strip
          compact. */}
      <div className="flex justify-center items-center gap-1.5 pt-2 border-t border-[--border-1]/70">
        <button
          type="button"
          onClick={() => {
            if (onEdit) {
              onEdit(product);
              return;
            }
            navigate(`/restaurant/products/${id}/edit/${product.id}`, {
              state: { product },
            });
          }}
          title={t("productCard.edit")}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-100 hover:ring-indigo-200 transition dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30 dark:hover:bg-indigo-500/25"
        >
          <Pencil className="size-4" />
          <span className="hidden sm:inline">{t("productCard.edit")}</span>
        </button>
        {/* Quick photo swap — only rendered when the parent wires the
            handler. Distinct emerald tone from Pencil/Trash so the row
            still reads as three discrete actions. */}
        {onChangeImage && (
          <button
            type="button"
            onClick={() => onChangeImage(product)}
            title={t("productCard.change_image", "Fotoğrafı Değiştir")}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 hover:ring-emerald-200 transition dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30 dark:hover:bg-emerald-500/25"
          >
            <Camera className="size-4" />
            <span className="hidden sm:inline">
              {t("productCard.change_image", "Fotoğrafı Değiştir")}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            setSecondPopupContent(
              <DeleteProduct product={product} onSuccess={onDeleted} />,
            )
          }
          title={t("productCard.delete")}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-100 hover:bg-rose-100 hover:ring-rose-200 transition dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30 dark:hover:bg-rose-500/25"
        >
          <Trash2 className="size-4" />
          <span className="hidden sm:inline">{t("productCard.delete")}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
