import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { getAuth } from "../redux/api";
import {
  getWaiterCalls,
  resetWaiterCalls,
} from "../redux/waiterCalls/getWaiterCallsSlice";
import {
  resetResolveWaiterCall,
  resolveWaiterCall,
} from "../redux/waiterCalls/resolveWaiterCallSlice";
import { useFirebase } from "./firebase";
import { formatDate } from "../utils/utils";
import i18n from "../config/i18n";

//SOUNDS
import newOrderEnSound from "../assets/sounds/waiter/callWaiter-EN.mp3";
import newOrderTrSound from "../assets/sounds/waiter/callWaiter-TR.mp3";

export const waiterCallsFilterInitialState = {
  dateRange: 0,
  startDateTime: "",
  endDateTime: "",
  statusId: null,
  isResolved: { label: "Hepsi", value: null },
  restaurant: { label: "Tümü", value: null },
  tableNumber: null,
};

const WaiterCallsContext = createContext();
export const useWaiterCalls = () => useContext(WaiterCallsContext);

export const WaiterCallsProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { lastPushMessage } = useFirebase();

  const localItemsPerPage = JSON.parse(
    localStorage.getItem("ITEMS_PER_PAGE"),
  ) || {
    label: "8",
    value: 8,
  };

  const isAuthenticated = !!getAuth()?.token;
  const { waiterCalls, error } = useSelector((s) => s.waiterCalls.get);

  const [calls, setCalls] = useState(null);
  const [filter, setFilter] = useState(waiterCallsFilterInitialState);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [pageSize, setPageSize] = useState(localItemsPerPage);

  const pageNumbers = () => {
    const numbersColl = [];
    for (let i = 5; i < 51; i += 5) {
      numbersColl.push({ label: `${i}`, value: i });
    }
    return numbersColl;
  };

  const playWaiterCallSound = () => {
    const currentLang = (i18n.language || "tr").toLowerCase();
    const soundSrc = currentLang.startsWith("en")
      ? newOrderEnSound
      : newOrderTrSound;

    const sound = new Audio(soundSrc);
    sound.play().catch((err) => {
      console.log("[WaiterCalls] Could not play waiter call sound:", err);
    });
  };

  const handleResolve = (id) => {
    dispatch(resolveWaiterCall({ waiterCallId: id }))
      .then((result) => {
        if (resolveWaiterCall.fulfilled.match(result)) {
          setCalls((prev) =>
            prev?.map((call) =>
              call.id === id ? { ...call, isResolved: true } : call,
            ),
          );
          toast.success(i18n.t("waiterCalls.resolve_success"));
        }
      })
      .finally(() => {
        dispatch(resetResolveWaiterCall());
      });
  };

  const handleItemsPerPage = (number) => {
    dispatch(
      getWaiterCalls({
        pageNumber,
        pageSize: number,
        dateRange: filter.dateRange,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        isResolved: filter.isResolved.value,
        tableNUmber: filter.tableNumber,
      }),
    );

    const localData = { label: `${number}`, value: number };
    localStorage.removeItem("ITEMS_PER_PAGE");
    localStorage.setItem("ITEMS_PER_PAGE", JSON.stringify(localData));
    setPageSize({ label: `${number}`, value: number });
  };

  const handlePageChange = (number) => {
    dispatch(
      getWaiterCalls({
        pageNumber: number,
        pageSize: pageSize.value,
        dateRange: filter.dateRange,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        isResolved: filter.isResolved.value,
        tableNUmber: filter.tableNumber,
      }),
    );
  };

  // Initial fetch
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!calls) {
      dispatch(getWaiterCalls({ page: pageNumber, pageSize: pageSize.value }));
    }
  }, [calls, dispatch, isAuthenticated, pageNumber, pageSize.value]);

  // Sync redux get response
  useEffect(() => {
    if (waiterCalls) {
      setCalls(waiterCalls.data);
      setTotalCount(waiterCalls.totalCount);
    }
    if (error) dispatch(resetWaiterCalls());
  }, [waiterCalls, error, dispatch]);

  // Realtime push updates from FirebaseContext
  useEffect(() => {
    if (!lastPushMessage?.data) return;

    const data = lastPushMessage.data;
    const type = (data.type || data.Type || "").toLowerCase();
    if (type !== "waiter_call") return;

    let waiterCallPayload = null;
    if (data.waiterCall) {
      if (typeof data.waiterCall === "string") {
        try {
          waiterCallPayload = JSON.parse(data.waiterCall);
        } catch (err) {
          console.log("[WaiterCalls] Invalid waiterCall payload:", err);
        }
      } else if (typeof data.waiterCall === "object") {
        waiterCallPayload = data.waiterCall;
      }
    }

    const normalizedPayload = waiterCallPayload || data;

    const incomingId =
      normalizedPayload.Id ||
      normalizedPayload.id ||
      data.waiterCallId ||
      data.WaiterCallId ||
      `push-${Date.now()}`;

    const newCall = {
      id: incomingId,
      restaurantId:
        normalizedPayload.RestaurantId ||
        normalizedPayload.restaurantId ||
        data.restaurantId ||
        data.RestaurantId ||
        null,
      restaurantName:
        normalizedPayload.RestaurantName ||
        normalizedPayload.restaurantName ||
        data.restaurantName ||
        data.RestaurantName ||
        "-",
      tableNumber:
        normalizedPayload.TableNumber ||
        normalizedPayload.tableNumber ||
        data.tableNumber ||
        data.TableNumber ||
        "-",
      note:
        normalizedPayload.Note ||
        normalizedPayload.note ||
        data.note ||
        data.Note ||
        "",
      createdDateTime:
        normalizedPayload.CreatedDateTime ||
        normalizedPayload.createdDateTime ||
        data.createdDateTime ||
        data.CreatedDateTime ||
        new Date().toISOString(),
      isResolved:
        normalizedPayload.IsResolved ?? normalizedPayload.isResolved ?? false,
    };

    setCalls((prev) => {
      const current = prev || [];
      const exists = current.some((c) => c.id === incomingId);
      if (exists) return current;
      return [newCall, ...current];
    });

    playWaiterCallSound();

    setTotalCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
  }, [lastPushMessage]);

  const value = useMemo(
    () => ({
      calls,
      setCalls,
      filter,
      setFilter,
      pageNumber,
      setPageNumber,
      totalCount,
      pageSize,
      setPageSize,
      pageNumbers,
      handleResolve,
      handleItemsPerPage,
      handlePageChange,
      filterInitialState: waiterCallsFilterInitialState,
    }),
    [calls, filter, pageNumber, totalCount, pageSize],
  );

  return (
    <WaiterCallsContext.Provider value={value}>
      {children}
    </WaiterCallsContext.Provider>
  );
};
