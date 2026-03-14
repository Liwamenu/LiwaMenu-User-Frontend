import { Route, Routes } from "react-router-dom";

import NotFound from "./404";
import ReservationsPage from "../components/reservations/pages/reservationsPage";

const Reservations = () => {
  return (
    <Routes>
      <Route path="/" element={<ReservationsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Reservations;
