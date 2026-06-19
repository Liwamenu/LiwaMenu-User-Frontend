//MODULES
import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

//COMP
import Home from "./pages/home";
import Login from "./pages/login";
import NotFound from "./pages/404";
// import Verify from "./pages/verify";
import Register from "./pages/register";
import Popup from "./components/common/popup";
import PaymentFailed from "./pages/paymentFailed";
import PaymentSuccess from "./pages/paymentSuccess";
// import PrivacyPolicy from "./pages/privacyPolicy";
import ProtectedRoute from "./components/protect";
import VerifyEmail from "./pages/verifyEmail";
import SetNewPassword from "./pages/setNewPassword";
import ForgotPassword from "./pages/forgotPassword";

//SITE — marketing landing shown at "/" (merged liwamenu.com)
import SiteLanding from "./site/App";

//REDUX & i18n
import { getAuth } from "./redux/api";
import { getUser } from "./redux/user/getUserSlice";
import { setTranslationLanguage } from "./config/i18n";

function App() {
  const dispatch = useDispatch();
  const freshUser = useSelector((s) => s.user.getUser.user);

  // On boot (and on every page refresh), if the user is logged in, fetch
  // their current profile from the server. The slice persists it back into
  // localStorage so all consumers see fresh values without a re-login.
  useEffect(() => {
    if (getAuth()?.token) {
      dispatch(getUser());
    }
  }, [dispatch]);

  // Whenever the server returns a fresh defaultLang, propagate it to i18n
  // so the UI re-renders in the chosen language without a hard reload.
  useEffect(() => {
    const lang = freshUser?.defaultLang;
    if (lang !== undefined && lang !== null) {
      setTranslationLanguage(lang);
    }
  }, [freshUser?.defaultLang]);

  return (
    <div>
      <Popup />
      <Routes>
        {/* Marketing site — public landing at "/" (Yönetim Paneli → /login).
            Exact "/" outranks the protected "/*" splat below. */}
        <Route
          path="/"
          element={
            <div className="site-root">
              <SiteLanding />
            </div>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email/*" element={<VerifyEmail />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<SetNewPassword />} />
        {/* PayTR 3DS return URLs — mounted ABOVE the protected branch
            so the iframe can land here without an auth header (PayTR's
            redirect won't carry session cookies). */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        {/*  <Route path="/verify" element={<Verify />} />
          <Route path="/privacyPolicy" element={<PrivacyPolicy />} /> */}
        <Route
          element={
            // <OrdersContextProvider>
            <ProtectedRoute />
            // </OrdersContextProvider>
          }
        >
          <Route path="/*" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
