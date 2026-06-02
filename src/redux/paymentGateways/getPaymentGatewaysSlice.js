// Fetch the payment-gateway config for a restaurant.
//
// Endpoint: `GET /api/PaymentGateways/GetByRestaurantId?restaurantId=`
// Returns a single gateway-config object (one row per restaurant in
// the backend). The page derives "is this provider active" from the
// rolled-up `isActive` + `gatewayType` on the row.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "getPaymentGateways",
  thunkType: "PaymentGateways/GetByRestaurantId",
  url: "PaymentGateways/GetByRestaurantId",
  method: "get",
  errorIdle: null,
  // Pull the payload out of the standard `{ data }` envelope.
  transform: (res) => res?.data?.data ?? res?.data ?? null,
});

export const getPaymentGateways = slice.thunk;
export const { resetGetPaymentGateways } = slice.actions;
export default slice.reducer;
