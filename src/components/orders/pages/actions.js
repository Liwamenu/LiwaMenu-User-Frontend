import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useFirebase } from "../../../context/firebase";
import {
  updateOrderStatus,
  resetUpdateOrderStatus,
} from "../../../redux/orders/updateOrderStatusSlice";

/**
 * Hook that returns an `updateStatus(orderId, newStatus)` function.
 * - Optimistically updates the local context state immediately.
 * - Dispatches the updateOrderStatus thunk.
 * - Shows toast.success on success; rolls back on failure.
 */
export function useOrderStatusActions() {
  const dispatch = useDispatch();
  const { setOrdersData, setSelectedOrder } = useFirebase();

  const updateStatus = async (orderId, newStatus) => {
    // ── Optimistic update + snapshot for rollback ───────────────────────────
    let snapshot;
    setOrdersData((prev) => {
      snapshot = prev;
      return prev.map((o) =>
        o.id === orderId ? { ...o, status: newStatus } : o,
      );
    });
    setSelectedOrder((prev) =>
      prev?.id === orderId ? { ...prev, status: newStatus } : prev,
    );

    // ── Dispatch thunk ──────────────────────────────────────────────────────
    const result = await dispatch(
      updateOrderStatus({ orderId, status: newStatus }),
    );
    dispatch(resetUpdateOrderStatus());

    if (updateOrderStatus.fulfilled.match(result)) {
      toast.success("Order status updated", { id: "updateStatusSuccess" });
    } else {
      // Rollback on failure (API error toast is handled globally in api.js)
      if (snapshot) {
        setOrdersData(snapshot);
        const rolled = snapshot.find((o) => o.id === orderId);
        setSelectedOrder((prev) =>
          prev?.id === orderId ? (rolled ?? null) : prev,
        );
      }
    }
  };

  return { updateStatus };
}
