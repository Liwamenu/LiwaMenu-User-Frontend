# Backend Performance Request — Admin Panel List Pages

**From:** Frontend team
**Re:** Slow load times on Categories, Products, Sub Categories, Menus, and Order Tags pages
**Status:** Frontend caching/refactor work is in progress; the items below need backend changes that the frontend cannot work around.

---

## 1. Background

The admin panel's five highest-traffic list pages all feel sluggish on first load. We've already audited the frontend and most of the wins are achievable client-side (slice caching, request deduplication, popup-based edit so list components don't unmount). Two specific issues, however, can only be fixed on the backend — they are detailed below in priority order.

For reference, our shared frontend pattern for these pages is a stale-while-revalidate cache keyed by `restaurantId`, plus a global loading middleware that toggles a full-screen spinner whenever **any** Redux thunk is in flight. That means even one slow endpoint blocks the whole UI, which amplifies the perceived slowness of any single request.

---

## 2. Priority 1 — Lift the silent `pageSize` cap on `Products/getProductsByRestaurantId`

### What's happening today

The endpoint silently caps `pageSize` at **100** regardless of the value the client sends. We discovered this only after responses kept coming back with 100 items even when we asked for 1000.

### Why it matters

The Order Tags page needs the full product list (every product across every category) so the relation-row dropdown can filter products by selected category. Today we work around the cap by issuing **N parallel paged requests** (`Promise.all` over pages 1..ceil(total/100)). For a restaurant with 500 products this is **5 round-trips** per page visit; for 2 000 products it's **20**.

Code reference: `src/components/restaurant/orderTags/orderTags.jsx#fetchAllProducts` (lines ~157–198) — the comment explicitly documents this workaround.

### Requested change

Raise the maximum allowed `pageSize` to at least **2000** (or remove the implicit cap and document the real maximum).

If a hard cap is required for memory/safety reasons, please:
- Document the actual maximum in the API.
- Return an `X-Max-Page-Size` response header so clients can adapt without the trial-and-error we did.

### Expected impact

- Order Tags page: 5–20 HTTP requests collapse into **1**.
- ~2–3 s saved on first visit for medium-sized menus.
- Removes a piece of frontend complexity (the fan-out paginator) once we trust the cap.

### Effort estimate

Smallest change in this document — should be a controller validator tweak (e.g. `pageSize.Clamp(1, 2000)`). No DTO change.

---

## 3. Priority 2 — Add `Products/GetProductsByRestaurantIdLite`

### What's happening today

`Products/getProductsByRestaurantId` returns the full product DTO: image URLs, descriptions, all portion details, attribute groups, order-tag relations, special prices, etc. This is the right shape for the Products edit page, but it's **8–10× larger than necessary** for the Order Tags relation dropdowns.

### Why it matters

Order Tags only renders three select inputs from this data: category dropdown, product dropdown, portion dropdown. So per product we only need:

```json
{
  "id": "guid",
  "name": "string",
  "categoryId": "guid",
  "portions": [
    { "id": "guid", "name": "string" }
  ]
}
```

Everything else (`imageURL`, `description`, prices, `orderTags`, attributes, etc.) is downloaded, parsed, and immediately discarded.

### Requested endpoint

```
GET  Products/GetProductsByRestaurantIdLite?restaurantId={guid}
```

**Response shape:**

```json
{
  "data": [
    {
      "id": "guid",
      "name": "string",
      "categoryId": "guid",
      "portions": [
        { "id": "guid", "name": "string" }
      ]
    }
    // … one entry per product, no pagination
  ],
  "totalCount": 532
}
```

Notes:
- No pagination needed if the endpoint returns the lite shape — the payload should be small enough to deliver in one response even for restaurants with thousands of products.
- `categoryId` is required (it's what powers the dropdown filtering).
- Hidden / soft-deleted products: please **include** them, with the same `hide` field as the regular endpoint, so we can decide client-side whether to filter them.
- Sort order doesn't matter; the client sorts.

### Expected impact

- Payload reduction: **~80–90 %** (rough estimate based on field sizes).
- First-paint of Order Tags page: **~1–2 s faster** on medium menus, more on large ones.
- Combined with Priority 1, Order Tags first-load drops from "noticeably slow" to "near instant" once the data arrives.

### Effort estimate

A new read-only endpoint plus a slim DTO projection on the existing query. Should reuse the existing `Products` repository / EF queryable; just `.Select(p => new ProductLiteDto { … })` instead of the full mapping.

---

## 4. Optional — `Restaurants/GetRestaurantBundle` (only if profiling justifies it)

This is **not** a hard blocker for the perceived slowness — please consider it only after Priorities 1 and 2 are deployed and we re-measure.

### What it would do

Return, in a single response, the data the admin app currently fetches across multiple calls when a user enters a restaurant for the first time:

```json
{
  "restaurant": { … },          // existing GetRestaurant payload
  "categories":     [ … ],      // existing GetCategoriesByRestaurantId
  "subCategories":  [ … ],      // existing GetSubCategoriesByRestaurantId
  "menus":          [ … ],      // existing GetMenusByRestaurantId
  "orderTags":      [ … ],      // existing GetOrderTagsByRestaurantId
  "paymentMethods": [ … ]       // existing GetPaymentMethods
}
```

### Why we're flagging it as optional

Each of the underlying slices already has `fetchedFor` caching on the frontend, so the bundle only helps the **first** restaurant entry of a session. After Priorities 1 and 2, that first entry may already be fast enough. Treat this as a "phase 2" improvement and only build it if first-entry latency is still a complaint.

---

## 5. Out of scope (frontend will handle)

For completeness, here's what the frontend is fixing in parallel — please do **not** spend backend effort on these:

- Categories page erroneously invalidates the categories slice cache after every load → fixed in the same PR as this brief.
- Products slice has no cache key for paginated requests → adding a per-params cache key client-side.
- Order Tags uses a module-level `Map` for the lite-product cache → will switch to Redux once Priority 2 ships (the `Map` is fine for now and survives navigation).

---

## 6. Summary

| Priority | Change | Frontend file affected | Effort | Impact |
|---|---|---|---|---|
| 🔴 1 | Lift `pageSize` cap to ≥ 2000 on `getProductsByRestaurantId` | `orderTags.jsx`, future `productsLiteSlice.js` | ~10 min | 5–20 round-trips → 1 |
| 🟡 2 | Add `Products/GetProductsByRestaurantIdLite` | new `getProductsLiteSlice.js` | ~1 hour | 80–90 % payload reduction on Order Tags |
| 🔵 3 | (Optional) `Restaurants/GetRestaurantBundle` | new `getRestaurantBundleSlice.js` | ~half day | Faster *first* restaurant entry only |

Please confirm feasibility/timeline for Priorities 1 and 2 so we can plan the matching frontend changes.
