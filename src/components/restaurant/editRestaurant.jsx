//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Phone,
  MapPin,
  Map,
  Image as ImageIcon,
  Save,
  X,
  Check,
  Compass,
  Search,
  Upload,
} from "lucide-react";

//COMP
import { googleMap, toNameCase } from "../../utils/utils";
import CustomPhoneInput from "../common/customPhoneInput";
import EditImageFile from "../common/editImageFile";
import PageHelp from "../common/pageHelp";
import { usePopup } from "../../context/PopupContext";

//REDUX
import {
  updateRestaurant,
  resetUpdateRestaurant,
} from "../../redux/restaurants/updateRestaurantSlice";

function formatCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return value;
  }

  const stringValue = String(value);
  if (stringValue.includes(".")) {
    return stringValue;
  }

  const cleanedValue = stringValue.replace(/\D/g, "");
  if (cleanedValue.length <= 2) {
    return stringValue;
  }

  return `${cleanedValue.slice(0, 2)}.${cleanedValue.slice(2)}`;
}

// Downscale a freshly-cropped image so the longest edge is at most maxEdge
// pixels, preserving the aspect ratio. Anything already small enough is
// returned untouched. PNGs stay PNG (alpha preserved); everything else
// (JPEG / WebP / GIF) re-encodes to high-quality JPEG, which keeps the
// file modest while still looking sharp at the typical hero crop sizes.
//
// Used only for the BACKGROUND image upload — large hero photos otherwise
// look blurry once the backend's storage pipeline rescales them, and the
// user has no need for >1000px source material.
async function resizeImageToMaxEdge(file, maxEdge = 1000) {
  // Read as data URL so we can decode through HTMLImageElement (works for
  // every type the picker accepts).
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= maxEdge) return file;

  const scale = maxEdge / longest;
  const targetW = Math.round(img.naturalWidth * scale);
  const targetH = Math.round(img.naturalHeight * scale);

  // `document` is shadowed inside the React component below by a state
  // variable, so use the global explicitly here at module scope (where it
  // still resolves to the browser document).
  const canvas = window.document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, outputType, 0.9),
  );
  if (!blob) return file;

  // Keep the original filename root, swap extension to match output type.
  const ext = outputType === "image/png" ? "png" : "jpg";
  const baseName = (file.name || "background").replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.${ext}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

const EditRestaurant = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toastId = useRef();

  // Derive formatted restaurant object
  const formatRestaurant = (restaurant) => {
    if (!restaurant) return null;

    const {
      id: restaurantId,
      dealerId,
      userId,
      name,
      phoneNumber,
      latitude,
      longitude,
      city,
      district,
      neighbourhood,
      address,
      isActive,
      imageAbsoluteUrl,
      logoImageUrl,
    } = restaurant;

    return {
      restaurantId,
      dealerId,
      userId,
      name,
      phoneNumber,
      latitude: formatCoordinate(latitude),
      longitude: formatCoordinate(longitude),
      city,
      district,
      neighbourhood,
      address,
      isActive,
      imageAbsoluteUrl,
      logoImageUrl,
    };
  };

  const { loading, success, error } = useSelector(
    (state) => state.restaurants.updateRestaurant,
  );

  const { success: locationSuccess, location } = useSelector(
    (state) => state.data.getLocation,
  );

  const [lat, setLat] = useState(formatCoordinate(restaurant?.latitude));
  const [lng, setLng] = useState(formatCoordinate(restaurant?.longitude));
  const [document, setDocument] = useState("");
  const [document2, setDocument2] = useState("");
  const [isMapOpen, setIsMapOpen] = useState(false);
  const mapSearchInputRef = useRef(null);
  const [restaurantDataBefore, setRestaurantDataBefore] = useState(
    formatRestaurant(restaurant),
  );
  const [restaurantData, setRestaurantData] = useState(
    formatRestaurant(restaurant),
  );
  const [preview, setPreview] = useState();
  const [preview2, setPreview2] = useState();

  const handleSubmit = (e) => {
    e.preventDefault();
    const equalData = isEqual(restaurantDataBefore, restaurantData);
    if (equalData && !document && !document2) {
      toast("Hiç bir değişiklik yapmadınız.");
      return;
    }

    const formData = new FormData();

    formData.append("RestaurantId", restaurantData.restaurantId);
    formData.append("DealerId", restaurantData.dealerId);
    formData.append("UserId", restaurantData.userId);
    formData.append("Name", restaurantData.name);
    formData.append("PhoneNumber", restaurantData.phoneNumber);
    formData.append("Latitude", restaurantData.latitude);
    formData.append("Longitude", restaurantData.longitude);
    formData.append("City", restaurantData.city);
    formData.append("District", restaurantData.district);
    formData.append("Neighbourhood", restaurantData.neighbourhood);
    formData.append("Address", restaurantData.address);
    formData.append("IsActive", restaurantData.isActive);
    document && formData.append("Image", document);
    document2 && formData.append("LogoImage", document2);

    dispatch(updateRestaurant(formData));
  };

  function handleOpenMap() {
    setIsMapOpen(true);
  }

  // When the map overlay opens, resolve a sensible center in priority order:
  //   1) coordinates already saved on the restaurant / typed in the form,
  //   2) browser geolocation (asks for permission),
  //   3) geocoding the user-supplied city/district,
  //   4) world view fallback so the user can pan/search freely.
  useEffect(() => {
    if (!isMapOpen) return;
    let cancelled = false;
    const FALLBACK_LAT = 20;
    const FALLBACK_LNG = 0;
    const FALLBACK_ZOOM = 2;

    const init = (centerLat, centerLng, zoom = 15) => {
      if (cancelled) return;
      setLat(centerLat.toFixed(6));
      setLng(centerLng.toFixed(6));
      // requestAnimationFrame so the #map div has its painted dimensions.
      requestAnimationFrame(() => {
        if (cancelled) return;
        googleMap(
          centerLat,
          centerLng,
          setLat,
          setLng,
          null,
          zoom,
          false,
          mapSearchInputRef.current,
        );
      });
    };

    const tryGeocodeCity = () => {
      const Geocoder = window.google?.maps?.Geocoder;
      const cityQuery = [restaurantData?.city, restaurantData?.district]
        .filter(Boolean)
        .join(", ");
      if (!Geocoder || !cityQuery) {
        init(FALLBACK_LAT, FALLBACK_LNG, FALLBACK_ZOOM);
        return;
      }
      const geocoder = new Geocoder();
      geocoder.geocode({ address: cityQuery }, (results, status) => {
        if (cancelled) return;
        if (status === "OK" && results && results.length) {
          const loc = results[0].geometry.location;
          init(loc.lat(), loc.lng(), 12);
        } else {
          init(FALLBACK_LAT, FALLBACK_LNG, FALLBACK_ZOOM);
        }
      });
    };

    // 1) Honor coordinates already entered/saved.
    const typedLat = parseFloat(formatCoordinate(lat));
    const typedLng = parseFloat(formatCoordinate(lng));
    const hasTypedCoords =
      Number.isFinite(typedLat) &&
      Number.isFinite(typedLng) &&
      typedLat >= -90 &&
      typedLat <= 90 &&
      typedLng >= -180 &&
      typedLng <= 180 &&
      !(typedLat === 0 && typedLng === 0);

    if (hasTypedCoords) {
      init(typedLat, typedLng, 15);
    } else if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => init(pos.coords.latitude, pos.coords.longitude, 15),
        () => tryGeocodeCity(),
        { timeout: 10000, maximumAge: 60000 },
      );
    } else {
      tryGeocodeCity();
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapOpen]);

  function handleSetMap() {
    setRestaurantData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    // console.log(lat, lng);
    setIsMapOpen(false);
  }

  // REFRESH WHEN RESTAURANT CHANGES
  useEffect(() => {
    if (restaurant) {
      const formatted = formatRestaurant(restaurant);
      setRestaurantData(formatted);
      setRestaurantDataBefore(formatted);
      setPreview(formatted?.imageAbsoluteUrl);
      setPreview2(formatted?.logoImageUrl);
      // Sync map coords so the map opens at the saved location.
      if (formatted?.latitude) setLat(formatted.latitude);
      if (formatted?.longitude) setLng(formatted.longitude);
    }
  }, [restaurant]);

  // TOAST
  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading("İşleniyor 🤩...");
    }
    if (error) {
      toast.dismiss(toastId.current);
      dispatch(resetUpdateRestaurant());
    } else if (success) {
      toast.dismiss(toastId.current);
      toast.success("Restoran başarıyla güncelendi 🥳🥳");
      dispatch(resetUpdateRestaurant());
    }
  }, [loading, success, error]);

  //PREVIEW
  useEffect(() => {
    let objectUrl;
    let objectUrl2;
    if (document) {
      // Create a preview URL
      objectUrl = URL.createObjectURL(document);
      setPreview(objectUrl);
    }
    if (document2) {
      // Create a preview URL
      objectUrl2 = URL.createObjectURL(document2);
      setPreview2(objectUrl2);
    }

    // Free memory when the component unmounts or doc changes
    return () => {
      if (document) {
        URL.revokeObjectURL(objectUrl);
      }
      if (document2) {
        URL.revokeObjectURL(objectUrl2);
      }
    };
  }, [document, document2]);

  const inputCls =
    "w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";
  const labelCls =
    "block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide";

  const SectionHeader = ({ icon: Icon, label }) => (
    <header className="flex items-center gap-1.5 mb-2.5">
      <Icon className="size-3.5 text-indigo-600" />
      <h2 className="text-[11px] font-bold text-[--gr-1] uppercase tracking-[0.12em]">
        {label}
      </h2>
    </header>
  );

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      {/* MAP MODAL */}
      <div
        className={`fixed bg-[--white-1] border border-[--border-1] w-[calc(100%-2rem)] top-0 bottom-0 right-0 left-0 max-w-2xl max-h-[80dvh] m-auto z-[999] rounded-2xl flex flex-col justify-start items-center shadow-2xl overflow-hidden ${
          !isMapOpen && "hidden"
        }`}
      >
        {/* Map area with overlaid Places Autocomplete search bar */}
        <div className="relative w-full flex-1 min-h-0">
          <div id="map" className="absolute inset-0 w-full h-full" />
          <div className="absolute top-3 left-[calc(50%+60px)] -translate-x-1/2 z-10 w-[min(320px,calc(100%-9rem))]">
            <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-[--white-1] shadow-lg ring-1 ring-black/10">
              <Search className="size-4 text-[--gr-2] shrink-0" />
              <input
                ref={mapSearchInputRef}
                type="text"
                placeholder={t("restaurants.map_search_placeholder")}
                className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm text-[--black-1] placeholder:text-[--gr-2]"
              />
            </div>
          </div>
        </div>

        <div className="w-full px-3 py-2.5 flex items-center gap-3 border-t border-[--border-1] bg-[--white-1]">
          <div className="flex flex-1 gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-[--gr-1] uppercase tracking-wide">
                {t("restaurants.latitude")}
              </span>
              <p className="rounded-md border border-[--border-1] px-2 py-1 text-sm text-[--black-1] font-medium truncate">
                {lat}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-[--gr-1] uppercase tracking-wide">
                {t("restaurants.longitude")}
              </span>
              <p className="rounded-md border border-[--border-1] px-2 py-1 text-sm text-[--black-1] font-medium truncate">
                {lng}
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg bg-[--white-1] text-[--black-2] border border-[--border-1] hover:bg-[--white-2] transition"
              onClick={() => setIsMapOpen(false)}
            >
              <X className="size-4" />
              <span className="hidden sm:inline">
                {t("restaurants.map_close")}
              </span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
              }}
              onClick={handleSetMap}
            >
              <Check className="size-4" strokeWidth={3} />
              {t("restaurants.map_save")}
            </button>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* Slim gradient accent strip */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        {/* HERO HEADER — slim & elegant */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Building2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
                {restaurantData?.name || t("restaurants.name")}
              </h1>
              {restaurantData?.isActive && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 shrink-0">
                  AKTİF
                </span>
              )}
            </div>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {[restaurantData?.city, restaurantData?.district]
                .filter(Boolean)
                .join(" / ") || "—"}
            </p>
          </div>
          <PageHelp pageKey="editRestaurant" />
        </div>

        <div className="p-4 sm:p-5">
          {restaurantData && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* RESTORAN BİLGİLERİ */}
              <div>
                <SectionHeader
                  icon={Building2}
                  label={t("restaurants.name")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>
                      {t("restaurants.name")}
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder={t("restaurants.name")}
                      value={restaurantData.name || ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          name: toNameCase(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {t("restaurants.phone")}
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <CustomPhoneInput
                      required
                      placeholder={t("restaurants.phone")}
                      className="!h-10 !rounded-lg !border-[--border-1] !text-sm !bg-[--white-1]"
                      value={restaurantData.phoneNumber}
                      onChange={(phone) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          phoneNumber: phone,
                        }))
                      }
                      maxLength={14}
                    />
                  </div>
                </div>
              </div>

              {/* ADRES */}
              <div>
                <SectionHeader
                  icon={MapPin}
                  label={t("restaurants.address")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t("restaurants.city")}</label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder={t("restaurants.city")}
                      value={restaurantData.city || ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          city: toNameCase(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {t("restaurants.district")}
                    </label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder={t("restaurants.district")}
                      value={restaurantData.district || ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          district: toNameCase(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {t("restaurants.neighbourhood")}
                    </label>
                    <input
                      required
                      type="text"
                      className={inputCls}
                      placeholder={t("restaurants.neighbourhood")}
                      value={restaurantData.neighbourhood || ""}
                      onChange={(e) =>
                        setRestaurantData((prev) => ({
                          ...prev,
                          neighbourhood: toNameCase(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className={labelCls}>
                    {t("restaurants.address")}
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    className={`${inputCls} h-auto py-2 resize-none`}
                    placeholder={t("restaurants.address")}
                    value={restaurantData.address || ""}
                    onChange={(e) =>
                      setRestaurantData((prev) => ({
                        ...prev,
                        address: toNameCase(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              {/* KONUM — tek satır button */}
              <div>
                <SectionHeader
                  icon={Compass}
                  label={`${t("restaurants.latitude")} / ${t(
                    "restaurants.longitude",
                  )}`}
                />
                <button
                  type="button"
                  onClick={handleOpenMap}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-[--border-1] bg-[--white-2]/60 hover:bg-[--white-1] hover:border-indigo-300 hover:shadow-sm transition text-left group"
                >
                  <div className="grid place-items-center size-9 rounded-lg bg-[--white-1] border border-[--border-1] shrink-0 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition">
                    <Map className="size-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-[--gr-1] uppercase tracking-wide">
                      {t("restaurants.latitude")} ·{" "}
                      {t("restaurants.longitude")}
                    </div>
                    <div className="text-sm font-medium text-[--black-1] truncate font-mono">
                      {restaurantData.latitude || "—"},{" "}
                      {restaurantData.longitude || "—"}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 hidden sm:inline shrink-0 mr-1">
                    {t("restaurants.map_save")} →
                  </span>
                </button>
              </div>

              {/* GÖRSELLER — kompakt yan yana, sol: arka plan / sağ: logo */}
              <div>
                <SectionHeader
                  icon={ImageIcon}
                  label={t("restaurants.image_main")}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* LEFT — Background → "Image" API field.
                      Background photos coming out of phone cameras can be
                      4–6 MB and 4000+px wide; the menu hero only needs
                      ~1000px, and bigger uploads go through a backend
                      rescale that softens the image. Downscale here so
                      the user sees what the menu will actually display. */}
                  <ImageField
                    label={t("restaurants.background_label")}
                    hint={t("restaurants.background_hint")}
                    preview={preview}
                    onChange={async (file) => {
                      if (!file) {
                        setDocument(file);
                        return;
                      }
                      try {
                        const resized = await resizeImageToMaxEdge(file, 1000);
                        setDocument(resized);
                      } catch (err) {
                        console.error("Background resize failed", err);
                        // Fallback: send the original so the upload still
                        // works even if canvas decoding hiccups.
                        setDocument(file);
                      }
                    }}
                  />
                  {/* RIGHT — Logo → "LogoImage" API field. No downscale —
                      logos are already small and may rely on transparency. */}
                  <ImageField
                    label={t("restaurants.logo_label")}
                    hint={t("restaurants.logo_hint")}
                    preview={preview2}
                    onChange={setDocument2}
                    contain
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <div className="flex justify-end pt-3 border-t border-[--border-1]">
                <button
                  type="submit"
                  disabled={loading}
                  className={`group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed ${
                    isMapOpen && "invisible"
                  }`}
                  style={{
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
                  }}
                >
                  <Save className="size-4" />
                  {t("restaurants.save")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const ImageField = ({ label, hint, preview, onChange, contain }) => {
  const { t } = useTranslation();
  const { setCropImgPopup, setPopupContent } = usePopup();
  const inputRef = useRef(null);
  const maxFileSizeMB = import.meta.env.VITE_MAX_FILE_SIZE_MB || 5;

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Geçersiz dosya türü");
      return;
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast.error(`Maks. dosya boyutu: ${maxFileSizeMB} MB`);
      return;
    }

    setCropImgPopup(<EditImageFile file={file} onSave={onChange} />);
  };

  const openLightbox = () => {
    if (!preview) return;
    setPopupContent(
      <ImageLightbox
        src={preview}
        title={label}
        onClose={() => setPopupContent(null)}
      />,
    );
  };

  const hasImage = !!preview;

  return (
    <div className="flex items-center gap-2.5 p-2 rounded-xl border border-[--border-1] bg-[--white-1] hover:border-indigo-200 transition">
      <button
        type="button"
        onClick={openLightbox}
        disabled={!hasImage}
        className={`size-14 rounded-lg bg-[--white-2] ring-1 ring-[--border-1] grid place-items-center overflow-hidden shrink-0 relative group ${
          hasImage
            ? "cursor-zoom-in hover:ring-indigo-300 transition"
            : "cursor-default"
        }`}
        aria-label={hasImage ? t("restaurants.image_view") : undefined}
        title={hasImage ? t("restaurants.image_view") : undefined}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="preview"
              className={`size-full ${contain ? "object-contain" : "object-cover"}`}
            />
            <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors grid place-items-center">
              <Search className="size-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
          </>
        ) : (
          <ImageIcon className="size-6 text-[--gr-3]" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[--black-1] truncate leading-tight">
          {label}
        </p>
        <p className="text-[10px] text-[--gr-1] leading-snug mt-0.5 line-clamp-2">
          {hint}
        </p>
      </div>
      <label
        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[11px] font-semibold text-white cursor-pointer transition shadow-sm shrink-0 hover:brightness-110"
        style={{
          background:
            "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
        }}
      >
        <Upload className="size-3" strokeWidth={2.5} />
        {hasImage
          ? t("restaurants.image_change_btn")
          : t("restaurants.image_upload_btn")}
        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/gif, image/webp"
          onChange={handlePick}
          className="hidden"
        />
      </label>
    </div>
  );
};

const ImageLightbox = ({ src, title, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[--border-1] bg-[--white-1] rounded-t-xl">
        <h3 className="text-sm font-semibold text-[--black-1] truncate">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition shrink-0"
          aria-label={t("restaurants.close") || "Kapat"}
        >
          <X className="size-4" strokeWidth={2.5} />
          {t("restaurants.close") || "Kapat"}
        </button>
      </div>

      {/* Image area with floating close button */}
      <div className="relative grid place-items-center bg-slate-900/95 p-4 sm:p-6 min-h-[50vh] rounded-b-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 grid place-items-center size-10 rounded-full bg-[--white-1]/95 text-[--black-1] hover:bg-[--white-1] hover:scale-105 transition shadow-xl ring-1 ring-black/10"
          aria-label={t("restaurants.close") || "Kapat"}
          title={t("restaurants.close") || "Kapat"}
        >
          <X className="size-5" strokeWidth={2.5} />
        </button>
        <img
          src={src}
          alt={title}
          className="block max-w-full max-h-[80vh] rounded-md shadow-2xl"
        />
      </div>
    </div>
  );
};

export default EditRestaurant;
