//MODULES
import toast from "react-hot-toast";
import { useId, useRef, useState } from "react";
import { CloudUI } from "../../assets/icon";
import { useTranslation } from "react-i18next";

//CONTEXT
import { usePopup } from "../../context/PopupContext";
import EditImageFile from "./editImageFile";

//image/png, image/jpeg, image/gif, application/pdf

const CustomFileInput = ({
  onChange,
  value,
  accept = "image/png, image/jpeg, image/gif, image/webp, application/pdf",
  className,
  required,
  msg,
  showFileDetails = true,
  sliceNameAt = 40,
  editIfImage = true,
  children,
}) => {
  const { t } = useTranslation();
  const { setCropImgPopup } = usePopup();

  // Unique id per instance — every CustomFileInput used to share the
  // hardcoded id "dropzone-file", so when two mounted at once (or HMR
  // left a stale one), every <label htmlFor="dropzone-file"> resolved
  // to the first matching <input> in document order and the others
  // silently never opened the file picker.
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const maxFileSizeMB = import.meta.env.VITE_MAX_FILE_SIZE_MB || 5;

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file && onChange) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    const fileType = file.type;
    const allowedTypes = accept.split(",").map((type) => type.trim());
    if (!allowedTypes.includes(fileType)) {
      toast.error(t("fileInput.invalid_type"));
      return;
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast.error(t("fileInput.too_large", { mb: maxFileSizeMB }));
      return;
    }

    const isImage = fileType.startsWith("image/");
    if (editIfImage && isImage) {
      // Open editor modal and pass callbacks
      setCropImgPopup(<EditImageFile file={file} onSave={onChange} />);
      return;
    }

    onChange(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }

    // Reset using ref
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const getReadableAcceptText = (accept) => {
    if (!accept) return "";
    return accept
      .split(",")
      .map((type) => {
        if (type.includes("image/")) return type.split("/")[1].toUpperCase();
        if (type === "application/pdf") return "PDF";
        return type;
      })
      .join(", ");
  };

  return (
    <label
      htmlFor={inputId}
      className={`flex flex-col items-center justify-center w-full text-[--gr-1] border-2 border-[--primary-1] border-dashed rounded-lg cursor-pointer bg-[--white-1] relative p-3 ${
        isDragging ? "border-[--primary-1] bg-[--light-3]" : ""
      } ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* When a caller provides children, render them in place of the
          default empty/selected UI. The label still wraps everything,
          so clicks on the custom visible content (e.g. a preview image)
          naturally trigger the file picker via the standard label-for-
          input HTML semantics — no overlay/hit-test gymnastics needed. */}
      {children ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center cursor-pointer">
          {!value ? (
            <>
              <CloudUI className="size-[2.5rem]" strokeWidth={1.5} />
              <p className="mb-2 text-sm">{msg || t("restaurants.file-info")}</p>
              <p className="text-xs">
                {getReadableAcceptText(accept)} ·{" "}
                {t("fileInput.max_size_hint", { mb: maxFileSizeMB })}
              </p>
            </>
          ) : showFileDetails ? (
            <div className="text-center flex flex-col justify-between">
              <p className="text-sm">
                <span className="font-semibold">
                  {t("fileInput.selected_file")}{" "}
                </span>
                <span className="font-semibold text-[--primary-1]">
                  {value.name?.slice(0, sliceNameAt)}
                  {value.name?.length > sliceNameAt && "..."}
                </span>
              </p>
              <p className="text-xs">
                {t("fileInput.size_label")} {(value.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            // Compact "click to replace" affordance for callers that hide
            // the verbose file-details block (e.g. QuickEditImage, which
            // shows the new image in its own preview pane). Without this
            // branch the dropzone went blank after a selection, leaving
            // the user with nothing to click to pick a different file.
            <div className="flex items-center gap-2 text-sm font-medium text-[--primary-1]">
              <CloudUI className="size-5" strokeWidth={1.75} />
              <span>{t("fileInput.replace_action")}</span>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        id={inputId}
        name={inputId}
        className="absolute top-0 inset-0 opacity-0 cursor-pointer"
        onChange={handleInputChange}
        accept={accept}
        required={required}
      />
    </label>
  );
};

export default CustomFileInput;
