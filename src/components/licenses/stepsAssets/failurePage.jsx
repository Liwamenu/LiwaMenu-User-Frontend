import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import failed_card from "../../../assets/img/failed_card.png";
const FailurePage = ({ currentPath, actionType }) => {
  const { t } = useTranslation();
  return (
    <main className="flex flex-col justify-start items-center pt-16">
      <div className="w-[25rem] overflow-visible">
        <img src={failed_card} alt="failed_card" />
      </div>

      <div className="pt-8 text-center">
        <p className="text-3xl mb-4 text-[--black-2]">
          {t("payment.payment_failed_title")}
        </p>
        <p className="text-[--gr-1] px-4">
          {t("payment.payment_failed_desc")}
        </p>
      </div>

      <div className="w-full flex justify-center pt-4">
        <Link
          to={currentPath?.replace(`/${actionType}`, "")}
          className="flex items-center py-2.5 whitespace-nowrap px-4 rounded-md text-sm border-[1.5px] disabled:cursor-not-allowed justify-center text-[--white-1] bg-[--primary-1] border-[--primary-1] group border-none"
        >
          {t("payment.go_to_licenses")}
        </Link>
      </div>
    </main>
  );
};

export default FailurePage;
