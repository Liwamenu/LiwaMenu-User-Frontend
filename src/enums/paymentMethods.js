// `labelKey` instead of a baked-in TR label so the chips switch with the
// active language. Call sites resolve via t(item.labelKey).
const PaymentMethod = [
  { value: "CreditCard", labelKey: "paymentsPage.method_credit_card", id: 0 },
  { value: "BankTransfer", labelKey: "paymentsPage.method_bank_transfer", id: 1 },
  { value: "PayTR", labelKey: "paymentsPage.method_pay_tr", id: 2 },
  { value: "Free", labelKey: "paymentsPage.method_free", id: 3 },
];

export default PaymentMethod;
