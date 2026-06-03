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
  FolderTree,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Bumping this triggers an explicit error on the import side rather
// than silent misinterpretation when the format changes incompatibly.
//
// v1 (initial): name + description + allergens + image (per product),
//   name + sortOrder + flags + image (per category). No IDs, no
//   portions, no machine-readable product→category memberships.
//   Restore was UPDATE-only (matched live products by name).
//
// v2 (current): adds `id` to every entity, `portions` and
//   `categories` (machine-readable membership array, independent of
//   the folder layout) and flags to products. Enables ID-based
//   matching and full CREATE-or-UPDATE restore. v1 manifests still
//   parse on the restore side via a name-based fallback.
const BACKUP_FORMAT_VERSION = 2;
const BACKUP_FILE_TYPE = "liwamenu.products.backup";

// Concurrent image downloads — kept low so the backend's static-file
// handler isn't hammered with 100+ near-simultaneous requests. 4 was
// observed to drop ~17% of fetches to "Failed to fetch" on a 120-
// product catalog (server / browser network-queue exhaustion); 2 is
// the comfortable middle that paired with the retry logic below
// brings success rate to near 100% without making the export drag.
const IMAGE_FETCH_CONCURRENCY = 2;

// Per-image fetch retry policy. Transient drops on a single product
// image shouldn't sink the whole backup, so each strategy gets a few
// retries with exponential-ish backoff before giving up. The total
// extra wall-time on a clean run is zero (no retries needed); on a
// flaky run it adds ~1.1s per fully-failing image (300 + 800ms).
const IMAGE_FETCH_RETRIES = 2; // 1 initial + 2 retries = 3 attempts
const IMAGE_FETCH_RETRY_DELAYS_MS = [300, 800];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

// Sanitise a name so it's safe as a single ZIP path segment. Keeps
// Turkish letters (UTF-8 in ZIP is fine), replaces filesystem-
// forbidden chars (\ / : * ? " < > |) and control chars with `_`,
// collapses whitespace, trims, hard-caps length so the path doesn't
// blow past Windows MAX_PATH on extract. Empty / whitespace-only
// inputs fall back to "untitled" so the resulting ZIP never has
// "//" or "/." artefacts.
function safeFileSegment(name) {
  const cleaned = String(name || "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return cleaned || "untitled";
}

// Resolve "<dir>/<name>.<ext>" against a Set of paths already used in
// this ZIP, appending " (2)", " (3)", … to disambiguate. Two products
// named "Çay" in the same category folder get distinct files instead
// of one overwriting the other.
function uniqueZipPath(used, candidate) {
  if (!used.has(candidate)) {
    used.add(candidate);
    return candidate;
  }
  const dot = candidate.lastIndexOf(".");
  const stem = dot > -1 ? candidate.slice(0, dot) : candidate;
  const ext = dot > -1 ? candidate.slice(dot) : "";
  let i = 2;
  // Bound the loop so a pathological collision can't loop forever —
  // 999 disambiguation suffixes is well beyond any real catalog.
  while (i < 1000) {
    const tryPath = `${stem} (${i})${ext}`;
    if (!used.has(tryPath)) {
      used.add(tryPath);
      return tryPath;
    }
    i += 1;
  }
  // Fallback if we somehow burn through 1000 collisions: random suffix.
  const fallback = `${stem}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  used.add(fallback);
  return fallback;
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

  // Strategy 1: fetch — with retry+backoff to ride out transient
  // network blips. Empirically the failures are NOT 404s (curl shows
  // 200), they're "Failed to fetch" exceptions thrown when the
  // server / browser drops a connection under concurrent load. A
  // simple retry recovers almost all of them.
  let lastFetchErr = null;
  for (let attempt = 0; attempt <= IMAGE_FETCH_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (res.ok) return await res.blob();
      // Permanent HTTP failure (404, 403, etc.) — no point retrying.
      // Log the status and break out to the canvas fallbacks.
      console.warn(
        "backup: fetch image returned non-OK",
        res.status,
        url,
      );
      lastFetchErr = new Error(`HTTP ${res.status}`);
      break;
    } catch (err) {
      lastFetchErr = err;
      if (attempt < IMAGE_FETCH_RETRIES) {
        const delay = IMAGE_FETCH_RETRY_DELAYS_MS[attempt] ?? 500;
        // Quiet retry — only loud if we exhaust attempts (logged after the loop).
        await sleep(delay);
        continue;
      }
      console.warn(
        "backup: fetch image failed after retries",
        url,
        err?.message,
      );
    }
  }
  // suppress unused-var lint; the variable is preserved for symmetry
  // if we ever need to surface the cause to the caller.
  void lastFetchErr;

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
  // Categories toggle bundles parent categories + subcategories
  // together. On by default so a backup captures the full menu
  // structure (a complete backup, not just product copy) — the user can
  // still untick it for a products-only snapshot.
  const [withCategories, setWithCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, phase: "" });

  const anyEnabled =
    withImages || withDescription || withAllergens || withCategories;

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

      // Skip the product fetch entirely if the user only wants
      // categories — saves a 2000-row round-trip + a potential fan-out.
      const anyProductToggle = withImages || withDescription || withAllergens;
      let products = [];
      if (anyProductToggle) {
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
        products = firstPage;
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
      // Tracks ZIP paths already issued so two products with the same
      // name in the same category get disambiguated ("Çay.jpg",
      // "Çay (2).jpg") instead of one overwriting the other.
      const usedPaths = new Set();
      // We always reserve "manifest.json" first — paranoid guard
      // against a category called literally "manifest" with a
      // pathological .json image extension.
      usedPaths.add("manifest.json");

      for (const p of products || []) {
        const name = (p?.name || "").trim();
        if (!name) continue; // unnameable product can't be matched on import

        // v2 core fields — always emitted regardless of toggles.
        // These are the "structural" bits needed to recreate the
        // product on restore. The user-facing toggles below only gate
        // the bulky / opinionated fields (image bytes, free-text
        // description, allergen lists).
        const entry = {
          id: p?.id || p?.Id || null,
          name,
          recommendation: !!p?.recommendation,
          hide: !!p?.hide,
          freeTagging: !!p?.freeTagging,
          isCampaign: !!p?.isCampaign,
          // Portions carry their own IDs so the restore can UPDATE
          // individual portion rows rather than always recreate them
          // (which would break referential integrity with anything
          // that points at portion IDs — e.g. orders historicals).
          portions: (Array.isArray(p?.portions) ? p.portions : []).map(
            (po) => ({
              id: po?.id || po?.Id || null,
              name: po?.name ?? po?.Name ?? "",
              price: Number(po?.price ?? po?.Price ?? 0) || 0,
              campaignPrice:
                Number(po?.campaignPrice ?? po?.CampaignPrice ?? 0) || 0,
              specialPrice:
                Number(po?.specialPrice ?? po?.SpecialPrice ?? 0) || 0,
            }),
          ),
          // Machine-readable category memberships — independent of
          // the human-friendly folder layout the image path encodes.
          // Restore reads from here, not from the path. Both casings
          // accepted because some endpoints still return PascalCase.
          categories: (
            (Array.isArray(p?.categories) && p.categories) ||
            (Array.isArray(p?.Categories) && p.Categories) ||
            []
          )
            .map((m) => {
              const categoryId = m?.categoryId ?? m?.CategoryId;
              const subCategoryId = m?.subCategoryId ?? m?.SubCategoryId;
              if (!categoryId) return null;
              const out = { categoryId };
              if (subCategoryId) out.subCategoryId = subCategoryId;
              return out;
            })
            .filter(Boolean),
        };

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
            // Place the file under "products/<Category>/[<Subcategory>/]<Name>.<ext>"
            // so the ZIP visually mirrors the menu tree. Multi-category
            // products get their image in the FIRST membership's folder
            // (rare in practice; manifest holds product data, the
            // folder is just a display nicety).
            const firstCat = (p.categories || [])[0] || {};
            const catSeg = firstCat?.categoryName
              ? safeFileSegment(firstCat.categoryName)
              : "__uncategorized__";
            const subSeg = firstCat?.subCategoryName
              ? `/${safeFileSegment(firstCat.subCategoryName)}`
              : "";
            const base = `products/${catSeg}${subSeg}/${safeFileSegment(name)}.${extFromUrl(url)}`;
            const fileName = uniqueZipPath(usedPaths, base);
            entry.image = fileName;
            imageJobs.push({ url, fileName });
          }
        }
        entries.push(entry);
      }

      // ── Categories + subcategories (opt-in 4th toggle) ──
      // Stored under their own manifest section so the import side
      // can run an "ensure exists" pass BEFORE touching products.
      // Image paths use separate folders inside the ZIP so the file
      // tree self-documents what each asset belongs to.
      let categoryEntries = [];
      if (withCategories) {
        const [catsRes, subsRes] = await Promise.all([
          api
            .get(`${baseURL}Categories/GetCategoriesByRestaurantId`, {
              params: { restaurantId },
            })
            .catch(() => ({ data: { data: [] } })),
          // The backend route is lower-cased "Subcategories" (see
          // getSubCategoriesSlice). Spell it the same way or get a 404.
          api
            .get(`${baseURL}Subcategories/GetSubCategoriesByRestaurantId`, {
              params: { restaurantId },
            })
            .catch(() => ({ data: { data: [] } })),
        ]);
        const categories = catsRes?.data?.data || [];
        const subcategories = subsRes?.data?.data || [];

        // Bucket subcategories by parent for nested manifest emission.
        const subsByCatId = new Map();
        for (const sc of subcategories) {
          const parentId = sc?.categoryId ?? sc?.CategoryId;
          if (!parentId) continue;
          const arr = subsByCatId.get(parentId) || [];
          arr.push(sc);
          subsByCatId.set(parentId, arr);
        }

        for (const c of categories) {
          const cName = (c?.name || "").trim();
          if (!cName) continue;
          const catEntry = {
            // v2: id is the primary match key on restore (falls back
            // to normalised-name when a v2 backup is restored into a
            // restaurant whose entities have different IDs).
            id: c?.id || c?.Id || null,
            name: cName,
            sortOrder: c?.sortOrder ?? 0,
            isActive: c?.isActive ?? true,
            featured: !!c?.featured,
            campaign: !!c?.campaign,
          };
          // Category image (independent of the products' withImages
          // toggle — categories are their own scope). Skipping the
          // `withImages` check here is intentional: a user backing up
          // categories with images-off wouldn't see them anyway, and
          // having the file in the ZIP is cheap. Named file path
          // mirrors the visible menu tree: "categories/<Name>.<ext>".
          //
          // Field-name landmine: products use `imageURL` but the
          // categories endpoint returns the image URL as
          // `imageAbsoluteUrl` (see categories.jsx where the list
          // renders <img src={cat.imageAbsoluteUrl} />). v2.0 of the
          // backup only checked imageURL → category images were
          // silently dropped from every backup. Now we accept all
          // observed casings + naming variants.
          const cUrl =
            c?.imageAbsoluteUrl ||
            c?.ImageAbsoluteUrl ||
            c?.imageURL ||
            c?.ImageURL ||
            c?.image ||
            "";
          const safeCatSeg = safeFileSegment(cName);
          if (cUrl) {
            const base = `categories/${safeCatSeg}.${extFromUrl(cUrl)}`;
            const fn = uniqueZipPath(usedPaths, base);
            catEntry.image = fn;
            imageJobs.push({ url: cUrl, fileName: fn });
          }

          const childList = subsByCatId.get(c?.id) || [];
          const subEntries = [];
          for (const sc of childList.sort(
            (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0),
          )) {
            const sName = (sc?.name || "").trim();
            if (!sName) continue;
            const sEntry = {
              id: sc?.id || sc?.Id || null,
              name: sName,
              sortOrder: sc?.sortOrder ?? 0,
              isActive: sc?.isActive ?? true,
            };
            // Same field-name landmine as categories — subcategories
            // surface their image URL as `imageAbsoluteUrl`.
            const sUrl =
              sc?.imageAbsoluteUrl ||
              sc?.ImageAbsoluteUrl ||
              sc?.imageURL ||
              sc?.ImageURL ||
              sc?.image ||
              "";
            if (sUrl) {
              // "subcategories/<Parent Name>/<Sub Name>.<ext>" keeps
              // the hierarchy visible even without opening the manifest.
              const base = `subcategories/${safeCatSeg}/${safeFileSegment(sName)}.${extFromUrl(sUrl)}`;
              const fn = uniqueZipPath(usedPaths, base);
              sEntry.image = fn;
              imageJobs.push({ url: sUrl, fileName: fn });
            }
            subEntries.push(sEntry);
          }
          if (subEntries.length > 0) catEntry.subCategories = subEntries;
          categoryEntries.push(catEntry);
        }
        // Stable order on output so two backups of the same state
        // produce identical (diff-able) manifests.
        categoryEntries.sort(
          (a, b) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
            a.name.localeCompare(b.name, "tr"),
        );
      }

      // Phase 2: download images in parallel batches. Single queue
      // for product / category / subcategory images — they're all
      // the same fetch operation just with different destination
      // paths inside the ZIP. Triggers whenever ANY image job was
      // queued, regardless of which toggles populated it.
      let imageBlobs = [];
      if (imageJobs.length > 0) {
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
          categories: withCategories,
        },
        products: entries,
      };
      // Categories section is optional — older v1 backups (no
      // categories) still parse cleanly because the import side
      // reads it with `manifest.categories || []`.
      if (withCategories) {
        manifest.categories = categoryEntries;
      }
      zip.file("manifest.json", JSON.stringify(manifest, null, 2));

      // Only include images that actually downloaded; if a fetch
      // returned null we drop the file entry to avoid an empty file
      // in the ZIP, and unset the entry's image path so the importer
      // doesn't try to read a missing image. Covers product images,
      // category images, and subcategory images uniformly — they all
      // live in the same `imageJobs` queue with prefixed file paths.
      let imagesIncluded = 0;
      let imagesFailed = 0;
      const failedUrls = []; // for diagnostic logging
      if (imageBlobs.length > 0) {
        const successfulNames = new Set();
        for (const job of imageBlobs) {
          if (job?.blob) {
            zip.file(job.fileName, job.blob);
            successfulNames.add(job.fileName);
            imagesIncluded += 1;
          } else {
            imagesFailed += 1;
            failedUrls.push(job.url);
          }
        }
        // Drop the image path from any manifest entry whose blob
        // didn't make it into the ZIP — applies across products,
        // categories, and nested subcategories.
        for (const e of entries) {
          if (e.image && !successfulNames.has(e.image)) delete e.image;
        }
        for (const c of categoryEntries) {
          if (c.image && !successfulNames.has(c.image)) delete c.image;
          if (Array.isArray(c.subCategories)) {
            for (const s of c.subCategories) {
              if (s.image && !successfulNames.has(s.image)) delete s.image;
            }
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

      // Console summary — single grouped log so the user can see the
      // entire breakdown in one place when investigating "why are
      // there fewer files than products" without scrolling through
      // 100s of per-URL warning lines. Each failed URL is listed
      // explicitly so the user can copy one into a browser tab to
      // confirm what kind of failure it is (CORS / 404 / timeout).
      const productsWithImageURL = (products || []).filter(
        (p) => (p?.imageURL || p?.ImageURL || "").trim(),
      ).length;
      try {
        console.group(
          `[backup] Done — products: ${entries.length}, categories: ${categoryEntries.length}, images: ${imagesIncluded}/${imageJobs.length}`,
        );
        console.log("Products fetched:", (products || []).length);
        console.log("Products with imageURL:", productsWithImageURL);
        console.log("Image fetch jobs queued:", imageJobs.length);
        console.log("Images downloaded successfully:", imagesIncluded);
        console.log("Images failed:", imagesFailed);
        if (failedUrls.length > 0) {
          console.warn(
            "Failed URLs (first 30):",
            failedUrls.slice(0, 30),
          );
        }
        console.groupEnd();
      } catch {
        // ignore — diagnostics should never break the export
      }

      // Two phrasings so a categories-only or products-only backup
      // doesn't read awkwardly ("0 ürün yedeği oluşturuldu"). The
      // image count is included so the user can reconcile ZIP file
      // count vs. manifest entry count — when imagesFailed > 0 we
      // show it as "95/120" so the gap is impossible to miss.
      const imageFraction =
        imagesFailed > 0
          ? `${imagesIncluded}/${imagesIncluded + imagesFailed}`
          : `${imagesIncluded}`;
      if (categoryEntries.length > 0) {
        toast.success(
          t("productsList.backup_success_full", {
            products: entries.length,
            categories: categoryEntries.length,
            images: imageFraction,
            defaultValue:
              "Yedek oluşturuldu: {{products}} ürün, {{categories}} kategori, {{images}} görsel.",
          }),
        );
      } else {
        toast.success(
          t("productsList.backup_success", {
            count: entries.length,
            images: imageFraction,
            defaultValue:
              "{{count}} ürün yedeği oluşturuldu ({{images}} görsel).",
          }),
        );
      }
      // Surface partial failure prominently — promoted to toast.error
      // so the user can't dismiss it as a passive informational chip.
      // Longer duration + clear "konsola bakın" pointer because the
      // root cause is almost always per-URL and only visible there.
      if (imagesFailed > 0) {
        toast.error(
          t("productsList.backup_images_failed", {
            failed: imagesFailed,
            total: imagesFailed + imagesIncluded,
            defaultValue:
              "{{failed}} / {{total}} görsel indirilemedi (tarayıcı konsoluna bakın — büyük olasılıkla CORS).",
          }),
          { duration: 10000 },
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
          <OptionToggle
            icon={FolderTree}
            label={t(
              "productsList.backup_with_categories",
              "Kategoriler & Alt Kategoriler",
            )}
            hint={t(
              "productsList.backup_with_categories_hint",
              "Kategori ve alt kategori yapısı (ad, görsel, sıralama) yedeklenir; eksik olanlar geri yüklerken oluşturulur.",
            )}
            checked={withCategories}
            onChange={setWithCategories}
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
