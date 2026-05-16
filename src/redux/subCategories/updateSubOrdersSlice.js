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

const updateSubOrdersSlice = createSlice({
  name: "updateSubOrders",
  initialState: initialState,
  reducers: {
    resetUpdateSubOrders: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(updateSubOrders.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
        state.data = null;
      })
      .addCase(updateSubOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = null;
        state.data = action.payload;
      })
      .addCase(updateSubOrders.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.data = null;
      });
  },
});

export const updateSubOrders = createAsyncThunk(
  "SubCategories/UpdateSubCategoriesOrder",
  // Backend now expects a plain JSON object:
  //   { restaurantId, subCategories: [{ subCategoryId, sortOrder }, …] }
  // It used to accept the legacy FormData payload (restaurantId +
  // subCategoriesData JSON-stringified) — that path now returns 415
  // Unsupported Media Type. Drop the multipart header override so
  // axios uses its default application/json.
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `${baseURL}SubCategories/UpdateSubCategoriesOrder`,
        data,
      );
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

export const { resetUpdateSubOrders } = updateSubOrdersSlice.actions;
export default updateSubOrdersSlice.reducer;
