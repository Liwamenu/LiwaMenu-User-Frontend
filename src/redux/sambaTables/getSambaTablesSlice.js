// SambaPOS table list — fed into the QR Code page so users can generate
// a QR per real table without manually typing prefixes/ranges. The
// backend endpoint is still being built; the contract we agreed on is a
// minimal `{ data: string[] }` shape (each string is the table's name as
// it should appear in the QR's `?tableNumber=` parameter).
//
// To stay forgiving if the backend ends up returning richer rows like
// `{ name }` objects or `{ data: { tables: [...] } }`, we normalise
// everything down to `string[]` here so downstream code never has to
// guess at the shape.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  tables: null, // string[] | null
  fetchedFor: null,
};

const getSambaTablesSlice = createSlice({
  name: "getSambaTables",
  initialState,
  reducers: {
    resetGetSambaTablesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetSambaTables: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.tables = null;
      state.fetchedFor = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getSambaTables.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
      })
      .addCase(getSambaTables.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.tables = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getSambaTables.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.tables = null;
        state.fetchedFor = null;
      });
  },
});

// Coerce the backend payload into a clean `string[]` regardless of which
// shape it lands in (raw array, wrapped `{data}`, or `{name}` objects).
const normalizeTables = (raw) => {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.tables)
        ? raw.tables
        : [];
  return list
    .map((entry) => {
      if (typeof entry === "string") return entry.trim();
      if (entry && typeof entry === "object") {
        return String(entry.name ?? entry.tableName ?? "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

export const getSambaTables = createAsyncThunk(
  "Tables/GetSambaTablesByRestaurantId",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      // NOTE: endpoint path provisional — adjust once backend confirms.
      // The generally agreed convention is
      // `Tables/GetSambaTablesByRestaurantId?restaurantId=...`.
      const res = await api.get(
        `${baseURL}Tables/GetSambaTablesByRestaurantId`,
        { params: { restaurantId } },
      );
      return normalizeTables(res?.data?.data ?? res?.data);
    } catch (err) {
      console.log(err);
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetSambaTablesState, resetGetSambaTables } =
  getSambaTablesSlice.actions;
export default getSambaTablesSlice.reducer;
