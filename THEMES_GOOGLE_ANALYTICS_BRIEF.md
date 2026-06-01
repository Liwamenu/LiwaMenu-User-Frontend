# Themes project — inject per-restaurant Google Analytics (gtag.js)

This brief is for the **customer-facing themes project**
(`D:\LiwaMenu Temalar\Qr Menu`, served at `demo.liwamenu.com` and
each restaurant's QR-menu domain) — NOT the admin panel.

## Why this lives in the themes project

The admin panel only lets the restaurant owner *enter* their GA4
Measurement ID (Genel Ayarlar → Google Analytics → e.g.
`G-40XJQTZ07N`). That value is saved on the restaurant entity and
already ships on the public menu DTO as `googleAnalytics`.

But Google's `gtag.js` snippet must run on the page the **customer**
actually sees — the QR menu rendered by the themes project. That's
why Google reports *"Google etiketiniz web sitenizde algılanmadı"*
when testing `https://demo.liwamenu.com`: nothing has injected the
tag there yet. The admin panel can't do it — the customer never
loads the admin panel.

## What to build

When the themes app loads a restaurant's menu, read
`googleAnalytics` from the restaurant/menu DTO and, if present and
valid, inject the GA4 gtag.js into `<head>` at runtime — using THAT
restaurant's ID, never a hard-coded one.

### Hard requirements

1. **Per-restaurant ID, never hard-coded.** Use the DTO's
   `googleAnalytics` value. Do NOT paste `G-40XJQTZ07N` (that's just
   the example from the Google console). Every restaurant has its own.

2. **No ID → no script.** Many restaurants won't have GA configured.
   If `googleAnalytics` is empty / null / whitespace, inject nothing.

3. **Validate the format.** Only inject when the value looks like a
   GA4 Measurement ID — `^G-[A-Z0-9]+$` (case-insensitive is fine but
   GA IDs are uppercase). A malformed value should be ignored, not
   injected, so a typo can't break the page or pollute another
   property.

4. **Inject once.** Guard against double-injection on
   re-render / client-side navigation. Track the injected ID; if the
   same ID is already live, do nothing. (If a different restaurant's
   menu loads in the same tab — rare but possible on a multi-tenant
   preview — that's an edge case; simplest correct behaviour is
   "inject for the first restaurant seen per page load".)

5. **SPA page-view tracking.** This is a React SPA, so GA's automatic
   pageview only fires on the initial load. On every client-side
   route change, manually send a page_view:
   ```js
   window.gtag?.("event", "page_view", {
     page_path: location.pathname + location.search,
     page_location: window.location.href,
     page_title: document.title,
   });
   ```
   Wire this to the router's location change (e.g. a `useEffect` on
   `useLocation()` in the app shell). Without it, GA only ever counts
   the landing page.

### Suggested implementation shape

A small hook, called once in the app shell after the restaurant DTO
is available:

```js
// useGoogleAnalytics(measurementId)
//  - validates the id (G-…)
//  - injects the two gtag.js script tags into <head> exactly once
//  - exposes nothing; side-effect only
// Plus a separate effect on useLocation() to send page_view on route
// change.
```

The two tags Google gives you (parameterised by the DTO id):

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=<ID>"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '<ID>');
</script>
```

Create those programmatically (document.createElement('script')) so
the id is interpolated from the DTO — don't ship them as static HTML
in index.html (that can't be per-restaurant).

### Where the value comes from

The public menu DTO already carries it. In the admin repo's sample
(`user/src/assets/js/FullRestaurantInfoForMenu.json`) the field is:

```json
{ "googleAnalytics": "" }
```

Find the equivalent in the themes project's restaurant/menu fetch
and read `googleAnalytics` off it.

## Acceptance test

1. Set a real GA4 Measurement ID on a test restaurant via the admin
   panel (Genel Ayarlar → Google Analytics), save.
2. Open that restaurant's QR menu in the themes app.
3. DevTools → Network → filter "gtag" → confirm
   `googletagmanager.com/gtag/js?id=G-…` loads with the CORRECT id.
4. GA Realtime (in analytics.google.com) shows 1 active user.
5. Navigate between menu categories/pages → GA Realtime event count
   increments (page_view per route change).
6. Open a restaurant with NO GA id → confirm NO gtag request fires.

## Out of scope

- The admin panel side is done (ID entry + DTO field).
- No consent-banner / cookie-gating is requested here; if the
  business later needs GDPR/KVKK consent before loading GA, that's a
  separate task.

---

## Themes-project Claude prompt (copy verbatim into a session rooted at D:\LiwaMenu Temalar\Qr Menu)

```
Add per-restaurant Google Analytics (GA4 gtag.js) injection to this
customer-facing QR-menu themes app.

Context: the restaurant/menu DTO this app fetches includes a
`googleAnalytics` field — the restaurant owner's GA4 Measurement ID
(e.g. "G-40XJQTZ07N"), entered in the separate admin panel. Google
reports the tag isn't detected on demo.liwamenu.com because nothing
injects gtag.js here yet. The customer only ever loads THIS app, so
the tag must be injected here, using each restaurant's own id.

Tasks:

1. Find where the restaurant/menu DTO is loaded into state (the fetch
   slice / context / hook that holds the restaurant object). Confirm
   it carries `googleAnalytics`.

2. Create a hook `useGoogleAnalytics(measurementId)` that:
   - Returns early (injects nothing) when measurementId is empty,
     null, whitespace, or doesn't match /^G-[A-Z0-9]+$/i.
   - Injects the gtag.js script pair into <head> exactly once per
     page load, with the id interpolated from the argument:
       <script async src="https://www.googletagmanager.com/gtag/js?id=ID">
       + an inline script doing dataLayer init, gtag('js', new Date()),
         gtag('config', 'ID').
     Build them with document.createElement and appendChild — NOT as
     static HTML in index.html (must be per-restaurant).
   - Guards against double-injection: track the injected id in a
     module-level variable; if already injected for that id, no-op.

3. Call the hook once in the app shell (e.g. App.jsx / the top-level
   layout) after the restaurant DTO is available, passing
   restaurant.googleAnalytics.

4. SPA page_view tracking: add a separate useEffect keyed on
   react-router's useLocation() that, when window.gtag exists, sends:
     window.gtag("event", "page_view", {
       page_path: location.pathname + location.search,
       page_location: window.location.href,
       page_title: document.title,
     });
   Without this, GA only counts the first page in a SPA.

5. Build and confirm no errors.

Constraints:
- Never hard-code a Measurement ID; always read from the DTO.
- No script when the id is missing or malformed.
- Don't add a static gtag snippet to index.html.
- Keep it dependency-free (no react-ga / extra packages) — plain
  gtag.js is enough.

Acceptance test:
- Restaurant WITH a valid id → DevTools Network shows
  googletagmanager.com/gtag/js?id=<that id> loading; GA Realtime
  shows the visit; navigating routes increments page_view.
- Restaurant WITHOUT an id → no gtag request fires at all.
```
