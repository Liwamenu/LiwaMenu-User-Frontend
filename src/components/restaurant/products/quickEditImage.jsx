// Quick image-only edit popup for the Products list. The full Edit
// Product form is overkill when the user just wants to swap the photo
// — this modal shows current/new previews side-by-side, takes a single
// file, and dispatches the existing editProduct thunk with all current
// fields preserved (the backend's PUT contract requires the whole
// product, not a partial). Auto-invalidation of the lite cache happens
// downstream via getProductsLiteSlice's matcher on EditProduct.fulfilled.
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { Image as ImageIcon, X, Save, Loader2, Camera } from "lucide-react";

import CustomFileInput from "../../common/customFileInput";
import { usePopup } from "../../../context/PopupContext";
import { parsePrice } from "../../../utils/utils";
import {
  editProduct,
  resetEditProduct,
} from "../../../redux/products/editProductSlice";

const QuickEditImage = ({ product, onSaved }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setSecondPopupContent } = usePopup();
  const { success, error, loading } = useSelector((s) => s.products.edit);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Revoke any pending blob URL on unmount or when a new preview replaces
  // it; the file picker creates a fresh blob URL on every selection.
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Save success → close modal and refresh the list via the
  // parent-supplied onSaved (mirrors the EditProduct popup contract).
  useEffect(() => {
    if (success) {
      toast.success(t("quickEditImage.success"));
      dispatch(resetEditProduct());
      setSecondPopupContent(null);
      if (onSaved) onSaved();
    }
    if (error) dispatch(resetEditProduct());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  const handleFileChange = (selectedFile) => {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    if (!selectedFile) {
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSave = () => {
    if (!file) {
      toast.error(t("quickEditImage.no_file"));
      return;
    }

    // Backend PUT /Products/EditProduct expects the full product DTO.
    // Mirror the field set used by editProduct.jsx (handleSave) so the
    // shape is identical and only the image actually changes.
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("restaurantId", product.restaurantId);
    formData.append("name", product.name || "");
    formData.append("description", product.description || "");
    formData.append("recommendation", !!product.recommendation);
    formData.append("hide", !!product.hide);
    formData.append("categoryId", product.categoryId || "");
    formData.append("subCategoryId", product.subCategoryId || "");
    formData.append("freeTagging", !!product.freeTagging);
    formData.append("image", file);

    const portions = (product.portions || []).map((p) => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      price: parsePrice(p.price),
      campaignPrice: parsePrice(p.campaignPrice),
      specialPrice: parsePrice(p.specialPrice),
    }));
    formData.append("portions", JSON.stringify(portions));

    dispatch(editProduct(formData));
  };

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-2] text-[--black-2] rounded-[24px] p-6 sm:p-7 w-full max-w-[480px] flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="grid place-items-center size-10 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0 bg-gradient-to-br from-indigo-500 to-cyan-500">
              <Camera className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-[--black-1] truncate">
                {t("quickEditImage.title")}
              </h2>
              <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
                {product.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSecondPopupContent(null)}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-1] hover:text-[--black-1] transition shrink-0"
            aria-label={t("quickEditImage.close")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* SIDE-BY-SIDE PREVIEW */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-[--gr-1] mb-1.5">
              {t("quickEditImage.current")}
            </span>
            <div className="aspect-square rounded-lg ring-1 ring-[--border-1] bg-[--white-1] grid place-items-center overflow-hidden">
              {product.imageURL ? (
                <img
                  src={product.imageURL}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-8 text-[--gr-3]" />
              )}
            </div>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-wider text-indigo-600 mb-1.5">
              {t("quickEditImage.new")}
            </span>
            <div
              className={`aspect-square rounded-lg ring-2 ${
                preview ? "ring-indigo-300" : "ring-dashed ring-[--border-1]"
              } bg-[--white-1] grid place-items-center overflow-hidden`}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="preview"
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-8 text-[--gr-3]" />
              )}
            </div>
          </div>
        </div>

        {/* FILE PICKER — reuses CustomFileInput so we get drag-drop, size
            validation, and the cropping flow for free. */}
        <CustomFileInput
          onChange={handleFileChange}
          value={file}
          accept="image/png, image/jpeg, image/gif, image/webp"
          showFileDetails={false}
          editIfImage={true}
        />

        {/* ACTIONS */}
        <div className="flex gap-3 mt-5 text-sm">
          <button
            type="button"
            onClick={() => setSecondPopupContent(null)}
            className="flex-1 py-2.5 px-4 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--white-1] transition-colors"
          >
            {t("quickEditImage.cancel")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!file || loading}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-indigo-500/25"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("quickEditImage.save")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default QuickEditImage;
