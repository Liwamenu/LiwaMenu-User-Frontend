//MODULES
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Ban,
  CheckCircle2,
  ChefHat,
  Clock,
  CreditCard,
  Hash,
  MapPin,
  Navigation,
  Phone,
  Printer,
  ShoppingBag,
  Sparkles,
  StickyNote,
  Store,
  Trash2,
  Truck,
  User,
  Utensils,
  X,
} from "lucide-react";

//UTILS
import { copyToClipboard, formatDateString } from "../../../utils/utils";
import { printOrder } from "./printOrder";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";

//COMP
import OrderLocationPopup from "./orderLocationPopup";
import ConfirmDeleteModal from "../../common/confirmDeleteModal";

//CONTEXT
import { useOrders } from "../../../context/ordersContext";

//ACTIONS
import { useOrderStatusActions } from "../pages/actions";

// Coerce a {latitude, longitude} pair to finite numbers and reject the
// "null island" 0,0 plus anything outside Earth's range. Returns either
// {lat, lng} or null. Centralised so the drawer's "View on map" gate
// and the popup itself can't drift.
//
// The early null/undefined/"" rejection matters: `Number(null) === 0` and
// `Number("") === 0`, so without those guards a half-filled location
// `{ latitude: 41, longitude: null }` would coerce to `{lat: 41, lng: 0}`
// and slip past the rest of the checks.
const toValidLatLng = (latitude, longitude) => {
  if (latitude == null || longitude == null) return null;
  if (latitude === "" || longitude === "") return null;
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
};

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const STATUS_DEFS = [
  { key: "Pending", icon: Clock, cls: "amber", labelKey: "orders.status_pending" },
  { key: "Accepted", icon: CheckCircle2, cls: "indigo", labelKey: "orders.status_accepted" },
  { key: "Preparing", icon: ChefHat, cls: "orange", labelKey: "orders.status_preparing" },
  { key: "OnTheWay", icon: Truck, cls: "violet", labelKey: "orders.status_on_the_way" },
  { key: "Delivered", icon: ShoppingBag, cls: "emerald", labelKey: "orders.status_delivered" },
  { key: "Cancelled", icon: Ban, cls: "rose", labelKey: "orders.status_cancelled" },
];

const STATUS_RING_CLS = {
  amber: "text-amber-600 bg-amber-500/10 ring-amber-500/40 border-amber-500/40",
  indigo: "text-indigo-600 bg-indigo-500/10 ring-indigo-500/40 border-indigo-500/40",
  orange: "text-orange-600 bg-orange-500/10 ring-orange-500/40 border-orange-500/40",
  violet: "text-violet-600 bg-violet-500/10 ring-violet-500/40 border-violet-500/40",
  emerald: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/40 border-emerald-500/40",
  rose: "text-rose-600 bg-rose-500/10 ring-rose-500/40 border-rose-500/40",
};

const OrderDetailDrawer = ({ open, order, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* DRAWER */}
      <aside
        className={`fixed top-16 bottom-0 right-0 z-[61] w-full sm:w-[28rem] lg:w-[32rem] bg-[--white-1] border-l border-[--border-1] shadow-2xl shadow-indigo-500/20 flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {order && (
          <>
            <DrawerHeader order={order} onClose={onClose} />
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
              <StatusActions order={order} />
              <CustomerSection order={order} />
              <ItemsSection order={order} />
              <NotesSection order={order} />
            </div>
            <DrawerFooter order={order} />
          </>
        )}
      </aside>
    </>
  );
};

export default OrderDetailDrawer;

// ====== Subcomponents ======

const DrawerHeader = ({ order, onClose }) => {
  const { t, i18n } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  const { handleDelete } = useOrders();

  const openDeleteConfirm = () => {
    setSecondPopupContent(
      <ConfirmDeleteModal
        title={t("orders.delete_title")}
        targetName={`#${String(order.id).slice(0, 8)}`}
        description={t("orders.delete_description")}
        confirmLabel={t("orders.delete_confirm")}
        onConfirm={async () => {
          const ok = await handleDelete(order.id);
          // Drop the modal first, then close the drawer if delete
          // actually persisted. On failure the modal closes but the
          // drawer stays open so the user can retry.
          setSecondPopupContent(null);
          if (ok) onClose?.();
        }}
      />,
    );
  };

  return (
    <header className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 sm:px-5 py-4 border-b border-[--border-1]">
      <div
        className="grid place-items-center size-10 sm:size-11 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <ShoppingBag className="size-5" strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-bold text-[--black-1] leading-tight">
          {t("orders.order_details")}
        </h2>
        {order.restaurantName && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[--primary-1]">
            <Store className="size-3 shrink-0" />
            <span className="truncate">{order.restaurantName}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => copyToClipboard({ text: order.id })}
          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[--gr-1] hover:text-[--primary-1] font-mono w-full transition"
          title="ID'yi kopyala"
        >
          <Hash className="size-3 shrink-0" />
          <span className="truncate">{order.id}</span>
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => printOrder(order, t, i18n.language)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
          style={{ background: PRIMARY_GRADIENT }}
          title={t("orders.print_order")}
          aria-label={t("orders.print_order")}
        >
          <Printer className="size-3.5" strokeWidth={2.4} />
          <span className="hidden sm:inline">{t("orders.print")}</span>
        </button>
        {/* Sil — rose tone so it visually separates from the indigo
            Print action and clearly reads as destructive. Opens a
            confirm modal in the second popup slot rather than acting
            directly. */}
        <button
          type="button"
          onClick={openDeleteConfirm}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 ring-1 ring-rose-200 hover:bg-rose-100 transition dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-400/30 dark:hover:bg-rose-500/25"
          title={t("orders.delete_order")}
          aria-label={t("orders.delete_order")}
        >
          <Trash2 className="size-3.5" strokeWidth={2.4} />
          <span className="hidden sm:inline">{t("orders.delete")}</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center size-9 rounded-lg hover:bg-[--white-2] text-[--gr-1] transition"
          aria-label="Kapat"
        >
          <X className="size-5" />
        </button>
      </div>
    </header>
  );
};

const StatusActions = ({ order }) => {
  const { t } = useTranslation();
  const { updateStatus } = useOrderStatusActions();
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
        {t("orders.change_status")}
      </p>
      <div className="grid grid-cols-6 gap-1">
        {STATUS_DEFS.map((s) => {
          const Icon = s.icon;
          const active = order.status === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => updateStatus(order.id, s.key)}
              title={t(s.labelKey)}
              aria-label={t(s.labelKey)}
              className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg border transition ${
                active
                  ? `${STATUS_RING_CLS[s.cls]}`
                  : "border-[--border-1] bg-[--white-1] text-[--gr-1] hover:border-[--primary-1]/40"
              }`}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2.2} />
              <span
                className={`text-[8.5px] font-bold leading-none text-center uppercase tracking-tight truncate w-full ${
                  active ? "" : "text-[--gr-1]"
                }`}
              >
                {t(s.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CustomerSection = ({ order }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const isInPerson = order.orderType === "InPerson";

  // Resolve the customer's pinned location from the order payload, and
  // the restaurant's location from the cached restaurants list (loaded
  // on first sidebar mount). Both must be valid for the map row to
  // appear — `toValidLatLng` rejects nulls, NaN, 0,0 (null island),
  // and out-of-range values so we never open a map showing nothing.
  //
  // Backend ships the customer coords as FLAT customerLatitude /
  // customerLongitude fields. The earlier draft spec used a nested
  // customerLocation object — kept as a fallback in case any caller
  // still sends that shape.
  const customer = toValidLatLng(
    order.customerLatitude ?? order.customerLocation?.latitude,
    order.customerLongitude ?? order.customerLocation?.longitude,
  );
  const restaurantEntry = useSelector((s) =>
    (s.restaurants?.getRestaurants?.restaurants?.data || []).find(
      (r) => r.id === order.restaurantId,
    ),
  );
  const restaurant = restaurantEntry
    ? toValidLatLng(restaurantEntry.latitude, restaurantEntry.longitude)
    : null;
  const canShowMap = !!customer && !!restaurant;

  const openMap = () => {
    setPopupContent(
      <OrderLocationPopup
        customer={customer}
        restaurant={{
          ...restaurant,
          name: restaurantEntry?.name,
        }}
      />,
    );
  };

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
        {t("orders.customer_information")}
      </p>
      <div className="rounded-xl border border-[--border-1] bg-[--white-2]/30 divide-y divide-[--border-1]">
        <Row
          icon={Utensils}
          label={t("orders.order_type_label")}
          value={
            isInPerson
              ? t("orders.order_type_in_person")
              : t("orders.order_type_online")
          }
        />
        {isInPerson && order.tableNumber && (
          <Row
            icon={MapPin}
            label={t("orders.table_number_label")}
            value={order.tableNumber}
          />
        )}
        {order.customerName && (
          <Row icon={User} label="Müşteri" value={order.customerName} />
        )}
        {order.customerTel && (
          <Row
            icon={Phone}
            label="Telefon"
            value={order.customerTel}
            onClick={() => copyToClipboard({ text: order.customerTel })}
          />
        )}
        {order.customerAddress && (
          <Row
            icon={MapPin}
            label="Adres"
            value={order.customerAddress}
            multiline
          />
        )}
        {canShowMap && (
          <Row
            icon={Navigation}
            label={t("orders.location_label")}
            value={t("orders.location_view_action")}
            onClick={openMap}
          />
        )}
        {order.paymentMethodName && (
          <Row
            icon={CreditCard}
            label="Ödeme"
            value={order.paymentMethodName}
          />
        )}
        <Row
          icon={Clock}
          label="Tarih"
          value={formatDateString({
            dateString: order.createdAt,
            hour: true,
            min: true,
          })}
        />
      </div>
    </div>
  );
};

const Row = ({ icon: Icon, label, value, onClick, multiline }) => (
  <div className="flex items-start gap-3 px-3.5 py-2.5">
    <span className="grid place-items-center size-7 shrink-0 rounded-lg bg-[--primary-1]/10 text-[--primary-1]">
      <Icon className="size-3.5" strokeWidth={2.2} />
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
        {label}
      </p>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          className="text-sm font-semibold text-[--black-1] hover:text-[--primary-1] transition truncate w-full text-left"
        >
          {value}
        </button>
      ) : (
        <p
          className={`text-sm font-semibold text-[--black-1] ${
            multiline ? "leading-snug" : "truncate"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  </div>
);

const ItemsSection = ({ order }) => {
  const { t } = useTranslation();
  if (!order.items?.length) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-2">
        {t("orders.order_items")}
      </p>
      <ul className="rounded-xl border border-[--border-1] divide-y divide-[--border-1] overflow-hidden">
        {order.items.map((item, idx) => (
          <li key={item.id || idx} className="p-3 bg-[--white-1]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="grid place-items-center min-w-7 h-6 px-1.5 rounded-md bg-[--primary-1]/10 text-[--primary-1] text-xs font-bold">
                    {item.quantity}×
                  </span>
                  <p className="text-sm font-bold text-[--black-1] truncate">
                    {item.productName}
                  </p>
                </div>
                {item.portionName && (
                  <p className="mt-1 ml-9 text-[11px] text-[--gr-1]">
                    {item.portionName}
                  </p>
                )}
                {item.note && (
                  <p className="mt-1 ml-9 text-[11px] italic text-[--primary-1]">
                    {t("orders.note_label")} {item.note}
                  </p>
                )}
                {item.selectedTags?.length > 0 && (
                  <ul className="mt-2 ml-9 space-y-1">
                    {item.selectedTags.map((tag, tIdx) => {
                      const tagTotal =
                        Number(tag.price || 0) *
                        Number(tag.quantity || 1) *
                        Number(item.quantity || 1);
                      return (
                        <li
                          key={tIdx}
                          className="flex items-center justify-between gap-2 text-xs text-[--gr-1]"
                        >
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <Sparkles className="size-3 shrink-0 text-[--primary-1]" />
                            <span className="truncate">
                              {tag.itemName}
                              {tag.quantity > 1 && (
                                <span className="text-[--gr-1]"> × {tag.quantity}</span>
                              )}
                            </span>
                          </span>
                          {tagTotal > 0 && (
                            <span className="text-[--black-1] font-medium tabular-nums whitespace-nowrap">
                              {tagTotal.toFixed(2)}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <p className="text-sm font-bold text-[--black-1] tabular-nums whitespace-nowrap">
                {Number(item.lineTotal || 0).toFixed(2)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const NotesSection = ({ order }) => {
  const { t } = useTranslation();
  if (!order.customerNote && !order.orderNote) return null;
  return (
    <div className="space-y-2">
      {order.orderNote && (
        <NoteCard
          label={t("orders.general_note")}
          text={order.orderNote}
          variant="amber"
        />
      )}
      {order.customerNote && (
        <NoteCard
          label={t("orders.customer_note")}
          text={order.customerNote}
          variant="indigo"
        />
      )}
    </div>
  );
};

const NoteCard = ({ label, text, variant }) => {
  const cls =
    variant === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-indigo-50 border-indigo-200 text-indigo-900";
  return (
    <div className={`rounded-xl border px-3 py-2 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-0.5 inline-flex items-center gap-1">
        <StickyNote className="size-3" />
        {label}
      </p>
      <p className="text-xs italic leading-snug">{text}</p>
    </div>
  );
};

const DrawerFooter = ({ order }) => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 space-y-1.5">
      <SummaryLine
        label={t("orders.subtotal")}
        value={Number(order.subTotal || 0).toFixed(2)}
      />
      {order.deliveryFee != null && Number(order.deliveryFee) > 0 && (
        <SummaryLine
          label={t("orders.delivery_fee")}
          value={Number(order.deliveryFee).toFixed(2)}
        />
      )}
      {order.discountAmount > 0 && (
        <SummaryLine
          label={t("orders.online_discount")}
          value={`-${Number(order.discountAmount).toFixed(2)}`}
          accent="emerald"
        />
      )}
      <div className="flex items-center justify-between pt-2 border-t border-[--border-1] mt-1">
        <span className="text-sm font-bold text-[--black-1]">
          {t("orders.total")}
        </span>
        <span
          className="text-xl font-extrabold"
          style={{
            background: PRIMARY_GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {Number(order.totalAmount || 0).toFixed(2)}
        </span>
      </div>
    </footer>
  );
};

const SummaryLine = ({ label, value, accent }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-[--gr-1]">{label}</span>
    <span
      className={`tabular-nums font-medium ${
        accent === "emerald" ? "text-emerald-600" : "text-[--black-1]"
      }`}
    >
      {value}
    </span>
  </div>
);
