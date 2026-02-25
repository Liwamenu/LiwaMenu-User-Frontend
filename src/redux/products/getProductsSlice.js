import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  products: null,
};

const getProductsSlice = createSlice({
  name: "getProducts",
  initialState: initialState,
  reducers: {
    resetGetProductsState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetProducts: (state) => {
      state.products = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getProducts.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.products = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.products = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.products = null;
      });
  },
});

export const getProducts = createAsyncThunk(
  "Products/getProducts",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Products/getProductsByRestaurantId`,
        {
          params: data,
        },
      );

      // console.log(res.data);
      return res.data.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  },
);

export const { resetGetProductsState, resetGetProducts } =
  getProductsSlice.actions;
export default getProductsSlice.reducer;
