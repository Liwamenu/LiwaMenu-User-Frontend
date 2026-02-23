import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  subCategories: null,
};

const getSubCategoriesSlice = createSlice({
  name: "getSubCategories",
  initialState: initialState,
  reducers: {
    resetGetSubCategoriesState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetSubCategories: (state) => {
      state.Subcategories = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getSubCategories.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.subCategories = null;
      })
      .addCase(getSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.subCategories = action.payload;
      })
      .addCase(getSubCategories.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.subCategories = null;
      });
  },
});

export const getSubCategories = createAsyncThunk(
  "Subcategories/GetSubCategoriesByRestaurantId",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `${baseURL}Subcategories/GetSubCategoriesByRestaurantId`,
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

export const { resetGetSubCategoriesState, resetGetSubCategories } =
  getSubCategoriesSlice.actions;
export default getSubCategoriesSlice.reducer;
