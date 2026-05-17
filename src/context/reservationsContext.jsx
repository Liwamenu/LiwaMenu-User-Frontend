import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import i18n from "../config/i18n";

import { getAuth } from "../redux/api";
import {
  getReservations,
  resetGetReservations,
} from "../redux/reservations/getReservationsSlice";
import {
  resetUpdateReservationStatus,
  updateReservationStatus,
} from "../redux/reservations/updateReservationStatusSlice";
import {
  deleteReservation,
  resetDeleteReservation,
} from "../redux/reservations/deleteReservationSlice";
import { useFirebase } from "./firebase";

import newReservationEnSound from "../assets/sounds/reservations/new-reservation-EN.mp3";
import newReservationTrSound from "../assets/sounds/reservations/new-reservation-TR.mp3";

export const reservationsFilterInitialState = {
  statusId: null,
  status: { label: "All", value: null },
  dateFrom: "",
  dateTo: "",
  searchKey: "",
  fullName: "",
  phoneNumber: "",
  minGuestCount: "",
  maxGuestCount: "",
};

const ReservationsContext = createContext();
export const useReservations = () => useContext(ReservationsContext);

export const ReservationsProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { lastPushMessage } = useFirebase();

  const localItemsPerPage = JSON.parse(
    localStorage.getItem("ITEMS_PER_PAGE"),
  ) || {
    label: "20",
    value: 20,
  };

  // Subscribe to login state so the provider re-renders after login and the
  // initial fetch effect below picks up the freshly-stored token + restaurantId.
  const sessionId = useSelector((s) => s.auth.login.sessionId);
  const isAuthenticated = !!getAuth()?.token;
  const auth = getAuth();
  const restaurantId =
    auth?.restaurantId ||
    auth?.user?.restaurantId ||
    auth?.user?.restaurant?.id ||
    null;

  const { reservations, error } = useSelector((s) => s.reservations.get);
  const { loading: updateLoading } = useSelector(
    (s) => s.reservations.updateStatus,
  );

  const [reservationsData, setReservationsData] = useState([]);
  const [filter, setFilter] = useState(reservationsFilterInitialState);
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

  const playNewReservationSound = () => {
    const currentLang = (i18n.language || "tr").toLowerCase();
    const soundSrc = currentLang.startsWith("en")
      ? newReservationEnSound
      : newReservationTrSound;

    const sound = new Audio(soundSrc);
    sound.play().catch((err) => {
      console.log("[Reservations] Could not play reservation sound:", err);
    });
  };

  const formatDateForApi = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split("T")[0];
  };

  const normalizeReservation = (reservation) => ({
    id: reservation?.id || reservation?.Id,
    restaurantId: reservation?.restaurantId || reservation?.RestaurantId,
    fullName: reservation?.fullName || reservation?.FullName || "-",
    phoneCountryCode:
      reservation?.phoneCountryCode || reservation?.PhoneCountryCode || "",
    phoneNumber: reservation?.phoneNumber || reservation?.PhoneNumber || "",
    email: reservation?.email || reservation?.Email || "",
    reservationDate:
      reservation?.reservationDate || reservation?.ReservationDate || "",
    reservationTime:
      reservation?.reservationTime || reservation?.ReservationTime || "",
    guestCount: reservation?.guestCount || reservation?.GuestCount || 0,
    specialNotes: reservation?.specialNotes || reservation?.SpecialNotes || "",
    isVerified: reservation?.isVerified ?? reservation?.IsVerified ?? false,
    status:
      reservation?.status || reservation?.Status || "PendingOwnerDecision",
    ownerDecisionNote:
      reservation?.ownerDecisionNote || reservation?.OwnerDecisionNote || null,
    verifiedAt: reservation?.verifiedAt || reservation?.VerifiedAt || null,
    ownerDecisionAt:
      reservation?.ownerDecisionAt || reservation?.OwnerDecisionAt || null,
    createdDateTime:
      reservation?.createdDateTime || reservation?.CreatedDateTime || null,
  });

  const buildQuery = (custom = {}) => {
    const query = {
      restaurantId,
      status: filter.statusId,
      dateFrom: formatDateForApi(filter.dateFrom),
      dateTo: formatDateForApi(filter.dateTo),
      searchKey: filter.searchKey || null,
      fullName: filter.fullName || null,
      phoneNumber: filter.phoneNumber || null,
      minGuestCount: filter.minGuestCount ? Number(filter.minGuestCount) : null,
      maxGuestCount: filter.maxGuestCount ? Number(filter.maxGuestCount) : null,
      pageNumber,
      pageSize: pageSize.value,
      ...custom,
    };

    return Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== null && value !== "" && value !== undefined,
      ),
    );
  };

  const fetchReservations = (custom = {}) => {
    dispatch(getReservations(buildQuery(custom)));
  };

  const handleUpdateStatus = (reservationId, status, note = "") => {
    dispatch(
      updateReservationStatus({
        reservationId,
        status,
        note,
      }),
    )
      .then((result) => {
        if (updateReservationStatus.fulfilled.match(result)) {
          setReservationsData((prev) =>
            prev.map((reservation) =>
              reservation.id === reservationId
                ? {
                    ...reservation,
                    status,
                    ownerDecisionNote: note || null,
                    ownerDecisionAt: new Date().toISOString(),
                  }
                : reservation,
            ),
          );
          toast.success("Reservation status updated.");
        }
      })
      .finally(() => {
        dispatch(resetUpdateReservationStatus());
      });
  };

  // Hard-delete a reservation. Optimistic: drop the row + decrement
  // totalCount immediately, snapshot for rollback, dispatch the
  // thunk, roll back on failure.
  const handleDelete = async (id) => {
    let snapshot;
    setReservationsData((prev) => {
      snapshot = prev;
      return prev.filter((r) => r.id !== id);
    });
    setTotalCount((prev) =>
      typeof prev === "number" ? Math.max(0, prev - 1) : prev,
    );

    const result = await dispatch(deleteReservation(id));
    dispatch(resetDeleteReservation());

    if (deleteReservation.fulfilled.match(result)) {
      toast.success(i18n.t("reservationsPage.delete_success"), {
        id: "deleteReservationSuccess",
      });
      return true;
    }
    if (snapshot) setReservationsData(snapshot);
    setTotalCount((prev) =>
      typeof prev === "number" ? prev + 1 : prev,
    );
    return false;
  };

  const handleApplyFilter = () => {
    setPageNumber(1);
    fetchReservations({ pageNumber: 1 });
  };

  const handleClearFilter = () => {
    setFilter(reservationsFilterInitialState);
    setPageNumber(1);
    const resetQuery = {
      restaurantId,
      pageNumber: 1,
      pageSize: pageSize.value,
    };
    dispatch(getReservations(resetQuery));
  };

  const handlePageChange = (number) => {
    dispatch(getReservations(buildQuery({ pageNumber: number })));
  };

  const handleItemsPerPage = (number) => {
    dispatch(
      getReservations(
        buildQuery({
          pageNumber,
          pageSize: number,
        }),
      ),
    );

    const localData = { label: `${number}`, value: number };
    localStorage.removeItem("ITEMS_PER_PAGE");
    localStorage.setItem("ITEMS_PER_PAGE", JSON.stringify(localData));
    setPageSize(localData);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchReservations({ pageNumber: 1, pageSize: pageSize.value });
  }, [dispatch, isAuthenticated, sessionId, restaurantId, pageSize.value]);

  useEffect(() => {
    if (reservations) {
      const rows = Array.isArray(reservations?.data)
        ? reservations.data
        : Array.isArray(reservations)
          ? reservations
          : [];

      setReservationsData(
        rows.map((reservation) => normalizeReservation(reservation)),
      );
      setTotalCount(
        typeof reservations?.totalCount === "number"
          ? reservations.totalCount
          : rows.length,
      );
      dispatch(resetGetReservations());
    }

    if (error) dispatch(resetGetReservations());
  }, [reservations, error, dispatch]);

  useEffect(() => {
    if (!lastPushMessage?.data) return;

    const data = lastPushMessage.data;
    const type = (data.type || data.Type || "").toLowerCase();
    if (type !== "reservation_verified") return;

    let incomingReservation = null;
    const rawReservation = data.reservation || data.Reservation;

    if (typeof rawReservation === "string") {
      try {
        incomingReservation = JSON.parse(rawReservation);
      } catch (err) {
        console.log("[Reservations] Invalid reservation payload:", err);
      }
    } else if (rawReservation && typeof rawReservation === "object") {
      incomingReservation = rawReservation;
    }

    if (!incomingReservation) return;

    const normalized = normalizeReservation(incomingReservation);
    if (!normalized?.id) return;

    if (
      restaurantId &&
      normalized.restaurantId &&
      normalized.restaurantId !== restaurantId
    ) {
      return;
    }

    setReservationsData((prev) => {
      const current = prev || [];
      const existingIndex = current.findIndex(
        (item) => item.id === normalized.id,
      );

      if (existingIndex === -1) {
        setTotalCount((count) => (typeof count === "number" ? count + 1 : 1));
        return [normalized, ...current];
      }

      const updated = [...current];
      updated[existingIndex] = {
        ...updated[existingIndex],
        ...normalized,
      };
      return updated;
    });

    playNewReservationSound();
  }, [lastPushMessage, restaurantId]);

  const value = useMemo(
    () => ({
      reservationsData,
      setReservationsData,
      filter,
      setFilter,
      pageNumber,
      setPageNumber,
      totalCount,
      pageSize,
      setPageSize,
      pageNumbers,
      handleUpdateStatus,
      handleDelete,
      handleItemsPerPage,
      handlePageChange,
      handleApplyFilter,
      handleClearFilter,
      filterInitialState: reservationsFilterInitialState,
      updateLoading,
    }),
    [reservationsData, filter, pageNumber, totalCount, pageSize, updateLoading],
  );

  return (
    <ReservationsContext.Provider value={value}>
      {children}
    </ReservationsContext.Provider>
  );
};
