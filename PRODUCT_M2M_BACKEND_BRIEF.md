# Product ↔ Category many-to-many — backend brief

This is the frontend's view of the migration. It describes what the
admin app (`feat/ui-revamp` branch) sends and reads after Phases 1–4
landed, what compatibility shims are still in place, and which pieces
of behaviour the backend needs to land for the shims to be removable.

## 1. Status

| Phase | Scope                                                       | Status |
| ----- | ----------------------------------------------------------- | ------ |
| 1     | Defensive product-shape normalizer                          | done   |
| 2     | Junction endpoints wired into "Ürünleri Yönet" modal        | done   |
| 3     | Multi-select picker + isCampaign toggle on Add/Edit Product | done   |
| 4     | Remaining readers pivoted to iterate `categories[]`         | done   |

Branch: `feat/ui-revamp` (Vercel preview). Main is unblocked once the
backend cutover is verified on staging.

## 2. Endpoint contracts the frontend is calling

All paths are under `Products/…` and `Categories/…` exactly as the
spec laid them out — keys are the `createAsyncThunk` type prefixes
the slices register, so cross-slice cache invalidation matchers
depend on them being stable.

### 2.1 Product mutations

- `POST Products/AddProduct` — multipart
- `PUT  Products/EditProduct` — multipart
- `DELETE Products/DeleteProduct/{id}`

**Payload (Add + Edit, multipart fields):**

```text
id                  — string (Edit only)
restaurantId        — string
name                — string
description         — string
recommendation      — bool
hide                — bool
freeTagging         — bool
isCampaign          — bool      ← NEW: per-product, replaces category.campaign inheritance
image               — file (optional, omit to keep, "" + imageURL="" + removeImage="true" to clear)
portions            — JSON string: [{ id, productId, name, price, campaignPrice, specialPrice }, …]
categories          — JSON string: [{ categoryId, subCategoryId? }, …]      ← NEW
categoryId          — string    ← BACKWARDS-COMPAT (see §3)
subCategoryId       — string    ← BACKWARDS-COMPAT (see §3)
```

The categories array is the source of truth. An empty array MUST be
rejected (the form-level guard catches it client-side, but the backend
is the last line of defence).

### 2.2 Junction endpoints (new)

These let the "Ürünleri Yönet" modal mutate a product's category
memberships without round-tripping every other product field.

- `POST   Products/{productId}/Categories` — body `{ categoryId, subCategoryId? }`
  - Thunk type: `Products/AddProductToCategory`
- `DELETE Products/{productId}/Categories/{categoryId}`
  - Thunk type: `Products/RemoveProductFromCategory`
  - MUST reject if it would leave the product with zero memberships (orphan guard)
- `PUT    Categories/{categoryId}/ProductOrder` — body `{ productIds: [string, …] }`
  - Thunk type: `Categories/UpdateProductOrder`
  - Reorders the per-junction `sortOrder` for every product in the
    given category; replaces the prior N-edits flow that rewrote
    every product's flat `sortOrder` one by one.

### 2.3 "Move product to another category" semantic

The modal implements this as POST-then-DELETE so the orphan guard
never trips:

1. `POST Products/{productId}/Categories` with the target category
2. `DELETE Products/{productId}/Categories/{currentCategoryId}`

Please don't introduce a single-endpoint atomic move — the
two-call flow is intentional and matches what the spec called out.

### 2.4 Category delete

`DELETE Categories/{categoryId}` MUST reject if any product would be
orphaned (i.e. has only this category as a membership). The frontend
surfaces the rejection through the standard `message_TR` toast; the
admin then opens "Ürünleri Yönet" to re-home those products first.

## 3. Backwards-compatibility shims still in the payload

The frontend currently sends BOTH the new `categories` JSON array
AND the legacy flat `categoryId` / `subCategoryId` fields (filled in
from the FIRST picked category) on every product write. This bridge
lives in:

- `src/components/restaurant/products/addProduct.jsx#handleSave`
- `src/components/restaurant/products/editProduct.jsx#handleSave`
- `src/components/restaurant/products/quickEditImage.jsx#handleSave`
- `src/components/restaurant/subCategory/subCategoryProducts.jsx#buildEditPayload`
- `src/utils/uncategorizedSafety.js#reassignOrphan`

Why it exists: during testing we hit a backend build that hadn't
deployed the m2m schema yet. With only the new `categories` field
the controller's `[FromForm] string categoryId` bound to `null`, the
service tried to look up the null id, and the request failed with
`"Kategori bulunamadı."` (surfaced via `message_TR` → the api
interceptor's toast). Sending the flat fields alongside keeps the
form functional on old builds; the new backend can ignore them and
prefer the array.

**Removal criterion:** when every environment (dev / staging / prod)
is on the m2m schema AND the team is confident no rollback is
needed, the shim can come out. The flat fields can be dropped in a
single commit — search for `Backwards-compat` in those files. Once
removed, multi-category products will save correctly under their
full membership set; while the shim is in place an OLD backend can
only see the first picked category.

## 4. Read-side response contract

Every endpoint that returns a product DTO should return:

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "imageURL": "string|null",
  "hide": false,
  "recommendation": false,
  "freeTagging": true,
  "isCampaign": false,
  "portions": [
    { "id": "uuid", "name": "Normal", "price": 0, "campaignPrice": 0, "specialPrice": 0 }
  ],
  "categories": [
    {
      "categoryId": "uuid",
      "categoryName": "string",
      "categoryImage": "string|null",
      "categorySortOrder": 0,
      "subCategoryId": "uuid|null",
      "subCategoryName": "string|null",
      "subCategoryImage": "string|null",
      "subCategorySortOrder": 0,
      "sortOrder": 0
    }
  ],
  "allergens": [ { "code": "string", "presence": "Contains|MayContain" } ]
}
```

`sortOrder` is per-junction now — there is no longer a single
"global" `sortOrder` on the product itself. The normalizer at
`src/utils/normalizeProduct.js` synthesizes a flat alias
(`product.sortOrder` = `categories[0].sortOrder`) for readers that
haven't been pivoted yet; once Phase 4 is verified end-to-end the
alias can come out.

Endpoints we read product DTOs from (each should return the new
shape consistently):

- `Products/getProductsByRestaurantId` — paginated full DTOs
- `Products/GetProductsByRestaurantIdLite` — dropdown DTOs
  (only needs `{ id, name, categories[].categoryId, portions: [{id, name}] }`
  today; consumers iterate `categories[]` for the category id)
- `Products/getProductsByCategoryId` — used by Sub Category Products
  modal; the modal reads the parent membership's `subCategoryId` per
  product
- Search / filter endpoints (if any) — same shape

## 5. Cache invalidation the frontend already wired

The list slices auto-bust their caches when any of these
`createAsyncThunk` types resolve, so the backend doesn't need to
emit explicit cache hints — just keep the thunk-type strings
stable:

`getProductsSlice` and `getProductsLiteSlice` invalidate on:
- `Products/AddProduct`, `Products/EditProduct`, `Products/DeleteProduct`
- `Products/UpdateProductAllergens`
- `Products/AddProductToCategory`, `Products/RemoveProductFromCategory`
- `Categories/UpdateProductOrder`
- `Categories/AddCategory`, `Categories/AddCategories`, `Categories/EditCategory`, `Categories/EditCategories`, `Categories/DeleteCategory`
- `SubCategories/AddSubCategory`, `SubCategories/AddSubCategories`, `SubCategories/EditSubCategory`, `SubCategories/EditSubCategories`, `SubCategories/DeleteSubCategory`, `SubCategories/UpdateSubCategoriesOrder`

`getCategoriesSlice` invalidates on:
- `Categories/*` mutations
- `Products/AddProduct`, `Products/DeleteProduct` (denormalized
  `productsCount` on each category row)

## 6. Things that could trip the backend rollout

These are the spots most likely to surface a regression — flagging
them so QA scripts can target them deliberately.

1. **isCampaign default** — for products created BEFORE the schema
   migration, `isCampaign` should default to whatever the parent
   category's `campaign` flag was (so existing data doesn't lose its
   campaign visibility). New products read `isCampaign` straight off
   the product row.

2. **Per-junction `sortOrder`** — the bulk reorder PUT on
   `Categories/{categoryId}/ProductOrder` writes one sortOrder per
   junction row. The reorder MUST NOT also touch any other category's
   memberships of the same product, otherwise drag-reordering one
   category silently shifts unrelated category pages.

3. **Orphan guards on the two delete paths** — `DELETE Products/
   {productId}/Categories/{categoryId}` AND `DELETE Categories/
   {categoryId}` must both refuse to leave any product with zero
   memberships. The admin app surfaces the rejection through the
   standard `message_TR` toast.

4. **`categories` field name** — the form sends the field as
   lowercase `categories` (matches the JSON property name in the
   sample request). If the backend's binder is case-sensitive and
   wants `Categories`, the form fails silently (the empty
   `[FromForm] string categories` binds to null, frontend's
   client-side guard already ran, backend then sees an "empty"
   array). Worth confirming.

5. **Multipart vs JSON for the `categories` array** — because
   multipart can't nest, the field arrives as a JSON-stringified
   string and needs to be parsed inside the controller. The shape
   is `[{ "categoryId": "uuid", "subCategoryId": "uuid|absent" }]`
   — `subCategoryId` is omitted (not set to null/empty) when the
   user didn't pick a subcategory, to keep the payload minimal.

6. **`getProductsByCategoryId` shape under m2m** — the Sub Category
   Products modal expects each product DTO to carry its FULL
   `categories[]` array (not just the parent membership), because
   the save needs to round-trip every other membership untouched.
   Returning only the parent's membership would silently strip the
   product from every other category on save.

## 7. Frontend reference

Code paths most worth grepping if a question comes up:

- Normalizer (defensive dual-shape): `src/utils/normalizeProduct.js`
- New picker widget: `src/components/restaurant/products/categoriesPicker.jsx`
- Add/Edit Product forms (handleSave): `src/components/restaurant/products/{addProduct,editProduct,quickEditImage}.jsx`
- Junction endpoints (slices): `src/redux/products/{addProductToCategory,removeProductFromCategory}Slice.js`,
  `src/redux/categories/reorderCategoryProductsSlice.js`
- Manage Products in a category: `src/components/restaurant/category/categoryProducts.jsx`
- Sub Category Products picker: `src/components/restaurant/subCategory/subCategoryProducts.jsx`
- Orphan safety net: `src/utils/uncategorizedSafety.js`
