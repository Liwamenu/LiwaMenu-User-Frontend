// Each entry stores a translation key (`labelKey`) instead of a baked-in
// TR label, so payment-status chips switch with the active language. Call
// sites resolve via `t(item.labelKey)` to render.
const statuses = [
  { labelKey: "paymentsPage.status_success", id: 0, value: "Success" },
  { labelKey: "paymentsPage.status_failed", id: 1, value: "Failed" },
  { labelKey: "paymentsPage.status_waiting", id: 2, value: "Waiting" },
  { labelKey: "paymentsPage.status_refunded", id: 3, value: "Refunded" },
];

export default statuses;
