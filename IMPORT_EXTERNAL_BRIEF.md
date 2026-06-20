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

## Endpoint 1 — Scan (preview)
`POST {VITE_BASE_URL}ImportExternal/Scan`  · auth: Bearer (same as other private endpoints)

**Request body (JSON):**
```json
{
  "restaurantId": "<guid>",
  "url": "https://other-platform.com/the-menu",
  "fields": ["category", "name", "portion", "price", "image"]
}
```
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
