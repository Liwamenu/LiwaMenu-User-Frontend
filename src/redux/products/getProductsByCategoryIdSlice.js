import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import { normalizeProductsPayload } from "../../utils/normalizeProduct";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  products: null,
};

const getProductsByCategoryIdSlice = createSlice({
  name: "getProductsByCategoryId",
  initialState: initialState,
  reducers: {
    resetGetProductsByCategoryIdState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetProductsByCategoryId: (state) => {
      state.products = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getProductsByCategoryId.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.products = null;
      })
      .addCase(getProductsByCategoryId.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.products = action.payload;
      })
      .addCase(getProductsByCategoryId.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.products = null;
      });
  },
});

export const getProductsByCategoryId = createAsyncThunk(
  "Products/getProductsByCategoryId",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Products/getProductsByCategoryId`, {
        params: data,
      });

      // Same migration shim as getProductsSlice — see
      // `utils/normalizeProduct.js` for the contract.
      return normalizeProductsPayload(res.data);
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  }
);

export const {
  resetGetProductsByCategoryIdState,
  resetGetProductsByCategoryId,
} = getProductsByCategoryIdSlice.actions;
export default getProductsByCategoryIdSlice.reducer;
