//https://api.pentegrasyon.net:9007/api/v1/Users/GetUsers

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { privateApi } from "../api";
import {
  isRestaurantPatchAction,
  restaurantPatchFromAction,
} from "./restaurantEntityPatchers";
import { invalidateOn } from "../cacheInvalidation";

// Mutations whose effect on the restaurant LIST can't be expressed as
// an in-place `{ restaurantId, ...patch }` merge (that's what
// `restaurantEntityPatchers` handles for settings saves). License
// purchases change `licenseIsActive` / `hasQrLicense` / the license
// end date — fields the dispatched arg doesn't carry (it's a payment
// basket, not a restaurant patch). Add/Delete/Transfer change which
// rows exist at all. For every one of these the only correct move is
// to drop the cache and let the page refetch. Keep these strings in
// sync with the `createAsyncThunk` first-arg in each slice — a typo
// silently disables the invalidation.
const RESTAURANT_LIST_INVALIDATORS = [
  // License lifecycle — all of these flip license fields on the
  // restaurant entity the list renders.
  "Licenses/AddLicense",
  "Licenses/AddLicenseByBank",
  "Licenses/AddLicenseByOnlinePayment",
  "Licenses/ExtendLicenseByBank",
  "Licenses/ExtendLicenseByOnlinePayment",
  "Licenses/DeleteLicenseById",
  "Licenses/LicenseTransfer",
  "Licenses/UpdateLicenseActive",
  "Licenses/UpdateLicenseDate",
  "Licenses/UpdateLicenseDay",
  // Restaurant add / delete / transfer / full update — row set or
  // entity fields change. `UpdateRestaurant` is a FormData thunk so
  // it's deliberately excluded from `restaurantEntityPatchers`;
  // invalidating here is the simplest way to keep the list honest.
  "Restaurants/AddRestaurant",
  "Restaurants/DeleteRestaurantById",
  "Restaurants/RestaurantTransfer",
  "Restaurants/UpdateRestaurant",
];

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
      })
      // Cross-slice: license purchases + restaurant add/delete/transfer
      // can't be expressed as an in-place patch (see the
      // RESTAURANT_LIST_INVALIDATORS comment above), so drop the whole
      // cache. The restaurants page's fetch effect watches `restaurants`
      // and refetches the current page when it goes null — so the user
      // sees the new license / new row without a hard reload.
      .addMatcher(invalidateOn(RESTAURANT_LIST_INVALIDATORS), (state) => {
        state.restaurants = null;
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
