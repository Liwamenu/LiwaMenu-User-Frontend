import Lottie from "lottie-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import TypingEffect from "../../common/typingEffect";

//COMP
import checkAnim from "../../../assets/anim/lottie/check_anim.json";
import congraAnim from "../../../assets/anim/lottie/congra_anim.json";

const SuccessPage = ({ step, currentPath, actionType }) => {
  const { t } = useTranslation();
  const [playAnimation, setPlayAnimation] = useState(false);

  useEffect(() => {
    let timer;
    let clearAnim;

    if (step === 5) {
      timer = setTimeout(() => {
        setPlayAnimation(true);
      }, 2000);

      clearAnim = setTimeout(() => setPlayAnimation(false), 7000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
        setPlayAnimation(false);
      }
      if (clearAnim) {
        clearTimeout(clearAnim);
      }
    };
  }, [step]);

  return (
    <main className="w-full h-full flex justify-center">
      <div className="w-[325px] overflow-visible relative">
        <div className="w-full bg-[--white-1] flex justify-center items-center relative overflow-visible">
          <div className="absolute w-full top-0 left-0">
            {playAnimation && (
              <Lottie animationData={congraAnim} loop={false} />
            )}
          </div>
          <div className="w-60">
            <Lottie animationData={checkAnim} loop={false} />
          </div>
        </div>
        <div className="flex w-full justify-center">
          <div className="text-[--green-1] text-xl mt-10 h-14 w-60">
            <TypingEffect
              text={t("payment.payment_success_typing")}
              speed={40}
              delay={4000}
            />
          </div>
        </div>

        <div className="w-full flex justify-center pb-8">
          <Link
            to={currentPath?.replace(`/${actionType}`, "")}
            className="flex items-center py-2.5 whitespace-nowrap px-4 rounded-md text-sm border-[1.5px] disabled:cursor-not-allowed justify-center text-[--white-1] bg-[--primary-1] border-[--primary-1] group border-none z-[999]"
          >
            {t("payment.go_to_licenses")}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default SuccessPage;
