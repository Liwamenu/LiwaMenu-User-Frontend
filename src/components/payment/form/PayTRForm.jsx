import { useTranslation } from "react-i18next";

const className =
  "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2";

const PayTRForm = ({ cardData }) => {
  const { t } = useTranslation();
  return (
    <>
      <div>
        <label className="hidden text-sm font-medium text-gray-700">
          {t("payment.card_holder_name_label")}
        </label>
        <input
          type="hidden"
          name="cc_owner"
          className={className}
          value={cardData.userName}
          onChange={() => {}}
        />
      </div>

      <div>
        <label className="hidden text-sm font-medium text-gray-700">
          {t("payment.card_number_label")}
        </label>
        <input
          type="hidden"
          name="card_number"
          value={cardData.cardNumber.replace(/\s/g, "")}
          className={className}
          onChange={() => {}}
        />
      </div>

      <div>
        <label className="hidden text-sm font-medium text-gray-700">
          {t("payment.card_expiry_month_label")}
        </label>
        <input
          type="hidden"
          name="expiry_month"
          className={className}
          value={cardData.month}
          onChange={() => {}}
        />
      </div>

      <div>
        <label className="hidden text-sm font-medium text-gray-700">
          {t("payment.card_expiry_year_label")}
        </label>
        <input
          type="hidden"
          name="expiry_year"
          className={className}
          value={cardData.year}
          onChange={() => {}}
        />
      </div>

      <div>
        <label className="hidden text-sm font-medium text-gray-700">
          {t("payment.card_security_code_label")}
        </label>
        <input
          type="hidden"
          name="cvv"
          className={className}
          value={cardData.cvv}
          onChange={() => {}}
        />
      </div>
    </>
  );
};

export default PayTRForm;
