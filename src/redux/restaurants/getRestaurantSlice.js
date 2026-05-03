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
  restaurant: null,
  licensesRestaurant: {
    loading: false,
    success: false,
    error: false,
    licenses: null,
  },
};

const getRestaurantSlice = createSlice({
  name: "getRestaurant",
  initialState: initialState,
  reducers: {
    resetGetRestaurantState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetRestaurant: (state) => {
      state.restaurant = null;
    },
    resetGetLicensesRestaurant: (state) => {
      state.licensesRestaurant.loading = false;
      state.licensesRestaurant.success = false;
      state.licensesRestaurant.error = false;
      state.licensesRestaurant.licenses = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getRestaurant.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.restaurant = null;
      })
      .addCase(getRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.restaurant = action.payload;
      })
      .addCase(getRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.restaurant = null;
      })
      .addCase(getLicensesRestaurant.pending, (state) => {
        state.licensesRestaurant.loading = true;
        state.licensesRestaurant.success = false;
        state.licensesRestaurant.error = null;
        state.licensesRestaurant.licenses = null;
      })
      .addCase(getLicensesRestaurant.fulfilled, (state, action) => {
        state.licensesRestaurant.loading = false;
        state.licensesRestaurant.success = true;
        state.licensesRestaurant.error = null;
        state.licensesRestaurant.licenses = action.payload;
      })
      .addCase(getLicensesRestaurant.rejected, (state, action) => {
        state.licensesRestaurant.loading = false;
        state.licensesRestaurant.success = false;
        state.licensesRestaurant.error = action.payload;
        state.licensesRestaurant.licenses = null;
      })
      // Cross-slice: when any restaurant-entity-patching settings save
      // succeeds for THIS cached restaurant, merge the patch in. See
      // restaurantEntityPatchers.js for the thunk list.
      .addMatcher(isRestaurantPatchAction, (state, action) => {
        const result = restaurantPatchFromAction(action);
        if (!result || !state.restaurant) return;
        if (state.restaurant.id !== result.restaurantId) return;
        state.restaurant = { ...state.restaurant, ...result.patch };
      });
  },
});

export const getRestaurant = createAsyncThunk(
  "Restaurants/GetRestaurantById",
  async ({ restaurantId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`${baseURL}Restaurants/GetRestaurantById`, {
        params: {
          restaurantId,
        },
      });

      // console.log(res.data.data);
      return res.data.data;
    } catch (err) {
      console.log(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  }
);

export const getLicensesRestaurant = createAsyncThunk(
  "Restaurants/GetRestaurantByIdFromLicenses",
  async ({ licenses }, { rejectWithValue }) => {
    try {
      const uniqueRestaurantIds = [
        ...new Set(licenses.map((license) => license.restaurantId)),
      ];

      const restaurantPromises = uniqueRestaurantIds.map((restaurantId) =>
        api
          .get(`${baseURL}Restaurants/GetRestaurantById`, {
            params: {
              restaurantId,
            },
          })
          .then((response) => response.data.data)
      );

      const restaurants = await Promise.all(restaurantPromises);

      const restaurantMap = restaurants.reduce((acc, restaurant) => {
        acc[restaurant.id] = restaurant;
        return acc;
      }, {});

      const updatedLicenses = licenses.map((license) => {
        const restaurant = restaurantMap[license.restaurantId];
        return {
          ...license,
          restaurantName: restaurant.name,
          restaurantId: restaurant.id,
        };
      });

      return updatedLicenses;
    } catch (err) {
      console.error(err);
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message_TR: err.message });
    }
  }
);

export const {
  resetGetRestaurantState,
  resetGetRestaurant,
  resetGetLicensesRestaurant,
} = getRestaurantSlice.actions;
export default getRestaurantSlice.reducer;
