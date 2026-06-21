# Backend Brief — "Import from Other Sources" (ImportExternal)

## Goal
Let a restaurant import its menu from **another platform** by pasting a public URL. The
backend scrapes that URL and returns a normalized menu; the admin panel then lets the user
**selectively** import Category, Product Name, Portion, Price, and Image. A special
**images-only** mode matches scraped images onto the restaurant's *existing* products.

The frontend is already built against the contract below (new "Diğer Kaynaklardan İçeri
Aktar" tab on the Products page). Until these endpoints exist the FE shows a graceful
"coming soon" state, so shipping the backend turns the feature on with no further FE work.

> **Why backend, not frontend:** browsers cannot fetch arbitrary cross-origin pages or
> images (CORS), so both the scrape and the image download **must** run server-side.

---

## ⚠️ UPDATE (2026-06-22) — Scan is deployed but can't read JS-rendered menus

`ImportExternal/Scan` is **deployed and returns the correct contract** (verified: HTTP 200 +
`{ source, categories, items }`). BUT live testing against real QR-menu platforms shows it
only parses **static HTML / OpenGraph** — it does **not execute JavaScript**, so it returns
nothing usable for the client-rendered SPA menus that almost every modern QR-menu platform
uses. Net effect: no categories/products/images come through, so nothing lists in the panel.

**Evidence — 6 real sources tested, ALL fail to yield a menu:**

| URL | Scan returned | Why |
|---|---|---|
| `tvmenu.tr/qr/gqJk` (Hacı Milcan) | `items: []`, `categories: []` | JS-rendered; static HTML is only a notification popup |
| `efendioglukebap.dijital.menu` | 1 bogus item = page title + `og:image` | JS-rendered; host 403s naive scrapers |
| `yemeksepeti.com/restaurant/srmv/zeyrek-doner` | 1 bogus item (OG card) | JS-rendered SPA + strong anti-bot |
| `getir.com/yemek/restoran/harvey-burger-…` | **HTTP 403** (blocked) | Anti-bot blocks the fetch entirely |
| `tgoyemek.com/restoranlar/130914` (Trendyol Go) | 1 bogus item = page `<title>` | JS-rendered SPA |
| `migros.com.tr/yemek/ozgur-usta-…` (Migros Yemek) | 1 bogus item = page `<title>` | JS-rendered SPA |
| `talabat.com/uae/restaurant/991/pizza-2-go1` (Talabat) | 1 bogus item = page `<title>` | JS-rendered SPA (menu via API) |
| `ubereats.com/store/flipside-burgers…` | **HTTP 403** (blocked) | Aggressive anti-bot — page can't even be fetched (its menu JSON is embedded via React Query once loaded) |

Every modern QR-menu and food-delivery platform is a client-rendered SPA; several also have
anti-bot (Getir and Uber Eats return **403** to any non-browser client). The static-HTML/OG
scraper extracts a real menu from **none** of them — it only ever returns the page's
OpenGraph card as one fake "item".

**Two difficulty tiers the adapters must handle:**
- **Fetchable but JS-rendered** (dijital.menu, tvmenu, Trendyol Go, Migros, Yemeksepeti, Talabat): the
  HTML loads, but the menu arrives via JS/XHR → needs headless render **or** the platform's API.
- **Anti-bot blocked (403)** (Getir, Uber Eats): the page can't even be fetched by a plain
  client → needs a real browser (correct UA / TLS fingerprint, possibly a residential proxy)
  **or** the platform's internal API. Uber Eats embeds the full menu as JSON in-page once it
  renders, so a render-capable fetch is enough — the blocker is purely the 403.

**Required to make this actually work:**

1. **Render JavaScript before extracting (primary fix).** Use a headless browser
   (Playwright / Puppeteer / headless Chromium): load the URL, wait for the menu to render
   (network-idle or a menu selector), then extract from the **rendered** DOM. This is the
   universal solution — works regardless of platform.
2. **Per-platform API adapters (required for the big platforms).** Detect the platform by host
   and call its underlying JSON menu API directly. For the delivery giants (Yemeksepeti, Getir,
   Trendyol Go, Migros, Uber Eats) anti-bot (Cloudflare / DataDome) will likely defeat even a headless
   browser — their internal menu JSON APIs (the same ones their own apps call) are the most
   reliable source, so plan adapters there. For QR-menu platforms (`*.dijital.menu`, `tvmenu.tr`,
   `*.menulux.*`, `adisyo`, …) either a headless render or their simpler JSON API works. Find
   each API via the browser DevTools → Network (the page fetches its menu as JSON); e.g.
   dijital.menu asset URLs expose a company id (`assets.dijital.menu/companies/<id>/…`).
3. **Send a realistic browser User-Agent + headers** (dijital.menu returns 403 otherwise);
   keep the SSRF / timeout / size limits already specified below.
4. Keep the existing JSON-LD / microdata / heuristic-HTML / LLM extraction chain — it just
   needs the **rendered** HTML as input instead of the raw shell.

**Acceptance (re-test):** scanning the two URLs above returns the real **categories**,
**products** (name + price/portions) and **image URLs**. The frontend already lists and
selectively imports them — this is purely a scraper enhancement, no FE change needed.

---

## Endpoint 1 — Scan (preview)
`POST {VITE_BASE_URL}ImportExternal/Scan`  · auth: Bearer (same as other private endpoints)

**Request body (JSON):**
```json
{
  "restaurantId": "<guid>",
  "platform": "yemeksepeti",
  "url": "https://other-platform.com/the-menu",
  "fields": ["category", "name", "portion", "price", "image"]
}
```
- `platform` = **which source the user picked in the panel dropdown** — route straight to that
  adapter, no auto-detection. One of: `generic`, `dijitalmenu`, `tvmenu`, `yemeksepeti`,
  `getir`, `trendyolgo`, `migros`, `ubereats`, `talabat` (extend as adapters are added). `generic` = open-URL
  fallback (headless render + heuristic). **Apply sends the same `platform`.** This is the
  recommended model: the user knows their source, so each platform is a targeted adapter
  (ideally its JSON API) rather than a guess — see the UPDATE section above.
- `fields` = which fields the user ticked. Only these need to be populated in the response
  (e.g. an images-only scan can return just `name` + `imageURL` per item).

**Response (JSON):**
```json
{
  "source": "other-platform.com",
  "categories": ["Pizzalar", "İçecekler"],
  "items": [
    {
      "externalId": "optional-stable-id",
      "category": "Pizzalar",
      "name": "Margherita",
      "portions": [{ "name": "Orta", "price": 180 }, { "name": "Büyük", "price": 240 }],
      "price": 180,
      "imageURL": "https://other-platform.com/img/margherita.jpg"
    }
  ]
}
```
- `price` = single/base price; if the product is multi-portion, also fill `portions[]`.
- `imageURL` = the **remote** image URL on the source site (used as-is for preview; fetched
  server-side at Apply time).
- Return `200` with `items: []` if nothing importable was found.

## Endpoint 2 — Apply (commit)
`POST {VITE_BASE_URL}ImportExternal/Apply` · auth: Bearer

**Mode A — create (general import):**
```json
{
  "restaurantId": "<guid>",
  "fields": ["category", "name", "portion", "price", "image"],
  "mode": "create",
  "items": [ /* the subset of Scan items the user kept (same shape) */ ]
}
```
Behavior: create any missing **categories** (by name, scoped to the restaurant), then create
**products** with name + portions/prices, attach to category, and **download each `imageURL`
server-side** and store it as the product image (only when `image` ∈ `fields`). Respect
`fields`: e.g. if `price` is not selected, default price to 0 / leave per existing rules.
Reuse the same persistence as `Products/AddProduct` + `Categories/AddCategory`.

**Mode B — images (match onto existing products):**
```json
{
  "restaurantId": "<guid>",
  "fields": ["image"],
  "mode": "images",
  "imageMatches": [
    { "productId": "<existing-product-guid>", "imageURL": "https://other-platform.com/img/x.jpg" }
  ]
}
```
Behavior: for each pair, **download `imageURL` server-side** and set it as that product's
image (same storage path as the product image upload). Ignore/blank entries.

**Response (both modes):**
```json
{ "createdCategories": 2, "createdProducts": 14, "updatedImages": 9, "skipped": 1, "errors": [] }
```

---

## Scraping strategy (server side)
Try in order, take the richest result:
1. **Structured data** — JSON-LD (`Menu`/`MenuItem`/`Product`/`Offer`), microdata, OpenGraph.
2. **Known-platform adapters** — optional per-source parsers for the common TR menu/QR
   platforms restaurants migrate from (highest fidelity; add as needed).
3. **Heuristic HTML** — repeated item blocks (name + price pattern + nearby `<img>`).
4. **Optional LLM extraction** — feed cleaned HTML to an extractor as a fallback for
   unstructured pages.

## Server-side image fetch
At Apply: GET each `imageURL` with a timeout, validate it's really an image
(content-type + magic bytes), cap size, then store via the existing product-image pipeline
and persist our own `imageURL`. Never store the foreign URL as the product image directly.

## Security (important)
- **SSRF:** validate the URL is public http/https; block localhost/private/link-local IPs
  and non-http schemes; follow redirects with the same checks.
- Timeouts on both page fetch and each image fetch; cap page size, image size, and item
  count per scan.
- Authorize that `restaurantId` belongs to the caller (same as other private endpoints).

## Conventions
- Errors: return localized `message_TR` / `message_EN` (the FE interceptor surfaces them).
- The FE calls **Scan** with `skipErrorToast` and treats `404`/network as "not deployed yet"
  (graceful panel), so a missing route degrades cleanly during rollout.

## Out of scope (v1)
- **Etiket / OrderTags** import — deferred. `fields` will not include `tag` in v1; the FE
  shows it disabled. (When added: map scraped tags → `OrderTags/AddOrderTag` groups with
  product/category/portion relations.)
