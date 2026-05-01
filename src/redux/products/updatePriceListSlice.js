import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const updatePriceListSlice = createSlice({
  name: "updatePriceList",
  initialState: initialState,
  reducers: {
    resetUpdatePriceList: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(updatePriceList.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(updatePriceList.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(updatePriceList.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

// Walk the products → portions tree and convert any portion's
// `campaignPrice` of 0 (number, "0", "0.00", null, undefined,
// non-numeric, …) into a true null so the backend records it as
// "no campaign" rather than "0 TL campaign". Both call sites
// (PriceList save + PriceListApplyBulk's bulk math) feed this
// thunk, so normalizing here keeps the rule in one place.
const normalizeCampaignZeros = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map((product) => {
    if (!product || !Array.isArray(product.portions)) return product;
    return {
      ...product,
      portions: product.portions.map((portion) => {
        if (!portion) return portion;
        const n = Number(portion.campaignPrice);
        const isZeroish = !Number.isFinite(n) || n === 0;
        return isZeroish ? { ...portion, campaignPrice: null } : portion;
      }),
    };
  });
};

export const updatePriceList = createAsyncThunk(
  "Products/UpdatePriceList",
  async (data, { rejectWithValue }) => {
    try {
      const payload = normalizeCampaignZeros(data);
      const res = await api.put(`${baseURL}Products/UpdatePriceList`, payload);

      // console.log(res);
      return res.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetUpdatePriceList } = updatePriceListSlice.actions;
export default updatePriceListSlice.reducer;
