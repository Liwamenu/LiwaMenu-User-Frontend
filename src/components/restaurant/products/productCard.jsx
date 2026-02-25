//MODULES
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

//COMP
import DeleteProduct from "./deleteProduct";
import { DeleteI, EditI } from "../../../assets/icon";
import { usePopup } from "../../../context/PopupContext";

const ProductCard = ({ product }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const { setSecondPopupContent } = usePopup();
  const { t } = useTranslation();

  return (
    <div className="bg-[--white-1] rounded-2xl shadow-sm border border-[--gr-4] p-6 mb-4 flex flex-col md:flex-row gap-6 relative group hover:shadow-md transition-shadow duration-200">
      {/* Left: Image & Basic Info */}
      <div className="flex flex-col-md:flex-row gap-4 md:w-5/12">
        {/* Image / Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-lg bg-[--gr-4] overflow-hidden flex items-center justify-center text-[--gr-1] font-bold">
            {!product.imageURL || imgError ? (
              <div
                className={`w-full h-full flex items-center justify-center bg-[--gr-4] text-[--gr-2] font-bold text-lg `}
              >
                {!product.image && t("productCard.no_image")}
              </div>
            ) : (
              <img
                src={product.imageURL}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>

        {/* Text Info */}
        <div className="flex flex-col justify-center">
          <h3 className="text-lg font-bold text-[--black-2]">{product.name}</h3>
          <span className="text-[--gr-1] text-sm font-medium">
            {product.categoryName}
          </span>
          <div className="flex gap-1">
            <p className="min-w-[.1rem] bg-[--gr-3] mt-2"></p>
            <p className="text-[--gr-2] text-xs italic mt-2 leading-relaxed">
              "{product.description?.slice(0, 50)}"
              {product.description?.length > 50 && "..."}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Portions & Prices */}
      <div className="flex-1 flex flex-col justify-center">
        {product.portions.map((portion, idx) => (
          <div
            key={portion.id}
            className={`flex flex-wrap items-center justify-between bg-[--light-1] p-2 first:rounded-t-md last:rounded-b-md border border-[--gr-4] border-b-[--gr-3] last:border-b-[--gr-4] hover:bg-[--gr-4]`}
          >
            <span className="text-[--black-2] font-medium text-base">
              {portion.name}
            </span>

            <div className="flex flex-col items-end text-right gap-0.5">
              <span className="text-[--black-2] font-bold text-lg">
                {portion.price.toLocaleString("tr-TR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </span>

              {portion.campaignPrice > 0 && (
                <span className="text-[--green-1] text-xs font-semibold">
                  {t("productCard.campaign_prefix")} {portion.campaignPrice}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons - Absolute bottom right or flex end on mobile */}
      <div className="flex md:flex-col justify-end max-md:gap-2 mt-4 md:mt-0 md:justify-center md:pl-4">
        <div className="mb-1">
          <span
            className={`${
              product.hide
                ? "bg-[--status-red] text-[--red-1]"
                : "bg-[--status-green] text-[--green-1]"
            } px-3 py-1 rounded-full text-xs font-semibold`}
          >
            {product.hide
              ? t("editCategories.status_closed")
              : t("editCategories.status_open")}
          </span>
        </div>

        <button
          className="max-w-min p-2 hover:bg-[--light-3] rounded-full transition-colors md:ml-1.5"
          onClick={() =>
            navigate(`/restaurant/products/${id}/edit/${product.id}`, {
              state: { product },
            })
          }
        >
          <EditI strokeWidth={1.5} className="size-[1.3rem] text-[--black-2]" />
        </button>

        <button
          className="max-w-min p-2 hover:bg-[--light-3] rounded-full transition-colors md:ml-1.5"
          onClick={() =>
            setSecondPopupContent(<DeleteProduct product={product} />)
          }
        >
          <DeleteI strokeWidth={1.5} className="size-[1.3rem] text-[--red-1]" />
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
