// External Page settings — owners configure an extra HTML/image page that
// the customer-facing theme renders behind a button. Three fields, all
// optional:
//   externalPageHTML        — raw HTML the theme injects on the page
//   externalPageImage       — accompanying image (binary upload)
//   externalPageButtonName  — label of the button that opens the page
//
// There's no dedicated backend endpoint — these fields ride along with
// Restaurants/UpdateRestaurant (multipart). To stay safe with that
// "send everything or risk a null-out" endpoint, we re-send the basic
// restaurant fields from `data` alongside the three new ones, mirroring
// editRestaurant.jsx's payload shape.

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Code2,
  Image as ImageIcon,
  Layout,
  MousePointerClick,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import CustomTextarea from "../common/customTextarea";
import SettingsTabs from "./settingsTabs";
import EditImageFile from "../common/editImageFile";
import { usePopup } from "../../context/PopupContext";
import {
  updateRestaurant,
  resetUpdateRestaurant,
} from "../../redux/restaurants/updateRestaurantSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Backend may serialize the saved external-page image URL under any of
// these keys depending on which serializer/DTO it picked. Try them in
// order so the form always lights up the existing image preview when
// there is one.
const readSavedImageUrl = (data) =>
  data?.externalPageImageUrl ??
  data?.externalPageImageAbsoluteUrl ??
  data?.externalPageImage ??
  "";

const ExternalPage = ({ data }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setCropImgPopup } = usePopup();

  const { success, error } = useSelector(
    (s) => s.restaurants.updateRestaurant,
  );

  // Form state mirrors the three fields. `imageFile` holds the new File
  // (post-crop) until save; `imagePreview` is the URL shown to the user
  // (saved URL when no new file picked, ObjectURL once they pick one).
  const [htmlContent, setHtmlContent] = useState(data?.externalPageHTML ?? "");
  const [buttonName, setButtonName] = useState(
    data?.externalPageButtonName ?? "",
  );
  const [imageFile, setImageFile] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imagePreview, setImagePreview] = useState(readSavedImageUrl(data));

  // Re-seed when the restaurant data prop changes (e.g. parent re-derived
  // from the slice cache after a list refetch).
  useEffect(() => {
    setHtmlContent(data?.externalPageHTML ?? "");
    setButtonName(data?.externalPageButtonName ?? "");
    if (!imageFile) setImagePreview(readSavedImageUrl(data));
  }, [data]);

  // Manage ObjectURL lifecycle for the new-file preview.
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Toast on save success/failure.
  useEffect(() => {
    if (success) {
      toast.success(t("externalPage.success"));
      dispatch(resetUpdateRestaurant());
      // Reset the local "new file" state — preview now points at the
      // saved URL (which the parent's data prop will refresh on its
      // own when the cache re-fetches).
      setImageFile(null);
      setImageRemoved(false);
    }
    if (error) {
      dispatch(resetUpdateRestaurant());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  const handlePickImage = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("externalPage.invalid_image"));
      return;
    }
    const maxMb = import.meta.env.VITE_MAX_FILE_SIZE_MB || 5;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(t("externalPage.image_too_large", { mb: maxMb }));
      return;
    }
    // Open the cropper, then commit to local state on save.
    setCropImgPopup(
      <EditImageFile
        file={file}
        onSave={(cropped) => {
          setImageFile(cropped);
          setImageRemoved(false);
        }}
      />,
    );
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageRemoved(true);
    setImagePreview("");
  };

  const handleSubmit = () => {
    if (!data?.id) {
      toast.error(t("externalPage.missing_restaurant"));
      return;
    }

    const formData = new FormData();
    // Re-send the basic restaurant fields the way editRestaurant.jsx does
    // — UpdateRestaurant is the catch-all endpoint and missing fields
    // historically risk being nulled out.
    formData.append("RestaurantId", data.id);
    formData.append("DealerId", data.dealerId ?? "");
    formData.append("UserId", data.userId ?? "");
    formData.append("Name", data.name ?? "");
    formData.append("PhoneNumber", data.phoneNumber ?? "");
    formData.append("Latitude", data.latitude ?? "");
    formData.append("Longitude", data.longitude ?? "");
    formData.append("City", data.city ?? "");
    formData.append("District", data.district ?? "");
    formData.append("Neighbourhood", data.neighbourhood ?? "");
    formData.append("Address", data.address ?? "");
    formData.append("IsActive", data.isActive ?? true);

    // The three external-page fields.
    formData.append("ExternalPageHTML", htmlContent ?? "");
    formData.append("ExternalPageButtonName", buttonName ?? "");
    if (imageFile) {
      formData.append("ExternalPageImage", imageFile);
    } else if (imageRemoved) {
      // Send empty string to signal removal. Mirrors the same convention
      // used for the basic restaurant Image/LogoImage fields.
      formData.append("ExternalPageImage", "");
    }

    dispatch(updateRestaurant(formData));
  };

  const labelCls =
    "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide uppercase";

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Layout className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("externalPage.title", { name: data?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("externalPage.subtitle")}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* BUTTON NAME */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <MousePointerClick className="size-3.5 text-indigo-600" />
                {t("externalPage.button_name_label")}
              </span>
            </label>
            <input
              type="text"
              value={buttonName}
              onChange={(e) => setButtonName(e.target.value)}
              placeholder={t("externalPage.button_name_placeholder")}
              maxLength={40}
              className="w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] placeholder:text-[--gr-2] outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
            <p className="mt-1 text-[11px] text-[--gr-1]">
              {t("externalPage.button_name_hint")}
            </p>
          </div>

          {/* IMAGE */}
          <div>
            <label className={labelCls}>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon className="size-3.5 text-indigo-600" />
                {t("externalPage.image_label")}
              </span>
            </label>
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/40 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="size-32 shrink-0 rounded-lg overflow-hidden bg-[--white-1] border border-[--border-1] grid place-items-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-[--gr-2]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[--gr-1] mb-2">
                  {t("externalPage.image_hint")}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-xs font-semibold text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 cursor-pointer transition">
                    <Upload className="size-3.5" />
                    {imagePreview
                      ? t("externalPage.change_image")
                      : t("externalPage.pick_image")}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      onChange={handlePickImage}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-xs font-semibold text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="size-3.5" />
                      {t("externalPage.remove_image")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* HTML */}
          <div className="rounded-xl border border-[--border-1] overflow-hidden bg-slate-900 flex flex-col min-h-[24rem] shadow-sm">
            <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-slate-700/60 bg-slate-800/60">
              <div className="flex items-center gap-2 text-slate-200 text-[11px] font-bold uppercase tracking-[0.12em]">
                <Code2 className="size-3.5 text-cyan-400" />
                {t("externalPage.html_label")}
              </div>
            </div>
            <CustomTextarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={20}
              className2="!flex-1 !min-h-0"
              className="!w-full !flex-1 !p-4 !font-mono !text-xs !bg-slate-900 !text-slate-200 !border-0 !rounded-none focus:!ring-0 !outline-none !resize-none !shadow-none !min-h-[20rem]"
              placeholder={t("externalPage.html_placeholder")}
            />
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end pt-3 border-t border-[--border-1]">
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Save className="size-4" />
              {t("externalPage.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalPage;
