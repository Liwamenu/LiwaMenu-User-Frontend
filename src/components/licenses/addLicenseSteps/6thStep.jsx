//MODULES
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

//COMP
import SuccessPage from "../stepsAssets/successPage";
import FailurePage from "../stepsAssets/failurePage";

const SixthStep = ({ step, paymentStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const pathArray = location.pathname.split("/");
  const actionType = pathArray[pathArray.length - 1];

  useEffect(() => {
    let goToLicenses;
    console.log(step);

    if (step === 6) {
      goToLicenses = setTimeout(
        () => navigate(currentPath?.replace(`/${actionType}`, "")),
        7000,
      );
    }

    return () => {
      if (goToLicenses) {
        clearTimeout(goToLicenses);
      }
    };
  }, [step]);

  return (
    step === 6 &&
    (paymentStatus === "success" ? (
      <SuccessPage
        step={step}
        currentPath={currentPath}
        actionType={actionType}
      />
    ) : (
      <FailurePage currentPath={currentPath} actionType={actionType} />
    ))
  );
};

export default SixthStep;
