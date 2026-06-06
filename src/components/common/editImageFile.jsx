// Image crop / rotate / flip dialog — used everywhere a user uploads a
// product / category / restaurant photo (addRestaurant, editRestaurant,
// externalPage, customFileInput, …). Mounted via PopupContext's
// `setCropImgPopup`, which renders us inside the dedicated crop slot
// (`<Popup />` in App.jsx) so we don't compete with the regular popup
// stack.
//
// The previous version used a fixed 400px cropper height + hard-coded
// max-w-4xl wrapper + side-by-side aspect/tools rows that overflowed
// horizontally on phones AND vertically on landscape. This rewrite:
//   • uses dynamic-viewport-units (dvh) so the modal respects mobile
//     browser chrome (URL bar, bottom toolbar)
//   • flexes the cropper between min / max bounds based on viewport
//   • stacks the aspect-ratio + tool rows on narrow widths and makes
//     the buttons wrap instead of overflow
//   • drops the ad-hoc inline SVGs in favour of the lucide icon set
//     used throughout the rest of the admin so visual weight matches
//
// Modal is used in many places — keep the prop contract (file, onSave)
// stable so call sites don't need to be touched.

import "cropperjs/dist/cropper.css";
import Cropper from "react-cropper";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Crop,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  Undo2,
  Check,
} from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// The cropper rasterizes onto a <canvas> and re-encodes the result as
// JPEG (canvas.toBlob(..., "image/jpeg") below). So the produced File MUST
// be labelled JPEG too. The old code kept the SOURCE name + type on those
// JPEG bytes — e.g. a "photo.webp" / "image/webp" wrapper around JPEG data.
// That name/type/bytes mismatch made the backend reject the upload for
// WEBP (its extension / magic-byte check failed); JPEG/PNG happened to
// slip through. Normalising the filename's extension to .jpg keeps the
// name, the MIME type and the actual bytes consistent.
const toJpegFileName = (name) => {
  const base = (name || "image").replace(/\.[^/.]+$/, "").trim();
  return `${base || "image"}.jpg`;
};

// Aspect-ratio presets surfaced as pill buttons. The numeric value is
// what cropperjs expects; `NaN` switches the cropper to free-form mode.
const ASPECT_PRESETS = [
  { value: 16 / 9, label: "16:9" },
  { value: 4 / 3, label: "4:3" },
  { value: 1, label: "1:1" },
];

const EditImageFile = ({ file, onSave }) => {
  const { t } = useTranslation();
  const cropperRef = useRef(null);
  const { setCropImgPopup } = usePopup();
  const [imageURL, setImageURL] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(4 / 3);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageURL(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleAspectRatio = (ratio) => {
    setAspectRatio(ratio);
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      cropper.setAspectRatio(ratio);
    }
  };

  const cropImage = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      onClose();
      return;
    }

    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
      if (blob) {
        // Re-wrap the JPEG blob as a File. Name + type MUST match the
        // bytes (JPEG) — keeping the source .webp/.png name + type here is
        // what caused WEBP uploads to fail (mismatched extension vs JPEG
        // content). See toJpegFileName above.
        const croppedFile = new File([blob], toJpegFileName(file.name), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        onSave(croppedFile);
        onClose();
      }
    }, "image/jpeg");
  };

  const onClose = () => {
    setImageURL(null);
    setCropImgPopup(null);
  };

  const handleRotateLeft = () => cropperRef.current?.cropper.rotate(-90);
  const handleRotateRight = () => cropperRef.current?.cropper.rotate(90);

  const handleFlipHorizontal = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const imageData = cropper.getImageData();
    cropper.scaleX(imageData.scaleX === 1 ? -1 : 1);
  };

  const handleFlipVertical = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    const imageData = cropper.getImageData();
    cropper.scaleY(imageData.scaleY === 1 ? -1 : 1);
  };

  const handleReset = () => cropperRef.current?.cropper.reset();
  const handleZoomIn = () => cropperRef.current?.cropper.zoom(0.1);
  const handleZoomOut = () => cropperRef.current?.cropper.zoom(-0.1);

  // Pill style helper for aspect-ratio buttons — keeps the active /
  // inactive variants in one place instead of duplicating Tailwind
  // strings inline four times.
  const ratioPillCls = (active) =>
    `inline-flex items-center justify-center h-8 px-3 rounded-md text-[11px] font-semibold transition ${
      active
        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
        : "bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] hover:bg-[--white-2] hover:text-[--black-1]"
    }`;

  // Tool icon button — square, tinted on hover.
  const toolBtnCls =
    "grid place-items-center size-9 rounded-md bg-[--white-1] text-[--gr-1] ring-1 ring-[--border-1] hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200 transition dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200 dark:hover:ring-indigo-400/30";

  return (
    <div className="bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] w-full max-w-3xl mx-auto flex flex-col max-h-[95dvh] overflow-hidden">
      {/* Brand strip — matches the other settings modals (Announcement,
          External Page, EditRestaurant) so this dialog feels like part
          of the same design system. */}
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* Header */}
      <header className="flex items-center gap-3 px-3 sm:px-5 py-3 border-b border-[--border-1] shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Crop className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold text-[--black-1] truncate tracking-tight">
            {t("cropImage.title")}
          </h3>
          {file?.name && (
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {file.name}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("cropImage.cancel")}
          className="grid place-items-center size-8 rounded-md text-[--gr-2] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      {/* Body — scrollable so even a tiny landscape phone can reach
          everything; the cropper itself is height-clamped so the body
          rarely needs to scroll on reasonable viewports. */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[--white-2]/30">
        {/* Cropper — height adapts to viewport (50dvh on mobile, ~480px
            cap on desktop) with a 220px floor so the cropper handles
            stay tappable on landscape phones with very low height. */}
        <div className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden">
          {imageURL ? (
            <Cropper
              ref={cropperRef}
              src={imageURL}
              style={{
                width: "100%",
                height: "min(55dvh, 480px)",
                minHeight: 220,
              }}
              aspectRatio={aspectRatio}
              guides={true}
              background={false}
              responsive={true}
              autoCropArea={1}
              checkOrientation={false}
              viewMode={1}
            />
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ height: "min(55dvh, 480px)", minHeight: 220 }}
            >
              <p className="text-sm text-[--gr-1]">
                {t("cropImage.preview_loading")}
              </p>
            </div>
          )}
        </div>

        {/* Aspect-ratio row — label on top of the buttons on mobile so
            the touch targets keep their full width, side-by-side on
            sm: where there's horizontal room. */}
        <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] shrink-0">
            {t("cropImage.size_label")}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            {ASPECT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleAspectRatio(preset.value)}
                className={ratioPillCls(aspectRatio === preset.value)}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleAspectRatio(NaN)}
              className={ratioPillCls(Number.isNaN(aspectRatio))}
            >
              {t("cropImage.free_ratio")}
            </button>
          </div>
        </div>

        {/* Tools row — flex-wrap so seven small buttons collapse onto
            two lines on tiny widths instead of overflowing. */}
        <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] shrink-0">
            {t("cropImage.tools_label")}
          </span>
          <div className="flex flex-wrap gap-1.5 sm:ml-auto">
            <button
              type="button"
              onClick={handleZoomIn}
              title={t("cropImage.zoom_in")}
              aria-label={t("cropImage.zoom_in")}
              className={toolBtnCls}
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              title={t("cropImage.zoom_out")}
              aria-label={t("cropImage.zoom_out")}
              className={toolBtnCls}
            >
              <ZoomOut className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateLeft}
              title={t("cropImage.rotate_left")}
              aria-label={t("cropImage.rotate_left")}
              className={toolBtnCls}
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleRotateRight}
              title={t("cropImage.rotate_right")}
              aria-label={t("cropImage.rotate_right")}
              className={toolBtnCls}
            >
              <RotateCw className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleFlipHorizontal}
              title={t("cropImage.flip_horizontal")}
              aria-label={t("cropImage.flip_horizontal")}
              className={toolBtnCls}
            >
              <FlipHorizontal2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleFlipVertical}
              title={t("cropImage.flip_vertical")}
              aria-label={t("cropImage.flip_vertical")}
              className={toolBtnCls}
            >
              <FlipVertical2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              title={t("cropImage.reset")}
              aria-label={t("cropImage.reset")}
              className={toolBtnCls}
            >
              <Undo2 className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer action bar — primary action is full-width on mobile so
          it's a clean thumb target; on sm: it sits to the right of the
          cancel button as the conventional "OK" position. */}
      <footer className="px-3 sm:px-5 py-3 border-t border-[--border-1] shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-[--white-1]">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center h-10 px-5 rounded-lg text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] hover:bg-[--white-2] hover:text-[--black-1] transition"
        >
          {t("cropImage.cancel")}
        </button>
        <button
          type="button"
          onClick={cropImage}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-sm font-semibold text-white shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Check className="size-4" strokeWidth={2.75} />
          {t("cropImage.save")}
        </button>
      </footer>
    </div>
  );
};

export default EditImageFile;
