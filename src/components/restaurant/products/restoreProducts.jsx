// "Yedeği Yükle" — restore the manually-authored bits (image /
// description / allergens) from a ZIP previously produced by
// backupProducts.jsx. Matching is BY NAME (TR-normalised) since IDs
// from the export will not survive any add / delete / reorder
// activity in between.
//
// MULTI-PHASE FLOW:
//   1) idle      — file picker
//   2) parsing   — read ZIP + manifest, validate
//   3) ready     — show backup metadata + 3 apply toggles + diff
//                  preview (matched / ambiguous / unmatched); user
//                  reviews and confirms
//   4) applying  — progress bar while we walk the matched list and
//                  push updates via the existing EditProduct +
//                  UpdateProductAllergens endpoints
//   5) done      — summary report (updated / failed / skipped) with
//                  a "Kapat" button
//
// EDIT PRODUCT CONTRACT: `PUT /Products/EditProduct` is multipart and
// expects the WHOLE product DTO — partial updates are not supported.
// So for any image / description restore we have to clone the live
// product, override the touched fields, and PUT it back. Allergens
// have their own endpoint (`PUT /Products/{id}/Allergens`) which IS
// partial-friendly. The applier merges these two patterns per item.
//
// AMBIGUOUS MATCHES: if a name in the backup maps to N > 1 live
// products (legitimate menus do have multiple "Çay" rows in different
// categories), we apply the same data to ALL matches. This is the
// pragmatic default — same name almost always means the same dish.
// Counted separately in the summary so the user can spot anomalies.

import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Wheat,
  X,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FileWarning,
  Info,
  AlertCircle,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;

const SUPPORTED_VERSION = 1;
const SUPPORTED_TYPE = "liwamenu.products.backup";

// Concurrent product updates — bounded so a 500-item restore doesn't
// fire 500 simultaneous requests at the .NET backend (which will
// throttle / queue / time out). 3 is the sweet spot from manual
// testing: meaningfully faster than sequential without overloading.
const APPLY_CONCURRENCY = 3;

// TR-aware fold for the name matching index. Mirrors the one used by
// products.jsx so the search bar and the import matcher agree on what
// "Türk Kahvesi" / "turk kahvesi" / "TÜRK KAHVESİ" all collapse to.
const TR_FOLD = {
  ı: "i", İ: "i", i: "i", I: "i",
  ş: "s", Ş: "s",
  ğ: "g", Ğ: "g",
  ç: "c", Ç: "c",
  ü: "u", Ü: "u",
  ö: "o", Ö: "o",
};
function normaliseName(s) {
  if (!s) return "";
  let out = "";
  for (const ch of String(s)) out += TR_FOLD[ch] ?? ch.toLowerCase();
  return out
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Bounded-concurrency walk; preserves input order in the result so we
// can correlate items with their per-item results in the summary.
async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (true) {
        const i = cursor++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return out;
}

// Parse a numeric / string price safely — re-used here only for the
// EditProduct portion payload (we don't TOUCH prices, just have to
// echo them back since the PUT contract is whole-product).
function safePrice(v) {
  if (v == null || v === "") return 0;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

// Build a fresh FormData per product so each apply call is isolated.
// Mirrors the field set used by editProduct.jsx / quickEditImage.jsx
// — keep these three call-sites in sync if the backend contract
// changes (the .NET PUT will silently 200 with missing fields).
function buildEditFormData(product, overrides) {
  const fd = new FormData();
  fd.append("id", product.id);
  fd.append("restaurantId", product.restaurantId);
  fd.append("name", product.name || "");
  fd.append(
    "description",
    overrides.description != null ? overrides.description : product.description || "",
  );
  fd.append("recommendation", !!product.recommendation);
  fd.append("hide", !!product.hide);
  fd.append("freeTagging", !!product.freeTagging);
  fd.append("isCampaign", !!product.isCampaign);

  const categoriesPayload = (product.categories || []).map((c) => ({
    categoryId: c.categoryId,
    ...(c.subCategoryId ? { subCategoryId: c.subCategoryId } : {}),
  }));
  fd.append("categories", JSON.stringify(categoriesPayload));
  const firstCat = (product.categories || [])[0];
  fd.append("categoryId", firstCat?.categoryId || "");
  fd.append("subCategoryId", firstCat?.subCategoryId || "");

  if (overrides.imageFile) {
    fd.append("image", overrides.imageFile);
  }

  const portions = (product.portions || []).map((p) => ({
    id: p.id,
    productId: p.productId,
    name: p.name,
    price: safePrice(p.price),
    campaignPrice: safePrice(p.campaignPrice),
    specialPrice: safePrice(p.specialPrice),
  }));
  fd.append("portions", JSON.stringify(portions));

  return fd;
}

// ── Modal ──────────────────────────────────────────────────────────────
export default function RestoreProductsModal({ restaurantId, onApplied }) {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();

  const restaurant = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    const list = s.restaurants.getRestaurants?.restaurants?.data;
    return list?.find?.((r) => r.id === restaurantId) || null;
  });
  const restaurantName = restaurant?.name || "";

  const [phase, setPhase] = useState("idle"); // idle | parsing | ready | applying | done
  const [error, setError] = useState("");
  const [zip, setZip] = useState(null); // JSZip instance
  const [manifest, setManifest] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null); // { matched: [...], ambiguous: [...], unmatched: [...] }
  const [currentProducts, setCurrentProducts] = useState([]);

  // Apply toggles — default to whatever the manifest contains.
  const [applyImages, setApplyImages] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);
  const [applyAllergens, setApplyAllergens] = useState(true);

  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [summary, setSummary] = useState(null); // { updated, failed, ambiguousCount, unmatchedCount, errors: [...] }

  const fileInputRef = useRef(null);

  const close = () => {
    if (phase === "parsing" || phase === "applying") return;
    setSecondPopupContent(null);
    if (phase === "done" && onApplied) onApplied();
  };

  // ── Phase 2: parsing ───────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setPhase("parsing");
    try {
      // Dynamic-import JSZip — keeps the initial Products-page bundle
      // slim (the lib is ~100 KB and only matters when a restore is
      // actually happening). Same pattern as backupProducts.jsx and
      // the long-standing usage in qrPage.jsx.
      const { default: JSZip } = await import("jszip");
      const zipInstance = await JSZip.loadAsync(file);
      const manifestFile = zipInstance.file("manifest.json");
      if (!manifestFile) {
        throw new Error("MISSING_MANIFEST");
      }
      const manifestText = await manifestFile.async("string");
      const parsed = JSON.parse(manifestText);

      if (parsed?.type !== SUPPORTED_TYPE) {
        throw new Error("WRONG_TYPE");
      }
      if (Number(parsed?.version) !== SUPPORTED_VERSION) {
        throw new Error("WRONG_VERSION");
      }
      if (!Array.isArray(parsed?.products)) {
        throw new Error("MALFORMED");
      }

      // Default the apply toggles to what's actually in the file —
      // a backup made with "images off" should not offer an image-
      // apply toggle in a misleading "on" state.
      setApplyImages(!!parsed?.includes?.image);
      setApplyDescription(!!parsed?.includes?.description);
      setApplyAllergens(!!parsed?.includes?.allergens);

      // Pull the current product catalog so we can pre-compute the
      // diff before the user even clicks "Apply" — they get to see
      // the impact and decide.
      const api = privateApi();
      const PAGE = 2000;
      const first = await api.get(
        `${baseURL}Products/getProductsByRestaurantId`,
        { params: { restaurantId, pageNumber: 1, pageSize: PAGE } },
      );
      const total = first?.data?.totalCount ?? 0;
      const firstPage = first?.data?.data || [];
      let products = firstPage;
      if (firstPage.length < total) {
        const totalPages = Math.ceil(total / PAGE);
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            api
              .get(`${baseURL}Products/getProductsByRestaurantId`, {
                params: {
                  restaurantId,
                  pageNumber: i + 2,
                  pageSize: PAGE,
                },
              })
              .then((r) => r?.data?.data || [])
              .catch(() => []),
          ),
        );
        products = firstPage.concat(...rest);
      }

      // Build a name → [products] index. Multiple live products can
      // share the same normalised name (Çay × 3) so values are arrays.
      const indexByName = new Map();
      for (const p of products || []) {
        const k = normaliseName(p?.name);
        if (!k) continue;
        const bucket = indexByName.get(k);
        if (bucket) bucket.push(p);
        else indexByName.set(k, [p]);
      }

      const matched = [];
      const ambiguous = [];
      const unmatched = [];
      for (const entry of parsed.products) {
        const key = normaliseName(entry?.name);
        if (!key) {
          unmatched.push(entry);
          continue;
        }
        const live = indexByName.get(key);
        if (!live || live.length === 0) {
          unmatched.push(entry);
        } else if (live.length === 1) {
          matched.push({ entry, targets: live });
        } else {
          ambiguous.push({ entry, targets: live });
        }
      }

      setZip(zipInstance);
      setManifest(parsed);
      setCurrentProducts(products);
      setMatchInfo({ matched, ambiguous, unmatched });
      setPhase("ready");
    } catch (err) {
      console.error("backup parse failed", err);
      let key = "productsList.restore_error_generic";
      let fallback = "Yedek dosyası okunamadı.";
      const code = err?.message;
      if (code === "MISSING_MANIFEST") {
        key = "productsList.restore_error_missing_manifest";
        fallback = "manifest.json bulunamadı — bu dosya geçerli bir Liwa yedeği değil.";
      } else if (code === "WRONG_TYPE") {
        key = "productsList.restore_error_wrong_type";
        fallback = "Bu dosya bir Liwa ürün yedeği değil.";
      } else if (code === "WRONG_VERSION") {
        key = "productsList.restore_error_wrong_version";
        fallback = "Bu yedek dosyasının formatı desteklenmiyor (yeni sürüm gerekebilir).";
      } else if (code === "MALFORMED") {
        key = "productsList.restore_error_malformed";
        fallback = "Yedek dosyasının yapısı bozuk.";
      }
      setError(t(key, fallback));
      setPhase("idle");
    }
  };

  // ── Phase 4: applying ──────────────────────────────────────────────
  const handleApply = async () => {
    if (!matchInfo || !zip) return;

    // Combine matched + ambiguous (ambiguous → apply to all live
    // targets, same data) into one work queue.
    const work = [
      ...matchInfo.matched.flatMap((m) =>
        m.targets.map((t) => ({ entry: m.entry, target: t, ambiguous: false })),
      ),
      ...matchInfo.ambiguous.flatMap((m) =>
        m.targets.map((t) => ({ entry: m.entry, target: t, ambiguous: true })),
      ),
    ];

    if (work.length === 0) {
      toast.error(
        t(
          "productsList.restore_nothing_to_apply",
          "Uygulanacak bir kayıt yok.",
        ),
      );
      return;
    }

    setPhase("applying");
    setProgress({ done: 0, total: work.length });

    const api = privateApi();
    const errors = [];
    let updated = 0;
    let failed = 0;
    let done = 0;

    await mapWithConcurrency(work, APPLY_CONCURRENCY, async (job) => {
      const { entry, target } = job;
      try {
        // Pull image blob lazily from the ZIP — keeps memory bounded
        // (instead of holding every image in RAM after parse).
        let imageFile = null;
        if (applyImages && entry.image) {
          const fileEntry = zip.file(entry.image);
          if (fileEntry) {
            const blob = await fileEntry.async("blob");
            // Reasonable Content-Type guess from extension; backend
            // accepts whatever the multipart field carries.
            const ext = entry.image.split(".").pop() || "jpg";
            const mime =
              ext === "png"
                ? "image/png"
                : ext === "webp"
                  ? "image/webp"
                  : ext === "gif"
                    ? "image/gif"
                    : "image/jpeg";
            imageFile = new File([blob], `restore.${ext}`, { type: mime });
          }
        }

        const needsEdit =
          (applyImages && imageFile != null) ||
          (applyDescription && entry.description != null);

        if (needsEdit) {
          const overrides = {};
          if (applyDescription && entry.description != null) {
            overrides.description = entry.description;
          }
          if (imageFile) overrides.imageFile = imageFile;
          const fd = buildEditFormData(target, overrides);
          await api.put(`${baseURL}Products/EditProduct`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        if (applyAllergens && Array.isArray(entry.allergens)) {
          await api.put(`${baseURL}Products/${target.id}/Allergens`, {
            allergens: entry.allergens,
          });
        }

        updated += 1;
      } catch (err) {
        failed += 1;
        const msg =
          err?.response?.data?.message_TR ||
          err?.response?.data?.message ||
          err?.message ||
          "unknown";
        errors.push({ name: target?.name || entry?.name, message: msg });
      } finally {
        done += 1;
        setProgress({ done, total: work.length });
      }
    });

    setSummary({
      updated,
      failed,
      ambiguousCount: matchInfo.ambiguous.length,
      unmatchedCount: matchInfo.unmatched.length,
      errors: errors.slice(0, 50), // cap the visible list
      totalErrors: errors.length,
    });
    setPhase("done");
  };

  const reset = () => {
    setPhase("idle");
    setError("");
    setZip(null);
    setManifest(null);
    setMatchInfo(null);
    setCurrentProducts([]);
    setProgress({ done: 0, total: 0 });
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-[640px] shadow-2xl ring-1 ring-[--border-1] overflow-hidden animate-[fadeIn_0.18s_ease-out] max-h-[90vh] flex flex-col">
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)",
          }}
        />

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3 shrink-0">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-amber-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)",
            }}
          >
            <Upload className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
              {t("productsList.restore_modal_title", "Ürün Yedeğini Yükle")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {restaurantName ||
                t(
                  "productsList.restore_modal_desc",
                  "Görsel, açıklama ve alerjenleri yedekten geri yükle",
                )}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={phase === "parsing" || phase === "applying"}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition disabled:opacity-50"
            aria-label={t("productsList.restore_cancel", "Vazgeç")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* BODY — scrollable */}
        <div className="flex-1 overflow-auto">
          {/* PHASE: idle — file picker */}
          {phase === "idle" && (
            <IdlePhase
              t={t}
              error={error}
              onPick={() => fileInputRef.current?.click()}
              fileInputRef={fileInputRef}
              onFileChange={(e) => handleFile(e.target.files?.[0])}
            />
          )}

          {/* PHASE: parsing — spinner */}
          {phase === "parsing" && (
            <div className="p-10 text-center">
              <Loader2 className="size-7 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-[13px] text-[--gr-1]">
                {t("productsList.restore_parsing", "Yedek dosyası okunuyor…")}
              </p>
            </div>
          )}

          {/* PHASE: ready — manifest preview + toggles + diff */}
          {phase === "ready" && matchInfo && manifest && (
            <ReadyPhase
              t={t}
              manifest={manifest}
              matchInfo={matchInfo}
              applyImages={applyImages}
              setApplyImages={setApplyImages}
              applyDescription={applyDescription}
              setApplyDescription={setApplyDescription}
              applyAllergens={applyAllergens}
              setApplyAllergens={setApplyAllergens}
            />
          )}

          {/* PHASE: applying — progress bar */}
          {phase === "applying" && (
            <div className="p-10 text-center">
              <Loader2 className="size-7 animate-spin text-amber-600 mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[--black-1] mb-1">
                {t(
                  "productsList.restore_applying",
                  "Ürünler güncelleniyor…",
                )}
              </p>
              <p className="text-[12px] text-[--gr-1] mb-4">
                {t("productsList.restore_progress", "{{done}} / {{total}}", {
                  done: progress.done,
                  total: progress.total,
                })}
              </p>
              <div className="max-w-sm mx-auto h-2 rounded-full bg-[--white-2] overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{
                    width:
                      progress.total > 0
                        ? `${Math.round((progress.done / progress.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          )}

          {/* PHASE: done — summary report */}
          {phase === "done" && summary && (
            <SummaryPhase t={t} summary={summary} />
          )}
        </div>

        {/* FOOTER — buttons depend on phase */}
        <div className="px-5 py-3 border-t border-[--border-1] bg-[--white-2]/40 flex items-center gap-2 justify-end shrink-0">
          {phase === "ready" && (
            <>
              <button
                type="button"
                onClick={reset}
                className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--gr-1] text-sm font-semibold hover:bg-[--white-2] transition inline-flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                {t("productsList.restore_pick_other", "Başka Dosya")}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={
                  matchInfo.matched.length + matchInfo.ambiguous.length === 0 ||
                  (!applyImages && !applyDescription && !applyAllergens)
                }
                className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-amber-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg,#f59e0b 0%,#f97316 50%,#ef4444 100%)",
                }}
              >
                <Upload className="size-4" />
                {t("productsList.restore_apply", "Geri Yükle")}
              </button>
            </>
          )}
          {phase === "done" && (
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-emerald-500/25 transition hover:brightness-110 active:brightness-95"
              style={{
                background:
                  "linear-gradient(135deg,#059669 0%,#10b981 50%,#22d3ee 100%)",
              }}
            >
              <Check className="size-4" />
              {t("productsList.restore_close", "Kapat")}
            </button>
          )}
          {phase === "idle" && (
            <button
              type="button"
              onClick={close}
              className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--gr-1] text-sm font-semibold hover:bg-[--white-2] transition"
            >
              {t("productsList.restore_cancel", "Vazgeç")}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

// ─── Phase components ─────────────────────────────────────────────────

const IdlePhase = ({ t, error, onPick, fileInputRef, onFileChange }) => (
  <div className="p-6">
    <button
      type="button"
      onClick={onPick}
      className="w-full border-2 border-dashed border-[--border-1] hover:border-amber-300 hover:bg-amber-50/40 dark:hover:bg-amber-500/10 rounded-2xl p-10 transition flex flex-col items-center gap-3 text-center"
    >
      <span className="grid place-items-center size-14 rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
        <Upload className="size-6" />
      </span>
      <span className="text-[14px] font-semibold text-[--black-1]">
        {t("productsList.restore_pick_file", "Yedek ZIP dosyasını seç")}
      </span>
      <span className="text-[11px] text-[--gr-1] max-w-xs">
        {t(
          "productsList.restore_pick_hint",
          "'Yedek Al' ile oluşturulmuş bir .zip dosyası bekleniyor.",
        )}
      </span>
    </button>
    <input
      ref={fileInputRef}
      type="file"
      accept=".zip,application/zip,application/x-zip-compressed"
      onChange={onFileChange}
      className="hidden"
    />
    {error && (
      <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[12px] dark:bg-rose-500/15 dark:border-rose-400/30 dark:text-rose-200">
        <AlertCircle className="size-4 shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    )}
  </div>
);

const ReadyPhase = ({
  t,
  manifest,
  matchInfo,
  applyImages,
  setApplyImages,
  applyDescription,
  setApplyDescription,
  applyAllergens,
  setApplyAllergens,
}) => {
  const { matched, ambiguous, unmatched } = matchInfo;
  const [expandedSection, setExpandedSection] = useState(null); // 'amb' | 'unmatched' | null

  const incl = manifest.includes || {};
  // Format the manifest creation date in the user's locale.
  let dateStr = "";
  try {
    dateStr = new Date(manifest.createdAt).toLocaleString();
  } catch {
    dateStr = manifest.createdAt || "";
  }

  return (
    <div className="p-5 space-y-4">
      {/* Backup info card */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 dark:bg-amber-500/10 dark:border-amber-400/30">
        <div className="flex items-start gap-2.5">
          <Info className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1 text-[12px]">
            <div className="font-semibold text-[--black-1] truncate">
              {manifest.restaurantName || "—"}
            </div>
            <div className="text-[--gr-1] mt-0.5">
              {t("productsList.restore_backup_meta", "{{count}} ürün · {{date}}", {
                count: (manifest.products || []).length,
                date: dateStr,
              })}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {incl.image && (
                <Pill label={t("productsList.backup_with_images", "Görseller")} icon={ImageIcon} />
              )}
              {incl.description && (
                <Pill
                  label={t("productsList.backup_with_description", "Açıklamalar")}
                  icon={FileText}
                />
              )}
              {incl.allergens && (
                <Pill
                  label={t("productsList.backup_with_allergens", "Alerjen bilgileri")}
                  icon={Wheat}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Diff summary */}
      <div className="grid grid-cols-3 gap-2">
        <DiffStat
          colour="emerald"
          icon={CheckCircle2}
          value={matched.length}
          label={t("productsList.restore_stat_matched", "Eşleşen")}
        />
        <DiffStat
          colour="amber"
          icon={AlertTriangle}
          value={ambiguous.length}
          label={t("productsList.restore_stat_ambiguous", "Çoklu Eşleşme")}
          onClick={
            ambiguous.length > 0
              ? () => setExpandedSection((p) => (p === "amb" ? null : "amb"))
              : null
          }
          expanded={expandedSection === "amb"}
        />
        <DiffStat
          colour="rose"
          icon={XCircle}
          value={unmatched.length}
          label={t("productsList.restore_stat_unmatched", "Eşleşmeyen")}
          onClick={
            unmatched.length > 0
              ? () => setExpandedSection((p) => (p === "unmatched" ? null : "unmatched"))
              : null
          }
          expanded={expandedSection === "unmatched"}
        />
      </div>

      {/* Expanded list of ambiguous / unmatched */}
      {expandedSection === "amb" && ambiguous.length > 0 && (
        <ListBox
          tone="amber"
          title={t(
            "productsList.restore_ambiguous_title",
            "Aynı isimde birden fazla ürün — hepsine aynı veri uygulanacak",
          )}
        >
          {ambiguous.map((a, i) => (
            <li
              key={`${a.entry.name}-${i}`}
              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md"
            >
              <span className="truncate font-medium">{a.entry.name}</span>
              <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                ×{a.targets.length}
              </span>
            </li>
          ))}
        </ListBox>
      )}
      {expandedSection === "unmatched" && unmatched.length > 0 && (
        <ListBox
          tone="rose"
          title={t(
            "productsList.restore_unmatched_title",
            "Bu ürünler mevcut listede bulunamadı — atlanacak",
          )}
        >
          {unmatched.map((u, i) => (
            <li
              key={`${u.name}-${i}`}
              className="truncate py-1.5 px-2 rounded-md font-medium"
            >
              {u.name || "—"}
            </li>
          ))}
        </ListBox>
      )}

      {/* Apply toggles */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
          {t("productsList.restore_apply_what", "Neler uygulansın?")}
        </div>
        <div className="space-y-2">
          {incl.image && (
            <ApplyToggle
              icon={ImageIcon}
              label={t("productsList.backup_with_images", "Görseller")}
              checked={applyImages}
              onChange={setApplyImages}
            />
          )}
          {incl.description && (
            <ApplyToggle
              icon={FileText}
              label={t("productsList.backup_with_description", "Açıklamalar")}
              checked={applyDescription}
              onChange={setApplyDescription}
            />
          )}
          {incl.allergens && (
            <ApplyToggle
              icon={Wheat}
              label={t("productsList.backup_with_allergens", "Alerjen bilgileri")}
              checked={applyAllergens}
              onChange={setApplyAllergens}
            />
          )}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11.5px] leading-snug dark:bg-rose-500/10 dark:border-rose-400/30 dark:text-rose-200">
        <FileWarning className="size-4 shrink-0 mt-0.5" />
        <span>
          {t(
            "productsList.restore_warning",
            "Mevcut görsel, açıklama ve alerjen bilgileri yedektekiyle değiştirilir. Bu işlem geri alınamaz.",
          )}
        </span>
      </div>
    </div>
  );
};

const SummaryPhase = ({ t, summary }) => (
  <div className="p-5 space-y-3">
    <div className="text-center pt-2 pb-3">
      <span className="grid place-items-center size-14 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 mx-auto mb-3 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
        <CheckCircle2 className="size-7" />
      </span>
      <h3 className="text-[15px] font-bold text-[--black-1]">
        {t("productsList.restore_done_title", "Geri Yükleme Tamamlandı")}
      </h3>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <SummaryStat
        colour="emerald"
        value={summary.updated}
        label={t("productsList.restore_summary_updated", "Güncellendi")}
      />
      <SummaryStat
        colour="rose"
        value={summary.failed}
        label={t("productsList.restore_summary_failed", "Başarısız")}
      />
      <SummaryStat
        colour="amber"
        value={summary.ambiguousCount}
        label={t("productsList.restore_summary_ambiguous", "Çoklu Eşleşme")}
      />
      <SummaryStat
        colour="slate"
        value={summary.unmatchedCount}
        label={t("productsList.restore_summary_unmatched", "Eşleşmeyen")}
      />
    </div>

    {summary.errors && summary.errors.length > 0 && (
      <ListBox
        tone="rose"
        title={t(
          "productsList.restore_summary_errors_title",
          "Hata Veren Ürünler",
        )}
      >
        {summary.errors.map((e, i) => (
          <li key={i} className="py-1.5 px-2 rounded-md">
            <div className="font-medium truncate">{e.name}</div>
            <div className="text-[10.5px] text-rose-700 truncate dark:text-rose-300">
              {e.message}
            </div>
          </li>
        ))}
        {summary.totalErrors > summary.errors.length && (
          <li className="text-[10.5px] text-[--gr-1] px-2 pt-1">
            {t("productsList.restore_summary_errors_more", "+{{count}} daha", {
              count: summary.totalErrors - summary.errors.length,
            })}
          </li>
        )}
      </ListBox>
    )}
  </div>
);

// ─── Small bits ───────────────────────────────────────────────────────

const ApplyToggle = ({ icon: Icon, label, checked, onChange }) => (
  <label
    className={`flex items-center gap-3 p-2.5 rounded-lg border transition cursor-pointer ${
      checked
        ? "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/30"
        : "bg-[--white-1] border-[--border-1] hover:border-amber-200"
    }`}
  >
    <span
      className={`grid place-items-center size-7 rounded-md shrink-0 transition ${
        checked ? "bg-amber-500 text-white" : "bg-[--white-2] text-[--gr-1]"
      }`}
    >
      <Icon className="size-3.5" />
    </span>
    <div className="text-[13px] font-semibold text-[--black-1] flex-1">
      {label}
    </div>
    <span
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition ${
        checked
          ? "bg-amber-500 border-amber-600"
          : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`inline-block size-3 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        } translate-y-[1px]`}
      />
    </span>
  </label>
);

const DiffStat = ({ colour, icon: Icon, value, label, onClick, expanded }) => {
  const tones = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-400/30 dark:text-emerald-200",
    amber: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-200",
    rose: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-400/30 dark:text-rose-200",
  };
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick || undefined}
      disabled={!interactive}
      className={`rounded-xl border px-3 py-3 text-left transition ${tones[colour]} ${interactive ? "hover:brightness-105 active:brightness-95 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-3.5" />
        <span className="text-[10.5px] font-bold uppercase tracking-wider truncate flex-1">
          {label}
        </span>
        {interactive &&
          (expanded ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          ))}
      </div>
      <div className="text-[20px] font-bold leading-none">{value}</div>
    </button>
  );
};

const SummaryStat = ({ colour, value, label }) => {
  const tones = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-400/30 dark:text-emerald-200",
    rose: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-400/30 dark:text-rose-200",
    amber: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/10 dark:border-amber-400/30 dark:text-amber-200",
    slate: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-700/30 dark:border-slate-500/30 dark:text-slate-200",
  };
  return (
    <div className={`rounded-xl border px-3 py-3 ${tones[colour]}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-wider mb-0.5">
        {label}
      </div>
      <div className="text-[20px] font-bold leading-none">{value}</div>
    </div>
  );
};

const Pill = ({ label, icon: Icon }) => (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-white ring-1 ring-amber-200 px-1.5 py-0.5 rounded-md dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30">
    <Icon className="size-2.5" />
    {label}
  </span>
);

const ListBox = ({ tone, title, children }) => {
  const tones = {
    amber: "bg-amber-50/60 border-amber-200 text-amber-800 dark:bg-amber-500/5 dark:border-amber-400/30 dark:text-amber-100",
    rose: "bg-rose-50/60 border-rose-200 text-rose-800 dark:bg-rose-500/5 dark:border-rose-400/30 dark:text-rose-100",
  };
  return (
    <div className={`rounded-xl border ${tones[tone]} p-3`}>
      <div className="text-[11px] font-bold uppercase tracking-wider mb-2 opacity-80">
        {title}
      </div>
      <ul className="text-[12px] max-h-40 overflow-auto space-y-0.5">
        {children}
      </ul>
    </div>
  );
};
