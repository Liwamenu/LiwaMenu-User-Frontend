import { Route, Routes } from "react-router-dom";
import NotFound from "./404";
import PaymentsPage from "../components/payments/pages/paymentsPage";

const Payments = () => {
  return (
    <Routes>
      <Route path="/" element={<PaymentsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Payments;
