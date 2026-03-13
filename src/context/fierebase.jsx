import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  initFirebaseMessaging,
  subscribeForegroundMessages,
  requestPushPermissionToken,
} from "../firebase";
import { getOrders, resetGetOrders } from "../redux/orders/getOrdersSlice";
import { getAuth } from "../redux/api";
import i18n from "../config/i18n";
import newOrderEnSound from "../assets/sounds/newOrder-EN.mp3";
import newOrderTrSound from "../assets/sounds/newOrder-TR.mp3";

const FirebaseContext = createContext();
export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
  const dispatch = useDispatch();

  const [pushToken, setPushToken] = useState(null);
  const [notificationPermission, setNotificationPermission] =
    useState("default");
  const [ordersData, setOrdersData] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { orders, error } = useSelector((s) => s.orders.get);

  // Ref so the async init can always reach the latest unsubscribe fn
  const unsubscribeRef = useRef(() => {});
  const isAuthenticated = !!getAuth()?.token;

  // ── 1. Initialize Firebase & subscribe to foreground/background messages ────
  useEffect(() => {
    const playNewOrderSound = () => {
      const currentLang = (i18n.language || "tr").toLowerCase();
      const soundSrc = currentLang.startsWith("en")
        ? newOrderEnSound
        : newOrderTrSound;

      const sound = new Audio(soundSrc);
      sound.play().catch((err) => {
        console.log("[Firebase] Could not play new order sound:", err);
      });
    };

    const parseOrderFromPayload = (payloadData) => {
      const rawOrder = payloadData.order || payloadData.Order;
      if (!rawOrder) return null;

      if (typeof rawOrder === "string") {
        try {
          return JSON.parse(rawOrder);
        } catch {
          return null;
        }
      }

      return typeof rawOrder === "object" ? rawOrder : null;
    };

    const getOrderId = (order) =>
      order?.id || order?.Id || order?.orderId || order?.OrderId;

    // Handler shared by foreground (FCM onMessage) and background (SW postMessage)
    const handlePush = (data, source) => {
      // Log the RAW data so we can see exactly what the backend sends
      console.log(`[Firebase] 🔔 Push received (${source}):`, data);

      const pushType = (data.type || data.Type || "").toLowerCase();
      const orderId = data.orderId || data.OrderId;
      const newStatus = data.status || data.Status;
      const incomingOrder = parseOrderFromPayload(data);
      const incomingOrderId = getOrderId(incomingOrder);

      const isNewOrderPush =
        pushType.includes("new_order") ||
        pushType.includes("order_created") ||
        (!!incomingOrder && !newStatus) ||
        (orderId && !newStatus);

      if (incomingOrder && incomingOrderId) {
        console.log(
          `[Firebase] 📥 Upserting order from payload: ${incomingOrderId}`,
        );
        setOrdersData((prev) => {
          const existingIndex = prev.findIndex(
            (o) => (o.id || o.Id || o.orderId || o.OrderId) === incomingOrderId,
          );
          if (existingIndex === -1) return [incomingOrder, ...prev];

          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...incomingOrder,
          };
          return updated;
        });

        setSelectedOrder((prev) => {
          const prevId = prev?.id || prev?.Id || prev?.orderId || prev?.OrderId;
          return prevId === incomingOrderId
            ? { ...prev, ...incomingOrder }
            : prev;
        });

        if (isNewOrderPush) {
          console.log("[Firebase] 🔊 Playing new order sound");
          playNewOrderSound();
        }
      } else if (orderId && newStatus) {
        console.log(
          `[Firebase] ✅ Status update: order ${orderId} → ${newStatus}`,
        );
        setOrdersData((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
        );
        setSelectedOrder((prev) =>
          prev?.id === orderId ? { ...prev, status: newStatus } : prev,
        );
      } else {
        if (isNewOrderPush) {
          console.log("[Firebase] 🔊 Playing new order sound");
          playNewOrderSound();
        }

        console.log("[Firebase] ℹ️ Push did not contain usable order payload");
      }
    };

    // Background messages – SW bridges push events via postMessage
    const onSwMessage = (event) => {
      console.log("[Firebase] SW postMessage raw:", event.data);
      if (event.data?.type !== "FCM_BACKGROUND") return;
      handlePush(event.data?.data || {}, "background-sw");
    };

    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    // Async init – use ref so cleanup always cancels the right listener
    (async () => {
      const { token, permission } = await initFirebaseMessaging();
      if (permission) setNotificationPermission(permission);
      if (token) setPushToken(token);

      // Cancel any previous foreground listener before registering a new one
      unsubscribeRef.current();

      // Foreground messages – app tab is active
      unsubscribeRef.current = subscribeForegroundMessages((payload) => {
        console.log("[Firebase] 🔔 Foreground FCM raw payload:", payload);
        handlePush(payload?.data || {}, "foreground");
      });
    })();

    return () => {
      unsubscribeRef.current();
      unsubscribeRef.current = () => {};
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [dispatch]);

  const requestNotificationAccess = async () => {
    const { token, permission } = await requestPushPermissionToken();
    if (permission) setNotificationPermission(permission);
    if (token) setPushToken(token);
    return { token, permission };
  };

  // ── 2. Initial orders fetch ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(getOrders());
  }, [dispatch, isAuthenticated]);

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
        notificationPermission,
        requestNotificationAccess,
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
