//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

//REDUX
import { resetVerifyEmail, verifyEmail } from "../redux/auth/verifyEmailSlice";
import {
  resetSendVerification,
  sendVerificationCode,
} from "../redux/auth/sendVerificationSlice";

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const { success, error, loading } = useSelector(
    (state) => state.auth.verifyEmail
  );
  const {
    error: sendErr,
    success: sendSucc,
    loading: sendLoad,
  } = useSelector((state) => state.auth.sendVerification);

  const [credentials, setCredentials] = useState(null);

  //TAKE THE CREDS FROM PARAMS AND VERIFY
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (email && token) {
      setCredentials({ email, token });
      dispatch(
        verifyEmail({
          email,
          token,
        })
      );
    }
  }, [location]);

  //TOAST
  useEffect(() => {
    if (loading) toast.loading(t("auth.processing"), { id: "verify/send" });
    if (success) {
      toast.dismiss();
      navigate("/login");
    }
    if (error) {
      toast.error(error.message, { id: "verify/send" });
      dispatch(resetVerifyEmail());
      dispatch(sendVerificationCode(credentials));
    }
  }, [loading, success, error]);

  //SEND THE CODE
  useEffect(() => {
    if (sendLoad) {
      toast.loading(t("auth.resending_code"), { id: "verify/send" });
    }
    if (sendSucc) {
      toast.dismiss();
      toast.success(t("auth.code_sent"), { id: "verify/send" });
      dispatch(resetSendVerification());
      navigate("/login");
    }
    if (sendErr) {
      toast.dismiss();
      toast.error(sendErr.message, { id: "verify/send" });
      dispatch(resetSendVerification());
      navigate("/login");
    }
  }, [sendErr, sendLoad, sendSucc]);

  return (
    <section>
      <div></div>
    </section>
  );
};

export default VerifyEmail;
