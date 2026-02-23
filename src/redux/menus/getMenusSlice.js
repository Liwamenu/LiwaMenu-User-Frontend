import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  menus: null,
};

const getMenusSlice = createSlice({
  name: "getMenus",
  initialState: initialState,
  reducers: {
    resetGetMenusState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetMenus: (state) => {
      state.menus = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getMenus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.menus = null;
      })
      .addCase(getMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.menus = action.payload;
      })
      .addCase(getMenus.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.menus = null;
      });
  },
});

export const getMenus = createAsyncThunk(
  "Menus/GetMenusByRestaurantId",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Menus/GetMenusByRestaurantId`, {
        params: { restaurantId },
      });

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

export const { resetGetMenusState, resetGetMenus } = getMenusSlice.actions;
export default getMenusSlice.reducer;
