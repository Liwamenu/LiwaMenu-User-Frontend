import { useTranslation } from "react-i18next";

export const PhoneUserMessage = ({ number }) => {
  const { t } = useTranslation();
  return (
    <>
      <span className="text-[--link-1] font-bold">{number}</span>{" "}
      {t("common.phone_verification_message")}
    </>
  );
};

export const EmailUserMessage = ({ mail }) => {
  const { t } = useTranslation();
  return (
    <>
      <span className="text-[--link-1] font-bold">{mail}</span>{" "}
      {t("common.email_verification_message")}
    </>
  );
};
