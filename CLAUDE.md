# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — Vite dev server (host `0.0.0.0`, port **9006**). NOTE: there is no `dev` script despite what README.md says — the script name is `start`.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built bundle locally.
- `npm run lint` — ESLint flat config (`eslint.config.js`); rules are deliberately lenient (most stylistic rules are commented out).

There are no tests in this repo. The deploy target is Vercel; `vercel.json` rewrites all paths to `/` so client-side routing works.

## Environment

- All runtime config is read from Vite env vars in `.env` and must be prefixed `VITE_`. The most load-bearing ones:
  - `VITE_BASE_URL` — backend API base (used by `src/redux/api.js`).
  - `VITE_LOCAL_KEY` — localStorage key under which the entire auth blob (`{ token, sessionId, user, ... }`) is stored. Never hard-code "liwamenu_..." — read it from env.
  - `VITE_FIREBASE_*` — FCM push notifications (service worker at `public/firebase-messaging-sw.js`).
  - `VITE_GOOGLE_MAPS_API_KEY` — injected at runtime in `src/main.jsx`.
- `@` is aliased to `./src` (`vite.config.js`); prefer `@/foo` over deep relative paths.

## Architecture

### Top-level shape

`src/main.jsx` mounts the provider stack in this order (order matters):

1. `bootstrap/handoffAuth.js` runs as a side-effect import **before** anything else — it decodes auth from a `#auth=<base64>` URL fragment or a `.liwamenu.com`-scoped `liwamenu_auth` cookie and writes it to localStorage. This is how the admin panel hands a session over to this app. It must run before `config/i18n.js` reads localStorage to pick the user's `defaultLang`.
2. Redux `Provider` → `BrowserRouter` → `FirebaseProvider` → `OrdersProvider` → `WaiterCallsProvider` → `ReservationsProvider` → `PopupProvider` → `<App />`.
3. Google Maps script is injected after render via `loadGoogleMaps`.

`App.jsx` declares public routes (`/login`, `/register`, `/verify-email/*`, `/forgotPassword`, `/reset-password`) and gates everything else behind `ProtectedRoute` (a token check on `localStorage[VITE_LOCAL_KEY]`). The protected tree mounts `pages/home.jsx`, which renders `Header` + `Sidebar` and nested routes for `restaurants`, `licenses`, `payments`, `orders`, `waiterCalls`, `reservations`, `profile`, and per-restaurant pages under `/restaurant/*` (which uses a secondary sidebar — `Home` toggles `showS1` to swap which sidebar's open-state is wired to the header).

### Redux conventions

The store (`src/store.js`) registers one reducer per domain. Inside `src/redux/<domain>/`:

- **One file per endpoint.** Each file defines a `createAsyncThunk` and a `createSlice` with `loading/success/error` plus the payload (e.g. `products`, `categories`).
- **`<domain>/index.js`** uses `combineReducers` to assemble the slices into one reducer keyed by short names (`get`, `add`, `edit`, `delete`, `getLite`, ...). The store registers that combined reducer.
- **Use `createApiSlice` for new endpoints.** `src/redux/createApiSlice.js` is a factory that captures the standard `{loading, success, error, payloadKey}` shape in ~10 lines per slice instead of ~80. Pass `name`, `thunkType`, `url`, `method`, plus optional `transform` (e.g. `(res) => res?.data?.data` for endpoints with a wrapper envelope), `errorIdle: null` if the slice uses `null` instead of `false` for the error idle value, and `clearOnPending: true` if pending should clear the payload (vs stale-while-revalidate). The factory also auto-exports `resetXxx` and `resetXxxState` actions. Slices in `src/redux/restaurant/` are mostly migrated; the rest follow the legacy verbose pattern and can be migrated incrementally. **Keep `thunkType` exactly as the original** — many cross-slice matchers and the `restaurantEntityPatchers` rely on stable action-type strings.
- **Cache contract:** list slices use a stale-while-revalidate pattern — keep the previous payload visible during refetch and stamp `fetchedFor` with a cache key (restaurantId, or for paginated endpoints a composite key built by an exported helper like `productsCacheKey` in `redux/products/getProductsSlice.js`). Call sites compute the same key and skip dispatch when it matches. Slices with caching extend `createApiSlice` via `initialExtra` and `extraCases` (or stay verbose).
- **Cross-slice invalidation** is done via `addMatcher` on action-type strings, not via thunks calling other thunks. Example: `getProductsLiteSlice` clears its cache when it sees `Products/AddProduct/fulfilled`, `Products/EditProduct/fulfilled`, or `Products/DeleteProduct/fulfilled`. The thunk type prefix is the **first arg to `createAsyncThunk`** — keep matcher strings in sync with those prefixes (a typo silently disables invalidation).
- **Restaurant entity sync after settings saves:** `src/redux/restaurants/restaurantEntityPatchers.js` lists thunk type prefixes whose dispatched arg shape is `{ restaurantId, ...patch }`. When any of those fulfills, `getRestaurantsSlice` and `getRestaurantSlice` automatically merge the patch into the cached restaurant entry — no callback wiring or extra fetch. Add a thunk to `PATCH_THUNK_PREFIXES` when its save updates fields directly on the restaurant entity.

### Global loading middleware

`src/middlewares/loadingMiddleware.js` counts every `/pending` thunk and toggles `state.isLoading` true until the count returns to zero. `PopupContext` watches this and renders a full-screen `CustomGeneralLoader` overlay. Default: any pending thunk shows the spinner.

**Opt-out two ways** when a thunk shouldn't freeze the UI (background polling, prefetch, FCM-driven refresh):
1. **Static allowlist:** add the thunk type prefix to `SILENT_THUNKS` at the top of the middleware. No call-site changes.
2. **Per-call:** dispatch with `{ ..., __silent: true }` in the arg. Caveat — slices that forward the whole arg to axios (e.g. `params: data`) will leak `__silent` to the backend as a query param; either destructure it out or just use the static allowlist.

### API layer (`src/redux/api.js`)

Two axios instances:

- `api` — public (login, register, password reset).
- `privateApi()` — returns an instance whose request interceptor injects `Bearer <token>` from `getAuth()` and rejects with 401 if no token. The response interceptor:
  - On 401: clears auth and hard-redirects to `/login`.
  - On other errors: picks the localized backend message via `pickBackendMessage(data)` (`message_EN` if i18n is in English, else `message_TR`, else `message`) and toasts it. Backend error DTOs include `message_TR`/`message_EN` — use those names when surfacing new errors.
- `getAuth()` / `setAuth(patch)` / `clearAuth()` are the only sanctioned ways to read/mutate the auth blob — `setAuth` merges so callers can update `user` without losing the token.

### Backend response casing

The .NET backend sometimes returns PascalCase keys. `src/utils/normalizeKeys.js` exports `normalizeKeysDeep` — apply it at the slice boundary on endpoints that have shown mixed casing (already used by Orders / OrderTags / Products).

### i18n

- `src/config/i18n.js` registers `tr` and `en` and uses `LanguageDetector` with localStorage key `liwamenu_lang`. The detector tolerates the legacy numeric `LanguagesEnums.value` ("0", "1") in addition to ISO codes.
- If a logged-in user has a `defaultLang`, that wins (passed as `lng:` to init, skipping detection). On boot `App.jsx` re-fetches the user and calls `setTranslationLanguage(user.defaultLang)` so server-side language changes propagate without a reload.
- All UI strings go through `useTranslation()` / `t(...)`. Translation files are in `src/locales/{TR,EN}/translation.json`. Default is Turkish.

### Popups

Every modal/edit dialog is rendered through `PopupContext` (`src/context/PopupContext.jsx`) — call sites do `setPopupContent(<Foo />)` (and `setSecondPopupContent` for nested popups, `setCropImgPopup` for the image-crop slot). The `<Popup />` component in `App.jsx` is the single mount point. Edits happen in popups deliberately so list pages do not unmount and lose their slice cache.

`contentRef` is a registry of `{ ref, outRef, callback }` entries — a global click-outside listener walks it. To make a popup auto-close on outside click, `setContentRef([...prev, { ref, callback }])` on mount and clean up on unmount.

### Push notifications

`FirebaseProvider` (`src/context/firebase.jsx`) initializes FCM via `src/firebase.js`, registers `/firebase-messaging-sw.js`, and exposes `lastPushMessage` plus `requestNotificationAccess`. Background pushes arrive via `postMessage` from the service worker (`type: "FCM_BACKGROUND"`); foreground pushes come through `onMessage`. Domain providers (`OrdersProvider`, `WaiterCallsProvider`, `ReservationsProvider`) consume `lastPushMessage` to refresh their lists in real time.

### Styling

Tailwind 3 with `darkMode: ['class']` driven by a class set on `<body>` (`utils/localStorage.js` exports `getTheme()`/`setTheme()` and applies it on import). Color tokens are CSS custom properties defined in `src/index.css` for both `.light` and `.dark` blocks — prefer `bg-[--white-1]`, `text-[--black-1]`, etc. over hard-coded hex. Custom font-weight scale in `tailwind.config.js` (note `normal: 350`, `medium: 500` — lighter than Tailwind defaults).

## Notable quirks

- The dev script is `start`, not `dev`. The README is wrong about this.
- `Products/getProductsByRestaurantId` historically capped `pageSize` at 100; the lite endpoint `Products/GetProductsByRestaurantIdLite` was added for dropdown use cases.
- `MenuJson.json` (~800 KB) is sample/seed data, not loaded at runtime.
- `privateApi()` returns a process-singleton — interceptors are registered once at module load, not per call. Old call sites that do `const api = privateApi();` at module top still work and now share the same instance.
