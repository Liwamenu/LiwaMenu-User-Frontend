import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  menus: null,
  // Restaurant id the cached `menus` belongs to. Lets the menu list page
  // skip the slow refetch when revisiting within the same restaurant.
  fetchedFor: null,
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
      state.fetchedFor = null;
    },
    // Optimistic cache mutations — used by the menu list after a successful
    // add/edit/delete so the cache stays accurate without forcing another
    // round-trip to the (slow) GetMenusByRestaurantId endpoint.
    addMenuToCache: (state, action) => {
      if (Array.isArray(state.menus)) {
        state.menus = [...state.menus, action.payload];
      }
    },
    updateMenuInCache: (state, action) => {
      if (Array.isArray(state.menus)) {
        state.menus = state.menus.map((m) =>
          m.id === action.payload.id ? action.payload : m,
        );
      }
    },
    removeMenuFromCache: (state, action) => {
      if (Array.isArray(state.menus)) {
        state.menus = state.menus.filter((m) => m.id !== action.payload);
      }
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getMenus.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        // Stale-while-revalidate: keep the previous payload visible while
        // the refetch is in flight instead of blanking the list.
      })
      .addCase(getMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.menus = action.payload;
        state.fetchedFor = action.meta?.arg?.restaurantId ?? null;
      })
      .addCase(getMenus.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.menus = null;
        state.fetchedFor = null;
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

export const {
  resetGetMenusState,
  resetGetMenus,
  addMenuToCache,
  updateMenuInCache,
  removeMenuFromCache,
} = getMenusSlice.actions;
export default getMenusSlice.reducer;
