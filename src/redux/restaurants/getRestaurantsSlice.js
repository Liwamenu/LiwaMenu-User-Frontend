//https://api.pentegrasyon.net:9007/api/v1/Users/GetUsers

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import {
  isRestaurantPatchAction,
  restaurantPatchFromAction,
} from "./restaurantEntityPatchers";

const api = privateApi();
const baseURL = import.meta.env.VITE_BASE_URL;

const initialState = {
  loading: false,
  success: false,
  error: false,
  restaurants: null,
};

const getRestaurantsSlice = createSlice({
  name: "getRestaurants",
  initialState: initialState,
  reducers: {
    resetGetRestaurantsState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetRestaurants: (state) => {
      state.restaurants = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getRestaurants.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.restaurants = null;
      })
      .addCase(getRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.restaurants = action.payload;
      })
      .addCase(getRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.restaurants = null;
      })
      // Cross-slice: when any restaurant-entity-patching settings save
      // succeeds, mutate the cached entry by id so the UI doesn't go stale
      // on tab switch + return. See restaurantEntityPatchers.js.
      .addMatcher(isRestaurantPatchAction, (state, action) => {
        const result = restaurantPatchFromAction(action);
        if (!result || !state.restaurants?.data) return;
        const idx = state.restaurants.data.findIndex(
          (r) => r.id === result.restaurantId,
        );
        if (idx === -1) return;
        state.restaurants.data[idx] = {
          ...state.restaurants.data[idx],
          ...result.patch,
        };
      });
  },
});

export const getRestaurants = createAsyncThunk(
  "Restaurants/getRestaurants",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Restaurants/GetmyRestaurants`, {
        params: data,
      });

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

export const { resetGetRestaurantsState, resetGetRestaurants } =
  getRestaurantsSlice.actions;
export default getRestaurantsSlice.reducer;
