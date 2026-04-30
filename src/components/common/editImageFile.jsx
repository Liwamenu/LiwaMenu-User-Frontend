//MODULES
import "cropperjs/dist/cropper.css";
import Cropper from "react-cropper";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

//CONTEXT
import { usePopup } from "../../context/PopupContext";
import { CancelI } from "../../assets/icon";

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

  const cropImage = async () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) {
      onClose();
      return;
    }

    const canvas = cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
      if (blob) {
        // Create a new File object from the blob with the original filename
        const croppedFile = new File([blob], file.name, {
          type: file.type,
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

  const handleRotateLeft = () => {
    cropperRef.current?.cropper.rotate(-90);
  };

  const handleRotateRight = () => {
    cropperRef.current?.cropper.rotate(90);
  };

  const handleFlipHorizontal = () => {
    const cropper = cropperRef.current?.cropper;
    const imageData = cropper.getImageData();
    cropper.scaleX(imageData.scaleX === 1 ? -1 : 1);
  };

  const handleFlipVertical = () => {
    const cropper = cropperRef.current?.cropper;
    const imageData = cropper.getImageData();
    cropper.scaleY(imageData.scaleY === 1 ? -1 : 1);
  };

  const handleReset = () => {
    cropperRef.current?.cropper.reset();
  };

  const handleZoomIn = () => {
    cropperRef.current?.cropper.zoom(0.1);
  };

  const handleZoomOut = () => {
    cropperRef.current?.cropper.zoom(-0.1);
  };

  return (
    <div className="flex items-center justify-center transition-all duration-300">
      <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full max-w-4xl p-6 transform transition-all duration-300 modal-content max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-3">
          <h3 className="text-xl font-bold text-[--black-1]">
            {t("cropImage.title")}
          </h3>
          <button
            onClick={onClose}
            className="text-[--gr-1] hover:text-[--black-2] transition-colors"
          >
            <CancelI className="size-[1.5rem]" />
          </button>
        </div>

        {/* Cropper Container */}
        <div className="mb-4 bg-[--light-1] rounded-lg border border-[--border-1] p-3">
          {imageURL ? (
            <Cropper
              ref={cropperRef}
              src={imageURL}
              style={{ height: 400, width: "100%" }}
              aspectRatio={aspectRatio}
              guides={true}
              background={false}
              responsive={true}
              autoCropArea={1}
              checkOrientation={false}
              viewMode={1}
            />
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-sm text-[--gr-1]">
                {t("cropImage.preview_loading")}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Aspect Ratio */}
          <div className="flex justify-between items-center bg-[--light-4] p-3 rounded-lg border border-[--border-1]">
            <span className="text-xs font-medium text-[--black-2]">
              <span className="text-[--gr-1]">{t("cropImage.size_label")}</span>{" "}
              {t("cropImage.size_auto")}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleAspectRatio(16 / 9)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  aspectRatio === 16 / 9
                    ? "bg-[--primary-1] text-white"
                    : "bg-[--light-3] text-[--black-2] hover:bg-[--light-4]"
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => handleAspectRatio(4 / 3)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  aspectRatio === 4 / 3
                    ? "bg-[--primary-1] text-white"
                    : "bg-[--light-3] text-[--black-2] hover:bg-[--light-4]"
                }`}
              >
                4:3
              </button>
              <button
                onClick={() => handleAspectRatio(1)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  aspectRatio === 1
                    ? "bg-[--primary-1] text-white"
                    : "bg-[--light-3] text-[--black-2] hover:bg-[--light-4]"
                }`}
              >
                1:1
              </button>
              <button
                onClick={() => handleAspectRatio(NaN)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  Number.isNaN(aspectRatio)
                    ? "bg-[--primary-1] text-white"
                    : "bg-[--light-3] text-[--black-2] hover:bg-[--light-4]"
                }`}
              >
                {t("cropImage.free_ratio")}
              </button>
            </div>
          </div>

          {/* Tools */}
          <div className="flex justify-between items-center bg-[--light-4] p-3 rounded-lg border border-[--border-1]">
            <span className="text-sm font-medium text-[--black-2]">
              {t("cropImage.tools_label")}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleZoomIn}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.zoom_in")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Zm-40-60v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.zoom_out")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400ZM280-540v-80h200v80H280Z" />
                </svg>
              </button>
              <button
                onClick={handleRotateLeft}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.rotate_left")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M440-80q-50-5-96-24.5T256-156l56-58q29 21 61.5 34t66.5 18v82Zm80 0v-82q104-15 172-93.5T760-438q0-117-81.5-198.5T480-718h-8l64 64-56 56-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-438q0 137-91 238.5T520-80ZM198-214q-32-42-51.5-88T122-398h82q5 34 18 66.5t34 61.5l-58 56Zm-76-264q6-51 25-98t51-86l58 56q-21 29-34 61.5T204-478h-82Z" />
                </svg>
              </button>
              <button
                onClick={handleRotateRight}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.rotate_right")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M522-80v-82q34-5 66.5-18t61.5-34l56 58q-42 32-88 51.5T522-80Zm-80 0Q304-98 213-199.5T122-438q0-75 28.5-140.5t77-114q48.5-48.5 114-77T482-798h6l-62-62 56-58 160 160-160 160-56-56 64-64h-8q-117 0-198.5 81.5T202-438q0 104 68 182.5T442-162v82Zm322-134-58-56q21-29 34-61.5t18-66.5h82q-5 50-24.5 96T764-214Zm76-264h-82q-5-34-18-66.5T706-606l58-56q32 39 51 86t25 98Z" />
                </svg>
              </button>
              <button
                onClick={handleFlipHorizontal}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.flip_horizontal")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M280-280 80-480l200-200 56 56-103 104h494L624-624l56-56 200 200-200 200-56-56 103-104H233l103 104-56 56Z" />
                </svg>
              </button>
              <button
                onClick={handleFlipVertical}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.flip_vertical")}
              >
                <div className="rotate-90">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="currentColor"
                  >
                    <path d="M280-280 80-480l200-200 56 56-103 104h494L624-624l56-56 200 200-200 200-56-56 103-104H233l103 104-56 56Z" />
                  </svg>
                </div>
              </button>
              <button
                onClick={handleReset}
                className="p-2 bg-[--light-3] text-[--black-2] rounded-lg hover:bg-[--light-4] transition-colors"
                title={t("cropImage.reset")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="currentColor"
                >
                  <path d="M680-80q-83 0-141.5-58.5T480-280q0-83 58.5-141.5T680-480q83 0 141.5 58.5T880-280q0 83-58.5 141.5T680-80Zm0-80q-20-26-30.5-56T639-280q0-34 11-64t30-56q-50 0-85 35t-35 85q0 50 35 85t85 35Zm151-400h-83q-26-88-99-144t-169-56q-117 0-198.5 81.5T200-480q0 72 32.5 132t87.5 98v-110h80v240H160v-80h94q-62-50-98-122.5T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q129 0 226.5 79.5T831-560Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-[--border-1] mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] rounded-xl hover:bg-[--light-1] hover:text-[--black-1] transition-all"
          >
            {t("cropImage.cancel")}
          </button>
          <button
            onClick={cropImage}
            className="px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg hover:bg-[--primary-2] transform hover:-translate-y-0.5 transition-all"
          >
            <i className="fa-solid fa-check mr-2"></i>
            {t("cropImage.save")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditImageFile;
