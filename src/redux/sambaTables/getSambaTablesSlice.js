// SambaPOS table list — fed into the QR Code page so users can generate
// a QR per real table without manually typing prefixes/ranges.
//
// Backend endpoint: GET /api/TableNames/GetByRestaurantId?restaurantId=…
// Wraps in the standard `ResponsBase { data, message_TR, … }` envelope.
// Each row matches `RestaurantTableNameItemUpsertDto { sambaId, name }`,
// but the read response has been observed serializing in PascalCase on
// other endpoints — so we run normalizeKeysDeep before pulling `name`,
// then flatten to a clean `string[]` so downstream code never has to
// guess at the shape.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import toast from "react-hot-toast";
import { privateApi } from "../api";
import i18n from "../../config/i18n";
import { normalizeKeysDeep } from "../../utils/normalizeKeys";

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
// Keys are already lowercased by normalizeKeysDeep upstream, so we only
// need to handle the camelCase variants here.
const normalizeTables = (raw) => {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.tables)
        ? raw.tables
        : Array.isArray(raw?.tableNames)
          ? raw.tableNames
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
  "TableNames/GetByRestaurantId",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}TableNames/GetByRestaurantId`, {
        params: { restaurantId },
      });
      // Lowercase first-char of every key so PascalCase responses
      // (`{ Name, SambaId }`) map to the same shape as camelCase.
      // Then unwrap ResponsBase and pull table names out.
      const normalized = normalizeKeysDeep(res?.data);
      return normalizeTables(normalized?.data ?? normalized);
    } catch (err) {
      console.log(err);
      // Surface a domain-specific toast so the user knows this is a
      // SambaPOS sync issue, not a generic network error. The api-error
      // interceptor toast (backend message_TR / status fallback) still
      // fires alongside this — the user opted into seeing both so they
      // get the technical reason plus our plain-language explainer.
      // Different toast id keeps it from overriding "api-error".
      const tt = i18n.t.bind(i18n);
      toast.error(tt("sambaTables.toast_fetch_failed"), {
        id: "samba-tables-fetch-failed",
        duration: 4500,
      });
      if (err?.response?.data) return rejectWithValue(err.response.data);
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetSambaTablesState, resetGetSambaTables } =
  getSambaTablesSlice.actions;
export default getSambaTablesSlice.reducer;
