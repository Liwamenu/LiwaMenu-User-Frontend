# Static product images — CORS header brief

The admin panel needs to fetch product image bytes (not just render
them in `<img>` tags) in order to package them into a downloadable
ZIP for the new "Yedek Al / Yedeği Yükle" feature on the Products
page. The frontend can already pull and rebuild every other piece of
product data through existing API endpoints, but the image bytes
served from `/images/products/...` are blocked by the browser's CORS
policy because that path doesn't send `Access-Control-Allow-Origin`
headers.

This brief documents what's failing, why client-side workarounds
hit a dead end, and the two backend options to unblock it (with a
recommendation).

## 1. What the frontend feature is

`src/components/restaurant/products/backupProducts.jsx` builds a
ZIP archive containing:

- `manifest.json` — per-product `{ name, description, allergens }`
- `images/0001.jpg, 0002.png, …` — one file per product that has
  an `imageURL`

The user picks 3 toggles (Görsel / Açıklama / Alerjen) and gets a
single `liwa-urun-yedek-<restoran>-<tarih>.zip` they can hold onto
as a safety net. A sibling modal (`restoreProducts.jsx`) reads that
ZIP back later and replays the data through existing endpoints
(`PUT Products/EditProduct` and `PUT Products/{id}/Allergens`) —
no new write endpoints needed.

The "Açıklama" and "Alerjen" parts work in production today. The
"Görsel" part is what this brief is about.

## 2. The error

When the user clicks "Yedek Al" with the Görseller toggle on, the
browser console shows (one line per product with an image):

```text
GET https://liwamenu.pentegrasyon.net/images/products/<uuid>.jpg
    net::ERR_FAILED

backup: fetch image failed (CORS?)
    https://liwamenu.pentegrasyon.net/images/products/<uuid>.jpg
    Failed to fetch
```

The toast at the end of the export reads:

> "47 / 47 görsel indirilemedi (tarayıcı konsoluna bakın — büyük
> olasılıkla CORS)."

The same image URL renders just fine in an `<img>` tag elsewhere
in the app (e.g. the product card / quick image swap modal) —
that's because `<img>` loading is exempt from CORS for display, but
`fetch()` is not.

## 3. Why the frontend can't fix this alone

`fetchImageBlob` in `backupProducts.jsx` already tries three
fallback strategies in sequence:

1. `fetch(url, { mode: "cors" })` — fails with the error above
2. `<img crossorigin="anonymous">` + `<canvas>` → `toBlob()` —
   image won't load at all without the CORS header
3. `<img>` (no crossOrigin) + `<canvas>` → `toBlob()` — image
   loads, but the canvas is tainted and `toBlob()` throws
   `SecurityError: The operation is insecure` (browser blocks
   reading pixel data from cross-origin images without CORS)

All three depend on the server eventually sending CORS headers.
There is no purely client-side bypass for this — that's the
intended browser security model.

## 4. Frontend / image origins

| Environment | Frontend origin (where the app is loaded) | Image origin |
| --- | --- | --- |
| Local dev | `http://localhost:9006`                  | `https://liwamenu.pentegrasyon.net` |
| Production| `https://<admin>.liwamenu.com` (Vercel)   | `https://liwamenu.pentegrasyon.net` |

Both are cross-origin to the image host. Hosting the admin app on
the same domain as the backend would also solve this (same-origin →
no CORS needed), but that's a much bigger move than the two options
below.

## 5. Two options to unblock

### Option A — Static images CORS header (RECOMMENDED)

Add `Access-Control-Allow-Origin: *` to responses under
`/images/...`. Recommended because it's ~5 lines, no new endpoint,
no frontend change, and any future admin-panel feature that needs
to fetch images programmatically (auto-tagging, batch resize, AI
description generation, …) also benefits.

**ASP.NET Core** (`Program.cs`, where `UseStaticFiles` is registered):

```csharp
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/images"))
        {
            ctx.Context.Response.Headers["Access-Control-Allow-Origin"] = "*";
            // Keeps caching behaviour predictable across origins —
            // without "Vary: Origin" a cached response can leak the
            // wrong CORS header to a different origin.
            ctx.Context.Response.Headers["Vary"] = "Origin";
        }
    },
});
```

If the existing CORS policy registered via `app.UseCors(...)` already
exposes a wildcard or the admin origins, scoping it to `/images` via
endpoint routing also works — whichever fits the project conventions.

**IIS** (`web.config`, if hosting via IIS instead of Kestrel):

```xml
<location path="images">
  <system.webServer>
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Vary" value="Origin" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</location>
```

Notes:

- `*` is safe here because the images are already public (anyone
  with the URL can fetch them via `<img>`). No credentials are
  involved — the request is `credentials: "omit"` on our side.
- If a more restrictive origin list is preferred, allow at least
  `https://<the-admin-app>.vercel.app`, `https://<panel>.liwamenu.com`,
  `http://localhost:9006` (dev), and any other admin frontends.
- Once this header is in place, the frontend's existing fetch path
  (Strategy 1) succeeds immediately. No frontend deploy required.

### Option B — Image proxy endpoint

If exposing CORS on `/images/...` is undesirable, expose a new API
endpoint that streams the image bytes through the API layer (which
already has CORS configured for the admin origins).

```text
GET /api/Images/Proxy?path=products/<uuid>.jpg
  Response: image bytes with the original Content-Type
```

Auth: should require the standard `Bearer` token (the admin user
already has it; nothing extra in the frontend).

Frontend change in `backupProducts.jsx` would be ~3 lines — swap
the raw URL for the proxy URL before fetching.

Less preferred because:

- Every backup request doubles its bandwidth (backend reads its
  own files and re-streams them).
- New endpoint to maintain.
- No reuse for other future image-fetching features unless they
  also go through the proxy.

## 6. How to verify after deploy

In a browser DevTools console, with the admin frontend open:

```js
fetch("https://liwamenu.pentegrasyon.net/images/products/<uuid>.jpg")
  .then((r) => r.blob())
  .then((b) => console.log("OK", b.size))
  .catch((e) => console.error("FAIL", e));
```

Before the fix: `FAIL TypeError: Failed to fetch`.
After the fix: `OK 24513` (or whatever the file size is).

Or just open the Products page and click "Yedek Al" — the toast
should now read "247 ürün yedeği oluşturuldu." with NO follow-up
warning toast about failed images.

## 7. Frontend code references

If anything needs cross-checking against the frontend side:

- Export modal: `src/components/restaurant/products/backupProducts.jsx`
  - Three-strategy `fetchImageBlob` (top of file)
  - Image-job loop and ZIP assembly inside `handleExport`
- Import modal: `src/components/restaurant/products/restoreProducts.jsx`
  - Pulls image blobs back out of the ZIP via JSZip and stuffs
    them into `FormData` for `PUT Products/EditProduct`
- Existing display path (works without CORS because it's `<img>`):
  `src/components/restaurant/products/quickEditImage.jsx`

## 8. Scope check / non-asks

- No new write endpoints needed — restore uses the existing
  `EditProduct` (multipart, full DTO) and `UpdateProductAllergens`
  endpoints exactly as documented in
  `PRODUCT_M2M_BACKEND_BRIEF.md` §2.
- No schema changes.
- No auth changes — `<img>` already serves these publicly; adding
  a CORS header doesn't broaden access in any meaningful way.
