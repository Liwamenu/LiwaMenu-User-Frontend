import { Route, Routes } from "react-router-dom";
import NotFound from "./404";
import OrdersPage from "../components/orders/pages/ordersPage";

const Orders = () => {
  return (
    <Routes>
      <Route path="/" element={<OrdersPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Orders;
