//MODULES
import { useTranslation } from "react-i18next";
import {
  Clock,
  User,
  MapPin,
  Phone,
  CreditCard,
  ShoppingBag,
  X,
  ArrowLeft,
  CheckCircle2,
  ChefHat,
  Truck,
  Ban,
} from "lucide-react";

//UTILS
import { useOrderStatusActions } from "./actions";
import { useFirebase } from "../../../context/firebase";

//COMP
import CustomSelect from "../../common/customSelector";
import CustomPagination from "../../common/pagination";
import FilterOrders from "../components/filterOrders";
import { formatDateString } from "../../../utils/utils";

const OrdersPage = () => {
  const { t } = useTranslation();
  const {
    pageNumber,
    pageSize,
    setPageNumber,
    ordersData,
    selectedOrder,
    setSelectedOrder,
    totalCount,
    handlePageChange,
    handleItemsPerPage,
  } = useFirebase();
  const { updateStatus } = useOrderStatusActions();

  const STATUS_CONFIG = {
    Pending: {
      label: "Pending",
      icon: Clock,
      color: "var(--orange-1)",
      bgColor: "var(--status-orange)",
    },
    Accepted: {
      label: "Accepted",
      icon: CheckCircle2,
      color: "var(--green-1)",
      bgColor: "var(--status-green)",
    },

    Preparing: {
      label: "Preparing",
      icon: ChefHat,
      color: "var(--orange-1)",
      bgColor: "var(--status-orange)",
    },
    OnTheWay: {
      label: "On The Way",
      icon: Truck,
      color: "var(--purple-1)",
      bgColor: "var(--status-purple)",
    },
    Delivered: {
      label: "Delivered",
      icon: ShoppingBag,
      color: "var(--green-1)",
      bgColor: "var(--status-green)",
    },
    Cancelled: {
      label: "Cancelled",
      icon: Ban,
      color: "var(--red-1)",
      bgColor: "var(--status-red)",
    },
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateStatus(orderId, newStatus);
  };

  const pageNumbers = () => {
    const numbersColl = [];
    for (let i = 5; i < 51; i += 5) {
      numbersColl.push({ label: `${i}`, value: i });
    }
    return numbersColl;
  };

  return (
    <div className="min-h-screen bg-[--white-2] transition-colors duration-300 lg:ml-[280px] pt-16 flex flex-col">
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow w-full">
        {/* Orders List */}
        <div
          className={`lg:col-span-7 space-y-4 ${selectedOrder ? "hidden lg:block" : "block"}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[--black-1]">
              <ShoppingBag className="w-5 h-5 text-[--primary-1]" />
              {t("pages.ordersPage.active_orders")}
              <span className="ml-2 px-2 py-0.5 bg-[--primary-1] text-white text-xs rounded-full">
                {ordersData?.length}
              </span>
            </h2>

            <FilterOrders />
          </div>

          <div className="space-y-3">
            {ordersData &&
              ordersData.map((order) => {
                const StatusIcon = STATUS_CONFIG[order.status]?.icon;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`group cursor-pointer p-4 rounded-2xl border transition-all duration-200 text-[--black-1] ${
                      selectedOrder?.id === order.id
                        ? "bg-[--primary-1] border-[--primary-1] text-white  shadow-xl shadow-indigo-500/20"
                        : "bg-[--white-1] border-[--border-1] hover:border-[--primary-1] hover:shadow-lg"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {order.customerName}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                              selectedOrder?.id === order.id
                                ? "bg-white/20"
                                : "bg-[--gr-4] dark:bg-[--gr-5]"
                            }`}
                          >
                            #{order.id.split("-")[1]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm opacity-70">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateString(
                              order.createdAt,
                              false,
                              false,
                              false,
                              true,
                              true,
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" />
                            {order.paymentMethodName}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          ₺{order.totalAmount.toFixed(2)}
                        </div>
                        <div
                          className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            selectedOrder?.id === order.id
                              ? "bg-white/20 text-white"
                              : ""
                          }`}
                          style={
                            selectedOrder?.id !== order.id
                              ? {
                                  backgroundColor:
                                    STATUS_CONFIG[order.status].bgColor,
                                  color: STATUS_CONFIG[order.status].color,
                                }
                              : {}
                          }
                        >
                          <StatusIcon className="w-3.5 h-3.5" />
                          {STATUS_CONFIG[order.status].label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Order Details */}
        <div
          className={`lg:col-span-5 ${selectedOrder ? "block" : "hidden lg:block"}`}
        >
          <div>
            {selectedOrder ? (
              <div className="bg-[--white-1] text-[--black-1] rounded-3xl border border-[--border-1] shadow-2xl overflow-hidden sticky top-24">
                {/* Details Header */}
                <div className="p-6 border-b border-[--border-1] flex justify-between items-center bg-[--gr-4] dark:bg-[--gr-5]">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="lg:hidden p-2 rounded-full bg-[--white-1] shadow-sm"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h3 className="font-bold text-lg">
                        {t("pages.ordersPage.order_details")}
                      </h3>
                      <p className="text-xs opacity-60">
                        {t("pages.ordersPage.id_label")} {selectedOrder.id}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="hidden lg:block p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                  {/* Status Actions */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {t("pages.ordersPage.change_status")}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {Object.keys(STATUS_CONFIG).map((status) => {
                        const config = STATUS_CONFIG[status];
                        const Icon = config.icon;
                        const isActive = selectedOrder.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(selectedOrder.id, status)
                            }
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                              isActive
                                ? "border-[--primary-1] bg-[--status-primary-1] dark:bg-[--status-primary-2] scale-105 shadow-md"
                                : "border-[--border-1] hover:border-[--gr-3]"
                            }`}
                          >
                            <Icon
                              className="w-5 h-5"
                              style={{
                                color: isActive ? "--primary-1)" : "inherit",
                              }}
                            />
                            <span
                              className={`text-[10px] font-bold text-center ${isActive ? "text-[--primary-1]" : "opacity-60"}`}
                            >
                              {config.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {t("pages.ordersPage.customer_information")}
                    </p>
                    <div className="space-y-3 bg-[--gr-4] dark:bg-[--gr-5] p-4 rounded-2xl">
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 mt-1 text-[--primary-1]" />
                        <div>
                          <p className="font-bold">
                            {selectedOrder.customerName}
                          </p>
                          <p className="text-xs opacity-60 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedOrder.customerTel}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 border-t border-[--border-1] pt-3">
                        <MapPin className="w-4 h-4 mt-1 text-[--primary-1]" />
                        <p className="text-sm leading-relaxed">
                          {selectedOrder.customerAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                      {t("pages.ordersPage.order_items")}
                    </p>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start pb-3 border-b border-[--border-1] last:border-0"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[--gr-4] dark:bg-[--gr-5] flex items-center justify-center text-xs font-bold">
                                {item.quantity}x
                              </span>
                              <span className="font-bold">
                                {item.productName}
                              </span>
                              <span className="text-xs opacity-50">
                                ({item.portionName})
                              </span>
                            </div>
                            {item.selectedTags.map((tag, tIdx) => (
                              <p key={tIdx} className="text-xs opacity-60 ml-8">
                                + {tag.itemName}
                              </p>
                            ))}
                            {item.note && (
                              <p className="text-xs italic text-[--primary-1] ml-8">
                                {t("pages.ordersPage.note_label")} {item.note}
                              </p>
                            )}
                          </div>
                          <span className="font-bold text-sm">
                            ₺{item.lineTotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Note */}
                  {selectedOrder.orderNote && (
                    <div className="p-4 rounded-2xl bg-[--status-yellow] border border-[--yellow-1]/20">
                      <p className="text-xs font-bold text-[--status-yellow] uppercase mb-1">
                        {t("pages.ordersPage.general_note")}
                      </p>
                      <p className="text-sm italic opacity-80">
                        {selectedOrder.orderNote}
                      </p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="space-y-3 pt-4 border-t border-[--border-1]">
                    <div className="flex justify-between text-sm opacity-60">
                      <span>{t("pages.ordersPage.subtotal")}</span>
                      <span>
                        ₺{(selectedOrder.totalAmount * 0.9).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-[--green-1] font-medium">
                      <span>{t("pages.ordersPage.online_discount")}</span>
                      <span>
                        -₺{(selectedOrder.totalAmount * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-lg">
                        {t("pages.ordersPage.total")}
                      </span>
                      <span className="text-2xl font-bold text-[--orange-1]">
                        ₺{selectedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex flex-col items-center justify-center text-center p-8 bg-[--gr-4] dark:bg-[--gr-5] rounded-3xl border-2 border-dashed border-[--border-1]">
                <div className="w-16 h-16 bg-[--white-1] rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <ShoppingBag className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="font-bold opacity-40">
                  {t("pages.ordersPage.select_order")}
                </h3>
                <p className="text-sm opacity-30 mt-1">
                  {t("pages.ordersPage.realtime_updates")}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* PAGINATION */}
      {ordersData && typeof totalCount === "number" && (
        <div className="w-full self-end flex justify-center py-4 text-[--black-2]">
          <div className="scale-[.8] min-w-20">
            <CustomSelect
              className="mt-[0] sm:mt-[0]"
              className2="mt-[0] sm:mt-[0]"
              menuPlacement="top"
              value={pageSize}
              options={pageNumbers()}
              onChange={(option) => {
                handleItemsPerPage(option.value);
              }}
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
    </div>
  );
};

export default OrdersPage;
