# Backend Brief — PayTR payment-return handoff (license purchase 3DS)

## Problem (observed live)
During license purchase with online payment, after the user completes PayTR 3D Secure
**inside the in-app iframe**, the iframe stays stuck on PayTR's "Lütfen Bekleyin" spinner.
The admin panel never learns the payment finished, so it doesn't advance to the success
screen or refresh the license list — the user has to **hard-reload** to see the result.

**Root cause (confirmed):** after 3DS the iframe ends on a **cross-origin** page (PayTR, then
the backend's PayTR return endpoint), so the frontend **cannot read the iframe URL** (browser
`SecurityError`) to detect completion. The only cross-origin-safe signal is a
`window.postMessage` from the return page — and that message isn't arriving.

> The backend **does** assign the license correctly — verified live: a new active license
> appears via `GetLicensesByRestaurantId` immediately after 3DS. The gap is purely the
> **payment-return → frontend handoff**, not the assignment.

## Frontend (already shipped — context, no FE change needed)
The 3DS step listens for a postMessage from the return page:
```js
window.addEventListener("message", (event) => {
  if (event.data?.source !== "paytr") return;
  if (event.data.status === "success") { /* advance to success + refresh */ }
  else if (["fail","failed","failure"].includes(event.data.status)) { /* advance to failure */ }
});
```
As a safety net the FE now ALSO polls `Licenses/GetLicensesByRestaurantId` and advances when
the license set changes (+ a 90s timeout fallback). But the **postMessage is the intended,
instant path** and should work.

## Backend ask
The PayTR **merchant return URLs** — the pages PayTR redirects the iframe to after 3DS (e.g.
`PayTR/PaymentSuccessReturn` and `PayTR/PaymentFailReturn`) — must return a tiny HTML page
that notifies the parent window on load (and then stops — no infinite spinner):

- Success page → `window.top.postMessage({ source: 'paytr', status: 'success' }, '*')`
- Fail page → `window.top.postMessage({ source: 'paytr', status: 'fail' }, '*')`

Use targetOrigin **`'*'`** — the parent (admin panel) is on a **different origin** than the API
(dev: `http://localhost:9006`; prod: the panel domain), so a specific targetOrigin would
silently drop the message. Post it immediately (inline `<script>`); it's fine to also show a
short "İşlem tamamlandı, bu pencereyi kapatabilirsiniz" message.

Also confirm (independent of the browser handoff):
1. **License assignment runs in the PayTR server-to-server callback** (the authoritative
   notification), NOT only on the browser return — so a closed tab / dropped redirect never
   loses a paid license.
2. That callback is **idempotent** — duplicate/retried PayTR notifications must not
   double-grant or extend twice.

## Acceptance
1. After 3DS **success**, the return page postMessages `{source:'paytr', status:'success'}` to
   `window.top`; the panel advances to the success screen and refreshes the license list
   **without a hard reload**.
2. After 3DS **failure/cancel**, it posts `{source:'paytr', status:'fail'}`.
3. The license is created/extended **exactly once** per successful payment, even if the browser
   never returns.

## Backend Claude prompt (copy verbatim)
```
Our PayTR online-payment return pages render inside an in-app iframe in the admin panel, but
they don't notify the parent window, so the panel hangs on PayTR's "Lütfen Bekleyin" spinner
after 3D Secure even though the payment and license assignment already succeeded server-side.

Change the PayTR merchant-return endpoints (the success and fail return URLs PayTR redirects to
after 3DS — e.g. PayTR/PaymentSuccessReturn and PayTR/PaymentFailReturn) to return a small HTML
page that, on load, runs:

  <script>
    // 'success' on the success-return page, 'fail' on the fail-return page
    window.top.postMessage({ source: 'paytr', status: 'success' }, '*');
  </script>

Requirements:
- targetOrigin MUST be '*' (the parent panel is on a different origin than the API:
  http://localhost:9006 in dev and the panel domain in prod), otherwise the message is dropped.
- status is 'success' on the success-return page and 'fail' on the fail-return page.
- Post it immediately on page load via an inline script; you may also show a short
  "İşlem tamamlandı, pencereyi kapatabilirsiniz" message.
- Do NOT rely on the browser return for granting the license: assign/extend the license in the
  PayTR server-to-server callback (notification) handler, and make that handler idempotent so
  duplicate notifications never double-grant or double-extend.

Verify: complete a 3DS payment inside the iframe; confirm the parent window receives the
postMessage (DevTools) and that the license is created exactly once.
```
