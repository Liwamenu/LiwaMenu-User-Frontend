# Menu ↔ Category m2m sync — write-mirror not persisting

> **STATUS: RESOLVED via backend PR #162 (deployed 2026-05-25).**
>
> Root cause was §3 Hypothesis 1 — the m2m is dual-stored
> (`Category.MenuIds` uuid[] column + `CategoryMenu` junction table),
> and each Edit endpoint only wrote to its OWN side. PR #162 makes
> both `EditCategory` and `EditMenu` dual-write inside a single
> SaveChanges transaction. Acceptance test from §2 now passes.
>
> Frontend cleanup landed in the same series: `syncCategoryMenuIds`
> and `syncMenuCategoryIds` helpers, the `originalMenuIds` snapshot,
> the `editMenu.syncing` translation key, and the Save-button sync
> UX are all gone. A single `EditCategory` or `EditMenu` call is now
> sufficient.
>
> Historical drift caveat: any restaurant currently in a desynced
> state heals on the next save touching that side (PR #162 dual-
> writes from then on). Backend offered a one-shot reconciliation
> script if needed — not requested.
>
> The rest of this file is preserved as the original investigation
> trail.
>
> ---

Follow-up to the bidirectional m2m sync discussion captured in
`CATEGORY_CAMPAIGN_CASCADE_BRIEF.md` Addendum 2. The previous round
closed with: **"the data is already being sent — call both
endpoints."** Frontend implemented exactly that pattern; the failure
mode persists. This brief documents the new evidence and asks for a
targeted backend fix.

## 1. What frontend now does (post Addendum 2)

After every successful `EditMenu`, frontend computes the diff of
added/removed `categoryIds` and fires `EditCategory` per affected
category with that category's existing payload + the freshly mutated
`menuIds` array. Symmetrically, after every `EditCategory`, frontend
fires `EditMenu` per affected menu with `categoryIds` updated. Code
references:

- `src/components/restaurant/menus/editMenu.jsx` — `syncCategoryMenuIds`
- `src/components/restaurant/category/editCategory.jsx` — `syncMenuCategoryIds`

Both helpers run after the primary save returns 200, and both
explicitly include the cross-side m2m field in the payload. All
calls return 200 — no validation rejection visible.

## 2. Reproducible test (Liwa Cafe & Bistro, restaurant id `f9f7344a-bcf8-47fb-9aaf-4736341c4fa8`)

**Scenario A — EditMenu's change doesn't reach `category.menuIds`:**

1. Open EditMenu on "Qr Menu" (menu `Z`). Current `categoryIds = [c1, c2]`.
2. Pick category `c3` in the dialog. Save.
3. Frontend fires:
   - `PUT /api/Menus/EditMenu { menuId: Z, categoryIds: [c1, c2, c3], plans, name, priceListType }` → **200**
   - `PUT /api/Categories/EditCategory` with the full DTO for `c3`,
     including `menuIds: [...c3OldMenuIds, Z]` → **200**
4. `GET /api/Categories/GetCategoriesByRestaurantId` → **`c3.menuIds` does NOT contain `Z`**.

**Scenario B — EditCategory's change doesn't reach `menu.categoryIds`:**

1. Open EditCategory on `c1`. The "Menüler" picker currently shows
   only `Z` checked. Tick `M2` as well. Save.
2. Frontend fires:
   - `PUT /api/Categories/EditCategory` with `menuIds: [Z, M2]` → **200**
   - `PUT /api/Menus/EditMenu` on `M2` with `categoryIds: [...m2OldCategoryIds, c1]` → **200**
3. `GET /api/Menus/GetMenusByRestaurantId` → **`M2.categoryIds` does NOT contain `c1`**.

In both scenarios the OWN-side write lands correctly (the field the
endpoint is "primarily" about persists). It's only the cross-side
field — sent in the exact payload shape the existing dialogs use —
that vanishes between PUT-200 and the next GET.

## 3. What we suspect

One of these is the smallest defect that would explain the symptom:

1. **Field ignored on Edit\* endpoints.** `EditCategory`'s handler
   may treat `menuIds` as read-only (projected on GET, never written
   on PUT). Same for `EditMenu`'s `categoryIds` field — wait, that
   one demonstrably persists (Scenario A step 3 still shows `Z` has
   `[c1, c2, c3]`), so this asymmetry is the key clue. **It's only
   the cross-side field on each endpoint that's ignored.**
2. **Junction table only written from one side.** If a single
   `CategoryMenu` table backs both projections (`category.menuIds`
   left join, `menu.categoryIds` right join), and the EditCategory
   write path only updates rows when invoked through certain flows,
   the symmetric write disappears.
3. **Post-save normalisation step rewrites the m2m from one
   authoritative source** (e.g. EditMenu treats `menu.categoryIds`
   as truth and rebuilds the junction, overwriting any rows that
   EditCategory just inserted).

## 4. Asks

Pick the smallest of:

### Option A (preferred) — each endpoint persists its own cross-side field

Make `EditCategory.menuIds` and `EditMenu.categoryIds` symmetric
first-class write fields. No cascade needed — the frontend already
calls both endpoints per save and sends the updated array. Each
write just needs to land in the junction table such that the
opposite-side GET projects it correctly.

Acceptance test:

```
PUT  /api/Categories/EditCategory  body has menuIds: [Z]   → 200
GET  /api/Categories/GetCategoriesByRestaurantId  → c.menuIds includes Z
GET  /api/Menus/GetMenusByRestaurantId             → Z.categoryIds includes c
```

Today step 3 fails.

### Option B — server-side cascade on EditMenu/EditCategory

Originally proposed in `CATEGORY_CAMPAIGN_CASCADE_BRIEF.md`
Addendum 2 and declined. Re-listing only for completeness. If
revisiting: a single transaction per save updates both projections.
Frontend deletes the write-mirror in that case.

### Option C — new inverse read endpoint

Add `GET /api/Menus/GetMenusByCategoryId?categoryId=<guid>` as a
mirror of the just-shipped PR #157 `GetCategoriesByMenuId`.
Frontend then drops the raw `category.menuIds` / `menu.categoryIds`
reads and queries by side. **Still requires the write side to
actually persist into whatever junction backs both reads** — without
that, the new endpoint just returns the same stale view as today.
So Option C alone does NOT fix the symptom; Option A is the
prerequisite.

## 5. Hard data the backend can verify against

- All write requests in the repro use the same payload shape the
  EditCategory / EditMenu modals send for first-class saves —
  nothing custom or unusual.
- HTTP-level responses are 200 with no validation errors and no
  `message_TR` warnings.
- The frontend re-fetches via `GetCategoriesByRestaurantId` /
  `GetMenusByRestaurantId` after the writes settle, and the
  inverse-side field is empty on both sides.

## 6. Frontend code we'd remove once this lands

- `editMenu.jsx#syncCategoryMenuIds` — entire helper block + the
  `setSyncing(true/false)` UX
- `editCategory.jsx#syncMenuCategoryIds` — entire helper block
- The new `Categories/EditCategory` follow-up call after `EditMenu`
  and the `Menus/EditMenu` follow-up call after `EditCategory`
- Translation key `editMenu.syncing`
- The `originalMenuIds` snapshot in EditCategory used to compute the
  diff

All purely client-side; no backend coordination required for the
cleanup once the round-trip test passes.

## 7. Suggested investigation prompt for backend's Claude

A self-contained Claude prompt is at the bottom of this brief —
section 8 — that the backend team can paste directly without
needing this brief loaded as context.

---

## 8. Backend Claude prompt (copy verbatim)

```
Investigate and fix: PUT /api/Categories/EditCategory accepts a
`menuIds` array in its categoriesData payload but does not persist
the result such that subsequent reads of either side of the m2m
relationship reflect the change. The same symptom exists in the
mirror direction: PUT /api/Menus/EditMenu's categoryIds field
persists for menu.categoryIds reads but the corresponding
category.menuIds doesn't see it.

Reproducible test sequence:

  Setup: pick any restaurant with at least 2 menus (M1, M2) and at
  least 1 category (C1). Note their guids.

  Step 1: PUT /api/Categories/EditCategory
    Multipart body:
      RestaurantId: <restaurantId>
      categoriesData: [{
        id: C1,
        restaurantId: <restaurantId>,
        name: <C1's current name>,
        isActive: true,
        featured: false,
        campaign: false,
        menuIds: [M1, M2]
      }]
    Expect 200 OK.

  Step 2: GET /api/Categories/GetCategoriesByRestaurantId
    Expect C1.menuIds to contain both M1 and M2.
    (Today's behaviour: usually passes.)

  Step 3: GET /api/Menus/GetMenusByRestaurantId
    Expect M1.categoryIds AND M2.categoryIds to both contain C1.
    (Today's behaviour: at least one of them is missing C1.)

  Step 4 (mirror direction): PUT /api/Menus/EditMenu
    JSON body:
      { menuId: M1, restaurantId: <restaurantId>, name, plans,
        categoryIds: [<M1's existing categories minus C1>],
        priceListType: "normal" }
    Expect 200 OK.

  Step 5: GET /api/Categories/GetCategoriesByRestaurantId
    Expect C1.menuIds NOT to contain M1 anymore.
    (Today's behaviour: still contains M1 — the EditMenu side did
    not update the junction in the opposite direction.)

Tasks for you:

1. Reproduce the test sequence above in the dev/staging environment.
   If it passes, the bug is elsewhere — flag it and stop.

2. Trace the EditCategory request handler. Identify exactly where
   menuIds is bound from the multipart payload and what it does
   with that array. If the field is ignored (or only used for
   validation), that's defect #1. Fix: write/diff the
   CategoryMenu junction (or equivalent) for this category, adding
   rows for ids that appeared and removing rows for ids that
   disappeared.

3. Trace the EditMenu request handler. Verify the categoryIds write
   path INSERTs/DELETEs into the same junction table that
   EditCategory's menuIds writes target (vs. a separate table that
   only this endpoint touches). If they touch different tables /
   columns, that's defect #2. Fix: collapse to a single junction.

4. After fixing, run the test sequence again. All five steps must
   pass.

Constraints:
- No schema migration desired (junction table already exists for
  the GET projections to work).
- No new endpoints required; both EditCategory and EditMenu are
  the right write paths.
- Restaurant scope must continue to be enforced (don't let a
  category in restaurant A get menuIds from restaurant B).
- The frontend already calls EditMenu and EditCategory in sequence
  for each cross-side change, so no cascade-on-save is needed —
  just make each endpoint persist its own cross-side field
  reliably.

Affected frontend code that will be removed once this lands:
- src/components/restaurant/menus/editMenu.jsx (syncCategoryMenuIds)
- src/components/restaurant/category/editCategory.jsx (syncMenuCategoryIds)

The frontend doesn't need any change for the fix itself — just keep
the response shape stable.
```
