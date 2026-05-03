// Factory for the project's standard "one endpoint per slice" pattern.
//
// The vast majority of slices in src/redux/ follow the same shape:
//   state: { loading, success, error, <payloadKey>: null }
//   thunk: createAsyncThunk(thunkType, args => api.METHOD(URL, args).data)
//   pending → loading=true, success=false (optionally clear payload)
//   fulfilled → loading=false, success=true, payload=action.payload
//   rejected → loading=false, success=false, error=action.payload, payload=null
//   reducers: resetXxxState, resetXxx
//
// This factory captures that pattern in ~one call. Slices with extra state
// (caches like `fetchedFor`, cross-slice matchers like getProductsLite) can
// still extend the slice via the `extraReducers` and `initialExtra` hooks.
//
// Usage:
//   import { createApiSlice } from "../createApiSlice";
//
//   const slice = createApiSlice({
//     name: "setRestaurantTheme",
//     thunkType: "Restaurants/SetRestaurantTheme",
//     url: "Restaurants/UpdateRestaurantTheme",
//     method: "put",
//   });
//   export const setRestaurantTheme = slice.thunk;
//   export const { resetSetRestaurantThemeState, resetSetRestaurantTheme } = slice.actions;
//   export default slice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "./api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * @param {object} cfg
 * @param {string} cfg.name              Slice name (also used for resetXxx action keys).
 * @param {string} cfg.thunkType         createAsyncThunk first arg, e.g. "Restaurants/UpdateRestaurant". MUST match the original to keep cross-slice matchers working.
 * @param {string|((arg)=>string)} cfg.url  URL path appended to VITE_BASE_URL, or a function (arg)=>path.
 * @param {"get"|"post"|"put"|"delete"|"patch"} [cfg.method="get"]
 * @param {"body"|"params"} [cfg.send]   How to send the arg. Defaults: get|delete → params, others → body.
 * @param {string} [cfg.payloadKey="data"]  Field name on state where the response is stored.
 * @param {(res)=>any} [cfg.transform]   Map axios response to value stored on state. Defaults to `res.data`.
 * @param {boolean} [cfg.clearOnPending=false]  If true, payload is cleared in pending. Match the slice's existing behavior.
 * @param {null|false} [cfg.errorIdle=false]  Initial / reset value for `error`. Some slices use `null`, most use `false`.
 * @param {object} [cfg.axiosConfig]     Extra axios options merged into the request.
 * @param {object} [cfg.initialExtra]    Extra fields merged into initial state (e.g. `{ fetchedFor: null }`).
 * @param {object} [cfg.extraReducerMap] Plain reducers added under `reducers:` (e.g. for additional resetters).
 * @param {(builder)=>void} [cfg.extraCases]  Hook to append addCase/addMatcher (for cross-slice invalidation).
 *
 * @returns {{ reducer, thunk, actions, slice }} use `reducer` as default export, `thunk` as the dispatched action creator, `actions` includes the auto-generated resetters.
 */
export function createApiSlice(cfg) {
  const {
    name,
    thunkType,
    url,
    method = "get",
    send,
    payloadKey = "data",
    transform = (res) => res?.data,
    clearOnPending = false,
    errorIdle = false,
    axiosConfig,
    initialExtra = {},
    extraReducerMap = {},
    extraCases,
  } = cfg;

  if (!name || !thunkType || !url) {
    throw new Error(
      `createApiSlice: name, thunkType, and url are required (got name="${name}", thunkType="${thunkType}", url="${url}")`,
    );
  }

  const sendMode =
    send ?? (method === "get" || method === "delete" ? "params" : "body");

  const thunk = createAsyncThunk(
    thunkType,
    async (arg, { rejectWithValue }) => {
      try {
        const path = typeof url === "function" ? url(arg) : url;
        const fullUrl = `${baseURL}${path}`;
        const opts = { ...(axiosConfig || {}) };
        let res;
        if (sendMode === "params") {
          opts.params = arg;
          res = await api[method](fullUrl, opts);
        } else {
          res = await api[method](fullUrl, arg, opts);
        }
        return transform(res);
      } catch (err) {
        if (err?.response?.data) return rejectWithValue(err.response.data);
        return rejectWithValue({ message_TR: err.message });
      }
    },
  );

  const initialState = {
    loading: false,
    success: false,
    error: errorIdle,
    [payloadKey]: null,
    ...initialExtra,
  };

  const Cap = capitalize(name);
  const stateResetKey = `reset${Cap}State`;
  const fullResetKey = `reset${Cap}`;

  const slice = createSlice({
    name,
    initialState,
    reducers: {
      [stateResetKey]: (state) => {
        state.loading = false;
        state.success = false;
        state.error = errorIdle;
      },
      [fullResetKey]: (state) => {
        state.loading = false;
        state.success = false;
        state.error = errorIdle;
        state[payloadKey] = null;
      },
      ...extraReducerMap,
    },
    extraReducers: (builder) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.loading = true;
          state.success = false;
          state.error = errorIdle;
          if (clearOnPending) state[payloadKey] = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.loading = false;
          state.success = true;
          state.error = errorIdle;
          state[payloadKey] = action.payload;
        })
        .addCase(thunk.rejected, (state, action) => {
          state.loading = false;
          state.success = false;
          state.error = action.payload;
          state[payloadKey] = null;
        });
      if (extraCases) extraCases(builder);
    },
  });

  return {
    reducer: slice.reducer,
    thunk,
    actions: slice.actions,
    slice,
  };
}
