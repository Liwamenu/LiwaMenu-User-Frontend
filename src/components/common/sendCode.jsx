//MODULES
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

//COMP
import { GobackI } from "../../assets/icon";
import LoadingI from "../../assets/anim/loading";
import CustomPhoneInput from "./customPhoneInput";

// ASSETS
import {
  resetSendVerification,
  sendVerificationCode,
} from "../../redux/auth/userVerificationSlice";

const SendCode = ({ phoneNumber, setPhoneNumber, setToVerify }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const { success, loading, error } = useSelector(
    (state) => state.auth.sendVerification
  );

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(sendVerificationCode({ phoneNumber: phoneNumber.slice(1) }));
  }

  //TOAST AND ACTION FOR SEND CODE
  useEffect(() => {
    if (success) {
      toast.success(t("common.verification_sent"));
      setToVerify(true);
      dispatch(resetSendVerification());
    }
    if (error) {
      toast.dismiss();
      toast.error(error.message);
      dispatch(resetSendVerification());
    }
  }, [success, error, loading]);

  return (
    <form
      className="flex flex-col w-full max-w-[38rem] px-12"
      onSubmit={handleSubmit}
    >
      <div className="flex justify-center relative">
        <div className="absolute left-0 top-0 bottom-0 flex items-center">
          <button
            type="button"
            onClick={() => {
              window.history.back();
            }}
            className="flex items-center justify-center sm:px-5 py-2 text-sm transition-colors duration-200 border-0 rounded-lg gap-x-2 text-[--white-1]"
          >
            <GobackI strokeWidth={2} className="size-[1.7rem]" />
            {/* <span>Gri dön</span> */}
          </button>
        </div>
        <div className="w-max">
          <h2 className="text-[2.3rem] font-bold text-[--white-1] tracking-tighter">
            {t("common.confirmation")}
          </h2>
        </div>
      </div>
      <div className="flex flex-col max-w-full">
        <CustomPhoneInput
          label={t("common.phone_label")}
          type="number"
          placeholder={t("common.phone_label")}
          value={phoneNumber}
          onChange={(phone) => setPhoneNumber(phone)}
          required={true}
          className="py-2 bg-transparent text-[var(--white-1)]"
          className5="text-[var(--white-1)]"
        />
        <div className="flex flex-col mt-10 w-full">
          <button
            disabled={loading}
            type="submit"
            className="flex justify-center px-7 py-2 text-md rounded-md bg-[--primary-1] text-white hover:opacity-90 disabled:opacity-90 disabled:cursor-not-allowed"
          >
            {loading ? <LoadingI className="h-7" /> : t("common.continue")}
          </button>
          <div className="shrink-0 mt-5 h-px bg-slate-200 w-full mb-24" />
        </div>
      </div>
    </form>
  );
};

export default SendCode;
