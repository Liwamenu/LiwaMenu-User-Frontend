//MODULES
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Ban,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  Search,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  X,
} from "lucide-react";

//COMP
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import FilterOrders from "../components/filterOrders";
import OrderDetailDrawer from "../components/orderDetailDrawer";

//CONTEXT
import { useOrders } from "../../../context/ordersContext";

//REDUX
import { getOrders } from "../../../redux/orders/getOrdersSlice";
import { getRestaurants } from "../../../redux/restaurants/getRestaurantsSlice";

//UTILS
import { formatDate, formatDateString } from "../../../utils/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const STATUS_META = {
  Pending: {
    labelKey: "orders.status_pending",
    icon: Clock,
    cls: "amber",
  },
  Accepted: {
    labelKey: "orders.status_accepted",
    icon: CheckCircle2,
    cls: "indigo",
  },
  Preparing: {
    labelKey: "orders.status_preparing",
    icon: ChefHat,
    cls: "orange",
  },
  OnTheWay: {
    labelKey: "orders.status_on_the_way",
    icon: Truck,
    cls: "violet",
  },
  Delivered: {
    labelKey: "orders.status_delivered",
    icon: ShoppingBag,
    cls: "emerald",
  },
  Cancelled: {
    labelKey: "orders.status_cancelled",
    icon: Ban,
    cls: "rose",
  },
};

const STATUS_PILL = {
  amber: "text-amber-600 bg-amber-500/10 ring-amber-500/30",
  indigo: "text-indigo-600 bg-indigo-500/10 ring-indigo-500/30",
  orange: "text-orange-600 bg-orange-500/10 ring-orange-500/30",
  violet: "text-violet-600 bg-violet-500/10 ring-violet-500/30",
  emerald: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/30",
  rose: "text-rose-600 bg-rose-500/10 ring-rose-500/30",
};

const STATUS_DOT = {
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
  violet: "bg-violet-500",
  emerald: "bg-emerald-500",
  rose: "bg-rose-500",
};

const OrdersPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const {
    pageSize,
    pageNumber,
    setPageNumber,
    pageNumbers,
    ordersData,
    selectedOrder,
    setSelectedOrder,
    totalCount,
    handlePageChange,
    handleItemsPerPage,
    filter,
    setFilter,
  } = useOrders();

  // Make sure restaurants are loaded for filtering
  useEffect(() => {
    dispatch(getRestaurants({}));
  }, [dispatch]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const handleOpenOrder = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };
  const handleCloseDrawer = () => setDrawerOpen(false);

  const refetchWithFilter = (next) => {
    dispatch(
      getOrders({
        page: 1,
        pageSize: pageSize.value,
        dateRange: next.dateRange,
        startDateTime: next.endDateTime
          ? formatDate(next.startDateTime)
          : null,
        endDateTime: next.endDateTime ? formatDate(next.endDateTime) : null,
        status: next.statusId || null,
        restaurantIds: next.restaurantIds?.length ? next.restaurantIds : null,
        paymentMethodId: next.paymentMethodId || null,
        orderType: next.orderType || null,
        minTotalAmount:
          next.minTotalAmount !== "" && next.minTotalAmount != null
            ? Number(next.minTotalAmount)
            : null,
        maxTotalAmount:
          next.maxTotalAmount !== "" && next.maxTotalAmount != null
            ? Number(next.maxTotalAmount)
            : null,
      }),
    );
    setPageNumber(1);
  };

  const removeRestaurantFilter = (restaurant) => {
    const nextIds = (filter.restaurantIds || []).filter(
      (id) => id !== restaurant.value,
    );
    const nextRestaurants = (filter.restaurants || []).filter(
      (r) => r.value !== restaurant.value,
    );
    const next = {
      ...filter,
      restaurantIds: nextIds,
      restaurants: nextRestaurants,
    };
    setFilter(next);
    refetchWithFilter(next);
  };

  const clearAllRestaurantFilters = () => {
    const next = { ...filter, restaurantIds: [], restaurants: [] };
    setFilter(next);
    refetchWithFilter(next);
  };

  const filteredOrders = !searchVal
    ? ordersData
    : ordersData?.filter((o) =>
        [
          o.customerName,
          o.tableNumber,
          o.id,
          o.restaurantName,
          o.customerTel,
        ]
          .filter(Boolean)
          .some((v) =>
            String(v).toLowerCase().includes(searchVal.toLowerCase()),
          ),
      );

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] section_row flex flex-col">
      {/* HERO */}
      <header className="flex items-start gap-3 sm:gap-4 mt-4 mb-6">
        <div
          className="grid place-items-center size-11 sm:size-12 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <ShoppingBag className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-[--black-1] leading-tight">
            {t("orders.active_orders")}
          </h1>
          <p className="mt-1 text-sm text-[--gr-1]">
            {t("orders.subtitle")}
            {typeof totalCount === "number" && totalCount > 0
              ? ` · ${t("orders.summary_count", { count: totalCount })}`
              : ""}
          </p>
        </div>
      </header>

      {/* ACTIVE RESTAURANT FILTER CHIPS */}
      {filter.restaurants?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mr-1">
            {t("orders.filtered_restaurants")}
          </span>
          {filter.restaurants.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => removeRestaurantFilter(r)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[--primary-1]/10 text-[--primary-1] text-xs font-semibold ring-1 ring-[--primary-1]/30 hover:bg-[--primary-1]/15 transition"
              title={t("orders.remove_from_filter")}
            >
              <Store className="size-3" />
              {r.label}
              <X className="size-3 opacity-70" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAllRestaurantFilters}
            className="text-xs font-semibold text-rose-600 hover:underline ml-1"
          >
            {t("orders.clear_all")}
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[--gr-1] pointer-events-none" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder={t("orders.search_placeholder")}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] placeholder:text-[--gr-1] outline-none transition focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-100"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => setSearchVal("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center size-6 rounded-full hover:bg-[--white-2] text-[--gr-1] transition"
              aria-label={t("orders.clear_search")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <FilterOrders />
      </div>

      {/* LIST */}
      {!filteredOrders || filteredOrders.length === 0 ? (
        <EmptyState searchActive={Boolean(searchVal)} t={t} />
      ) : (
        <ul className="space-y-2.5">
          {filteredOrders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              onSelect={() => handleOpenOrder(order)}
              isActive={selectedOrder?.id === order.id && drawerOpen}
              t={t}
            />
          ))}
        </ul>
      )}

      {/* PAGINATION */}
      {ordersData && typeof totalCount === "number" && totalCount > 0 && (
        <div className="w-full mt-auto flex flex-wrap justify-center items-center gap-3 pt-8 text-[--black-1]">
          <div className="w-20">
            <CustomSelect
              className="mt-[0] sm:mt-[0]"
              className2="mt-[0] sm:mt-[0]"
              menuPlacement="top"
              value={pageSize}
              options={pageNumbers()}
              onChange={(option) => handleItemsPerPage(option.value)}
            />
          </div>
          <CustomPagination
            pageNumber={pageNumber}
            setPageNumber={setPageNumber}
            itemsPerPage={pageSize.value}
            totalItems={totalCount}
            handlePageChange={handlePageChange}
          />
        </div>
      )}

      {/* DETAIL DRAWER */}
      <OrderDetailDrawer
        open={drawerOpen}
        order={selectedOrder}
        onClose={handleCloseDrawer}
      />
    </section>
  );
};

export default OrdersPage;

// ====== Helpers ======

const OrderRow = ({ order, onSelect, isActive, t }) => {
  const meta = STATUS_META[order.status] || STATUS_META.Pending;
  const isInPerson = order.orderType === "InPerson";
  const TypeIcon = isInPerson ? Utensils : Truck;
  const typeLabel = isInPerson
    ? t("orders.order_type_in_person")
    : t("orders.order_type_online");
  const itemCount = order.items?.length || 0;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left rounded-2xl border bg-[--white-1] hover:border-[--primary-1]/40 hover:shadow-md hover:shadow-indigo-500/5 transition-all p-4 sm:p-5 ${
          isActive
            ? "border-[--primary-1]/60 shadow-md shadow-indigo-500/10 ring-2 ring-[--primary-1]/15"
            : "border-[--border-1]"
        }`}
      >
        <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 items-center">
          {/* Avatar */}
          <div
            className="grid place-items-center size-10 sm:size-12 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <TypeIcon className="size-5" strokeWidth={2.2} />
          </div>

          {/* Body */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-[--black-1] truncate">
                {order.customerName ||
                  (isInPerson && order.tableNumber) ||
                  "—"}
              </p>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 whitespace-nowrap ${
                  STATUS_PILL[meta.cls]
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${STATUS_DOT[meta.cls]}`}
                />
                {t(meta.labelKey)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[--gr-1]">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3 shrink-0" />
                {formatDateString({
                  dateString: order.createdAt,
                  hour: true,
                  min: true,
                })}
              </span>
              <span className="inline-flex items-center gap-1">
                <TypeIcon className="size-3 shrink-0" />
                {typeLabel}
              </span>
              {isInPerson && order.tableNumber && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 shrink-0" />
                  {order.tableNumber}
                </span>
              )}
              {order.paymentMethodName && (
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="size-3 shrink-0" />
                  {order.paymentMethodName}
                </span>
              )}
              {itemCount > 0 && (
                <span className="text-[--gr-1]">
                  · {t("orders.item_count", { count: itemCount })}
                </span>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="text-right flex flex-col items-end gap-1">
            <p className="font-bold text-[--black-1] text-base sm:text-lg whitespace-nowrap tabular-nums">
              {Number(order.totalAmount || 0).toFixed(2)}
            </p>
            <ChevronRight className="size-4 text-[--gr-1]" />
          </div>
        </div>
      </button>
    </li>
  );
};

const EmptyState = ({ searchActive, t }) => (
  <div className="grid place-items-center min-h-[24rem] rounded-2xl border border-[--border-1] bg-[--white-1]">
    <div className="text-center px-6">
      <div className="mx-auto mb-3 grid place-items-center size-12 rounded-2xl bg-[--white-2] ring-1 ring-[--border-1] text-[--gr-1]">
        <ShoppingBag className="size-6" />
      </div>
      <p className="text-[--black-1] font-semibold">
        {searchActive
          ? t("orders.empty_no_match")
          : t("orders.empty_no_active")}
      </p>
      <p className="text-xs text-[--gr-1] mt-1 max-w-xs">
        {searchActive
          ? t("orders.empty_no_match_desc")
          : t("orders.empty_no_active_desc")}
      </p>
    </div>
  </div>
);
