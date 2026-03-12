import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  initFirebaseMessaging,
  subscribeForegroundMessages,
} from "../firebase";
import { getOrders, resetGetOrders } from "../redux/orders/getOrdersSlice";

const FirebaseContext = createContext();
export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
  const dispatch = useDispatch();

  const [pushToken, setPushToken] = useState(null);
  const [ordersData, setOrdersData] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { orders, error } = useSelector((s) => s.orders.get);

  // ── 1. Initialize Firebase & subscribe to foreground messages ───────────────
  useEffect(() => {
    let unsubscribe = () => {};

    // Handler shared by both foreground (FCM) and background (SW postMessage)
    const handleOrderPush = ({ orderId, newStatus, source }) => {
      console.log(`[Firebase] 📦 Order push (${source}):`, {
        orderId,
        newStatus,
      });
      if (orderId && newStatus) {
        // Status change – update in place
        console.log(`[Firebase] Updating order ${orderId} → ${newStatus}`);
        setOrdersData((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        setSelectedOrder((prev) =>
          prev?.id === orderId ? { ...prev, status: newStatus } : prev,
        );
      } else {
        // New order or unknown change – re-fetch
        console.log("[Firebase] New order detected, re-fetching orders...");
        dispatch(getOrders());
      }
    };

    (async () => {
      const { token } = await initFirebaseMessaging();
      if (token) setPushToken(token);

      // Foreground messages (app is open and focused)
      unsubscribe = subscribeForegroundMessages((payload) => {
        const data = payload?.data || {};
        const type = (data.type || "").toLowerCase();
        if (!type.includes("order")) return;
        handleOrderPush({
          orderId: data.orderId,
          newStatus: data.status,
          source: "foreground",
        });
      });
    })();

    // Background messages (app open but not focused – SW posts a message back)
    const onSwMessage = (event) => {
      console.log("[Firebase] SW postMessage received:", event.data);
      if (event.data?.type !== "FCM_BACKGROUND") return;
      const data = event.data?.data || {};
      const type = (data.type || "").toLowerCase();
      if (!type.includes("order")) return;
      handleOrderPush({
        orderId: data.orderId,
        newStatus: data.status,
        source: "background-sw",
      });
    };

    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    return () => {
      unsubscribe();
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [dispatch]);

  // ── 2. Initial orders fetch ─────────────────────────────────────────────────
  useEffect(() => {
    dispatch(getOrders());
  }, [dispatch]);

  // ── 3. Sync redux response into local state ─────────────────────────────────
  useEffect(() => {
    if (orders) {
      setOrdersData(orders);
      setSelectedOrder((prev) => {
        if (!prev) return orders.length > 0 ? orders[0] : null;
        return orders.find((o) => o.id === prev.id) ?? null;
      });
      dispatch(resetGetOrders());
    }
    if (error) dispatch(resetGetOrders());
  }, [orders, error, dispatch]);

  return (
    <FirebaseContext.Provider
      value={{
        pushToken,
        ordersData,
        setOrdersData,
        selectedOrder,
        setSelectedOrder,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
