import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import i18n from "../config/i18n";
import { formatDate } from "../utils/utils";
import { normalizeKeysDeep } from "../utils/normalizeKeys";
import { getAuth } from "../redux/api";
import { getOrders, resetGetOrders } from "../redux/orders/getOrdersSlice";
import { useFirebase } from "./firebase";
import newOrderEnSound from "../assets/sounds/orders/newOrder-EN.mp3";
import newOrderTrSound from "../assets/sounds/orders/newOrder-TR.mp3";

const { t } = i18n;
export const filterInitialState = {
  dateRange: 0,
  startDateTime: "",
  endDateTime: "",
  statusId: "",
  status: { label: t("orders.all"), value: null },
  restaurantIds: [],
  restaurants: [],
  paymentMethodId: "",
  paymentMethod: { label: t("orders.all"), value: null },
  orderType: "",
  orderTypeOption: { label: t("orders.all"), value: null },
  minTotalAmount: "",
  maxTotalAmount: "",
};

const OrdersContext = createContext();
export const useOrders = () => useContext(OrdersContext);

export const OrdersProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { lastPushMessage } = useFirebase();

  const canSetSelectedOrder = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(min-width: 1024px)").matches;

  // Re-render this provider whenever auth state changes, so that the initial
  // fetch effect below can pick up the new token from localStorage. Without
  // this, the provider (mounted at app root) never re-renders after login.
  const sessionId = useSelector((s) => s.auth.login.sessionId);
  const isAuthenticated = !!getAuth()?.token;

  const localItemsPerPage = JSON.parse(
    localStorage.getItem("ITEMS_PER_PAGE"),
  ) || {
    label: "8",
    value: 8,
  };

  const [pageNumber, setPageNumber] = useState(1);
  const [ordersData, setOrdersData] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState(filterInitialState);
  const [pageSize, setPageSize] = useState(localItemsPerPage);

  // Always-current snapshot of filter for push handler (avoids stale closures)
  const filterRef = useRef(filter);
  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const { orders, error } = useSelector((s) => s.orders.get);

  const pageNumbers = () => {
    const numbersColl = [];
    for (let i = 5; i < 51; i += 5) {
      numbersColl.push({ label: `${i}`, value: i });
    }
    return numbersColl;
  };

  const playNewOrderSound = () => {
    const currentLang = (i18n.language || "tr").toLowerCase();
    const soundSrc = currentLang.startsWith("en")
      ? newOrderEnSound
      : newOrderTrSound;

    const sound = new Audio(soundSrc);
    sound.play().catch((err) => {
      console.log("[Orders] Could not play new order sound:", err);
    });
  };

  const parseOrderFromPayload = (payloadData) => {
    const rawOrder = payloadData.order || payloadData.Order;
    if (!rawOrder) return null;

    if (typeof rawOrder === "string") {
      try {
        return normalizeKeysDeep(JSON.parse(rawOrder));
      } catch {
        return null;
      }
    }

    return typeof rawOrder === "object" ? normalizeKeysDeep(rawOrder) : null;
  };

  const getOrderId = (order) =>
    order?.id || order?.Id || order?.orderId || order?.OrderId;

  // One-time initial fetch (and on auth/page-size changes)
  useEffect(() => {
    if (!isAuthenticated) return;
    dispatch(
      getOrders({
        pageNumber,
        pageSize: pageSize.value,
      }),
    );
  }, [dispatch, isAuthenticated, sessionId, pageSize.value]);

  // Sync redux into context state
  useEffect(() => {
    if (orders) {
      setOrdersData(orders.data);
      setTotalCount(orders.totalCount);

      if (canSetSelectedOrder()) {
        setSelectedOrder((prev) => {
          if (!prev) return orders.data.length > 0 ? orders.data[0] : null;
          return orders.data.find((o) => o.id === prev.id) ?? null;
        });
      }

      dispatch(resetGetOrders());
    }

    if (error) dispatch(resetGetOrders());
  }, [orders, error, dispatch]);

  // Process push data coming from FirebaseContext
  useEffect(() => {
    if (!lastPushMessage?.data) return;

    const data = lastPushMessage.data;
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
      // Restaurant filter: ignore pushes for restaurants not in active filter
      const activeRestaurantIds = filterRef.current?.restaurantIds || [];
      const incomingRestaurantId =
        incomingOrder.restaurantId || incomingOrder.RestaurantId;
      const passesRestaurantFilter =
        activeRestaurantIds.length === 0 ||
        !incomingRestaurantId ||
        activeRestaurantIds.includes(incomingRestaurantId);

      if (!passesRestaurantFilter) return;

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

      if (canSetSelectedOrder()) {
        setSelectedOrder((prev) => {
          const prevId = prev?.id || prev?.Id || prev?.orderId || prev?.OrderId;
          return prevId === incomingOrderId
            ? { ...prev, ...incomingOrder }
            : prev;
        });
      }

      if (isNewOrderPush) playNewOrderSound();
    } else if (orderId && newStatus) {
      setOrdersData((prev) =>
        prev.map((o) =>
          (o.id || o.Id || o.orderId || o.OrderId) === orderId
            ? { ...o, status: newStatus }
            : o,
        ),
      );

      if (canSetSelectedOrder()) {
        setSelectedOrder((prev) => {
          const prevId = prev?.id || prev?.Id || prev?.orderId || prev?.OrderId;
          return prevId === orderId ? { ...prev, status: newStatus } : prev;
        });
      }
    } else if (isNewOrderPush) {
      playNewOrderSound();
    }
  }, [lastPushMessage]);

  const handlePageChange = (number) => {
    dispatch(
      getOrders({
        pageNumber: number,
        pageSize: pageSize.value,
        dateRange: filter.dateRange,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        status: filter.statusId,
        restaurantIds: filter.restaurantIds?.length
          ? filter.restaurantIds
          : null,
        paymentMethodId: filter.paymentMethodId || null,
        orderType: filter.orderType || null,
        minTotalAmount:
          filter.minTotalAmount !== "" ? Number(filter.minTotalAmount) : null,
        maxTotalAmount:
          filter.maxTotalAmount !== "" ? Number(filter.maxTotalAmount) : null,
      }),
    );
  };

  const handleItemsPerPage = (number) => {
    dispatch(
      getOrders({
        pageNumber,
        pageSize: number,
        dateRange: filter.dateRange,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        status: filter.statusId,
        restaurantIds: filter.restaurantIds?.length
          ? filter.restaurantIds
          : null,
        paymentMethodId: filter.paymentMethodId || null,
        orderType: filter.orderType || null,
        minTotalAmount:
          filter.minTotalAmount !== "" ? Number(filter.minTotalAmount) : null,
        maxTotalAmount:
          filter.maxTotalAmount !== "" ? Number(filter.maxTotalAmount) : null,
      }),
    );

    const localData = { label: `${number}`, value: number };
    localStorage.removeItem("ITEMS_PER_PAGE");
    localStorage.setItem("ITEMS_PER_PAGE", JSON.stringify(localData));
    setPageSize({ label: `${number}`, value: number });
  };

  const value = useMemo(
    () => ({
      ordersData,
      setOrdersData,
      selectedOrder,
      setSelectedOrder,
      totalCount,
      pageSize,
      setPageSize,
      pageNumber,
      setPageNumber,
      pageNumbers,
      filter,
      setFilter,
      filterInitialState,
      handlePageChange,
      handleItemsPerPage,
    }),
    [ordersData, selectedOrder, totalCount, pageSize, pageNumber, filter],
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
};
