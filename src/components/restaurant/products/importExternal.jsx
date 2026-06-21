// MODULES
import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  DownloadCloud,
  Globe,
  Loader2,
  ScanLine,
  AlertTriangle,
  ImageOff,
  Check,
  ArrowRight,
  Tag,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

// COMP
import ProductsHeader from "./header";
import CustomSelect from "../../common/customSelector";

// REDUX
import { privateApi } from "../../../redux/api";
import { getProducts } from "../../../redux/products/getProductsSlice";

const baseURL = import.meta.env.VITE_BASE_URL;
const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Diacritic-insensitive name normalizer (mirrors products.jsx) — used to
// auto-match scraped images to existing products by name.
const TR_FOLD = {
  ı: "i", İ: "i", i: "i", I: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ç: "c", Ç: "c", ü: "u", Ü: "u", ö: "o", Ö: "o",
};
const normalizeName = (s) => {
  if (!s) return "";
  let out = "";
  for (const ch of String(s)) out += TR_FOLD[ch] ?? ch.toLowerCase();
  return out.normalize("NFD").replace(/\p{M}+/gu, "").trim();
};

// Importable fields. `tag` is shown but disabled — OrderTags are a separate
// entity in this app, so tag import is deferred to a later version.
const FIELD_DEFS = [
  { key: "category", labelKey: "field_category" },
  { key: "name", labelKey: "field_name" },
  { key: "portion", labelKey: "field_portion" },
  { key: "price", labelKey: "field_price" },
  { key: "image", labelKey: "field_image" },
];

// Source platforms. The user picks one so the backend routes to the matching
// adapter instead of guessing — far more reliable than scraping an arbitrary
// JS-rendered SPA. "generic" keeps the open-URL fallback. Brand names stay
// literal; only "generic" is translated. `placeholder` shows the expected URL
// shape for the chosen platform.
const PLATFORM_DEFS = [
  { value: "generic", labelKey: "platform_generic" },
  { value: "dijitalmenu", label: "dijital.menu", placeholder: "https://isletmeniz.dijital.menu/" },
  { value: "tvmenu", label: "TV Menü", placeholder: "https://tvmenu.tr/qr/XXXX" },
  { value: "yemeksepeti", label: "Yemeksepeti", placeholder: "https://www.yemeksepeti.com/restaurant/..." },
  { value: "getir", label: "Getir Yemek", placeholder: "https://getir.com/yemek/restoran/..." },
  { value: "trendyolgo", label: "Trendyol Go", placeholder: "https://tgoyemek.com/restoranlar/123456" },
  { value: "migros", label: "Migros Yemek", placeholder: "https://www.migros.com.tr/yemek/..." },
  { value: "ubereats", label: "Uber Eats", placeholder: "https://www.ubereats.com/store/..." },
  { value: "talabat", label: "Talabat", placeholder: "https://www.talabat.com/uae/restaurant/..." },
];

const ImportExternal = () => {
  const { id: restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("generic");
  const [fields, setFields] = useState({
    category: true,
    name: true,
    portion: true,
    price: true,
    image: true,
  });

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanResult, setScanResult] = useState(null); // { source, categories, items }
  const [includeRows, setIncludeRows] = useState(() => new Set());

  // Image-only matching: scraped item index -> existing product id
  const [existingProducts, setExistingProducts] = useState([]);
  const [imageMatches, setImageMatches] = useState({});

  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  const selectedFieldList = useMemo(
    () => FIELD_DEFS.filter((f) => fields[f.key]).map((f) => f.key),
    [fields],
  );

  const platformOptions = useMemo(
    () =>
      PLATFORM_DEFS.map((p) => ({
        value: p.value,
        label: p.label || t(`importExternal.${p.labelKey}`),
      })),
    [t],
  );
  const currentPlatform =
    PLATFORM_DEFS.find((p) => p.value === platform) || PLATFORM_DEFS[0];
  const urlPlaceholder =
    currentPlatform.placeholder || t("importExternal.url_placeholder");

  // "Only images selected" → switch to the product↔image matching flow.
  const imagesOnly =
    fields.image &&
    !fields.category &&
    !fields.name &&
    !fields.portion &&
    !fields.price;

  const items = scanResult?.items || [];

  const productOptions = useMemo(
    () => existingProducts.map((p) => ({ label: p.name, value: p.id })),
    [existingProducts],
  );

  const toggleField = (key) =>
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));

  const resetResults = () => {
    setScanResult(null);
    setScanError(null);
    setIncludeRows(new Set());
    setImageMatches({});
    setApplyResult(null);
  };

  // Fetch the restaurant's existing products (for image↔product matching).
  const fetchExistingProducts = useCallback(async () => {
    try {
      const api = privateApi();
      const r = await api.get(
        `${baseURL}Products/getProductsByRestaurantId`,
        { params: { restaurantId, pageNumber: 1, pageSize: 2000 } },
      );
      return r?.data?.data || [];
    } catch {
      return [];
    }
  }, [restaurantId]);

  const handleScan = async () => {
    if (!url.trim() || selectedFieldList.length === 0 || scanning) return;
    setScanning(true);
    resetResults();
    try {
      const api = privateApi();
      // skipErrorToast: surface backend-not-ready as a friendly inline panel
      // instead of the global red toast.
      const res = await api.post(
        `${baseURL}ImportExternal/Scan`,
        { restaurantId, url: url.trim(), platform, fields: selectedFieldList },
        { skipErrorToast: true },
      );
      const payload = res?.data?.data ?? res?.data ?? {};
      const scanned = Array.isArray(payload.items) ? payload.items : [];
      setScanResult({
        source: payload.source || "",
        categories: payload.categories || [],
        items: scanned,
      });
      setIncludeRows(new Set(scanned.map((_, i) => i)));

      // Image-only mode: load existing products and auto-match by name.
      if (imagesOnly) {
        const prods = await fetchExistingProducts();
        setExistingProducts(prods);
        const byName = new Map();
        for (const p of prods) {
          const k = normalizeName(p.name);
          if (k && !byName.has(k)) byName.set(k, p.id);
        }
        const matches = {};
        scanned.forEach((it, i) => {
          const pid = byName.get(normalizeName(it.name));
          if (pid) matches[i] = pid;
        });
        setImageMatches(matches);
      }
    } catch (err) {
      const status = err?.response?.status;
      // 404 / network → feature not deployed yet (graceful), else generic.
      setScanError(
        status === 404 || !err?.response
          ? "not_ready"
          : err?.response?.data?.message_TR ||
              err?.response?.data?.message ||
              "error",
      );
    } finally {
      setScanning(false);
    }
  };

  const toggleRow = (i) =>
    setIncludeRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const handleApply = async () => {
    if (applying) return;
    let body;
    if (imagesOnly) {
      const imgMatches = items
        .map((it, i) =>
          imageMatches[i] ? { productId: imageMatches[i], imageURL: it.imageURL } : null,
        )
        .filter(Boolean);
      if (imgMatches.length === 0) {
        toast.error(t("importExternal.no_matches"));
        return;
      }
      body = { restaurantId, platform, fields: selectedFieldList, mode: "images", imageMatches: imgMatches };
    } else {
      const included = items.filter((_, i) => includeRows.has(i));
      if (included.length === 0) {
        toast.error(t("importExternal.no_rows"));
        return;
      }
      body = { restaurantId, platform, fields: selectedFieldList, mode: "create", items: included };
    }

    setApplying(true);
    setApplyResult(null);
    try {
      const api = privateApi();
      const res = await api.post(`${baseURL}ImportExternal/Apply`, body);
      const r = res?.data?.data ?? res?.data ?? {};
      setApplyResult(r);
      toast.success(t("importExternal.import_success"));
      // Invalidate the products list so the new items/images show up.
      dispatch(
        getProducts({ restaurantId, pageNumber: 1, pageSize: 20 }),
      ).unwrap?.().catch?.(() => {});
      if (!imagesOnly) {
        setTimeout(() => navigate(`/restaurant/products/${restaurantId}`), 900);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || !err?.response) {
        toast.error(t("importExternal.not_ready_short"));
      }
      // other errors are toasted by the response interceptor
    } finally {
      setApplying(false);
    }
  };

  const priceOf = (it) =>
    it?.price ?? (Array.isArray(it?.portions) ? it.portions[0]?.price : null);

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <DownloadCloud className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold truncate tracking-tight">
              {t("importExternal.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("importExternal.subtitle")}
            </p>
          </div>
        </div>

        {/* STEP 1 — URL + field selection */}
        <div className="px-4 sm:px-5 py-4 border-b border-[--border-1] bg-[--white-2]/40">
          {/* Platform picker — routes the backend to the right adapter */}
          <label className="block text-xs font-semibold text-[--gr-1] mb-1.5">
            {t("importExternal.platform_label")}
          </label>
          <div className="mb-3 sm:max-w-xs">
            <CustomSelect
              label=""
              value={
                platformOptions.find((o) => o.value === platform) ||
                platformOptions[0]
              }
              options={platformOptions}
              onChange={(opt) => setPlatform(opt?.value || "generic")}
              className="text-sm"
              className2="relative w-full"
              menuPlacement="auto"
            />
          </div>
          <label className="block text-xs font-semibold text-[--gr-1] mb-1.5">
            {t("importExternal.url_label")}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[--gr-2]">
                <Globe className="size-4" />
              </span>
              <input
                type="url"
                inputMode="url"
                placeholder={urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan()}
                className="block w-full pl-9 pr-3 h-10 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
            <button
              type="button"
              onClick={handleScan}
              disabled={!url.trim() || selectedFieldList.length === 0 || scanning}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: PRIMARY_GRADIENT }}
            >
              {scanning ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ScanLine className="size-4" />
              )}
              {t("importExternal.scan_btn")}
            </button>
          </div>

          {/* Field selection */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-[--gr-1] mb-1.5">
              {t("importExternal.fields_label")}
            </div>
            <div className="flex flex-wrap gap-2">
              {FIELD_DEFS.map((f) => {
                const on = fields[f.key];
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => toggleField(f.key)}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border transition ${
                      on
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25"
                        : "bg-[--white-1] text-[--gr-1] border-[--border-1] hover:border-indigo-300"
                    }`}
                  >
                    {on && <Check className="size-3.5" />}
                    {t(`importExternal.${f.labelKey}`)}
                  </button>
                );
              })}
              {/* Etiket — deferred */}
              <span
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-dashed border-[--border-1] text-[--gr-2] cursor-not-allowed select-none"
                title={t("importExternal.tag_soon")}
              >
                <Tag className="size-3.5" />
                {t("importExternal.field_tag")}
                <span className="ml-0.5 text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-[--white-2] text-[--gr-2]">
                  {t("importExternal.soon")}
                </span>
              </span>
            </div>
            {imagesOnly && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                <Sparkles className="size-3.5" />
                {t("importExternal.images_only_hint")}
              </p>
            )}
          </div>
        </div>

        {/* RESULTS */}
        <div className="p-3 sm:p-5">
          {scanError ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-amber-50 text-amber-600 mb-3 dark:bg-amber-500/15 dark:text-amber-300">
                <AlertTriangle className="size-6" />
              </span>
              <h3 className="text-sm font-semibold">
                {scanError === "not_ready"
                  ? t("importExternal.not_ready_title")
                  : t("importExternal.scan_failed_title")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1 max-w-md">
                {scanError === "not_ready"
                  ? t("importExternal.not_ready_desc")
                  : t("importExternal.scan_failed_desc")}
              </p>
            </div>
          ) : !scanResult ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3 dark:bg-indigo-500/15 dark:text-indigo-300">
                <DownloadCloud className="size-6" />
              </span>
              <h3 className="text-sm font-semibold">
                {t("importExternal.empty_title")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1 max-w-md">
                {t("importExternal.empty_desc")}
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <h3 className="text-sm font-semibold">
                {t("importExternal.no_results_title")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1">
                {t("importExternal.no_results_desc")}
              </p>
            </div>
          ) : imagesOnly ? (
            // === IMAGE ↔ PRODUCT MATCHING ===
            <>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[--gr-1]">
                  {t("importExternal.match_count", { count: items.length })}
                </span>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
                  style={{ background: PRIMARY_GRADIENT }}
                >
                  {applying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {t("importExternal.import_images_btn")}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[--border-1] bg-[--white-1]"
                  >
                    {it.imageURL ? (
                      <img
                        src={it.imageURL}
                        alt=""
                        className="size-14 rounded-lg object-cover border border-[--border-1] shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <span className="grid place-items-center size-14 rounded-lg bg-[--white-2] text-[--gr-2] shrink-0">
                        <ImageOff className="size-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      {it.name && (
                        <div className="text-xs text-[--gr-1] truncate mb-1">
                          {it.name}
                        </div>
                      )}
                      <CustomSelect
                        label=""
                        value={
                          productOptions.find((o) => o.value === imageMatches[i]) ||
                          null
                        }
                        options={productOptions}
                        onChange={(opt) =>
                          setImageMatches((prev) => ({
                            ...prev,
                            [i]: opt?.value || null,
                          }))
                        }
                        placeholder={t("importExternal.pick_product")}
                        isSearchable
                        isClearable
                        className="text-sm"
                        className2="relative w-full"
                        menuPlacement="auto"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // === GENERAL PREVIEW TABLE ===
            <>
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[--gr-1]">
                  {t("importExternal.preview_count", {
                    selected: includeRows.size,
                    total: items.length,
                  })}
                </span>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying || includeRows.size === 0}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition disabled:opacity-50"
                  style={{ background: PRIMARY_GRADIENT }}
                >
                  {applying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  {t("importExternal.import_btn")}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[--border-1]">
                <table className="w-full text-sm">
                  <thead className="bg-[--white-2]/60 text-[--gr-1]">
                    <tr className="text-left">
                      <th className="w-10 p-2"></th>
                      {fields.image && <th className="w-14 p-2"></th>}
                      {fields.name && (
                        <th className="p-2 font-semibold">
                          {t("importExternal.field_name")}
                        </th>
                      )}
                      {fields.category && (
                        <th className="p-2 font-semibold">
                          {t("importExternal.field_category")}
                        </th>
                      )}
                      {fields.portion && (
                        <th className="p-2 font-semibold">
                          {t("importExternal.field_portion")}
                        </th>
                      )}
                      {fields.price && (
                        <th className="p-2 font-semibold text-right">
                          {t("importExternal.field_price")}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, i) => {
                      const on = includeRows.has(i);
                      return (
                        <tr
                          key={i}
                          onClick={() => toggleRow(i)}
                          className={`border-t border-[--border-1] cursor-pointer transition ${
                            on ? "bg-[--white-1]" : "bg-[--white-2]/40 opacity-60"
                          } hover:bg-indigo-50/40`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleRow(i)}
                              onClick={(e) => e.stopPropagation()}
                              className="size-4 accent-indigo-600"
                            />
                          </td>
                          {fields.image && (
                            <td className="p-2">
                              {it.imageURL ? (
                                <img
                                  src={it.imageURL}
                                  alt=""
                                  className="size-10 rounded-md object-cover border border-[--border-1]"
                                  loading="lazy"
                                />
                              ) : (
                                <span className="grid place-items-center size-10 rounded-md bg-[--white-2] text-[--gr-2]">
                                  <ImageOff className="size-4" />
                                </span>
                              )}
                            </td>
                          )}
                          {fields.name && (
                            <td className="p-2 font-medium text-[--black-1]">
                              {it.name || "—"}
                            </td>
                          )}
                          {fields.category && (
                            <td className="p-2 text-[--gr-1]">
                              {it.category || "—"}
                            </td>
                          )}
                          {fields.portion && (
                            <td className="p-2 text-[--gr-1]">
                              {Array.isArray(it.portions) && it.portions.length
                                ? it.portions
                                    .map((p) => p.name)
                                    .filter(Boolean)
                                    .join(", ") ||
                                  t("importExternal.portion_count", {
                                    count: it.portions.length,
                                  })
                                : "—"}
                            </td>
                          )}
                          {fields.price && (
                            <td className="p-2 text-right font-semibold text-[--black-1] whitespace-nowrap">
                              {priceOf(it) != null ? priceOf(it) : "—"}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {applyResult && (
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-400/30">
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Check className="size-4" />
                {t("importExternal.import_success")}
              </span>
              <span className="ml-2 text-xs">
                {t("importExternal.result_summary", {
                  categories: applyResult.createdCategories ?? 0,
                  products: applyResult.createdProducts ?? 0,
                  images: applyResult.updatedImages ?? 0,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportExternal;
