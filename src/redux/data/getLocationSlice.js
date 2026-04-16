//https://api.pentegrasyon.net:9007/api/v1/CityDistrictNeighbourhood/GetLocation

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  loading: false,
  success: false,
  error: false,
  location: null,
};

const getLoationSlice = createSlice({
  name: "getLocation",
  initialState: initialState,
  reducers: {
    resetGetLocationState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetGetLocation: (state) => {
      state.location = null;
    },
  },
  extraReducers: (build) => {
    build
      .addCase(getLocation.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.location = null;
      })
      .addCase(getLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.location = action.payload;
      })
      .addCase(getLocation.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
        state.location = null;
      });
  },
});

export const getLocation = createAsyncThunk(
  "Route/GetLocation",
  async (address, { rejectWithValue }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const getGeolocation = () =>
      new Promise((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          reject(new Error("Geolocation is not supported by this browser."));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });

    const buildGeocodeUrl = (params) =>
      `https://maps.googleapis.com/maps/api/geocode/json?${params}&key=${apiKey}`;

    const getComponent = (components, typeList) => {
      const match = components.find((component) =>
        typeList.some((type) => component.types.includes(type)),
      );
      return match ? match.long_name : null;
    };

    try {
      let geocodeUrl;

      if (address && address.trim()) {
        geocodeUrl = buildGeocodeUrl(`address=${encodeURIComponent(address)}`);
      } else {
        const coords = await getGeolocation();
        geocodeUrl = buildGeocodeUrl(
          `latlng=${coords.latitude},${coords.longitude}`,
        );
      }

      const response = await axios.get(geocodeUrl);
      const data = response.data;

      if (data.status === "OK") {
        const result = data.results[0];
        const bounds = result.geometry.bounds;
        const components = result.address_components || [];
        const fullAddress = result.formatted_address || null;
        const city = getComponent(components, [
          "locality",
          "administrative_area_level_1",
        ]);
        const district = getComponent(components, [
          "administrative_area_level_2",
          "administrative_area_level_3",
        ]);
        const neighborhood = getComponent(components, [
          "neighborhood",
          "sublocality",
          "sublocality_level_1",
          "sublocality_level_2",
        ]);

        if (bounds) {
          const boundaryCoords = [
            {
              lat: parseFloat(bounds.southwest.lat.toFixed(6)),
              lng: parseFloat(bounds.southwest.lng.toFixed(6)),
            },
            {
              lat: parseFloat(bounds.southwest.lat.toFixed(6)),
              lng: parseFloat(bounds.northeast.lng.toFixed(6)),
            },
            {
              lat: parseFloat(bounds.northeast.lat.toFixed(6)),
              lng: parseFloat(bounds.northeast.lng.toFixed(6)),
            },
            {
              lat: parseFloat(bounds.northeast.lat.toFixed(6)),
              lng: parseFloat(bounds.southwest.lng.toFixed(6)),
            },
          ];

          // console.log(boundaryCoords);
          return {
            fullAddress,
            city,
            district,
            neighborhood,
            boundaryCoords,
          };
        } else {
          // Fallback if bounds are not available
          const viewport = result.geometry.viewport;
          const boundaryCoords = [
            { lat: viewport.southwest.lat, lng: viewport.southwest.lng },
            { lat: viewport.southwest.lat, lng: viewport.northeast.lng },
            { lat: viewport.northeast.lat, lng: viewport.northeast.lng },
            { lat: viewport.northeast.lat, lng: viewport.southwest.lng },
          ];

          // console.log(boundaryCoords);
          return {
            fullAddress,
            city,
            district,
            neighborhood,
            boundaryCoords,
          };
        }
      } else {
        throw new Error(`Geocode was not successful: ${data.status}`);
      }
    } catch (err) {
      console.log(err);
      return rejectWithValue({ message: err.message });
    }
  },
);

export const { resetGetLocationState, resetGetLocation } =
  getLoationSlice.actions;
export default getLoationSlice.reducer;
