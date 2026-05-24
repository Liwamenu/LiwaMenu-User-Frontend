// Print-friendly product-list export.
//
// Opens an options modal (price column, allergen line, group-by-category),
// pulls the full product catalogue + categories, builds a print-styled HTML
// document, opens it in a new tab, and triggers `window.print()`. The
// browser's print dialog handles "Save as PDF" — no PDF library needed.
//
// Why a new-window print instead of `react-to-print` or a PDF lib: zero
// new dependencies, leaves the SPA untouched, and the user's own browser
// already does perfect text-rendered PDFs out of the print dialog.

import { useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Printer,
  Loader2,
  Tag,
  Layers,
  Wheat,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

import { usePopup } from "../../../context/PopupContext";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Inline middle-dot string used to fill the dotted leader between a
// product name and its price. Rendering dots as TEXT inside the flex
// item (rather than a `border-bottom` on an empty span) lets them
// align perfectly with the adjacent text baselines — the previous
// border-bottom approach sat several pixels below the baseline,
// producing the "satır kayması" look. `overflow: hidden` on the
// leader clips the surplus characters.
const LEADER_FILL = "·".repeat(80);

// ── Modal ──────────────────────────────────────────────────────────────
export default function PrintProductsExportModal({ restaurantId }) {
  const { t, i18n } = useTranslation();
  const { setSecondPopupContent } = usePopup();

  // Resolve the FULL restaurant object from the same redux state the
  // Products / Settings pages read — single-fetch first (freshest),
  // then the list fallback. We need more than the name now: moneySign
  // (Genel Ayarlar → Para Birimi Sembolü) and decimalPoint feed
  // formatPrice so the printed prices use the restaurant's own
  // currency instead of a hard-coded ₺.
  const restaurant = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    const list = s.restaurants.getRestaurants?.restaurants?.data;
    return list?.find?.((r) => r.id === restaurantId) || null;
  });
  const restaurantName = restaurant?.name || "";
  // Empty string (not "₺") when unset — formatPrice omits the suffix
  // entirely in that case rather than guessing a default.
  const moneySign = restaurant?.moneySign || "";
  const decimalPoint = Number.isFinite(Number(restaurant?.decimalPoint))
    ? Number(restaurant.decimalPoint)
    : 2;

  const [withPrices, setWithPrices] = useState(true);
  const [withAllergens, setWithAllergens] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [loading, setLoading] = useState(false);

  const close = () => setSecondPopupContent(null);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);

    // Open the new tab SYNCHRONOUSLY (still inside the click handler) so
    // Safari / Firefox pop-up blockers don't reject it — they require an
    // unbroken user-gesture, which is lost after the first `await`. Show
    // a tiny "preparing" placeholder until the real HTML is ready.
    const printWin = window.open("", "_blank");
    if (!printWin) {
      toast.error(
        t(
          "productsList.export_popup_blocked",
          "Tarayıcı yeni sekmeyi engelledi. Pop-up izni verip tekrar deneyin.",
        ),
      );
      setLoading(false);
      return;
    }
    try {
      printWin.document.open();
      printWin.document.write(
        `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${escapeHtml(
          t("productsList.export_preparing", "Hazırlanıyor…"),
        )}</title></head><body style="font-family:ui-sans-serif,system-ui,sans-serif;padding:24px;color:#666;font-size:13px">${escapeHtml(
          t("productsList.export_preparing", "Hazırlanıyor…"),
        )}</body></html>`,
      );
      printWin.document.close();
    } catch {
      // window may have been closed by the user mid-flight — handled below
    }

    try {
      const api = privateApi();
      // Pull every product in one big call — same trick the duplicate-
      // finder uses (the backend cap was raised so >2000 is fine). A
      // defensive fan-out kicks in if the first call still came up
      // short of the reported totalCount.
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

      // Categories (used only when grouping; reading them either way is
      // cheap — the request is just metadata).
      const catRes = await api.get(
        `${baseURL}Categories/GetCategoriesByRestaurantId`,
        { params: { restaurantId } },
      );
      const categories = catRes?.data?.data || [];

      // Allergen master catalog — only fetched when the user opted in,
      // so the export doesn't pay an extra round-trip otherwise. Maps
      // each code (e.g. "gluten") to its localised displayName in the
      // active UI language, so the print shows Turkish / English labels
      // instead of raw English-looking code identifiers.
      const allergenLabels = {};
      if (withAllergens) {
        try {
          const allergenLang = (i18n.language || "tr")
            .toLowerCase()
            .startsWith("en")
            ? "en"
            : "tr";
          const allergenRes = await api.get(
            `${baseURL}Allergens/GetMasterCatalog`,
            { params: { lang: allergenLang } },
          );
          const allergenList = Array.isArray(allergenRes?.data?.data)
            ? allergenRes.data.data
            : Array.isArray(allergenRes?.data)
              ? allergenRes.data
              : [];
          for (const a of allergenList) {
            if (a?.code) {
              allergenLabels[a.code] =
                a.displayName || a.name || a.label || a.code;
            }
          }
        } catch {
          // Master catalog failed — renderer falls back to raw codes.
        }
      }

      const html = buildPrintHtml({
        restaurantName,
        moneySign,
        decimalPoint,
        products,
        categories,
        allergenLabels,
        withPrices,
        withAllergens,
        groupByCategory,
        lang: i18n.language,
        labels: {
          docTitle: t("productsList.export_doc_title", {
            name: restaurantName,
            defaultValue: "{{name}} — Ürün Listesi",
          }),
          uncategorized: t("productsList.export_uncategorized", "Kategorisiz"),
          allergensPrefix: t(
            "productsList.export_allergens_label",
            "Alerjen",
          ),
        },
      });

      // Swap the placeholder for the real document. `onload` + a small
      // RAF stagger is more reliable than a fixed timeout — print()
      // before fonts/styles apply produces a blank dialog on the first
      // try in Chrome/Firefox.
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      const doPrint = () => {
        try {
          printWin.print();
        } catch {
          // Window may have been closed by the user mid-flight.
        }
      };
      const triggerPrint = () => {
        // Wait for the Nunito webfont before opening the
        // print dialog — otherwise Chrome/Firefox can preview with the
        // fallback serif first and only swap to the proper face after,
        // which makes the print look "wrong" the first time.
        const fontsReady =
          (printWin.document && printWin.document.fonts && printWin.document.fonts.ready) ||
          Promise.resolve();
        Promise.resolve(fontsReady)
          .then(() =>
            requestAnimationFrame(() => requestAnimationFrame(doPrint)),
          )
          .catch(() =>
            requestAnimationFrame(() => requestAnimationFrame(doPrint)),
          );
      };
      if (printWin.document.readyState === "complete") {
        triggerPrint();
      } else {
        printWin.addEventListener("load", triggerPrint);
      }
      close();
    } catch (err) {
      toast.error(
        t("productsList.export_error", "Ürünler alınamadı, tekrar deneyin."),
      );
      // Close the placeholder tab so the user isn't left with a dead
      // "Hazırlanıyor…" page.
      try {
        printWin.close();
      } catch {
        // user may already have closed it
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-[480px] shadow-2xl ring-1 ring-[--border-1] overflow-hidden animate-[fadeIn_0.18s_ease-out]">
        {/* Gradient strip */}
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* Header */}
        <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Printer className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
              {t("productsList.export_modal_title", "Ürün Listesini Dışa Aktar")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "productsList.export_modal_desc",
                "Yazdırma veya PDF kaydı için seçenekler",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition disabled:opacity-50"
            aria-label={t("productsList.export_cancel", "Vazgeç")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-2.5">
          <OptionToggle
            icon={Tag}
            label={t("productsList.export_with_prices", "Fiyatlı")}
            hint={t(
              "productsList.export_with_prices_hint",
              "Fiyatı olmayan ürünler için elle doldurulacak boş alan bırakılır.",
            )}
            checked={withPrices}
            onChange={setWithPrices}
            disabled={loading}
          />
          <OptionToggle
            icon={Wheat}
            label={t("productsList.export_with_allergens", "Alerjen bilgisi dahil")}
            hint={t(
              "productsList.export_with_allergens_hint",
              "Ürün adının altına küçük puntolarla alerjen bilgisi yazılır.",
            )}
            checked={withAllergens}
            onChange={setWithAllergens}
            disabled={loading}
          />
          <OptionToggle
            icon={Layers}
            label={t(
              "productsList.export_group_by_category",
              "Kategorilere göre ayır",
            )}
            hint={t(
              "productsList.export_group_by_category_hint",
              "Ürünler kategori başlıkları altında listelenir.",
            )}
            checked={groupByCategory}
            onChange={setGroupByCategory}
            disabled={loading}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[--border-1] bg-[--white-2]/40 flex items-center gap-2 justify-end">
          <p className="text-[10px] text-[--gr-1] flex-1 flex items-center gap-1">
            <AlertTriangle className="size-3 text-amber-500" />
            {t(
              "productsList.export_print_hint",
              "Tarayıcının yazdırma penceresi açılır — 'PDF olarak kaydet' seçeneğini kullanın.",
            )}
          </p>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--gr-1] text-sm font-semibold hover:bg-[--white-2] transition disabled:opacity-50"
          >
            {t("productsList.export_cancel", "Vazgeç")}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-wait"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Printer className="size-4" />
            )}
            {loading
              ? t("productsList.export_preparing", "Hazırlanıyor…")
              : t("productsList.export_confirm", "Dışa Aktar")}
          </button>
        </div>
      </div>
    </main>
  );
}

// Single option row — icon + label + hint + accessible checkbox.
const OptionToggle = ({ icon: Icon, label, hint, checked, onChange, disabled }) => (
  <label
    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
      checked
        ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:border-indigo-400/30 dark:ring-indigo-400/20"
        : "bg-[--white-1] border-[--border-1] hover:border-indigo-200 hover:bg-[--white-2]"
    } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
  >
    <span
      className={`grid place-items-center size-8 rounded-lg shrink-0 transition ${
        checked
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
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
          ? "bg-indigo-600 border-indigo-700"
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
        <Check className="absolute left-0.5 top-1/2 -translate-y-1/2 size-3 text-white" strokeWidth={3} />
      )}
    </span>
  </label>
);

// ── HTML / print stylesheet builder ─────────────────────────────────────

function buildPrintHtml({
  restaurantName,
  moneySign,
  decimalPoint,
  products,
  categories,
  allergenLabels,
  withPrices,
  withAllergens,
  groupByCategory,
  lang,
  labels,
}) {
  let body = "";

  if (groupByCategory) {
    // Group products by category. m2m: a product in multiple categories
    // appears in each section (correct for a printed menu). Sort
    // categories by their own sortOrder, and items inside each by
    // their per-junction sortOrder then name.
    const catMap = new Map();
    categories.forEach((c) =>
      catMap.set(c.id, {
        id: c.id,
        name: c.name || "",
        sortOrder: c.sortOrder ?? 0,
        items: [],
      }),
    );
    const uncategorized = [];

    for (const p of products || []) {
      const memberships = Array.isArray(p.categories) ? p.categories : [];
      if (memberships.length === 0) {
        uncategorized.push({ product: p, sortOrder: Number.MAX_SAFE_INTEGER });
        continue;
      }
      for (const m of memberships) {
        const bucket = catMap.get(m?.categoryId);
        if (bucket) {
          bucket.items.push({
            product: p,
            sortOrder: m?.sortOrder ?? 0,
          });
        } else {
          uncategorized.push({
            product: p,
            sortOrder: Number.MAX_SAFE_INTEGER,
          });
        }
      }
    }

    const sortedCats = [...catMap.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    for (const cat of sortedCats) {
      if (cat.items.length === 0) continue;
      cat.items.sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          String(a.product.name || "").localeCompare(
            String(b.product.name || ""),
            "tr",
          ),
      );
      body += renderCategorySection(cat.name, cat.items, {
        withPrices,
        withAllergens,
        labels,
        allergenLabels,
        moneySign,
        decimalPoint,
      });
    }

    if (uncategorized.length > 0) {
      uncategorized.sort((a, b) =>
        String(a.product.name || "").localeCompare(
          String(b.product.name || ""),
          "tr",
        ),
      );
      body += renderCategorySection(labels.uncategorized, uncategorized, {
        withPrices,
        withAllergens,
        labels,
        allergenLabels,
        moneySign,
        decimalPoint,
      });
    }
  } else {
    const sorted = [...(products || [])].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), "tr"),
    );
    body += `<ul class="items">${sorted
      .map((p) =>
        renderProduct(p, {
          withPrices,
          withAllergens,
          labels,
          allergenLabels,
          moneySign,
          decimalPoint,
        }),
      )
      .join("")}</ul>`;
  }

  // Document header carries only the restaurant name — no date or
  // "list title" sub-line (per request: cleaner, menu-like).
  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang || "tr")}">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(labels.docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap">
<style>${PRINT_CSS}</style>
</head>
<body>
<header class="doc-header">
  <h1>${escapeHtml(restaurantName || "")}</h1>
</header>
<main class="doc-main">
${body || `<p class="empty">—</p>`}
</main>
</body>
</html>`;
}

function renderCategorySection(name, items, opts) {
  // Ornament spans on each side of the heading — drawn as thin gold
  // rules in CSS to mimic the classic centered-category-title look of
  // printed restaurant menus.
  return `<section class="cat">
  <h2><span class="ornament" aria-hidden="true"></span>${escapeHtml(
    name,
  )}<span class="ornament" aria-hidden="true"></span></h2>
  <ul class="items">${items
    .map(({ product }) => renderProduct(product, opts))
    .join("")}</ul>
</section>`;
}

function renderProduct(p, { withPrices, withAllergens, labels, allergenLabels, moneySign, decimalPoint }) {
  const name = escapeHtml(p.name || "");
  const portions = Array.isArray(p.portions) ? p.portions : [];
  const multi = portions.length > 1;

  // ─── Right-side cell ───
  //  • withPrices=true  + saved price → display the price.
  //  • withPrices=true  + no price    → empty box (fill-in by hand).
  //  • withPrices=false (fiyatsız)    → empty box for EVERY portion, so
  //    the printed menu doubles as a fill-in-by-hand price template.
  const priceCellHtml = (portion) => {
    if (withPrices) {
      const has =
        portion?.price != null &&
        portion.price !== "" &&
        Number(portion.price) > 0;
      if (has) {
        return `<span class="price">${escapeHtml(formatPrice(portion.price, { moneySign, decimalPoint }))}</span>`;
      }
    }
    return `<span class="price-box" aria-hidden="true"></span>`;
  };

  // ─── Main row + (optional) portion list ───
  // Single-portion: name + dotted leader + price/box on one row.
  // Multi-portion: name on top; each portion as its own row below, each
  // with its own leader + price/box (so a fiyatsız multi-portion product
  // gets one box per portion to write into).
  let mainRow = "";
  let portionList = "";

  if (multi) {
    mainRow = `<div class="row name-only"><span class="name">${name}</span></div>`;
    portionList = `<div class="portions">${portions
      .map((po) => {
        const poName = escapeHtml(po?.name || "");
        return `<div class="portion-row"><span class="portion-name">${poName}</span><span class="portion-leader" aria-hidden="true">${LEADER_FILL}</span>${priceCellHtml(po)}</div>`;
      })
      .join("")}</div>`;
  } else {
    const portion = portions[0];
    mainRow = `<div class="row"><span class="name">${name}</span><span class="leader" aria-hidden="true">${LEADER_FILL}</span>${priceCellHtml(portion)}</div>`;
  }

  // ─── Optional allergens line ───
  // The .NET backend sometimes serialises in PascalCase, and the list
  // endpoint isn't guaranteed to use the same shape as the single-
  // product fetch. Accept all common shapes defensively: camelCase
  // `allergens`, PascalCase `Allergens`, plain string entries, and
  // missing `presence` (treated as "Contains").
  let allergens = "";
  if (withAllergens) {
    const rawList =
      (Array.isArray(p.allergens) && p.allergens) ||
      (Array.isArray(p.Allergens) && p.Allergens) ||
      [];
    const items = rawList
      .map((a) => {
        if (typeof a === "string") return { code: a, presence: "Contains" };
        const code = a?.code ?? a?.Code ?? a?.name ?? a?.Name;
        const presence = a?.presence ?? a?.Presence ?? "Contains";
        return code ? { code, presence } : null;
      })
      .filter(Boolean);
    // "Contains" first, then "MayContain" in parentheses. Use the
    // localised displayName from the master catalog when available;
    // fall back to the raw code if the catalog fetch failed.
    const labelFor = (code) =>
      (allergenLabels && allergenLabels[code]) || code;
    const contains = items
      .filter((a) => a.presence !== "MayContain")
      .map((a) => labelFor(a.code));
    const may = items
      .filter((a) => a.presence === "MayContain")
      .map((a) => labelFor(a.code));
    const parts = [];
    if (contains.length) parts.push(contains.join(", "));
    if (may.length) parts.push(`(${may.join(", ")})`);
    if (parts.length) {
      allergens = `<div class="allergens">${escapeHtml(
        labels.allergensPrefix,
      )}: ${escapeHtml(parts.join(" "))}</div>`;
    }
  }

  return `<li class="item">${mainRow}${portionList}${allergens}</li>`;
}

// Format a price using the restaurant's own currency symbol and
// decimal-place setting (Genel Ayarlar → Para Birimi Sembolü +
// Kuruş Hanesi). Defaults: 2 decimals, no suffix when the restaurant
// hasn't picked a symbol (rather than guessing "₺").
function formatPrice(p, opts) {
  const n = Number(p) || 0;
  const decimals = Number.isFinite(opts?.decimalPoint) ? opts.decimalPoint : 2;
  const formatted = n.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = opts?.moneySign;
  return sign ? `${formatted} ${sign}` : formatted;
}

const HTML_ESCAPE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch]);
}
function escapeAttr(s) {
  return escapeHtml(s);
}

// Print stylesheet — clean menu styling.
//
// Typography: Nunito throughout (humanist sans, friendly + readable at
// small print sizes). Warm sepia/gold accent (#a18664) on rules and
// ornaments. Centered category titles framed by thin gold rules.
// Dotted leader rows between item names and prices. Empty bordered BOX
// (not a line) for items without a saved price — invites handwriting.
//
// Row layout: name and portion-name are `flex: 0 0 auto; white-space:
// nowrap` (single-line, no shrink); price / price-box are also
// `flex: 0 0 auto` (never squeezed); the leader is `flex: 1 1 auto`
// (absorbs all width changes, dot-fill clipped via overflow:hidden).
// .doc-main has overflow:hidden as a defensive clip for the rare case
// where a very long product name would otherwise push past the A4
// content area.
const PRINT_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Nunito', system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1d1815;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    line-height: 1.45;
  }

  /* ── Document header ── */
  .doc-header {
    text-align: center;
    padding: 28px 24px 18px;
    margin-bottom: 8px;
    border-bottom: 1.5px solid #1d1815;
    position: relative;
  }
  .doc-header::after {
    content: '';
    display: block;
    width: 56px;
    height: 1px;
    background: #a18664;
    margin: 12px auto 0;
  }
  .doc-header h1 {
    margin: 0;
    font-size: 26pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #1d1815;
  }

  .doc-main {
    padding: 8px 24px 24px;
    overflow: hidden;
  }

  /* ── Category section ── */
  /* Keep each category on a single page when it fits. If a category is
     bigger than a page, the browser still has to break inside — but
     the rule biases toward keeping it whole, even if that means leaving
     some empty space at the bottom of the previous page (the user
     prefers cohesive category pages over packed pagination). */
  .cat {
    margin-top: 24px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  /* The first category must be allowed to break across pages.
     Otherwise a tall first category triggers 'page-break-inside: avoid'
     and gets pushed entirely onto page 2, leaving page 1 with nothing
     but the document header — the 'ilk sayfa boş' symptom. Subsequent
     categories keep the avoid behaviour so they stay cohesive. */
  .cat:first-of-type {
    margin-top: 6px;
    page-break-inside: auto;
    break-inside: auto;
  }
  .cat h2 {
    font-size: 13pt;
    font-weight: 800;
    text-align: center;
    margin: 0 0 14px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #1d1815;
    padding: 6px 0;
    /* Heading stays with at least the first item below it. */
    page-break-after: avoid;
  }
  .cat h2 .ornament {
    display: inline-block;
    width: 36px;
    height: 1px;
    background: #a18664;
    vertical-align: middle;
    margin: 0 12px;
  }

  /* ── Items ── */
  ul.items { list-style: none; padding: 0; margin: 0; }
  .item { padding: 7px 0; page-break-inside: avoid; }
  .item + .item { border-top: 1px dotted #d4c8b5; }
  .item .row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    min-width: 0;
  }
  .item .row.name-only { justify-content: flex-start; }
  .item .name {
    font-size: 11.5pt;
    font-weight: 700;
    /* Keep the name on a single line — no shrinking, no wrap. Leader
       (flex: 1 1 auto) absorbs all width changes. Very long names
       remain unbroken; .doc-main's overflow:hidden clips any rare
       edge-case overflow. */
    flex: 0 0 auto;
    white-space: nowrap;
    color: #1d1815;
  }
  /* Dotted leader between name and price — filled with middle-dot
     characters injected from JS. Rendering dots as inline text lets
     them sit ON the text baseline; the previous border-bottom on an
     empty span ended up several pixels below the baseline, producing
     the visible row-shift. overflow:hidden crops the surplus
     characters to fit the available space. */
  .item .leader {
    flex: 1 1 auto;
    min-width: 14px;
    overflow: hidden;
    white-space: nowrap;
    color: #c7b698;
    font-weight: 400;
    letter-spacing: 3px;
  }
  /* Price cell — fixed-width right-aligned column so prices line up
     vertically down the page (like a real menu). Same min-width as the
     empty box below + as the portion row's price/box, so the right edge
     is consistent whether a row has a price, an empty box, a main
     product, or a portion. 91px ≈ 70px × 1.3 (the user requested a 30 %
     wider price column). */
  .item .price {
    font-size: 11pt;
    font-weight: 700;
    white-space: nowrap;
    color: #1d1815;
    flex: 0 0 auto;
    min-width: 91px;
    text-align: right;
  }
  /* Empty box for hand-filled prices. Vertically centered in the row
     (otherwise the empty box's baseline sat oddly high relative to
     the name text and could read as "invisible"). 1.5px border so it
     reads as a clear form field on the printed page. */
  .item .price-box {
    display: inline-block;
    min-width: 91px;
    height: 18pt;
    border: 1.5px solid #8a7766;
    border-radius: 2px;
    background: transparent;
    flex: 0 0 auto;
    align-self: center;
  }

  /* ── Portion list (multi-portion products) ── */
  .portions { margin-top: 5px; margin-left: 20px; }
  .portion-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 10.5pt;
    padding: 2px 0;
    min-width: 0;
  }
  .portion-name {
    font-weight: 500;
    font-style: italic;
    color: #4a3f33;
    /* Same no-wrap policy as the product name above. */
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .portion-leader {
    flex: 1 1 auto;
    min-width: 12px;
    overflow: hidden;
    white-space: nowrap;
    color: #d4c8b5;
    font-weight: 400;
    letter-spacing: 2.5px;
  }
  /* Portion price / box share the SAME min-width as the main row so
     all prices line up in one vertical column across both contexts. */
  .portion-row .price {
    font-size: 10.5pt;
    font-weight: 600;
    min-width: 91px;
    text-align: right;
  }
  .portion-row .price-box {
    min-width: 91px;
    height: 14pt;
  }

  /* ── Allergens ── */
  .allergens {
    margin-top: 4px;
    margin-left: 2px;
    font-size: 8pt;
    color: #8a7766;
    font-style: italic;
    letter-spacing: 0.3px;
  }

  .empty {
    color: #8a7766;
    font-style: italic;
    text-align: center;
    padding: 20px 0;
  }

  @page { size: A4; margin: 16mm; }
  @media print {
    body { margin: 0; padding: 0; }
    .doc-header { padding-top: 4px; }
    .doc-main { padding-bottom: 0; }
  }
`;
