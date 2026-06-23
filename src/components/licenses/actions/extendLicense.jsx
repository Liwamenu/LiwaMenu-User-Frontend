// MODULES
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

// COMPONENTS
import { ExtendI } from "../../../assets/icon";
import ActionButton from "../../common/actionButton";

const ExtendLicense = ({ licenseData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, restaurant } = location.state || {};

  const handleClick = (event) => {
    event.stopPropagation();
    const currentPath = location.pathname;
    navigate(`${currentPath}/extend-license`, {
      state: { user, restaurant, currentLicense: licenseData },
    });
  };

  return (
    <ActionButton
      element={<ExtendI className="w-[1.1rem]" />}
      element2={t("licenses.extend")}
      onClick={handleClick}
    />
  );
};

export default ExtendLicense;
