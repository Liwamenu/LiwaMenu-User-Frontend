// Upsert (create or update) a payment-gateway config row.
//
// Endpoint: `PUT /api/PaymentGateways/Upsert`
// Body:
//   {
//     restaurantId, gatewayType (0=PayTR, 1=Stripe, 2=Iyzico),
//     isActive,
//     payTrMerchantId / payTrMerchantKey / payTrMerchantSalt / payTrTestMode,
//     stripePublishableKey / stripeSecretKey / stripeWebhookSecret,
//     iyzicoApiKey / iyzicoSecretKey / iyzicoBaseUrl
//   }
//
// Cross-slice: invalidates getPaymentGateways so the page re-reads
// after a save.

import { createApiSlice } from "../createApiSlice";

const slice = createApiSlice({
  name: "upsertPaymentGateway",
  thunkType: "PaymentGateways/Upsert",
  url: "PaymentGateways/Upsert",
  method: "put",
  errorIdle: null,
});

export const upsertPaymentGateway = slice.thunk;
export const { resetUpsertPaymentGateway } = slice.actions;
export default slice.reducer;
