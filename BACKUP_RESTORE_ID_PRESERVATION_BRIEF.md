# Backup / Restore — preserve IDs on Add endpoints

The admin panel's Yedek Al / Yedeği Yükle (Products page) is being
expanded from a "metadata snapshot" (description/image/allergens only)
to a **full menu snapshot** that can recreate deleted categories,
subcategories and products from a backup ZIP. To make the restore
truly idempotent and free of cross-reference rebuilds, the `Add*`
endpoints need to accept an optional `id` field so the IDs in the
backup round-trip end-to-end.

This is an **additive** change — existing call-sites that don't send
`id` continue to work exactly as before. Old admin builds and the
non-backup paths (Add/Edit popups, import wizards) are unaffected.

## 1. The ask in one paragraph

For the five endpoints listed below, when the request payload (inside
the JSON-stringified `categoriesData` / `subCategoryData` / product
DTO) contains an `id` field that is a valid UUID, persist the new
entity with that exact ID instead of generating a fresh one. When the
field is absent, empty, or null, generate server-side as today.

## 2. Endpoints affected

| Endpoint                                    | Body field carrying the id   |
| ------------------------------------------- | ---------------------------- |
| `PUT  Categories/AddCategory`               | `categoriesData[i].id`        |
| `PUT  Categories/AddCategories` (bulk)      | `categoriesData[i].id`        |
| `PUT  SubCategories/AddSubCategory`         | `subCategoryData[i].id`       |
| `PUT  SubCategories/AddSubCategories` (bulk)| `subCategoryData[i].id`       |
| `POST Products/AddProduct`                  | top-level multipart field `id`|

Frontend payload shape today (for context — see
`PRODUCT_M2M_BACKEND_BRIEF.md` §2.1 for the full product contract):

```text
// AddCategory (multipart):
restaurantId   : "uuid"
categoriesData : '[{"id":"<optional-uuid>", "name":"...", "isActive":true, ...}]'
image_0        : <File>

// AddProduct (multipart):
id             : "<optional-uuid>"   ← NEW
restaurantId   : "uuid"
name           : "..."
description    : "..."
... (rest unchanged)
```

## 3. Validation requirements

| Case | Backend behaviour |
| --- | --- |
| `id` is valid UUID v4, not in use | persist with that id (current "generate new" logic skipped) |
| `id` is valid UUID v4, already exists for this restaurant | `409 Conflict` with `message_TR`/`message_EN` — frontend will fall through to the corresponding `Edit*` endpoint |
| `id` is present but malformed | `400 Bad Request` |
| `id` is absent / empty / null | generate as today |

The `409` case is what makes the restore round-trippable: the frontend
runs "POST AddProduct with backup id → if 409, switch to PUT
EditProduct with that same id → done". No restaurant-scoped uniqueness
check is needed beyond what's already enforced for current id columns.

## 4. Why this matters

Without this change the frontend has to:

- Maintain a `backup_id → newly_generated_id` remap table across the
  whole restore flow.
- Re-resolve every cross-reference (each product's
  `categories[].categoryId` and `subCategoryId`, each subcategory's
  parent `categoryId`) through that table before the dependent entity
  is created.
- Pay one extra GET round-trip after the create batch to capture the
  new IDs.

With this change the restore becomes a flat "for each backup entity,
hit Add (with id) — if 409 hit Edit (with id)" loop. The flow is
fully idempotent: running the same restore twice produces the same
result; running it after a partial failure is safe to retry.

It also opens the door to other features that have been informally
discussed:

- Cross-restaurant menu cloning (export from restaurant A, import into
  restaurant B with the same IDs reserved)
- Scheduled / automated backups landed by a worker process
- Multi-restaurant chain operations ("apply this product change to
  all 4 branches")

## 5. Frontend status

- Backup v2 format (with IDs + portions + machine-readable category
  memberships + flags) is being built **now** on the frontend.
  Manifest version bumps from `1` to `2`; v1 backups stay readable
  via a name-based fallback path.
- Restore v2 ships with a remap-table fallback so it works correctly
  even before this brief lands — the IDs in the backup just won't be
  preserved when items are newly created. Once the brief is deployed,
  a 5-line frontend change activates true ID preservation.
- Two restore modes (radio):
  - **"Sadece eksikleri ekle"** (merge): only CREATE missing items
  - **"Tümünü geri yükle"** (full): CREATE missing + UPDATE existing

## 6. Verification snippet

After deploy, from a browser DevTools console with a logged-in
session:

```js
const fd = new FormData();
fd.append("restaurantId", "<your-restaurant-uuid>");
fd.append(
  "categoriesData",
  JSON.stringify([
    {
      id: "11111111-2222-3333-4444-555555555555",
      name: "BRIEF-TEST",
      isActive: true,
      featured: false,
      campaign: false,
      menuIds: [],
    },
  ]),
);
// (no image_0 — optional)
fetch("/api/Categories/AddCategory", { method: "PUT", body: fd, headers: { Authorization: `Bearer ${token}` } })
  .then(r => r.json())
  .then(d => console.log(d));
```

Expected: response includes a category whose `id` is exactly
`11111111-...-555555555555`. Run the same call twice → second call
returns 409.

## 7. Scope NOT being asked

- No schema changes (`Id` columns already exist and accept UUIDs)
- No new endpoints
- No auth changes
- No changes to the response shape — frontend already reads `id` from
  the response, so anything that round-trips with the same id is fine
- Bulk endpoints (`AddCategories`, `AddSubCategories`) can support
  the same field per-element; otherwise the frontend will fall back
  to per-entity calls for restores

## 8. Frontend code references

- Backup builder: `src/components/restaurant/products/backupProducts.jsx`
- Restore applier: `src/components/restaurant/products/restoreProducts.jsx`
- Related m2m brief: `PRODUCT_M2M_BACKEND_BRIEF.md`
- Related CORS brief: `IMAGES_CORS_BACKEND_BRIEF.md`
