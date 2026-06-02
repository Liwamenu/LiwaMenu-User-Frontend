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
import { useDispatch, useSelector } from "react-redux";
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
  FolderTree,
  FolderPlus,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { privateApi } from "../../../redux/api";
// Cache resets — applyV2 hits api endpoints directly (bypasses the
// thunks) so the cross-slice invalidation matchers never see fulfilled
// actions. Manually flush every cache the restore could have changed
// so the next render fetches fresh data instead of showing stale
// pre-restore items.
import { resetGetProducts } from "../../../redux/products/getProductsSlice";
import { resetGetProductsLite } from "../../../redux/products/getProductsLiteSlice";
import { resetGetCategories } from "../../../redux/categories/getCategoriesSlice";
import { resetGetSubCategories } from "../../../redux/subCategories/getSubCategoriesSlice";

const baseURL = import.meta.env.VITE_BASE_URL;

// v1 = legacy "metadata snapshot" (name+description+allergens+image).
//      Restore is UPDATE-only via TR-aware name matching.
// v2 = full snapshot with IDs + portions + memberships + flags.
//      Restore is ID-based CREATE-or-UPDATE. We send the backup id on
//      every Add (categories, subcategories, products) so a backend
//      honouring user/BACKUP_RESTORE_ID_PRESERVATION_BRIEF.md persists
//      the original ids — making restores idempotent (a re-run matches
//      by id → UPDATE, never a duplicate CREATE). The remap table below
//      is kept as a safety net for older backends that ignore the id
//      and mint a fresh one.
const SUPPORTED_VERSIONS = new Set([1, 2]);
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
  const dispatch = useDispatch();

  // Centralised cache invalidation — called at the end of both v1 and
  // v2 apply paths so every list page the user might navigate to next
  // (Products, Categories, Subcategories) re-fetches fresh data.
  const invalidateAllCaches = () => {
    dispatch(resetGetProducts());
    dispatch(resetGetProductsLite());
    dispatch(resetGetCategories());
    dispatch(resetGetSubCategories());
  };

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
  // Category state — only populated when the backup includes categories
  // and we successfully fetched the live catalog. Drives both the diff
  // preview and the apply phase (ensure-exists semantics, never delete).
  const [currentCategories, setCurrentCategories] = useState([]);
  const [currentSubCategories, setCurrentSubCategories] = useState([]);
  const [categoryDiff, setCategoryDiff] = useState(null); // { newCategoryCount, newSubCategoryCount }

  // Apply toggles — default to whatever the manifest contains.
  // (v1 only — v2 restore is whole-entity via the radio below.)
  const [applyImages, setApplyImages] = useState(true);
  const [applyDescription, setApplyDescription] = useState(true);
  const [applyAllergens, setApplyAllergens] = useState(true);
  // Categories toggle — only meaningful if the manifest has a
  // `categories` section and `includes.categories: true`.
  const [applyCategories, setApplyCategories] = useState(false);

  // v2 only — radio mode for restore semantics:
  //   "merge" = only CREATE entries that don't already exist by ID
  //             (existing items are left untouched)
  //   "full"  = CREATE missing + UPDATE existing with backup data
  //             (overwrites any post-backup edits on matched items)
  const [restoreMode, setRestoreMode] = useState("merge");
  // v2 diff: per-entity-type lists of existing (UPDATE candidates)
  // vs new (CREATE candidates). Built in handleFile, consumed by
  // the diff UI and the apply phase.
  const [v2Diff, setV2Diff] = useState(null);

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
      if (!SUPPORTED_VERSIONS.has(Number(parsed?.version))) {
        throw new Error("WRONG_VERSION");
      }
      if (!Array.isArray(parsed?.products)) {
        throw new Error("MALFORMED");
      }

      // Default the apply toggles to what's actually in the file —
      // a backup made with "images off" should not offer an image-
      // apply toggle in a misleading "on" state. The categories
      // toggle stays off for v1 backups (no `includes.categories`
      // field) → backward-compatible.
      setApplyImages(!!parsed?.includes?.image);
      setApplyDescription(!!parsed?.includes?.description);
      setApplyAllergens(!!parsed?.includes?.allergens);
      setApplyCategories(!!parsed?.includes?.categories);

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

      // ── Categories pre-fetch + diff ──
      // Always fetched when the backup has a `categories` section so
      // we have the live state for both v1's "ensure exists" pass
      // and v2's ID-based create-or-update diff.
      let liveCategories = [];
      let liveSubCategories = [];
      let catDiff = null;
      let v2DiffLocal = null;
      if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
        const [catsRes, subsRes] = await Promise.all([
          api
            .get(`${baseURL}Categories/GetCategoriesByRestaurantId`, {
              params: { restaurantId },
            })
            .catch(() => ({ data: { data: [] } })),
          api
            .get(`${baseURL}Subcategories/GetSubCategoriesByRestaurantId`, {
              params: { restaurantId },
            })
            .catch(() => ({ data: { data: [] } })),
        ]);
        liveCategories = catsRes?.data?.data || [];
        liveSubCategories = subsRes?.data?.data || [];

        // Index live categories by normalised name for diff calc.
        const liveCatByName = new Map();
        for (const c of liveCategories) {
          const k = normaliseName(c?.name);
          if (k) liveCatByName.set(k, c);
        }
        // Index live subcategories by parentId → name → row.
        const liveSubsByParent = new Map();
        for (const s of liveSubCategories) {
          const parent = s?.categoryId ?? s?.CategoryId;
          if (!parent) continue;
          const k = normaliseName(s?.name);
          if (!k) continue;
          const bucket = liveSubsByParent.get(parent) || new Map();
          bucket.set(k, s);
          liveSubsByParent.set(parent, bucket);
        }

        let newCategoryCount = 0;
        let newSubCategoryCount = 0;
        for (const bc of parsed.categories) {
          const k = normaliseName(bc?.name);
          if (!k) continue;
          const liveCat = liveCatByName.get(k);
          if (!liveCat) {
            newCategoryCount += 1;
            // All children are new too (parent doesn't exist yet).
            newSubCategoryCount += (bc.subCategories || []).length;
          } else {
            const liveSubs = liveSubsByParent.get(liveCat.id) || new Map();
            for (const bs of bc.subCategories || []) {
              const sk = normaliseName(bs?.name);
              if (!sk) continue;
              if (!liveSubs.has(sk)) newSubCategoryCount += 1;
            }
          }
        }
        catDiff = { newCategoryCount, newSubCategoryCount };
      }

      // ── v2: ID-based diff (existing vs new per entity type) ──
      // Built ONLY for v2 backups. v1 backups stay on the name-based
      // flow above. The "existing" bucket drives UPDATE in full
      // mode; the "new" bucket drives CREATE in both merge and full.
      if (Number(parsed.version) === 2) {
        const liveCatById = new Map(
          liveCategories.map((c) => [c?.id, c]).filter(([id]) => id),
        );
        const liveSubById = new Map(
          liveSubCategories.map((s) => [s?.id, s]).filter(([id]) => id),
        );
        const liveProductById = new Map(
          (products || [])
            .map((p) => [p?.id || p?.Id, p])
            .filter(([id]) => id),
        );

        const cats = { existing: [], new: [] };
        const subs = { existing: [], new: [] };
        const prods = { existing: [], new: [] };

        for (const bc of parsed.categories || []) {
          const bid = bc?.id;
          if (bid && liveCatById.has(bid)) {
            cats.existing.push({ backup: bc, live: liveCatById.get(bid) });
          } else {
            cats.new.push({ backup: bc });
          }
          for (const bs of bc.subCategories || []) {
            const sbid = bs?.id;
            if (sbid && liveSubById.has(sbid)) {
              subs.existing.push({
                backup: bs,
                live: liveSubById.get(sbid),
                parentBackupId: bid,
              });
            } else {
              subs.new.push({ backup: bs, parentBackupId: bid });
            }
          }
        }

        for (const bp of parsed.products || []) {
          const bid = bp?.id;
          if (bid && liveProductById.has(bid)) {
            prods.existing.push({
              backup: bp,
              live: liveProductById.get(bid),
            });
          } else {
            prods.new.push({ backup: bp });
          }
        }

        v2DiffLocal = { cats, subs, prods };
      }

      setZip(zipInstance);
      setManifest(parsed);
      setCurrentProducts(products);
      setCurrentCategories(liveCategories);
      setCurrentSubCategories(liveSubCategories);
      setCategoryDiff(catDiff);
      setV2Diff(v2DiffLocal);
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

  // ── v2 apply ──────────────────────────────────────────────────────
  // Whole-entity create-or-update, ID-based. Runs in three sequential
  // phases (categories → subcategories → products) because each phase
  // produces IDs the next one depends on. Inside a phase, ops are
  // sequential to keep an honest progress bar and avoid the same
  // backend-throttling issue that bit the image-fetch loop.
  //
  // ID remap tables: we send the backup id on every Add, so a backend
  // honouring BACKUP_RESTORE_ID_PRESERVATION_BRIEF.md persists it and
  // these maps collapse to identity. They stay as a safety net for
  // older backends that ignore the id and mint a fresh one — we capture
  // the new ID from the Add response (or a re-fetch fallback) and
  // rewrite downstream references through these maps either way.
  const applyV2 = async () => {
    const api = privateApi();
    const isFullMode = restoreMode === "full";
    const { cats, subs, prods } = v2Diff;

    // Pull image blob from the ZIP and wrap as File for multipart.
    const blobFromZip = async (path) => {
      if (!path) return null;
      const fileEntry = zip.file(path);
      if (!fileEntry) return null;
      const blob = await fileEntry.async("blob");
      const ext = path.split(".").pop() || "jpg";
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "gif"
              ? "image/gif"
              : "image/jpeg";
      return new File([blob], `restore.${ext}`, { type: mime });
    };

    // Work lists, gated by mode. Merge = only the "new" buckets;
    // full = new + existing (existing get UPDATE'd with backup data).
    const catCreate = cats.new;
    const catUpdate = isFullMode ? cats.existing : [];
    const subCreate = subs.new;
    const subUpdate = isFullMode ? subs.existing : [];
    const prodCreate = prods.new;
    const prodUpdate = isFullMode ? prods.existing : [];

    const total =
      catCreate.length +
      catUpdate.length +
      subCreate.length +
      subUpdate.length +
      prodCreate.length +
      prodUpdate.length;

    if (total === 0) {
      toast.error(
        t(
          "productsList.restore_nothing_to_apply",
          "Uygulanacak bir kayıt yok.",
        ),
      );
      return;
    }

    setPhase("applying");
    setProgress({ done: 0, total });

    const errors = [];
    let created = 0;
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    let done = 0;
    const bump = () => {
      done += 1;
      setProgress({ done, total });
    };

    // Remap tables: backup-id → live-id. Pre-seed with the
    // "existing" matches we already know about.
    const catIdMap = new Map();
    for (const { backup, live } of cats.existing) {
      if (backup?.id && live?.id) catIdMap.set(backup.id, live.id);
    }
    const subIdMap = new Map();
    for (const { backup, live } of subs.existing) {
      if (backup?.id && live?.id) subIdMap.set(backup.id, live.id);
    }

    // ── Phase A: categories ──
    // Updates first (so any name/sortOrder changes land before
    // creates that might check for duplicates), then creates.
    for (const job of catUpdate) {
      try {
        const { backup, live } = job;
        const fd = new FormData();
        fd.append("restaurantId", restaurantId);
        const data = [
          {
            id: live.id,
            restaurantId,
            name: backup.name,
            isActive: backup.isActive ?? true,
            featured: !!backup.featured,
            campaign: !!backup.campaign,
            sortOrder: backup.sortOrder ?? 0,
            // Preserve live menuIds (we never backed them up); user
            // can manage menu attachments separately.
            menuIds: Array.isArray(live.menuIds) ? live.menuIds : [],
          },
        ];
        fd.append("categoriesData", JSON.stringify(data));
        const imageFile = await blobFromZip(backup.image);
        if (imageFile) fd.append("image_0", imageFile);
        console.log(
          "[restore v2] category update:",
          backup.name,
          "image:",
          backup.image || "(none in backup)",
          imageFile ? `→ uploading ${imageFile.size}B` : "→ keeping existing",
        );
        await api.put(`${baseURL}Categories/EditCategory`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updated += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Kategori güncelle] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }
    for (const job of catCreate) {
      try {
        const { backup } = job;
        const fd = new FormData();
        fd.append("restaurantId", restaurantId);
        const data = [
          {
            // Send the backup id so the backend can persist it (per
            // BACKUP_RESTORE_ID_PRESERVATION_BRIEF.md). Older backends
            // ignore it and generate their own; either way the live id
            // is captured below from the response / re-fetch fallback.
            id: backup.id || undefined,
            name: backup.name,
            isActive: backup.isActive ?? true,
            featured: !!backup.featured,
            campaign: !!backup.campaign,
            sortOrder: backup.sortOrder ?? 0,
            menuIds: [],
          },
        ];
        fd.append("categoriesData", JSON.stringify(data));
        const imageFile = await blobFromZip(backup.image);
        if (imageFile) fd.append("image_0", imageFile);
        // Diagnostic — surface whether an image is actually being
        // uploaded. Common confusion: a backup taken before the
        // user attached a category image has no `image` field, so
        // the restore can't conjure one. The log says yes/no per
        // category so the cause is obvious from DevTools.
        console.log(
          "[restore v2] category create:",
          backup.name,
          "image:",
          backup.image || "(none in backup)",
          imageFile ? `→ uploading ${imageFile.size}B` : "→ no image",
        );
        const res = await api.put(`${baseURL}Categories/AddCategory`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Try to capture the new ID from the response (response shape
        // varies across endpoints — be defensive).
        const newId =
          res?.data?.data?.[0]?.id ||
          res?.data?.data?.id ||
          res?.data?.id ||
          null;
        if (backup?.id && newId) catIdMap.set(backup.id, newId);
        created += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Kategori oluştur] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }

    // Re-fetch categories so any new IDs we couldn't capture from
    // the AddCategory response are visible to the subcategory and
    // product phases below (matched by NAME against the backup
    // entries we just sent — names are unique within a restaurant
    // per the existing add flow's uniqueness check).
    let liveCatsAfter = currentCategories;
    if (catCreate.length > 0) {
      try {
        const r = await api.get(
          `${baseURL}Categories/GetCategoriesByRestaurantId`,
          { params: { restaurantId } },
        );
        liveCatsAfter = r?.data?.data || liveCatsAfter;
        // Backfill the remap by name for any backup categories whose
        // new ID we missed from the response.
        const liveByName = new Map();
        for (const c of liveCatsAfter) {
          const k = normaliseName(c?.name);
          if (k) liveByName.set(k, c);
        }
        for (const { backup } of catCreate) {
          if (!backup?.id || catIdMap.has(backup.id)) continue;
          const live = liveByName.get(normaliseName(backup.name));
          if (live?.id) catIdMap.set(backup.id, live.id);
        }
      } catch {
        // Refetch failed — subcategory creates that depend on new
        // cats will fail individually below; logged per entry.
      }
    }

    // ── Phase B: subcategories ──
    for (const job of subUpdate) {
      try {
        const { backup, live } = job;
        const parentId =
          catIdMap.get(job.parentBackupId) ||
          live?.categoryId ||
          job.parentBackupId;
        const fd = new FormData();
        fd.append("restaurantId", restaurantId);
        const data = [
          {
            id: live.id,
            restaurantId,
            categoryId: parentId,
            name: backup.name,
            isActive: backup.isActive ?? true,
            sortOrder: backup.sortOrder ?? 0,
          },
        ];
        fd.append("subCategoryData", JSON.stringify(data));
        const imageFile = await blobFromZip(backup.image);
        if (imageFile) fd.append("image_0", imageFile);
        await api.put(`${baseURL}SubCategories/EditSubCategory`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updated += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Alt kategori güncelle] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }
    for (const job of subCreate) {
      try {
        const { backup, parentBackupId } = job;
        const parentLiveId = catIdMap.get(parentBackupId);
        if (!parentLiveId) {
          // Parent never made it into live — skip rather than create
          // an orphan. Counted as skipped, not failed.
          skipped += 1;
          bump();
          continue;
        }
        const fd = new FormData();
        fd.append("restaurantId", restaurantId);
        const data = [
          {
            id: backup.id || undefined,
            categoryId: parentLiveId,
            name: backup.name,
            isActive: backup.isActive ?? true,
            sortOrder: backup.sortOrder ?? 0,
          },
        ];
        fd.append("subCategoryData", JSON.stringify(data));
        const imageFile = await blobFromZip(backup.image);
        if (imageFile) fd.append("image_0", imageFile);
        const res = await api.put(
          `${baseURL}SubCategories/AddSubCategory`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } },
        );
        const newId =
          res?.data?.data?.[0]?.id ||
          res?.data?.data?.id ||
          res?.data?.id ||
          null;
        if (backup?.id && newId) subIdMap.set(backup.id, newId);
        created += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Alt kategori oluştur] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }

    // Re-fetch subcategories to backfill any missed IDs by name.
    if (subCreate.length > 0) {
      try {
        const r = await api.get(
          `${baseURL}Subcategories/GetSubCategoriesByRestaurantId`,
          { params: { restaurantId } },
        );
        const liveSubsAfter = r?.data?.data || [];
        // Index by (parentId + normalised name) so "Klasik" under
        // "Pizzalar" and "Klasik" under "Pideler" don't collide.
        const liveByParentName = new Map();
        for (const s of liveSubsAfter) {
          const parent = s?.categoryId ?? s?.CategoryId;
          const k = normaliseName(s?.name);
          if (!parent || !k) continue;
          liveByParentName.set(`${parent}::${k}`, s);
        }
        for (const job of subCreate) {
          if (!job?.backup?.id || subIdMap.has(job.backup.id)) continue;
          const parentLiveId = catIdMap.get(job.parentBackupId);
          if (!parentLiveId) continue;
          const live = liveByParentName.get(
            `${parentLiveId}::${normaliseName(job.backup.name)}`,
          );
          if (live?.id) subIdMap.set(job.backup.id, live.id);
        }
      } catch {
        // Subcat refetch failed — product creates that point at
        // newly-created subcats may still resolve via the
        // categoryId (parent) and drop the subCategoryId reference.
      }
    }

    // Helper: rewrite backup membership refs through the maps so they
    // point at live IDs. Drop a membership whose category we couldn't
    // resolve (would land the product in a non-existent category and
    // fail backend validation).
    const resolveMemberships = (backupMemberships) =>
      (backupMemberships || [])
        .map((m) => {
          const catId = catIdMap.get(m.categoryId) || m.categoryId;
          if (!catId) return null;
          const subId =
            m.subCategoryId &&
            (subIdMap.get(m.subCategoryId) || m.subCategoryId);
          return subId ? { categoryId: catId, subCategoryId: subId } : { categoryId: catId };
        })
        .filter(Boolean);

    // Helper: parse number for portion prices safely.
    const safePrice = (v) => {
      if (v == null || v === "") return 0;
      const n = Number(String(v).replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    };

    // Helper: build the AddProduct / EditProduct multipart payload.
    const buildProductFormData = (backup, opts) => {
      const fd = new FormData();
      // Entity id. On EDIT this is the live product id. On CREATE it's
      // the backup id — a backend honouring
      // BACKUP_RESTORE_ID_PRESERVATION_BRIEF.md persists the product
      // with that exact id, which keeps restores idempotent (re-running
      // matches by id → UPDATE, not a duplicate CREATE). Older backends
      // ignore the field and mint their own id, so sending it is always
      // safe (additive per the brief).
      const entityId = opts.editId || opts.createId;
      if (entityId) fd.append("id", entityId);
      fd.append("restaurantId", restaurantId);
      fd.append("name", backup.name || "");
      fd.append("description", backup.description ?? "");
      fd.append("recommendation", !!backup.recommendation);
      fd.append("hide", !!backup.hide);
      fd.append("freeTagging", !!backup.freeTagging);
      fd.append("isCampaign", !!backup.isCampaign);
      const memberships = opts.memberships || [];
      fd.append("categories", JSON.stringify(memberships));
      const firstCat = memberships[0] || {};
      // Backwards-compat fields — see PRODUCT_M2M_BACKEND_BRIEF.md §3.
      fd.append("categoryId", firstCat.categoryId || "");
      fd.append("subCategoryId", firstCat.subCategoryId || "");
      const portions = (backup.portions || []).map((po) => ({
        // Portion ids round-trip only on EDIT (update rows in place).
        // On CREATE they're stripped so the backend mints fresh portion
        // rows — the id-preservation brief covers the top-level product
        // id, not nested portion ids. Keyed on editId (not entityId) on
        // purpose so a preserved-id CREATE still gets fresh portions.
        ...(opts.editId && po.id ? { id: po.id } : {}),
        ...(opts.editId ? { productId: opts.editId } : {}),
        name: po.name || "",
        price: safePrice(po.price),
        campaignPrice: safePrice(po.campaignPrice),
        specialPrice: safePrice(po.specialPrice),
      }));
      fd.append("portions", JSON.stringify(portions));
      if (opts.imageFile) fd.append("image", opts.imageFile);
      return fd;
    };

    // ── Phase C: products ──
    for (const job of prodUpdate) {
      try {
        const { backup, live } = job;
        const memberships =
          resolveMemberships(backup.categories).length > 0
            ? resolveMemberships(backup.categories)
            : // Preserve live memberships if backup has none (data
              // sanity — never leave a product orphaned).
              (live.categories || []).map((m) => ({
                categoryId: m.categoryId,
                ...(m.subCategoryId ? { subCategoryId: m.subCategoryId } : {}),
              }));
        const imageFile = await blobFromZip(backup.image);
        const fd = buildProductFormData(backup, {
          editId: live.id,
          memberships,
          imageFile,
        });
        await api.put(`${baseURL}Products/EditProduct`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // Allergens are a separate endpoint regardless of edit/add.
        if (Array.isArray(backup.allergens)) {
          await api
            .put(`${baseURL}Products/${live.id}/Allergens`, {
              allergens: backup.allergens,
            })
            .catch(() => {
              // Allergen update is supplementary — log per the
              // higher-level error counter only if the whole
              // EditProduct fails. A single allergen failure
              // doesn't sink the whole product update.
            });
        }
        updated += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Ürün güncelle] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }
    for (const job of prodCreate) {
      try {
        const { backup } = job;
        const memberships = resolveMemberships(backup.categories);
        if (memberships.length === 0) {
          skipped += 1;
          bump();
          continue;
        }
        const imageFile = await blobFromZip(backup.image);
        const fd = buildProductFormData(backup, {
          // Preserve the backup id on create (see buildProductFormData).
          createId: backup.id || undefined,
          memberships,
          imageFile,
        });
        const res = await api.put(`${baseURL}Products/AddProduct`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const newId =
          res?.data?.data?.id ||
          res?.data?.id ||
          // A preserved-id backend may not echo the id back; fall back to
          // the backup id we just sent so allergens land on the right
          // product. Harmless on older backends — the allergen PUT is
          // wrapped in .catch() so a wrong/missing id just skips them.
          backup.id ||
          null;
        // Push allergens to the new product if we know its ID.
        if (newId && Array.isArray(backup.allergens) && backup.allergens.length > 0) {
          await api
            .put(`${baseURL}Products/${newId}/Allergens`, {
              allergens: backup.allergens,
            })
            .catch(() => {});
        }
        created += 1;
      } catch (err) {
        failed += 1;
        errors.push({
          name: `[Ürün oluştur] ${job?.backup?.name}`,
          message:
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown",
        });
      } finally {
        bump();
      }
    }

    // ── Phase D: re-order categories + subcategories ──
    // AddCategory / AddSubCategory ignore the `sortOrder` we send
    // (backend always assigns the next available slot). Without a
    // post-create reorder pass, every restored entity lands at the
    // bottom of its list — DÜRÜMLER restored at position 4 ended up
    // at position 12 instead of slotting into its original spot.
    //
    // We use the bulk endpoints the existing drag-to-reorder UI uses:
    //   Categories/EditCategories   — multipart, full DTO with sortOrder
    //   SubCategories/UpdateSubCategoriesOrder — JSON, light-weight
    //                                            {subCategoryId, sortOrder}
    //
    // The desired order is "backup categories in backup.sortOrder
    // order, then any extras (live cats not in backup) appended". In
    // merge mode this still re-numbers existing live categories so
    // newly-restored ones can slot into their backup positions —
    // technically a side-effect on "untouched" rows, but the user's
    // intent ("restore DÜRÜMLER to position 4") demands it.
    try {
      // Final fresh fetch so we have IDs + payload for every live cat.
      let finalCats = liveCatsAfter;
      try {
        const r = await api.get(
          `${baseURL}Categories/GetCategoriesByRestaurantId`,
          { params: { restaurantId } },
        );
        finalCats = r?.data?.data || finalCats;
      } catch {
        // Use the last known list — better than nothing.
      }

      // Build live-cat lookups by id and by normalised name (fallback
      // when our remap missed the id because backend gave us a new one
      // we couldn't capture from the response).
      const liveCatById = new Map();
      const liveCatByName = new Map();
      for (const c of finalCats) {
        if (c?.id) liveCatById.set(c.id, c);
        const k = normaliseName(c?.name);
        if (k) liveCatByName.set(k, c);
      }

      // Sort backup categories by their backup sortOrder so the
      // ordered list reflects the menu's original layout.
      const orderedBackup = [...(manifest.categories || [])].sort(
        (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0),
      );

      const orderedLive = [];
      const placed = new Set();
      for (const bc of orderedBackup) {
        let live = null;
        const mappedId = bc?.id ? catIdMap.get(bc.id) : null;
        if (mappedId && liveCatById.has(mappedId)) {
          live = liveCatById.get(mappedId);
        } else if (bc?.id && liveCatById.has(bc.id)) {
          live = liveCatById.get(bc.id);
        } else {
          live = liveCatByName.get(normaliseName(bc?.name));
        }
        if (live && !placed.has(live.id)) {
          orderedLive.push(live);
          placed.add(live.id);
        }
      }
      // Append any live categories that aren't in the backup at all.
      for (const c of finalCats) {
        if (c?.id && !placed.has(c.id)) {
          orderedLive.push(c);
          placed.add(c.id);
        }
      }

      // Skip the call if nothing actually changed (every live cat is
      // already at its target sortOrder). Saves a round-trip on the
      // common "restore was idempotent" case.
      const orderChanged = orderedLive.some(
        (c, idx) => (c?.sortOrder ?? 0) !== idx,
      );
      if (orderChanged && orderedLive.length > 0) {
        const payload = orderedLive.map((c, idx) => ({
          id: c.id,
          restaurantId,
          name: c.name,
          isActive: !!c.isActive,
          featured: !!c.featured,
          campaign: !!c.campaign,
          menuIds: Array.isArray(c.menuIds) ? c.menuIds : [],
          sortOrder: idx,
        }));
        const fd = new FormData();
        fd.append("RestaurantId", restaurantId);
        fd.append("CategoriesData", JSON.stringify(payload));
        // We're NOT changing images here — backend keeps existing.
        fd.append("DonotPostTheImages", "true");
        await api.put(`${baseURL}Categories/EditCategories`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Subcategories — bulk light-weight endpoint, one call per
      // parent category. Same approach: backup order first, extras
      // appended.
      let finalSubs = [];
      try {
        const r = await api.get(
          `${baseURL}Subcategories/GetSubCategoriesByRestaurantId`,
          { params: { restaurantId } },
        );
        finalSubs = r?.data?.data || [];
      } catch {
        // skip the sub reorder if we can't fetch
      }
      if (finalSubs.length > 0) {
        const liveSubsByParent = new Map();
        for (const s of finalSubs) {
          const parent = s?.categoryId ?? s?.CategoryId;
          if (!parent) continue;
          const arr = liveSubsByParent.get(parent) || [];
          arr.push(s);
          liveSubsByParent.set(parent, arr);
        }

        const subOrderPayload = [];
        for (const bc of orderedBackup) {
          // Resolve parent live cat
          const parentLive =
            (bc?.id && catIdMap.get(bc.id) && liveCatById.get(catIdMap.get(bc.id))) ||
            (bc?.id && liveCatById.get(bc.id)) ||
            liveCatByName.get(normaliseName(bc?.name));
          if (!parentLive?.id) continue;
          const liveSubs = liveSubsByParent.get(parentLive.id) || [];
          const liveSubById = new Map();
          const liveSubByName = new Map();
          for (const s of liveSubs) {
            if (s?.id) liveSubById.set(s.id, s);
            const k = normaliseName(s?.name);
            if (k) liveSubByName.set(k, s);
          }
          const placedSubs = new Set();
          let idx = 0;
          const orderedBackupSubs = [...(bc.subCategories || [])].sort(
            (a, b) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0),
          );
          for (const bs of orderedBackupSubs) {
            let sLive = null;
            const mappedSubId = bs?.id ? subIdMap.get(bs.id) : null;
            if (mappedSubId && liveSubById.has(mappedSubId)) {
              sLive = liveSubById.get(mappedSubId);
            } else if (bs?.id && liveSubById.has(bs.id)) {
              sLive = liveSubById.get(bs.id);
            } else {
              sLive = liveSubByName.get(normaliseName(bs?.name));
            }
            if (sLive && !placedSubs.has(sLive.id)) {
              subOrderPayload.push({
                subCategoryId: sLive.id,
                sortOrder: idx,
              });
              placedSubs.add(sLive.id);
              idx += 1;
            }
          }
          // Append extras under this parent.
          for (const s of liveSubs) {
            if (s?.id && !placedSubs.has(s.id)) {
              subOrderPayload.push({
                subCategoryId: s.id,
                sortOrder: idx,
              });
              placedSubs.add(s.id);
              idx += 1;
            }
          }
        }
        if (subOrderPayload.length > 0) {
          await api.put(
            `${baseURL}SubCategories/UpdateSubCategoriesOrder`,
            { restaurantId, subCategories: subOrderPayload },
          );
        }
      }
    } catch (err) {
      // Reorder is a polish pass; failure here doesn't invalidate
      // the restored data, so just log and move on. The user can
      // re-order manually on the categories page if needed.
      console.warn("[restore v2] reorder pass failed:", err?.message);
    }

    setSummary({
      updated,
      failed,
      created,
      skipped,
      ambiguousCount: 0,
      unmatchedCount: 0,
      categoriesCreated: 0,
      subCategoriesCreated: 0,
      errors: errors.slice(0, 50),
      totalErrors: errors.length,
      isV2: true,
    });
    // Flush every list cache so a navigation away from the modal
    // doesn't show stale pre-restore data. Without this the
    // Products / Categories / Subcategories pages keep their old
    // payload until a hard refresh (the direct-api writes here don't
    // trigger the slice matchers that normally invalidate on
    // *.fulfilled).
    invalidateAllCaches();
    setPhase("done");
  };

  // ── Phase 4: applying ──────────────────────────────────────────────
  // Single entry point — branches to the v2 ID-based flow for v2
  // backups, falls through to the legacy v1 name-based flow for old
  // backups taken before this feature shipped.
  const handleApply = async () => {
    if (!matchInfo || !zip) return;

    if (Number(manifest?.version) === 2 && v2Diff) {
      await applyV2();
      return;
    }

    // Combine matched + ambiguous (ambiguous → apply to all live
    // targets, same data) into one work queue.
    const productWork = [
      ...matchInfo.matched.flatMap((m) =>
        m.targets.map((t) => ({ entry: m.entry, target: t, ambiguous: false })),
      ),
      ...matchInfo.ambiguous.flatMap((m) =>
        m.targets.map((t) => ({ entry: m.entry, target: t, ambiguous: true })),
      ),
    ];

    // Categories work — only assembled if the toggle is on AND the
    // manifest has a categories section. The category creation pass
    // runs BEFORE product updates so subcategories can attach to
    // their newly-created parents on the same restore.
    const backupCats =
      applyCategories && Array.isArray(manifest?.categories)
        ? manifest.categories
        : [];

    // Re-derive the live indices from current state (handleFile's
    // indices were local to that closure).
    const liveCatByName = new Map();
    for (const c of currentCategories) {
      const k = normaliseName(c?.name);
      if (k) liveCatByName.set(k, c);
    }

    // Categories to create: those missing by normalised name.
    const catCreationJobs = [];
    for (const bc of backupCats) {
      const k = normaliseName(bc?.name);
      if (!k) continue;
      if (!liveCatByName.has(k)) catCreationJobs.push(bc);
    }

    // Subcategory jobs are computed AFTER categories are created
    // (need fresh parent IDs). Estimate total work for the progress
    // bar by counting backup subs that don't currently exist under
    // their parent — the worst case; some may turn out to belong to
    // newly-created parents.
    let estimatedSubJobs = 0;
    if (applyCategories) {
      const liveSubsByParent = new Map();
      for (const s of currentSubCategories) {
        const parent = s?.categoryId ?? s?.CategoryId;
        if (!parent) continue;
        const k = normaliseName(s?.name);
        if (!k) continue;
        const bucket = liveSubsByParent.get(parent) || new Set();
        bucket.add(k);
        liveSubsByParent.set(parent, bucket);
      }
      for (const bc of backupCats) {
        const k = normaliseName(bc?.name);
        const liveCat = liveCatByName.get(k);
        for (const bs of bc.subCategories || []) {
          if (!normaliseName(bs?.name)) continue;
          if (!liveCat) {
            // Parent will be created → all its subs are new.
            estimatedSubJobs += 1;
          } else {
            const existing = liveSubsByParent.get(liveCat.id) || new Set();
            if (!existing.has(normaliseName(bs.name))) estimatedSubJobs += 1;
          }
        }
      }
    }

    const totalWork =
      productWork.length + catCreationJobs.length + estimatedSubJobs;
    if (totalWork === 0) {
      toast.error(
        t(
          "productsList.restore_nothing_to_apply",
          "Uygulanacak bir kayıt yok.",
        ),
      );
      return;
    }

    setPhase("applying");
    setProgress({ done: 0, total: totalWork });

    const api = privateApi();
    const errors = [];
    let updated = 0;
    let failed = 0;
    let categoriesCreated = 0;
    let subCategoriesCreated = 0;
    let done = 0;
    const bump = () => {
      done += 1;
      setProgress({ done, total: totalWork });
    };

    // Helper: pull a blob out of the ZIP and wrap as a File ready for
    // multipart upload. Returns null when the path is missing.
    const blobFromZip = async (path) => {
      if (!path) return null;
      const fileEntry = zip.file(path);
      if (!fileEntry) return null;
      const blob = await fileEntry.async("blob");
      const ext = path.split(".").pop() || "jpg";
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
            ? "image/webp"
            : ext === "gif"
              ? "image/gif"
              : "image/jpeg";
      return new File([blob], `restore.${ext}`, { type: mime });
    };

    // ── Phase A: create missing categories ──
    // Sequential rather than concurrent — the backend's AddCategory
    // endpoint may serialise on a per-restaurant lock anyway, and the
    // counts here are typically small (<20).
    let categoriesAfter = currentCategories;
    if (catCreationJobs.length > 0) {
      for (const bc of catCreationJobs) {
        try {
          const fd = new FormData();
          fd.append("restaurantId", restaurantId);
          // Mirror addCategory.jsx payload shape — categoriesData is a
          // JSON array, image is sent as `image_0` (sequential index).
          const data = [
            {
              name: bc.name,
              isActive: bc.isActive ?? true,
              featured: !!bc.featured,
              campaign: !!bc.campaign,
              sortOrder: bc.sortOrder ?? 0,
              // menuIds intentionally omitted — restaurant-scoped IDs
              // don't survive cross-restaurant or post-delete restores.
              // The user can re-assign categories to menus via the UI
              // after the restore.
              menuIds: [],
            },
          ];
          fd.append("categoriesData", JSON.stringify(data));
          const imageFile = await blobFromZip(bc.image);
          if (imageFile) fd.append("image_0", imageFile);
          await api.put(`${baseURL}Categories/AddCategory`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          categoriesCreated += 1;
        } catch (err) {
          failed += 1;
          const msg =
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown";
          errors.push({
            name: `[Kategori] ${bc?.name}`,
            message: msg,
          });
        } finally {
          bump();
        }
      }

      // Refetch categories so we have IDs for the newly created ones
      // — required for the subcategory creation pass that follows.
      try {
        const r = await api.get(
          `${baseURL}Categories/GetCategoriesByRestaurantId`,
          { params: { restaurantId } },
        );
        categoriesAfter = r?.data?.data || categoriesAfter;
      } catch {
        // Keep the old list — subs that depended on newly-created
        // parents will simply fail to find a parent and be skipped.
      }
    }

    // ── Phase B: create missing subcategories ──
    if (applyCategories && backupCats.length > 0) {
      const liveCatByNameFresh = new Map();
      for (const c of categoriesAfter) {
        const k = normaliseName(c?.name);
        if (k) liveCatByNameFresh.set(k, c);
      }
      const liveSubsByParent = new Map();
      for (const s of currentSubCategories) {
        const parent = s?.categoryId ?? s?.CategoryId;
        if (!parent) continue;
        const k = normaliseName(s?.name);
        if (!k) continue;
        const bucket = liveSubsByParent.get(parent) || new Set();
        bucket.add(k);
        liveSubsByParent.set(parent, bucket);
      }

      const subJobs = [];
      for (const bc of backupCats) {
        const parentLive = liveCatByNameFresh.get(normaliseName(bc?.name));
        if (!parentLive?.id) continue;
        const existing = liveSubsByParent.get(parentLive.id) || new Set();
        for (const bs of bc.subCategories || []) {
          const sk = normaliseName(bs?.name);
          if (!sk) continue;
          if (existing.has(sk)) continue;
          subJobs.push({ bs, parentId: parentLive.id, parentName: bc.name });
        }
      }

      // If we overestimated estimatedSubJobs, top up the total so the
      // progress bar doesn't claim 110% completion.
      if (subJobs.length !== estimatedSubJobs) {
        const newTotal =
          productWork.length + catCreationJobs.length + subJobs.length;
        setProgress({ done, total: newTotal });
      }

      for (const job of subJobs) {
        try {
          const fd = new FormData();
          fd.append("restaurantId", restaurantId);
          const data = [
            {
              name: job.bs.name,
              categoryId: job.parentId,
              isActive: job.bs.isActive ?? true,
              sortOrder: job.bs.sortOrder ?? 0,
            },
          ];
          fd.append("subCategoryData", JSON.stringify(data));
          const imageFile = await blobFromZip(job.bs.image);
          if (imageFile) fd.append("image_0", imageFile);
          await api.put(`${baseURL}SubCategories/AddSubCategory`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          subCategoriesCreated += 1;
        } catch (err) {
          failed += 1;
          const msg =
            err?.response?.data?.message_TR ||
            err?.response?.data?.message ||
            err?.message ||
            "unknown";
          errors.push({
            name: `[Alt Kategori] ${job.parentName} / ${job.bs?.name}`,
            message: msg,
          });
        } finally {
          bump();
        }
      }
    }

    // ── Phase C: apply product overrides ──
    await mapWithConcurrency(productWork, APPLY_CONCURRENCY, async (job) => {
      const { entry, target } = job;
      try {
        // Pull image blob lazily from the ZIP — keeps memory bounded
        // (instead of holding every image in RAM after parse).
        const imageFile =
          applyImages && entry.image ? await blobFromZip(entry.image) : null;

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
        bump();
      }
    });

    setSummary({
      updated,
      failed,
      ambiguousCount: matchInfo.ambiguous.length,
      unmatchedCount: matchInfo.unmatched.length,
      categoriesCreated,
      subCategoriesCreated,
      errors: errors.slice(0, 50), // cap the visible list
      totalErrors: errors.length,
    });
    // Same rationale as the v2 path: direct api writes skip the
    // slice matchers, so flush every relevant cache by hand.
    invalidateAllCaches();
    setPhase("done");
  };

  const reset = () => {
    setPhase("idle");
    setError("");
    setZip(null);
    setManifest(null);
    setMatchInfo(null);
    setCurrentProducts([]);
    setCurrentCategories([]);
    setCurrentSubCategories([]);
    setCategoryDiff(null);
    setV2Diff(null);
    setRestoreMode("merge");
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
              categoryDiff={categoryDiff}
              v2Diff={v2Diff}
              restoreMode={restoreMode}
              setRestoreMode={setRestoreMode}
              applyImages={applyImages}
              setApplyImages={setApplyImages}
              applyDescription={applyDescription}
              setApplyDescription={setApplyDescription}
              applyAllergens={applyAllergens}
              setApplyAllergens={setApplyAllergens}
              applyCategories={applyCategories}
              setApplyCategories={setApplyCategories}
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
                disabled={(() => {
                  // v2: enabled whenever any work would happen given
                  // the selected mode. Merge needs at least one new
                  // entry across cats/subs/products. Full additionally
                  // counts updates of existing entries.
                  if (Number(manifest?.version) === 2 && v2Diff) {
                    const newCount =
                      v2Diff.cats.new.length +
                      v2Diff.subs.new.length +
                      v2Diff.prods.new.length;
                    if (restoreMode === "merge") return newCount === 0;
                    const totalCount =
                      newCount +
                      v2Diff.cats.existing.length +
                      v2Diff.subs.existing.length +
                      v2Diff.prods.existing.length;
                    return totalCount === 0;
                  }
                  // v1 legacy: same gating as before.
                  return (
                    ((matchInfo.matched.length + matchInfo.ambiguous.length === 0) &&
                      (!applyCategories ||
                        !categoryDiff ||
                        categoryDiff.newCategoryCount +
                          categoryDiff.newSubCategoryCount ===
                          0)) ||
                    (!applyImages &&
                      !applyDescription &&
                      !applyAllergens &&
                      !applyCategories)
                  );
                })()}
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
  categoryDiff,
  v2Diff,
  restoreMode,
  setRestoreMode,
  applyImages,
  setApplyImages,
  applyDescription,
  setApplyDescription,
  applyAllergens,
  setApplyAllergens,
  applyCategories,
  setApplyCategories,
}) => {
  const { matched, ambiguous, unmatched } = matchInfo;
  const [expandedSection, setExpandedSection] = useState(null); // 'amb' | 'unmatched' | null

  const incl = manifest.includes || {};
  const isV2 = Number(manifest.version) === 2 && v2Diff;
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
              {incl.categories && (
                <Pill
                  label={t(
                    "productsList.backup_with_categories",
                    "Kategoriler & Alt Kategoriler",
                  )}
                  icon={FolderTree}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category diff banner — only when the backup carries
          categories AND there's at least one missing item to create.
          The wording is neutral ("oluşturulacak") since this is
          ensure-exists; existing categories are left untouched.
          v1 path only — v2 has its own per-entity stat cards below. */}
      {!isV2 &&
        categoryDiff &&
        (categoryDiff.newCategoryCount > 0 ||
          categoryDiff.newSubCategoryCount > 0) && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11.5px] leading-snug dark:bg-indigo-500/10 dark:border-indigo-400/30 dark:text-indigo-200">
            <FolderPlus className="size-4 shrink-0 mt-0.5" />
            <span>
              {t(
                "productsList.restore_category_diff",
                "{{cats}} yeni kategori ve {{subs}} yeni alt-kategori oluşturulacak. Mevcut kategoriler değiştirilmez.",
                {
                  cats: categoryDiff.newCategoryCount,
                  subs: categoryDiff.newSubCategoryCount,
                },
              )}
            </span>
          </div>
        )}

      {/* ─── v2: mode radio + per-entity-type diff stats ─── */}
      {isV2 && (
        <V2Section
          t={t}
          v2Diff={v2Diff}
          restoreMode={restoreMode}
          setRestoreMode={setRestoreMode}
        />
      )}

      {/* Diff summary — v1 only. v2 renders its own per-entity-type
          stats inside V2Section above. */}
      {!isV2 && (
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
      )}

      {/* Expanded list of ambiguous / unmatched — v1 only */}
      {!isV2 && expandedSection === "amb" && ambiguous.length > 0 && (
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
      {!isV2 && expandedSection === "unmatched" && unmatched.length > 0 && (
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

      {/* Apply toggles — v1 only. v2 is whole-entity (no field-level
          granularity needed since the radio mode covers the intent). */}
      {!isV2 && (
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
            {incl.categories && (
              <ApplyToggle
                icon={FolderTree}
                label={t(
                  "productsList.backup_with_categories",
                  "Kategoriler & Alt Kategoriler",
                )}
                checked={applyCategories}
                onChange={setApplyCategories}
              />
            )}
          </div>
        </div>
      )}

      {/* Warning — wording switches based on mode. Merge is non-
          destructive; full mode overwrites and can lose post-backup
          changes. */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11.5px] leading-snug dark:bg-rose-500/10 dark:border-rose-400/30 dark:text-rose-200">
        <FileWarning className="size-4 shrink-0 mt-0.5" />
        <span>
          {isV2 && restoreMode === "merge"
            ? t(
                "productsList.restore_warning_merge",
                "Sadece eksik öğeler eklenecek. Mevcut kategoriler, alt kategoriler ve ürünler değiştirilmez.",
              )
            : isV2 && restoreMode === "full"
              ? t(
                  "productsList.restore_warning_full",
                  "Yedekteki tüm öğeler oluşturulur veya güncellenir. Yedek alındıktan sonra yaptığın değişiklikler kaybolur. Bu işlem geri alınamaz.",
                )
              : t(
                  "productsList.restore_warning",
                  "Mevcut görsel, açıklama ve alerjen bilgileri yedektekiyle değiştirilir. Bu işlem geri alınamaz.",
                )}
        </span>
      </div>
    </div>
  );
};

// V2 section: radio mode + per-entity-type create/update stat cards.
// Kept as its own component so the ReadyPhase body stays scannable
// — this block has ~80 lines of repetitive stat rendering.
const V2Section = ({ t, v2Diff, restoreMode, setRestoreMode }) => {
  const { cats, subs, prods } = v2Diff;
  const newCount =
    cats.new.length + subs.new.length + prods.new.length;
  const existingCount =
    cats.existing.length + subs.existing.length + prods.existing.length;

  return (
    <>
      {/* Mode radio */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
          {t("productsList.restore_v2_mode_title", "Geri yükleme modu")}
        </div>
        <div className="space-y-2">
          <ModeRadio
            checked={restoreMode === "merge"}
            onChange={() => setRestoreMode("merge")}
            label={t(
              "productsList.restore_v2_mode_merge",
              "Sadece eksikleri ekle",
            )}
            hint={t(
              "productsList.restore_v2_mode_merge_hint",
              "Sadece henüz var olmayan {{count}} öğe oluşturulur. Mevcut kayıtlara dokunulmaz.",
              { count: newCount },
            )}
            tone="indigo"
          />
          <ModeRadio
            checked={restoreMode === "full"}
            onChange={() => setRestoreMode("full")}
            label={t(
              "productsList.restore_v2_mode_full",
              "Tümünü geri yükle",
            )}
            hint={t(
              "productsList.restore_v2_mode_full_hint",
              "{{newCount}} öğe oluşturulur + {{existingCount}} mevcut öğe yedekteki haline güncellenir.",
              { newCount, existingCount },
            )}
            tone="rose"
          />
        </div>
      </div>

      {/* Per-entity-type diff cards */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
          {t("productsList.restore_v2_diff_title", "Yedek özeti")}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <V2DiffCard
            t={t}
            label={t("productsList.restore_v2_label_categories", "Kategori")}
            newCount={cats.new.length}
            existingCount={cats.existing.length}
            mode={restoreMode}
          />
          <V2DiffCard
            t={t}
            label={t(
              "productsList.restore_v2_label_subcategories",
              "Alt Kategori",
            )}
            newCount={subs.new.length}
            existingCount={subs.existing.length}
            mode={restoreMode}
          />
          <V2DiffCard
            t={t}
            label={t("productsList.restore_v2_label_products", "Ürün")}
            newCount={prods.new.length}
            existingCount={prods.existing.length}
            mode={restoreMode}
          />
        </div>
      </div>
    </>
  );
};

const ModeRadio = ({ checked, onChange, label, hint, tone }) => {
  const tones = {
    indigo: checked
      ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 dark:bg-indigo-500/15 dark:border-indigo-400/40 dark:ring-indigo-400/30"
      : "bg-[--white-1] border-[--border-1] hover:border-indigo-200",
    rose: checked
      ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 dark:bg-rose-500/15 dark:border-rose-400/40 dark:ring-rose-400/30"
      : "bg-[--white-1] border-[--border-1] hover:border-rose-200",
  };
  const dotTones = {
    indigo: checked
      ? "border-indigo-600 bg-indigo-600"
      : "border-slate-300 dark:border-slate-500",
    rose: checked
      ? "border-rose-600 bg-rose-600"
      : "border-slate-300 dark:border-slate-500",
  };
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${tones[tone]}`}
    >
      <span
        className={`relative inline-flex shrink-0 size-5 mt-0.5 rounded-full border-2 transition ${dotTones[tone]}`}
      >
        <input
          type="radio"
          checked={checked}
          onChange={() => onChange()}
          className="sr-only"
        />
        {checked && (
          <span className="absolute inset-1 rounded-full bg-white" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-tight text-[--black-1]">
          {label}
        </div>
        <p className="text-[11px] text-[--gr-1] mt-0.5 leading-snug">
          {hint}
        </p>
      </div>
    </label>
  );
};

// Per-entity stat card — shows new (always applied) and existing
// (only applied in full mode, so dimmed in merge mode).
const V2DiffCard = ({ t, label, newCount, existingCount, mode }) => {
  return (
    <div className="rounded-xl border border-[--border-1] bg-[--white-1] p-3">
      <div className="text-[10.5px] font-bold uppercase tracking-wider text-[--gr-1] mb-2 truncate">
        {label}
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] text-emerald-700 dark:text-emerald-200 font-semibold">
            {t("productsList.restore_v2_stat_create", "+ Oluştur")}
          </span>
          <span className="text-[14px] font-bold text-emerald-700 dark:text-emerald-200">
            {newCount}
          </span>
        </div>
        <div
          className={`flex items-center justify-between gap-1 ${
            mode === "merge" ? "opacity-40" : ""
          }`}
        >
          <span className="text-[10px] text-indigo-700 dark:text-indigo-200 font-semibold">
            {t("productsList.restore_v2_stat_update", "↻ Güncelle")}
          </span>
          <span className="text-[14px] font-bold text-indigo-700 dark:text-indigo-200">
            {mode === "merge" ? "—" : existingCount}
          </span>
        </div>
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

    {/* v2: created / updated / skipped / failed — drops the "matched
        / ambiguous / unmatched" buckets that were name-matching
        artifacts. v1: keeps the legacy bucket layout. */}
    {summary.isV2 ? (
      <div className="grid grid-cols-2 gap-2">
        <SummaryStat
          colour="emerald"
          value={summary.created || 0}
          label={t("productsList.restore_summary_created", "Oluşturuldu")}
        />
        <SummaryStat
          colour="indigo"
          value={summary.updated}
          label={t("productsList.restore_summary_updated", "Güncellendi")}
        />
        <SummaryStat
          colour="slate"
          value={summary.skipped || 0}
          label={t("productsList.restore_summary_skipped", "Atlandı")}
        />
        <SummaryStat
          colour="rose"
          value={summary.failed}
          label={t("productsList.restore_summary_failed", "Başarısız")}
        />
      </div>
    ) : (
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
        {/* Only show category stats when the restore actually created
            something — otherwise the grid stays clean for restores that
            didn't touch categories (the common case). */}
        {(summary.categoriesCreated > 0 ||
          summary.subCategoriesCreated > 0) && (
          <>
            <SummaryStat
              colour="indigo"
              value={summary.categoriesCreated}
              label={t(
                "productsList.restore_summary_categories_created",
                "Kategori Oluşturuldu",
              )}
            />
            <SummaryStat
              colour="indigo"
              value={summary.subCategoriesCreated}
              label={t(
                "productsList.restore_summary_subcategories_created",
                "Alt Kategori Oluşturuldu",
              )}
            />
          </>
        )}
      </div>
    )}

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
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-400/30 dark:text-indigo-200",
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
