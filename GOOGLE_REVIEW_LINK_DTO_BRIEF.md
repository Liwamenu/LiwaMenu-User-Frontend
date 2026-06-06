# `googleReviewLink` — persist + return on restaurant DTO

Sibling of the existing `googleAnalytics` field. **Genel Ayarlar > Genel**
now has a new input right next to Google Analytics: **"Google Yorum
Bağlantısı"**. The restaurant owner pastes their Google Business "write a
review" link (the one from Business Profile → *Ask for reviews / Yorum
iste*), e.g.:

- `https://g.page/r/XXXXXXXXXXXX/review`, or
- `https://search.google.com/local/writereview?placeid=PLACE_ID`

The customer theme will read this value and show a **"Değerlendir / Write a
review"** button that opens the link — so guests land directly on Google's
write-a-review screen.

The value is saved through the existing `SetRestaurantSettings` flow (the
admin already sends the whole settings object, so `googleReviewLink` is in
the payload). But — exactly like `googleAnalytics` — it must be **stored and
returned** by the GETs, otherwise on reload the field falls back to empty
and a saved value doesn't stick (and the theme can't read it).

## The ask (small, additive — identical shape to `googleAnalytics`)

A nullable `string googleReviewLink` on the restaurant entity:

1. **Accept + persist it** on `PUT Restaurants/SetRestaurantSettings`.
2. **Return it** in the restaurant projection of:
   - `Restaurants/GetmyRestaurants` (the settings form reads from this), and
   - `Restaurants/GetRestaurantById`.
3. Emit it camelCase (`googleReviewLink`) like the rest of the payload
   (`googleAnalytics`, `showWaiterCallButton`, …). Default `null` / empty
   for existing rows.

4. **Also accept it on `PUT Restaurants/SetSocialLinks`** and persist to the
   **same** `restaurant.googleReviewLink` column. The admin surfaces this one
   value in BOTH the "Genel" and "Sosyal Medya" tabs — saving in either tab
   must update the same field so they stay in sync. (Returning it from
   `GET Restaurants/GetSocialLinks` is optional — the Sosyal Medya tab reads
   the value from the restaurant entity, not from GetSocialLinks.)

No schema change beyond the additive (nullable) column; no contract break —
one extra string on two settings writes (SetRestaurantSettings +
SetSocialLinks) + the two restaurant read responses. Treat it as a plain
opaque string (don't validate/transform the URL server-side).

## Frontend code references
- Input + initialData: `src/components/restaurant/restaurantSettings.jsx`
  (`googleReviewLink: inData?.googleReviewLink`, the "Google Yorum
  Bağlantısı" field next to Google Analytics)
- Save thunk: `src/redux/restaurant/setRestaurantSettingsSlice.js`
  (`Restaurants/SetRestaurantSettings` — sends the whole `restaurantData`)
- Read source for the form: `src/redux/restaurants/getRestaurantsSlice.js`
  (`Restaurants/GetmyRestaurants`)

## Backend Claude prompt (copy verbatim)

```
Add an additive nullable string field `googleReviewLink` to the restaurant
entity, mirroring the existing `googleAnalytics` exactly:

1. Accept + persist it on PUT /api/Restaurants/SetRestaurantSettings (the
   admin already sends it in the settings payload).
2. ALSO accept + persist it on PUT /api/Restaurants/SetSocialLinks, writing
   to the SAME restaurant.googleReviewLink column (the admin sends the same
   field from the Social Media tab; both tabs must stay in sync).
3. Return it in the restaurant projection of GET
   /api/Restaurants/GetmyRestaurants AND GET /api/Restaurants/GetRestaurantById,
   camelCase (`googleReviewLink`), same as googleAnalytics.
4. Nullable; no default needed. Store as an opaque string (no URL validation).

Additive only — no schema change beyond the column, no contract break.
Verify: set it via SetRestaurantSettings, GET both endpoints and confirm the
value; then set a different value via SetSocialLinks and confirm the same
GETs reflect it (proving both writes hit one column).
```
