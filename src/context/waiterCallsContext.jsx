import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { getAuth, privateApi } from "../redux/api";
import {
  getWaiterCalls,
  resetWaiterCalls,
} from "../redux/waiterCalls/getWaiterCallsSlice";
import {
  resetResolveWaiterCall,
  resolveWaiterCall,
} from "../redux/waiterCalls/resolveWaiterCallSlice";
import {
  deleteWaiterCall,
  resetDeleteWaiterCall,
} from "../redux/waiterCalls/deleteWaiterCallSlice";
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

// How long after a waiter call arrives before "Çağrıları Otomatik Çöz"
// silently marks it resolved. 1 dakika.
const AUTO_RESOLVE_DELAY_MS = 60_000;

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

  // Subscribe to login state so the provider re-renders after login and the
  // initial fetch effect below picks up the freshly-stored token.
  const sessionId = useSelector((s) => s.auth.login.sessionId);
  const isAuthenticated = !!getAuth()?.token;
  const { waiterCalls, error } = useSelector((s) => s.waiterCalls.get);
  // Restaurant list cache — lets us read each call's restaurant's
  // `autoResolveWaiterCalls` setting (default ON when the restaurant
  // isn't in the cache yet).
  const restaurantsList = useSelector(
    (s) => s.restaurants?.getRestaurants?.restaurants?.data,
  );

  const [calls, setCalls] = useState(null);
  // Latest `calls`, readable inside the auto-resolve timer without
  // re-arming it; plus a registry of pending timers to clear on unmount.
  const callsRef = useRef([]);
  const autoResolveTimersRef = useRef(new Map());
  useEffect(() => {
    callsRef.current = calls || [];
  }, [calls]);
  useEffect(
    () => () => {
      autoResolveTimersRef.current.forEach((t) => clearTimeout(t));
      autoResolveTimersRef.current.clear();
    },
    [],
  );
  const [filter, setFilter] = useState(waiterCallsFilterInitialState);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [pageSize, setPageSize] = useState(localItemsPerPage);
  const [deletingAll, setDeletingAll] = useState(false);

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

  // `silent` skips the success toast — used by the auto-resolve timer so
  // automatic resolutions don't spam a toast per call.
  const handleResolve = (id, { silent = false } = {}) => {
    // `silent` (used by auto-resolve) also suppresses the global
    // full-screen loader via `__silent` so background resolutions don't
    // flash the spinner; the slice strips the flag before the request body.
    dispatch(
      resolveWaiterCall({
        waiterCallId: id,
        ...(silent ? { __silent: true } : {}),
      }),
    )
      .then((result) => {
        if (resolveWaiterCall.fulfilled.match(result)) {
          setCalls((prev) =>
            prev?.map((call) =>
              call.id === id ? { ...call, isResolved: true } : call,
            ),
          );
          if (!silent) toast.success(i18n.t("waiterCalls.resolve_success"));
        }
      })
      .finally(() => {
        dispatch(resetResolveWaiterCall());
      });
  };

  // Per-restaurant "Çağrıları Otomatik Çöz" setting. Defaults to ON when
  // the restaurant isn't found in the cache (matches the settings-form
  // default), so the automation works before the list is loaded / before
  // the backend ships the field.
  const isAutoResolveEnabled = (restaurantId) => {
    const r = (restaurantsList || []).find((x) => x?.id === restaurantId);
    return r?.autoResolveWaiterCalls ?? true;
  };

  // Hard-delete a waiter call. Optimistic: drop the row + decrement
  // totalCount immediately, snapshot for rollback, dispatch the
  // thunk, roll back on failure. The api response interceptor toasts
  // backend errors; the success branch shows a confirmation toast.
  const handleDelete = async (id) => {
    let snapshot;
    setCalls((prev) => {
      snapshot = prev;
      return (prev || []).filter((c) => c.id !== id);
    });
    setTotalCount((prev) =>
      typeof prev === "number" ? Math.max(0, prev - 1) : prev,
    );

    const result = await dispatch(deleteWaiterCall(id));
    dispatch(resetDeleteWaiterCall());

    if (deleteWaiterCall.fulfilled.match(result)) {
      toast.success(i18n.t("waiterCalls.delete_success"), {
        id: "deleteWaiterCallSuccess",
      });
      return true;
    }
    if (snapshot) setCalls(snapshot);
    setTotalCount((prev) =>
      typeof prev === "number" ? prev + 1 : prev,
    );
    return false;
  };

  // Bulk "delete everything" for housekeeping. The list can pile up to
  // hundreds of calls and there's no backend bulk endpoint, so we loop:
  // fetch a page, delete those ids in parallel batches, repeat until the
  // list is empty. Fetching page 1 each round (rather than pre-collecting
  // every id) stays correct no matter how the backend treats the page
  // params, and naturally drains the queue. Uses privateApi directly (not
  // the delete thunk) so we don't fire hundreds of Redux actions / flash
  // the global loader; the api interceptor dedupes any error toasts.
  const handleDeleteAll = async () => {
    const apiClient = privateApi();
    const base = import.meta.env.VITE_BASE_URL;
    const FETCH_SIZE = 100;
    const BATCH = 8;
    let deleted = 0;
    let failed = 0;

    setDeletingAll(true);
    try {
      // `round` is bounded so a backend that keeps returning the same
      // undeletable rows can't spin forever.
      for (let round = 0; round < 200; round += 1) {
        let rows = [];
        try {
          const res = await apiClient.get(
            `${base}Notifications/GetWaiterCalls`,
            { params: { pageNumber: 1, pageSize: FETCH_SIZE } },
          );
          rows = Array.isArray(res.data?.data) ? res.data.data : [];
        } catch {
          break; // GET failed (interceptor already toasted) — stop.
        }

        const ids = rows.map((c) => c.id || c.Id).filter(Boolean);
        if (ids.length === 0) break;

        let roundFailed = 0;
        for (let i = 0; i < ids.length; i += BATCH) {
          const results = await Promise.allSettled(
            ids
              .slice(i, i + BATCH)
              .map((id) =>
                apiClient.delete(
                  `${base}Notifications/DeleteWaiterCall?waiterCallId=${id}`,
                ),
              ),
          );
          results.forEach((r) => {
            if (r.status === "fulfilled") deleted += 1;
            else {
              failed += 1;
              roundFailed += 1;
            }
          });
        }

        // Whole round failed → the same rows will come back forever.
        if (roundFailed === ids.length) break;
      }
    } finally {
      // Clear optimistically, then refetch page 1 so a partial failure
      // still surfaces whatever survived.
      setCalls([]);
      setTotalCount(0);
      setPageNumber(1);
      dispatch(getWaiterCalls({ pageNumber: 1, pageSize: pageSize.value }));
      setDeletingAll(false);
    }

    return { deleted, failed };
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
  }, [calls, dispatch, isAuthenticated, sessionId, pageNumber, pageSize.value]);

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

    // Ignore duplicate pushes (same call delivered more than once).
    const exists = (callsRef.current || []).some((c) => c.id === incomingId);
    if (exists) return;

    setCalls((prev) => [newCall, ...(prev || [])]);
    setTotalCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
    playWaiterCallSound();

    // NOTE: auto-resolve is NOT armed here anymore — the dedicated effect
    // below watches the whole `calls` list, so it covers this push AND
    // calls loaded from the GET / already on screen.
  }, [lastPushMessage]);

  // ── Auto-resolve active calls ──────────────────────────────────────
  // For every UNRESOLVED call whose restaurant has "Çağrıları Otomatik
  // Çöz" enabled, schedule a silent resolve ~1 min after the call arrived.
  // Unlike the old push-only timer, this watches the entire `calls` list,
  // so it also clears calls loaded from the GET or already on screen when
  // the setting was turned on. Age-aware: a fresh call still waits the full
  // delay; one that's already older resolves almost immediately. Timers are
  // deduped per call id (Map) so re-renders / polls don't double-schedule,
  // and they self-clean on fire and on unmount.
  useEffect(() => {
    if (!calls?.length) return;
    const timers = autoResolveTimersRef.current;
    calls.forEach((call) => {
      if (!call || call.isResolved || timers.has(call.id)) return;
      if (!isAutoResolveEnabled(call.restaurantId)) return;
      const arrived = new Date(call.createdDateTime).getTime();
      const age = Number.isFinite(arrived) ? Date.now() - arrived : 0;
      const delay = Math.max(0, AUTO_RESOLVE_DELAY_MS - age);
      const tid = setTimeout(() => {
        timers.delete(call.id);
        const still = (callsRef.current || []).find(
          (c) => c.id === call.id && !c.isResolved,
        );
        if (still) handleResolve(call.id, { silent: true });
      }, delay);
      timers.set(call.id, tid);
    });
  }, [calls, restaurantsList]);

  // ── Keep the list live without a manual refresh ────────────────────
  // FCM push is best-effort (and frequently doesn't arrive on localhost),
  // which left the page stale until a reload. Poll the current page on a
  // short interval and immediately when the tab regains focus. Silent, so
  // the global full-screen loader never flashes. This also feeds the
  // auto-resolve effect above with newly-arrived calls. Polls are skipped
  // while the tab is hidden to avoid pointless background traffic.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      dispatch(
        getWaiterCalls({
          pageNumber,
          pageSize: pageSize.value,
          dateRange: filter.dateRange,
          startDateTime: filter.endDateTime
            ? formatDate(filter.startDateTime)
            : null,
          endDateTime: filter.endDateTime
            ? formatDate(filter.endDateTime)
            : null,
          isResolved: filter.isResolved.value,
          tableNUmber: filter.tableNumber,
          __silent: true,
        }),
      );
    };
    const intervalId = setInterval(poll, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", poll);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", poll);
    };
  }, [isAuthenticated, sessionId, pageNumber, pageSize.value, filter, dispatch]);

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
      handleDelete,
      handleDeleteAll,
      deletingAll,
      handleItemsPerPage,
      handlePageChange,
      filterInitialState: waiterCallsFilterInitialState,
    }),
    [calls, filter, pageNumber, totalCount, pageSize, deletingAll],
  );

  return (
    <WaiterCallsContext.Provider value={value}>
      {children}
    </WaiterCallsContext.Provider>
  );
};
