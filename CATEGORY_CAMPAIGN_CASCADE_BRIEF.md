# Category-level Kampanya cascade — backend brief

Follow-up ask after the m2m product/category migration shipped
(see `PRODUCT_M2M_BACKEND_BRIEF.md` for that closed-out scope).
This one is small and self-contained: one endpoint, no schema
changes, no new tables.

## What the admin sees today

In Edit Category, there's a "Kampanya" toggle. Flipping it on
used to (pre-m2m) make every product in the category render with
campaign price columns visible — because the visibility logic
inherited from `category.campaign` at render time.

The m2m migration moved that flag onto the product
(`product.isCampaign`) so individual products can be opted in or
out independently. That part shipped and works.

What got lost in the move: the convenience of "flip the category
switch, watch the whole menu section follow." Restaurant owners
who want all of KEBAPLAR to be on a campaign now have to open
every product in the category and toggle its own switch.

## What the admin needs

When the `campaign` flag on a category transitions:

- `false → true`: every product whose memberships include this
  category should have its `isCampaign` set to `true`.
- `true → false`: same products should have `isCampaign` set
  back to `false`.

Multi-category products (e.g. Adana Dürüm sits in both KEBAPLAR
and DÜRÜMLER) follow last-write-wins. Toggling KEBAPLAR off after
DÜRÜMLER was already on means Adana flips `isCampaign: false`.
The admin can refine any one product via Edit Product if they
need a different shape — the cascade is a one-time "stamp," not
a live inheritance, so there's no ongoing constraint to enforce.

## Why frontend can't do this cleanly on its own

Two reasons we're punting to backend rather than iterating
client-side:

1. **N round-trips per save.** A category with 30 products would
   fire 30 `EditProduct` PUTs. Slow, visible, partial-failure
   surface.
2. **`EditProduct` is full-DTO-replace.** Sending it with an
   incomplete portion list silently wipes the product's prices —
   this is the exact failure mode the `uncategorizedSafety`
   post-mortem turned up. To do the cascade safely the frontend
   would have to first fetch every product's full DTO via
   `Products/getProductsByCategoryId`, then round-trip each one
   with only the `isCampaign` field changed. N+1 calls and a lot
   of brittle code for what should be one mutation.

An atomic endpoint avoids both problems.

## Proposed shape

Two options. Either works; **Option B is preferred** because the
admin already saves the category through the existing
`EditCategory` flow — no separate call needed.

### Option A — dedicated endpoint, frontend chains after `EditCategory`

```text
PUT /api/Categories/{categoryId}/PropagateCampaign
Body: { "isCampaign": true | false }

200 OK
Body: { "affectedProductCount": int }
```

Behavior: sets `isCampaign` on every product whose memberships
list contains `categoryId` to the supplied value. Idempotent.

### Option B — server-side cascade inside `EditCategory` (preferred)

When `EditCategory` (or `EditCategories` bulk) processes a
category whose `campaign` value differs from the persisted row,
automatically update `isCampaign` on every product in that
category as part of the same transaction.

- Frontend just saves the category as normal.
- Cache invalidation already wired on the frontend
  (`getProductsSlice` / `getProductsLiteSlice` invalidate on
  `Categories/EditCategory`, so the products list refetches
  fresh after the save).
- Response shape unchanged.

If the campaign flag didn't move, do nothing. The cascade only
fires on transitions.

## Frontend wiring after this lands

Nothing new to write — Edit Category already dispatches
`EditCategory` and invalidates the products cache on success. Once
backend cascades server-side, the next render of any product list
just shows the updated `isCampaign` values.

If Option A is what backend picks, frontend will add:
- A new thunk `Categories/PropagateCampaign` mirroring the
  existing one-line slices (`addProductToCategorySlice.js`
  pattern).
- A call to it in `editCategory.jsx` right after a successful
  `EditCategory` when `category.campaign` changed.

Either way the diff is small. Backend just needs to pick a side
and ship.

## Reference

- Per-product `isCampaign` field origin: `PRODUCT_M2M_BACKEND_BRIEF.md` §2.1
- Why frontend cascade is risky: same brief's
  uncategorizedSafety post-mortem (see commit `7158c57` for the
  bug it caused).
- Frontend code path that would call this:
  `src/components/restaurant/category/editCategory.jsx`

---

## Addendum — list projection still missing (2026-05-19)

Cascade behaviour appears to be in place: toggling a category's
Kampanya on stamps every product in it with `isCampaign: true`,
and the price-list view reflects that correctly downstream. So the
hard part landed. Thank you.

What got missed in the original ask: the `campaign` field is
**not projected on `Categories/GetCategoriesByRestaurantId`**, so
the admin UI can't read back what it just saved. The actual fields
returned per category today are:

```text
id, sambaId, restaurantId, name, isActive, featured, menuIds,
productsCount, activeProductsCount, createdDateTime,
lastUpdateDateTime, imageFileName, imageContentType, imageHash,
hasImage, imageUrl, imageAbsoluteUrl, sortOrder
```

No `campaign`. The frontend writes it on save (it's in the
`EditCategory` payload) and the server stores it (the cascade
fires correctly, proving it lands), but reading the category list
back gives `undefined`.

### Observable symptoms on the admin side

1. **Categories list page** — the Kampanya badge on a category
   card (`categories.jsx`) reads `cat.campaign`; with the field
   missing it never renders, so a category whose campaign you
   just turned on looks indistinguishable from one that's off.
2. **Edit Category dialog** — the Kampanya toggle starts OFF
   every time the dialog opens, regardless of saved state, because
   `category.campaign` from the list passes through as `undefined`
   to the dialog as the initial value.
3. **Price List page** — currently dodges the issue via a heuristic
   ("all products in this category have `isCampaign: true` ⇒
   category is campaign-on"), but that's a workaround that
   misclassifies categories with new uncascaded products or with
   m2m drift-ins. The category-level flag would be the
   correct source of truth.

### Ask

Add `campaign` (boolean, default false) to the per-category DTO
returned by:

- `GET /api/Categories/GetCategoriesByRestaurantId`

(plus any other read endpoint that returns the category — e.g.
single-fetch variants if those exist — for symmetry).

No schema change implied; the column is already there, this is
purely a projection / DTO mapping addition.

### Why this didn't make the original brief

The brief focused on the cascade behaviour ("flip the category
switch, watch the menu section follow") and explicitly noted
"Response shape unchanged" — but that referred to the `EditCategory`
endpoint's response, not the list endpoint. Read-back of the saved
flag wasn't called out as a separate requirement because at the
time of writing it was assumed implicit. It isn't. Sorry for the
miss.

### Frontend follow-up once this lands

`categories.jsx` and `editCategory.jsx` already read `cat.campaign`
defensively; once the field arrives the badge and the toggle just
start working. `priceList.jsx`'s `categoryCampaignMap` falls back
to the field when present and only uses the products-derived
heuristic when it's absent — so when backend projects it, the
heuristic becomes inert and behaviour is correct without a code
change.

---

## Addendum 2 — bidirectional menu↔category m2m sync (2026-05-19)

Separate issue surfaced while testing the cascade work. The menu↔
category relationship is stored on **both sides** of the m2m:

- `category.menuIds[]` — which menus this category appears in
- `menu.categoryIds[]` — which categories appear in this menu

Observed today: these two halves drift apart. Concrete example
from the same test restaurant:

- All 13 categories returned `menuIds: ["8548bd69-5870-4828-bc6b-9ae8500e01ff"]`
- The only existing menu had `id: "767c0d46-cb58-413e-8a91-e848acada5f8"`
  and its `categoryIds` correctly listed all 13 category ids

So `category.menuIds` referenced a menu UUID that didn't exist
anymore, while `menu.categoryIds` was correct. The category-side
field looks like it carries a stale pointer from a previous menu
delete-and-recreate that didn't cascade.

The mirror failure also exists in the write direction: if an admin
toggles a menu in the EditCategory dialog and saves, the category's
`menuIds` updates, but the corresponding menu's `categoryIds` is
not back-filled — so opening that menu in EditMenu shows the
relationship missing.

### Symptoms on the admin side

1. **EditCategory popup** — the "Menüler" checkboxes are unchecked
   even for menus the category is actually a member of.
2. **EditMenu popup** — adding a category via EditCategory doesn't
   show up in the menu's category picker until you also add it
   from this side.
3. **Customer-facing app** — currently appears to render off
   `menu.categoryIds`, so it'd surface the category in the menu
   when the menu side is correct (i.e. the EditCategory case
   above heals correctly through the customer view) but NOT when
   only the category side was updated (the EditMenu case is
   silently broken for end customers).

### Frontend mitigation considered and rejected

We tried a reconcile in both `editCategory.jsx` and `editMenu.jsx`
that took the **union** of (this side's list) and (the OTHER side's
implicit claim, computed from the other entity's list). Idea was
to mask the missing sync by showing whichever side currently held
the relationship.

It half-worked: the ADD case (one side has it, other doesn't yet)
read correctly. But the symmetric REMOVE case was strictly worse
than no workaround at all:

1. User unchecks "Sabah Menü" inside EditCategory for BALIKLAR,
   saves. `category.menuIds` correctly drops Sabah; `menu.categoryIds`
   stays stale (still listing BALIKLAR).
2. User opens EditMenu on Sabah Menü to verify. Reconcile unions
   (categories with this menu in menuIds = no BALIKLAR) ∪ (menu's
   own categoryIds = still has BALIKLAR) → BALIKLAR reappears
   checked. User's explicit removal looks ignored.

Frontend can't tell ADD-not-synced from REMOVE-not-synced from
data alone — both look like "one side says yes, the other says no."
The reconcile was reverted on 2026-05-19. Both edit dialogs now
read the raw field returned by their respective list endpoint.
The fix has to live in backend.

### Ask

When `EditCategory` saves, also update `menu.categoryIds` for every
menu whose membership changed (added or removed). Symmetrically,
when `EditMenu` saves, update `category.menuIds` for every category
whose membership changed. Single transaction on each side.

If a single canonical source is preferred over dual storage, that
also works — just have one read endpoint (whichever you keep as
authoritative) populate the other side at projection time. Either
approach removes the need for the frontend workaround.

Reference: `src/components/restaurant/category/editCategory.jsx`
and `src/components/restaurant/menus/editMenu.jsx` both carry a
`reconciled = union(other-side-says, own-still-existing-entries)`
block — search for "m2m self-heal".
