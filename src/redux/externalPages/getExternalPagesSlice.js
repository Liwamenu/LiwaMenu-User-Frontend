// External pages list for a restaurant. Backend returns rows ordered by
// `sortOrder`. Cached per restaurant — call sites compare `fetchedFor`
// against the current restaurantId and skip dispatch on a hit. The cache
// is invalidated automatically when any Create / Update / Delete / Reorder
// thunk fulfills (see addMatcher below), so call sites never have to
// manually re-fetch after a mutation.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const FULFILLED_INVALIDATORS = new Set([
  "ExternalPages/Create",
  "ExternalPages/Update",
  "ExternalPages/Delete",
  "ExternalPages/Reorder",
]);

const initialState = {
  loading: false,
  success: false,
  error: null,
  pages: null,
  fetchedFor: null,
};

export const getExternalPages = createAsyncThunk(
  "ExternalPages/GetByRestaurant",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}ExternalPages/GetByRestaurant`,
        { params: { restaurantId } },
      );
      // ResponsBase wraps the array under `.data`.
      return res?.data?.data ?? [];
    } catch (err) {
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

const getExternalPagesSlice = createSlice({
  name: "getExternalPages",
  initialState,
  reducers: {
    resetGetExternalPagesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetExternalPages: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.pages = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getExternalPages.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        // Stale-while-revalidate — keep the previous list visible while
        // a refetch is in flight to avoid the empty flash.
      })
      .addCase(getExternalPages.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.pages = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getExternalPages.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.pages = null;
        state.fetchedFor = null;
      })
      // Any mutation fulfilling invalidates the cache so the next list
      // page mount triggers a fresh fetch.
      .addMatcher(
        (action) => {
          if (typeof action.type !== "string") return false;
          if (!action.type.endsWith("/fulfilled")) return false;
          const prefix = action.type.replace(/\/fulfilled$/, "");
          return FULFILLED_INVALIDATORS.has(prefix);
        },
        (state) => {
          state.pages = null;
          state.fetchedFor = null;
        },
      );
  },
});

export const { resetGetExternalPagesState, resetGetExternalPages } =
  getExternalPagesSlice.actions;
export default getExternalPagesSlice.reducer;
