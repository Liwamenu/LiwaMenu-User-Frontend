// "Yedek Al" — export the manually-authored, painful-to-recreate parts
// of the product catalog as a single portable ZIP that the user can
// store somewhere safe and import back later if anything goes wrong.
//
// SCOPE — only the data a restaurant operator typically agonises over:
//   • Product image     (uploaded photos)
//   • Description       (free-form copy)
//   • Allergens         (per-product code + presence list)
// Everything else (name, price, categories, portions, menu assignments,
// themes) is reconstructable from the live catalog itself; including it
// would bloat the file and force the import path to deal with much
// harder ID-remapping problems. The trade-off is documented in CLAUDE
// notes — discuss before widening the scope here.
//
// MATCH KEY — the import side keys on **product name** (TR-aware
// normalised) since the IDs from a backup will not survive any add /
// delete / reorder activity between export and import. The exporter
// just emits the name verbatim alongside the data; the importer owns
// the matching strategy.
//
// FILE FORMAT — ZIP archive:
//   manifest.json    metadata + per-product fields
//   images/          one file per product that has an image, named
//                    sequentially (0001.<ext>, 0002.<ext>, …). The
//                    manifest entry references its own image filename
//                    so the importer doesn't need to guess.
// Sequential names sidestep encoding issues with special characters
// (TR letters, slashes) that some ZIP tools choke on. Versioned with
// `version: 1` so future format bumps can be detected on import.

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Archive,
  Image as ImageIcon,
  FileText,
  Wheat,
  X,
  Check,
  Loader2,
  Download,
  AlertTriangle,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Bumping this triggers an explicit error on the import side rather
// than silent misinterpretation when the format changes incompatibly.
const BACKUP_FORMAT_VERSION = 1;
const BACKUP_FILE_TYPE = "liwamenu.products.backup";

// Concurrent image downloads — high enough to feel snappy on a fast
// connection, low enough not to swamp the backend / browser network
// queue on a slow one. Same cap as the import side.
const IMAGE_FETCH_CONCURRENCY = 4;

// Strip query / hash so a CDN URL with a `?v=` cache-buster still
// produces a clean filename extension.
function extFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname || url;
    const m = /\.([a-z0-9]{2,5})$/i.exec(pathname);
    return m ? m[1].toLowerCase() : "jpg";
  } catch {
    const m = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url || "");
    return m ? m[1].toLowerCase() : "jpg";
  }
}

// Fetch an image as a Blob. Returns null (not throws) when the
// download fails so a single broken image doesn't kill the whole
// export — we just skip that product's image and continue.
//
// THREE FALLBACK STRATEGIES, in order of preference:
//   1) fetch(url) — direct download. Works for same-origin or when
//      the image server sends Access-Control-Allow-Origin headers.
//   2) <img crossorigin="anonymous"> + canvas → toBlob() — bypasses
//      the fetch CORS check; canvas stays untainted if the server
//      sends CORS headers for image-element requests (often more
//      permissive than fetch CORS on CDNs like Azure Blob / S3).
//      Re-encodes via JPEG so original PNG transparency is lost in
//      the fallback path, but PNG support is preserved by sniffing
//      the source URL extension and using the matching MIME type.
//   3) <img> (no crossorigin) + canvas → toBlob() — last-ditch. Will
//      throw SecurityError on cross-origin tainted canvases, but
//      tries anyway so same-origin failures of #1 still work.
//
// All errors are logged to the console with the URL so the user can
// spot CORS issues in DevTools. The caller surfaces a "N görsel
// indirilemedi" counter when this returns null for any image.
async function fetchImageBlob(url) {
  if (!url) return null;

  // Strategy 1: fetch
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (res.ok) return await res.blob();
    console.warn("backup: fetch image returned non-OK", res.status, url);
  } catch (err) {
    console.warn("backup: fetch image failed (CORS?)", url, err?.message);
  }

  // Strategies 2 & 3 use <img> + canvas. Sniff the source extension
  // once so we encode the canvas back into the same format (PNG vs
  // JPEG vs WebP).
  const ext = extFromUrl(url);
  const mime =
    ext === "png"
      ? "image/png"
      : ext === "webp"
        ? "image/webp"
        : "image/jpeg";

  const tryImage = (withCrossOrigin) =>
    new Promise((resolve) => {
      const img = new Image();
      if (withCrossOrigin) img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 1;
          canvas.height = img.naturalHeight || 1;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.warn(
                  "backup: canvas.toBlob returned null",
                  withCrossOrigin ? "(cors)" : "(no-cors)",
                  url,
                );
              }
              resolve(blob || null);
            },
            mime,
            0.95,
          );
        } catch (err) {
          // Tainted canvas — happens on cross-origin without proper CORS.
          console.warn(
            "backup: canvas tainted, cannot extract blob",
            withCrossOrigin ? "(cors)" : "(no-cors)",
            url,
            err?.message,
          );
          resolve(null);
        }
      };
      img.onerror = (err) => {
        console.warn(
          "backup: <img> failed to load",
          withCrossOrigin ? "(cors)" : "(no-cors)",
          url,
          err?.message,
        );
        resolve(null);
      };
      img.src = url;
    });

  // Strategy 2: img with crossOrigin
  const corsBlob = await tryImage(true);
  if (corsBlob) return corsBlob;

  // Strategy 3: img without crossOrigin (will succeed at load, may
  // taint the canvas — caught above)
  const plainBlob = await tryImage(false);
  if (plainBlob) return plainBlob;

  return null;
}

// Process the work queue in fixed-concurrency batches. Order in the
// result mirrors the input order so manifest entries line up with
// their downloaded blobs cleanly.
async function mapWithConcurrency(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

// ── Modal ──────────────────────────────────────────────────────────────
export default function BackupProductsModal({ restaurantId }) {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();

  const restaurant = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    const list = s.restaurants.getRestaurants?.restaurants?.data;
    return list?.find?.((r) => r.id === restaurantId) || null;
  });
  const restaurantName = restaurant?.name || "";

  const [withImages, setWithImages] = useState(true);
  const [withDescription, setWithDescription] = useState(true);
  const [withAllergens, setWithAllergens] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, phase: "" });

  const anyEnabled = withImages || withDescription || withAllergens;

  const close = () => {
    if (loading) return; // do not let the user dismiss mid-build
    setSecondPopupContent(null);
  };

  const handleExport = async () => {
    if (loading || !anyEnabled) return;
    setLoading(true);
    setProgress({ done: 0, total: 0, phase: "fetch" });

    try {
      const api = privateApi();

      // Pull every product — same big-page strategy as the print export.
      // The list response already carries description + allergens, so
      // no per-product round-trip is needed except for image blobs.
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

      // Normalise the per-product allergen shape — backend sometimes
      // returns PascalCase / titled enum values; manifest stores the
      // lowercase form the write endpoint expects so re-import is
      // round-trippable without further massaging.
      const normalizeAllergens = (raw) => {
        const list =
          (Array.isArray(raw) && raw) ||
          [];
        return list
          .map((a) => {
            if (typeof a === "string") return { code: a, presence: "contains" };
            const code = a?.code ?? a?.Code ?? a?.name ?? a?.Name;
            const presenceRaw =
              a?.presence ?? a?.Presence ?? "contains";
            const presence = String(presenceRaw).toLowerCase() === "maycontain"
              ? "mayContain"
              : "contains";
            return code ? { code, presence } : null;
          })
          .filter(Boolean);
      };

      // Build the manifest entries first; collect the image-fetch
      // queue separately so we can run downloads concurrently.
      const entries = [];
      const imageJobs = [];

      let imageIndex = 0;
      for (const p of products || []) {
        const name = (p?.name || "").trim();
        if (!name) continue; // unnameable product can't be matched on import

        const entry = { name };

        if (withDescription) {
          entry.description = p?.description ?? "";
        }
        if (withAllergens) {
          const alg =
            (Array.isArray(p?.allergens) && p.allergens) ||
            (Array.isArray(p?.Allergens) && p.Allergens) ||
            [];
          entry.allergens = normalizeAllergens(alg);
        }
        if (withImages) {
          const url = p?.imageURL || p?.ImageURL || "";
          if (url) {
            imageIndex += 1;
            const fileName = `images/${String(imageIndex).padStart(4, "0")}.${extFromUrl(url)}`;
            entry.image = fileName;
            imageJobs.push({ url, fileName });
          }
        }
        entries.push(entry);
      }

      // Phase 2: download images in parallel batches.
      let imageBlobs = [];
      if (withImages && imageJobs.length > 0) {
        setProgress({ done: 0, total: imageJobs.length, phase: "images" });
        let done = 0;
        imageBlobs = await mapWithConcurrency(
          imageJobs,
          IMAGE_FETCH_CONCURRENCY,
          async (job) => {
            const blob = await fetchImageBlob(job.url);
            done += 1;
            // Throttle setState — every blob fires a re-render otherwise.
            // For typical catalog sizes (≤500) this is fine; bump to
            // batches if it ever becomes a perf issue.
            setProgress({
              done,
              total: imageJobs.length,
              phase: "images",
            });
            return { ...job, blob };
          },
        );
      }

      // Phase 3: assemble the ZIP. Dynamic-import JSZip so the ~100 KB
      // library is fetched only when the user actually triggers a
      // backup — matches the pattern in qrPage.jsx and keeps the
      // initial Products-page bundle slim.
      setProgress({ done: 0, total: 1, phase: "zip" });
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const manifest = {
        version: BACKUP_FORMAT_VERSION,
        type: BACKUP_FILE_TYPE,
        createdAt: new Date().toISOString(),
        restaurantId,
        restaurantName,
        includes: {
          image: withImages,
          description: withDescription,
          allergens: withAllergens,
        },
        products: entries,
      };
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // Only include images that actually downloaded; if a fetch
      // returned null we drop the file entry to avoid an empty file
      // in the ZIP, and unset the entry's image path so the importer
      // doesn't try to read a missing image.
      let imagesIncluded = 0;
      let imagesFailed = 0;
      if (withImages && imageBlobs.length > 0) {
        const successfulNames = new Set();
        for (const job of imageBlobs) {
          if (job?.blob) {
            zip.file(job.fileName, job.blob);
            successfulNames.add(job.fileName);
            imagesIncluded += 1;
          } else {
            imagesFailed += 1;
          }
        }
        // Clean up entries whose image failed to fetch.
        for (const e of entries) {
          if (e.image && !successfulNames.has(e.image)) {
            delete e.image;
          }
        }
        // Re-write manifest with cleaned entries.
        zip.file("manifest.json", JSON.stringify(manifest, null, 2));
      }

      const blob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      // Trigger download with a humane filename.
      const safeName = (restaurantName || "restoran")
        .replace(/[^a-z0-9çğıöşü_-]+/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase() || "restoran";
      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `liwa-urun-yedek-${safeName}-${stamp}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Defer revoke so the browser has time to start the download.
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      toast.success(
        t("productsList.backup_success", {
          count: entries.length,
          defaultValue: "{{count}} ürün yedeği oluşturuldu.",
        }),
      );
      // Surface partial failure prominently — the user shouldn't think
      // their backup is complete if half the images silently dropped
      // out. Console already has per-URL diagnostics for DevTools.
      if (withImages && imagesFailed > 0) {
        toast(
          t("productsList.backup_images_failed", {
            failed: imagesFailed,
            total: imagesFailed + imagesIncluded,
            defaultValue:
              "{{failed}} / {{total}} görsel indirilemedi (tarayıcı konsoluna bakın — büyük olasılıkla CORS).",
          }),
          { icon: "⚠️", duration: 7000 },
        );
      }
      setSecondPopupContent(null);
    } catch (err) {
      console.error("backup export failed", err);
      toast.error(
        t(
          "productsList.backup_error",
          "Yedek oluşturulurken bir hata oluştu, tekrar deneyin.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  // Render-side progress copy
  const phaseLabel = useMemo(() => {
    if (!loading) return "";
    if (progress.phase === "fetch")
      return t("productsList.backup_phase_fetch", "Ürünler çekiliyor…");
    if (progress.phase === "images")
      return t(
        "productsList.backup_phase_images",
        "Görseller indiriliyor… {{done}}/{{total}}",
        { done: progress.done, total: progress.total },
      );
    if (progress.phase === "zip")
      return t("productsList.backup_phase_zip", "Arşiv hazırlanıyor…");
    return "";
  }, [loading, progress, t]);

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-[480px] shadow-2xl ring-1 ring-[--border-1] overflow-hidden animate-[fadeIn_0.18s_ease-out]">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-emerald-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg,#059669 0%,#10b981 50%,#22d3ee 100%)",
            }}
          >
            <Archive className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
              {t("productsList.backup_modal_title", "Ürün Yedeği Al")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "productsList.backup_modal_desc",
                "Görsel, açıklama ve alerjenleri ZIP olarak indir",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition disabled:opacity-50"
            aria-label={t("productsList.backup_cancel", "Vazgeç")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* TOGGLES */}
        <div className="p-5 space-y-2.5">
          <OptionToggle
            icon={ImageIcon}
            label={t("productsList.backup_with_images", "Görseller")}
            hint={t(
              "productsList.backup_with_images_hint",
              "Ürün fotoğrafları ZIP içine eklenir.",
            )}
            checked={withImages}
            onChange={setWithImages}
            disabled={loading}
          />
          <OptionToggle
            icon={FileText}
            label={t("productsList.backup_with_description", "Açıklamalar")}
            hint={t(
              "productsList.backup_with_description_hint",
              "Ürün açıklamaları manifest dosyasına yazılır.",
            )}
            checked={withDescription}
            onChange={setWithDescription}
            disabled={loading}
          />
          <OptionToggle
            icon={Wheat}
            label={t("productsList.backup_with_allergens", "Alerjen bilgileri")}
            hint={t(
              "productsList.backup_with_allergens_hint",
              "Ürünlerin alerjen kod ve durumları yedeklenir.",
            )}
            checked={withAllergens}
            onChange={setWithAllergens}
            disabled={loading}
          />
        </div>

        {/* PROGRESS — visible only during the export */}
        {loading && (
          <div className="px-5 pb-3">
            <div className="bg-[--white-2] rounded-lg p-3 ring-1 ring-[--border-1]">
              <div className="flex items-center gap-2 text-[12px] font-medium text-[--black-2]">
                <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                <span className="truncate">{phaseLabel}</span>
              </div>
              {progress.total > 0 && progress.phase === "images" && (
                <div className="mt-2 h-1.5 rounded-full bg-[--white-1] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.round((progress.done / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-[--border-1] bg-[--white-2]/40 flex items-center gap-2 justify-end">
          <p className="text-[10px] text-[--gr-1] flex-1 flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-500" />
            {t(
              "productsList.backup_hint",
              "İçe aktarırken ürünler isme göre eşleştirilir.",
            )}
          </p>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--gr-1] text-sm font-semibold hover:bg-[--white-2] transition disabled:opacity-50"
          >
            {t("productsList.backup_cancel", "Vazgeç")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !anyEnabled}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-emerald-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-wait"
            style={{
              background:
                "linear-gradient(135deg,#059669 0%,#10b981 50%,#22d3ee 100%)",
            }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {loading
              ? t("productsList.backup_preparing", "Hazırlanıyor…")
              : t("productsList.backup_confirm", "Yedek Al")}
          </button>
        </div>
      </div>
    </main>
  );
}

// Toggle row — mirrors the look of the print-export modal so the two
// stay visually consistent in the secondary popup slot.
const OptionToggle = ({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
  disabled,
}) => (
  <label
    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
      checked
        ? "bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:border-emerald-400/30 dark:ring-emerald-400/20"
        : "bg-[--white-1] border-[--border-1] hover:border-emerald-200 hover:bg-[--white-2]"
    } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
  >
    <span
      className={`grid place-items-center size-8 rounded-lg shrink-0 transition ${
        checked
          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25"
          : "bg-[--white-2] text-[--gr-1]"
      }`}
    >
      <Icon className="size-4" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="text-[13px] font-semibold leading-tight text-[--black-1]">
        {label}
      </div>
      <p className="text-[11px] text-[--gr-1] mt-0.5 leading-snug">{hint}</p>
    </div>
    <span
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition mt-0.5 ${
        checked
          ? "bg-emerald-600 border-emerald-700"
          : "bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`inline-block size-4 rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        } translate-y-[1px]`}
      />
      {checked && (
        <Check
          className="absolute left-0.5 top-1/2 -translate-y-1/2 size-3 text-white"
          strokeWidth={3}
        />
      )}
    </span>
  </label>
);
