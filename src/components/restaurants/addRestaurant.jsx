//MODULES
import toast from "react-hot-toast";
import { getAuth } from "../../redux/api";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Image as ImageIcon,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

//COMP
import { googleMap, toNameCase } from "../../utils/utils";
import { usePopup } from "../../context/PopupContext";
import AuthField from "../auth/AuthField";
import AuthPhoneField from "../auth/AuthPhoneField";
import LoadingI from "../../assets/anim/loading";
import EditImageFile from "../common/editImageFile";

// REDUX
import {
  getLocation,
  resetGetLocationState,
} from "../../redux/data/getLocationSlice";
import {
  addRestaurant,
  resetAddRestaurantState,
} from "../../redux/restaurants/addRestaurantSlice";
import { setWorkingHours } from "../../redux/restaurant/setWorkingHoursSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Working-hours seed for a brand-new restaurant: all 7 days open,
// 08:00–22:00. The backend's own default is "every day 00:00–23:59"
// (a 24h week) which surprised owners; this one-shot SetWorkingHours
// right after AddRestaurant gives them a realistic starting point.
// Done as a separate dispatch — working hours are their own entity
// with their own endpoint, not part of the AddRestaurant FormData.
const DEFAULT_WORKING_HOURS_DAYS = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  isClosed: false,
  open: "08:00",
  close: "22:00",
}));

const AddRestaurant = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const handleClick = () => {
    setPopupContent(<AddRestaurantPopup onSuccess={onSuccess} />);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95 whitespace-nowrap"
      style={{ background: PRIMARY_GRADIENT }}
    >
      <Plus className="size-4" strokeWidth={2.5} />
      {t("restaurants.add")}
    </button>
  );
};

export default AddRestaurant;

// ====== ADD RESTAURANT POPUP ======

function AddRestaurantPopup({ onSuccess }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const toastId = useRef();
  const localUser = getAuth()?.isManager;

  const { setPopupContent } = usePopup();

  const { loading, success, error, data } = useSelector(
    (state) => state.restaurants.addRestaurant,
  );

  const { success: locationSuccess, location } = useSelector(
    (state) => state.data.getLocation,
  );

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [locationData, setLocationData] = useState({ location: null });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const mapSearchInputRef = useRef(null);
  const [doc, setDoc] = useState("");
  const [doc2, setDoc2] = useState("");
  const [preview, setPreview] = useState(null);
  const [preview2, setPreview2] = useState();
  const [r, setR] = useState({
    name: "",
    phoneNumber: "+90",
    latitude: "",
    longitude: "",
    city: "",
    district: "",
    neighbourhood: "",
    address: "",
    isActive: true,
  });

  const set = (k) => (v) => setR((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("Name", r.name);
    fd.append("PhoneNumber", r.phoneNumber);
    fd.append("Latitude", r.latitude);
    fd.append("Longitude", r.longitude);
    fd.append("City", r.city);
    fd.append("District", r.district);
    fd.append("Neighbourhood", r.neighbourhood);
    fd.append("Address", r.address);
    fd.append("IsActive", r.isActive);
    // Default the two order channels OFF for newly created restaurants.
    // The backend used to leave them ON which surprised owners — they'd
    // see "Paket Sipariş" and "Masada Sipariş" already enabled without
    // having configured pricing/distance/payment methods. Forcing them
    // to FALSE here makes the owner explicitly opt in from
    // RestaurantSettings once they're ready.
    fd.append("OnlineOrder", false);
    fd.append("InPersonOrder", false);
    // Seed the Genel Ayarlar → Genel tab defaults at creation time so
    // the form opens with sensible values instead of the backend's
    // raw 0/null. The owner can change every one of these later:
    //   • MenuLang "tr" — the menu-language picker can't be empty.
    //   • DecimalPoint "2" — TR kuruş precision (₺100,00).
    //   • MaxDistance 5 (km) — delivery radius. OnlineOrder still
    //     ships disabled; this just means the field isn't blank when
    //     the owner flips it on.
    //   • MaxTableOrderDistanceMeter 500 — same idea for table orders
    //     (InPersonOrder also ships disabled).
    // MoneySign is intentionally NOT seeded — the owner picks their
    // own currency symbol.
    fd.append("MenuLang", "tr");
    fd.append("DecimalPoint", "2");
    fd.append("MaxDistance", 5);
    fd.append("MaxTableOrderDistanceMeter", 500);
    fd.append("Image", doc);
    if (doc2) fd.append("LogoImage", doc2);
    dispatch(addRestaurant(fd));
  };

  function handleOpenMap() {
    setIsMapOpen(true);
  }

  function handleSetMap() {
    setR((p) => ({ ...p, latitude: lat, longitude: lng }));
    setIsMapOpen(false);
  }

  // When the map overlay opens, resolve a sensible center in priority order:
  //   1) coordinates already entered in the Latitude/Longitude form fields,
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
      googleMap(
        centerLat,
        centerLng,
        setLat,
        setLng,
        locationData.location,
        zoom,
        false,
        mapSearchInputRef.current,
      );
    };

    const tryGeocodeCity = () => {
      const Geocoder = window.google?.maps?.Geocoder;
      const cityQuery = [r.city, r.district].filter(Boolean).join(", ");
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

    // 1) Honor coordinates already entered in the form, if both are valid.
    const typedLat = parseFloat(r.latitude);
    const typedLng = parseFloat(r.longitude);
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

  // toast/feedback
  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading(t("register.processing"));
    } else if (error) {
      toast.dismiss(toastId.current);
      dispatch(resetAddRestaurantState());
    } else if (success) {
      // Seed the new restaurant's working hours (7 days, 08:00–22:00).
      // The AddRestaurant response is a ResponsBase envelope, so the
      // created entity is under `.data`; fall back through a couple of
      // shapes in case the backend ever returns it flat. Best-effort —
      // if the id can't be resolved the owner just edits hours
      // manually, no worse than the previous behaviour.
      const newId =
        data?.data?.id ?? data?.data?.restaurantId ?? data?.id ?? null;
      if (newId) {
        dispatch(
          setWorkingHours({
            restaurantId: newId,
            days: DEFAULT_WORKING_HOURS_DAYS,
          }),
        );
      }
      onSuccess?.();
      setPopupContent(null);
      toast.dismiss(toastId.current);
      dispatch(resetAddRestaurantState());
      toast.success(t("restaurants.success_add"));
    }
  }, [loading, success, error]);

  // initial location
  useEffect(() => {
    if (locationSuccess) {
      const boundaryCoords = location.boundaryCoords;
      const avgLat = (
        boundaryCoords.reduce((s, l) => s + l.lat, 0) / boundaryCoords.length
      ).toFixed(6);
      const avgLng = (
        boundaryCoords.reduce((s, l) => s + l.lng, 0) / boundaryCoords.length
      ).toFixed(6);
      setR((p) => ({
        ...p,
        latitude: avgLat,
        longitude: avgLng,
        city: location.city || p.city,
        district: location.district || p.district,
        neighbourhood: location.neighborhood || p.neighbourhood,
        address: location.fullAddress || p.address,
      }));
      setLocationData({ location: boundaryCoords });
      setLat(avgLat);
      setLng(avgLng);
      dispatch(resetGetLocationState());
    }
  }, [locationSuccess]);

  useEffect(() => {
    if (!lat || !lng) dispatch(getLocation());
  }, [lat, lng]);

  // image previews
  useEffect(() => {
    let u1, u2;
    if (doc) {
      u1 = URL.createObjectURL(doc);
      setPreview(u1);
    } else setPreview(null);
    if (doc2) {
      u2 = URL.createObjectURL(doc2);
      setPreview2(u2);
    } else setPreview2(null);
    return () => {
      if (u1) URL.revokeObjectURL(u1);
      if (u2) URL.revokeObjectURL(u2);
    };
  }, [doc, doc2]);

  return (
    <div className="bg-[--white-1] shadow-2xl ring-1 ring-[--border-1] max-w-3xl w-full mx-auto flex flex-col rounded-none sm:rounded-2xl overflow-hidden max-h-[100dvh] sm:max-h-[92dvh] h-[100dvh] sm:h-auto relative">
      {/* Top gradient strip */}
      <div
        className="h-1 shrink-0"
        style={{ background: PRIMARY_GRADIENT }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-start gap-3 sm:gap-4 px-5 sm:px-7 py-4 sm:py-5 border-b border-[--border-1] shrink-0">
        <div className="grid place-items-center size-10 shrink-0 rounded-xl bg-[--primary-1]/10 text-[--primary-1]">
          <Building2 className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-[--black-1] leading-tight">
            {t("restaurants.form_title")}
          </h2>
          <p className="text-[11px] sm:text-xs text-[--gr-1] mt-0.5">
            {t("restaurants.form_subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          aria-label={t("restaurants.close")}
          className="grid place-items-center size-9 shrink-0 -mt-0.5 rounded-full text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Map overlay */}
      {isMapOpen && (
        <div className="absolute inset-0 z-40 bg-[--white-1] flex flex-col">
          <div className="relative flex-1 w-full">
            <div id="map" className="absolute inset-0 w-full h-full" />
            <div className="absolute top-3 left-[calc(50%+60px)] -translate-x-1/2 z-10 w-[min(320px,calc(100%-9rem))]">
              <div className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white shadow-lg ring-1 ring-black/10">
                <Search className="size-4 text-[--gr-1] shrink-0" />
                <input
                  ref={mapSearchInputRef}
                  type="text"
                  placeholder={t("restaurants.map_search_placeholder")}
                  className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm text-[--black-1] placeholder:text-[--gr-1]"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between px-5 sm:px-7 py-3 border-t border-[--border-1] bg-[--white-2]">
            <div className="flex gap-3 text-xs">
              <div>
                <span className="text-[--gr-1]">
                  {t("restaurants.latitude")}:{" "}
                </span>
                <span className="font-semibold text-[--black-1]">{lat}</span>
              </div>
              <div>
                <span className="text-[--gr-1]">
                  {t("restaurants.longitude")}:{" "}
                </span>
                <span className="font-semibold text-[--black-1]">{lng}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMapOpen(false)}
                className="h-10 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition"
              >
                {t("restaurants.map_close")}
              </button>
              <button
                type="button"
                onClick={handleSetMap}
                className="h-10 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:brightness-110"
                style={{ background: PRIMARY_GRADIENT }}
              >
                {t("restaurants.map_save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <form
        id="add-restaurant-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 sm:py-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="name"
            label={t("restaurants.name")}
            icon={Building2}
            value={r.name}
            onChange={(e) => set("name")(toNameCase(e.target.value))}
            required
            placeholder={t("restaurants.name")}
            autoComplete="organization"
            maxLength={60}
          />
          <AuthPhoneField
            id="phoneNumber"
            label={t("restaurants.contact_phone")}
            value={r.phoneNumber}
            onChange={(phone) => set("phoneNumber")(phone)}
            required
            placeholder={t("restaurants.contact_phone")}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            id="city"
            label={t("restaurants.city")}
            icon={MapPin}
            value={r.city}
            onChange={(e) => set("city")(toNameCase(e.target.value))}
            required
            placeholder={t("restaurants.city")}
            autoComplete="address-level1"
            maxLength={40}
          />
          <AuthField
            id="district"
            label={t("restaurants.district")}
            icon={MapPin}
            value={r.district}
            onChange={(e) => set("district")(toNameCase(e.target.value))}
            required
            placeholder={t("restaurants.district")}
            autoComplete="address-level2"
            maxLength={40}
          />
        </div>

        <AuthField
          id="neighbourhood"
          label={t("restaurants.neighbourhood")}
          icon={MapPin}
          value={r.neighbourhood}
          onChange={(e) => set("neighbourhood")(toNameCase(e.target.value))}
          required
          placeholder={t("restaurants.neighbourhood")}
          autoComplete="address-level3"
          maxLength={60}
        />

        {/* Address textarea */}
        <div>
          <label
            htmlFor="address"
            className="block text-xs font-semibold text-[--black-1] mb-1.5"
          >
            {t("restaurants.address")}
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            required
            value={r.address}
            onChange={(e) => set("address")(e.target.value)}
            placeholder={t("restaurants.address_placeholder")}
            className="w-full px-4 py-3 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100 resize-none"
          />
        </div>

        {/* Lat / Lng + Map button */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label
              htmlFor="latitude"
              className="block text-xs font-semibold text-[--black-1] mb-1.5"
            >
              {t("restaurants.latitude")}
            </label>
            <input
              id="latitude"
              name="latitude"
              type="text"
              inputMode="decimal"
              required
              value={r.latitude}
              onChange={(e) =>
                set("latitude")(e.target.value.replace(/[^\d.\-]/g, ""))
              }
              placeholder={t("restaurants.latitude")}
              className="w-full h-12 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label
              htmlFor="longitude"
              className="block text-xs font-semibold text-[--black-1] mb-1.5"
            >
              {t("restaurants.longitude")}
            </label>
            <input
              id="longitude"
              name="longitude"
              type="text"
              inputMode="decimal"
              required
              value={r.longitude}
              onChange={(e) =>
                set("longitude")(e.target.value.replace(/[^\d.\-]/g, ""))
              }
              placeholder={t("restaurants.longitude")}
              className="w-full h-12 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenMap}
            className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-[--primary-1] text-[--primary-1] text-sm font-semibold hover:bg-[--primary-1]/10 transition"
          >
            <MapPin className="size-4" />
            {t("restaurants.select_on_map")}
          </button>
        </div>

        {/* Image uploads */}
        <div className="space-y-3">
          <CompactImageUpload
            label={t("restaurants.image_main")}
            preview={preview}
            file={doc}
            onChange={setDoc}
            required
          />
          <CompactImageUpload
            label={t("restaurants.image_logo")}
            preview={preview2}
            file={doc2}
            onChange={setDoc2}
            helperText={t("restaurants.logo_msg")}
          />
        </div>
      </form>

      {/* Footer */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 px-5 sm:px-7 py-3 sm:py-4 border-t border-[--border-1] bg-[--white-2] shrink-0">
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="h-11 sm:h-10 px-5 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] font-medium hover:bg-[--white-2] transition"
        >
          {t("restaurants.cancel")}
        </button>
        <button
          type="submit"
          form="add-restaurant-form"
          disabled={loading}
          className="h-11 sm:h-10 px-5 inline-flex items-center justify-center gap-2 rounded-xl text-white font-semibold shadow-md shadow-indigo-500/25 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {loading ? (
            <LoadingI className="size-5 text-white fill-white/40" />
          ) : (
            <>
              <Save className="size-4" />
              {t("restaurants.save")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ====== Compact image upload (preview + change + remove) ======

function CompactImageUpload({
  label,
  file,
  preview,
  onChange,
  required,
  helperText,
  accept = "image/png,image/jpeg,image/gif,image/webp",
  editImages = true,
}) {
  const { t } = useTranslation();
  const { setCropImgPopup } = usePopup();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const maxMB = parseFloat(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 5;
  const acceptList = accept.split(",").map((s) => s.trim());

  const validate = (f) => {
    if (!acceptList.includes(f.type)) {
      toast.error("Geçersiz dosya türü");
      return false;
    }
    if (f.size > maxMB * 1024 * 1024) {
      toast.error(`Maksimum ${maxMB}MB`);
      return false;
    }
    return true;
  };

  const acceptFile = (f) => {
    if (!validate(f)) return;
    if (editImages && f.type.startsWith("image/")) {
      setCropImgPopup(<EditImageFile file={f} onSave={onChange} />);
    } else {
      onChange(f);
    }
  };

  const pickFile = (e) => {
    e?.preventDefault();
    inputRef.current?.click();
  };

  const remove = (e) => {
    e?.stopPropagation();
    onChange(null);
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[--black-1] mb-1.5">
        {label}
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        required={required && !file}
      />

      {file && preview ? (
        <div className="flex items-center gap-3 p-2 rounded-xl border border-[--border-1] bg-[--white-1]">
          <img
            src={preview}
            alt="preview"
            className="size-14 rounded-lg object-cover ring-1 ring-[--border-1] shrink-0 bg-[--white-2]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[--black-1] truncate">
              {file.name}
            </p>
            <p className="text-[11px] text-[--gr-1]">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            type="button"
            onClick={pickFile}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-[--primary-1] text-[--primary-1] text-xs font-semibold hover:bg-[--primary-1]/10 transition shrink-0"
          >
            <RefreshCw className="size-3" />
            <span className="hidden sm:inline">Değiştir</span>
          </button>
          <button
            type="button"
            onClick={remove}
            aria-label="Kaldır"
            className="grid place-items-center size-8 rounded-lg text-[--gr-1] hover:text-[--red-1] hover:bg-[--status-red] transition shrink-0"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={pickFile}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pickFile(e)}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer transition ${
            isDragging
              ? "border-[--primary-1] bg-[--primary-1]/10"
              : "border-[--border-1] bg-[--white-2] hover:border-[--primary-1] hover:bg-[--primary-1]/5"
          }`}
        >
          <span className="grid place-items-center size-10 rounded-lg bg-[--white-1] text-[--primary-1] ring-1 ring-[--border-1] shrink-0">
            <Upload className="size-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-semibold text-[--black-1]">
              {helperText || t("restaurants.file-info")}
            </span>
            <span className="block text-[11px] text-[--gr-1]">
              PNG, JPG, GIF, WEBP — max {maxMB}MB
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
