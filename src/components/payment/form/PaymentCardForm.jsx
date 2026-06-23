import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import CustomInput from "../../common/customInput";
import { isValidCardNumber } from "../../../utils/utils";

const PaymentCardForm = ({ setFlip, cardData, setCardData }) => {
  const { t } = useTranslation();
  const yearRef = useRef(null);
  const cvvRef = useRef(null);

  const [invalidCardNumber, setInvalidCardNumber] = useState(true);

  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, "") // Remove non-digit characters
      .replace(/(.{4})/g, "$1 ") // Add a space every 4 digits
      .trim(); // Remove trailing space
  };

  const handleCardNumberChange = (e) => {
    const formattedNumber = formatCardNumber(e);
    setCardData((prev) => ({
      ...prev,
      cardNumber: formattedNumber,
    }));
  };

  const handleMonthChange = (value) => {
    if (value.length === 2) {
      yearRef.current.focus();
    }
    setCardData((prev) => {
      return {
        ...prev,
        month: value < 13 ? value : prev.month,
      };
    });
  };

  const handleYearChange = (value) => {
    if (value.length === 2) {
      cvvRef.current.focus();
    }
    setCardData((prev) => {
      return {
        ...prev,
        year: value,
      };
    });
  };

  useEffect(() => {
    setInvalidCardNumber(isValidCardNumber(cardData.cardNumber));
  }, [cardData.cardNumber]);

  return (
    <div className="w-max">
      <div className="mt-4 flex flex-col gap-3 max-w-[325px]">
        <div className="w-full">
          <CustomInput
            // label="Kart Sahibi"
            type="text"
            placeholder={t("payment.card_holder")}
            className="text-[13px] py-[6px] sm:mt-[4px] mt-[4px]"
            className2="mt-[0] sm:mt-[0]"
            required
            maxLength={30}
            value={cardData.userName}
            onChange={(e) =>
              setCardData((prev) => {
                return {
                  ...prev,
                  userName: e,
                };
              })
            }
            onClick={() => setFlip(false)}
          />
        </div>
        <div className="w-full">
          <CustomInput
            label={invalidCardNumber === false ? t("payment.invalid_card_number") : ""}
            className5="text-[--red-1] text-[.7rem]"
            type="text"
            placeholder={t("payment.card_number")}
            className={`text-[13px] py-[6px] sm:mt-[4px] mt-[4px] z-10 ${
              !invalidCardNumber && "border-[--red-1]"
            }`}
            className2="mt-[0] sm:mt-[0]"
            required
            const
            pattern="[0-9]{4}\s[0-9]{4}\s[0-9]{4}\s[0-9]{4}"
            maxLength={19}
            value={cardData.cardNumber}
            onChange={handleCardNumberChange}
            onClick={() => setFlip(false)}
          />
          <CustomInput
            required
            value={invalidCardNumber ? "valid" : ""}
            className="opacity-0 absolute -top-16 z-0"
          />
        </div>
        <div className="w-full flex gap-2">
          <CustomInput
            // label="Ay"
            type="number"
            placeholder={t("payment.month")}
            className="text-[13px] py-[6px] sm:mt-[4px] mt-[4px]"
            className2="mt-[0] sm:mt-[0]"
            required
            maxLength={2}
            value={cardData.month}
            onChange={handleMonthChange}
            onClick={() => setFlip(false)}
          />
          <CustomInput
            inputRef={yearRef}
            // label="Yıl"
            type="text"
            placeholder={t("payment.year")}
            className="text-[13px] py-[6px] sm:mt-[4px] mt-[4px]"
            className2="mt-[0] sm:mt-[0]"
            required
            maxLength={2}
            value={cardData.year}
            onChange={handleYearChange}
            onClick={() => setFlip(false)}
          />
          <CustomInput
            inputRef={cvvRef}
            // label="CVV"
            type="number"
            placeholder="CVV"
            className="text-[13px] py-[6px] sm:mt-[4px] mt-[4px]"
            className2="mt-[0] sm:mt-[0]"
            required
            maxLength={3}
            value={cardData.cvv}
            onChange={(e) =>
              setCardData((prev) => {
                return {
                  ...prev,
                  cvv: e,
                };
              })
            }
            onFocus={() => setFlip(true)}
            onBlur={() => setFlip(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentCardForm;
