import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  User,
  MapPin,
  Phone,
  CreditCard,
  ShoppingBag,
  X,
  CheckCircle2,
  Truck,
  ChefHat,
  Ban,
  ArrowLeft,
} from "lucide-react";

const MOCK_ORDERS = [
  {
    id: "ord-1",
    restaurantId: "538ba1a1-bf0d-47eb-9b88-054856703452",
    orderType: "online",
    status: "accept",
    items: [
      {
        productId: "prd-001-mercimek",
        productName: "Mercimek Çorbası",
        portionId: "por-001-mercimek-normal",
        portionName: "Normal",
        unitPrice: 55,
        quantity: 1,
        selectedTags: [],
        itemTotal: 55,
        note: "This is Product note. Test",
      },
      {
        productId: "prd-004-karniyarik",
        productName: "Karnıyarık",
        portionId: "por-004-karniyarik-standart",
        portionName: "Standart",
        unitPrice: 185,
        quantity: 1,
        selectedTags: [
          {
            tagId: "ot-002-yan",
            tagName: "Yan Ürün Seçimi",
            itemId: "oti-004-yogurt",
            itemName: "Yoğurt",
            price: 20,
            quantity: 1,
          },
        ],
        itemTotal: 205,
        note: "Product with options.",
      },
    ],
    totalAmount: 260,
    orderNote: "This General Order Note",
    createdAt: new Date().toISOString(),
    customerInfo: {
      name: "Ibrahim Ali Mohammed",
      phone: "+905058433855",
      address:
        "Yörükler, Denizevler cad no:81-83, 55420 19 Mayıs/Samsun Ondokuz Mayıs KYK Öğrenci Yurdu",
    },
    paymentMethodId: "pm-001",
    paymentMethodName: "Banka Kartı",
  },
  {
    id: "ord-2",
    restaurantId: "538ba1a1-bf0d-47eb-9b88-054856703452",
    orderType: "online",
    status: "prepare",
    items: [
      {
        productId: "prd-015-firin-sutlac",
        productName: "Fırın Sütlaç",
        portionId: "por-017-sutlac-kase",
        portionName: "Kase",
        unitPrice: 79,
        quantity: 3,
        selectedTags: [],
        itemTotal: 237,
        note: "",
      },
    ],
    totalAmount: 237,
    orderNote: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    customerInfo: {
      name: "Ayşe Yılmaz",
      phone: "+905551234567",
      address: "Cumhuriyet Mah. 123. Sokak No:5 Samsun",
    },
    paymentMethodId: "pm-002",
    paymentMethodName: "Nakit",
  },
];

const OrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState(MOCK_ORDERS[0]);

  const STATUS_CONFIG = {
    accept: {
      label: t("pages.ordersPage.status_accepted"),
      icon: CheckCircle2,
      color: "var(--green-1)",
      bgColor: "var(--status-green)",
    },
    prepare: {
      label: t("pages.ordersPage.status_preparing"),
      icon: ChefHat,
      color: "var(--orange-1)",
      bgColor: "var(--status-orange)",
    },
    ontheway: {
      label: t("pages.ordersPage.status_on_the_way"),
      icon: Truck,
      color: "var(--purple-1)",
      bgColor: "var(--status-purple)",
    },
    deliver: {
      label: t("pages.ordersPage.status_delivered"),
      icon: ShoppingBag,
      color: "var(--green-1)",
      bgColor: "var(--status-green)",
    },
    cancel: {
      label: t("pages.ordersPage.status_cancelled"),
      icon: Ban,
      color: "var(--red-1)",
      bgColor: "var(--status-red)",
    },
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[--white-2] transition-colors duration-300 lg:ml-[280px] pt-16">
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders List */}
        <div
          className={`lg:col-span-7 space-y-4 ${selectedOrder ? "hidden lg:block" : "block"}`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2 text-[--black-1]">
              <ShoppingBag className="w-5 h-5 text-[--primary-1]" />
              {t("pages.ordersPage.active_orders")}
              <span className="ml-2 px-2 py-0.5 bg-[--primary-1] text-white text-xs rounded-full">
                {orders.length}
              </span>
            </h2>
          </div>

          <div className="space-y-3">
            {orders.map((order) => {
              const StatusIcon = STATUS_CONFIG[order.status].icon;
              return (
                <div
                  key={order.id}
                  layoutId={order.id}
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
                          {order.customerInfo.name}
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
                          {formatDate(order.createdAt)}
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
                      className="lg:hidden p-2 rounded-full bg-white shadow-sm"
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
                            {selectedOrder.customerInfo.name}
                          </p>
                          <p className="text-xs opacity-60 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedOrder.customerInfo.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 border-t border-[--border-1] pt-3">
                        <MapPin className="w-4 h-4 mt-1 text-[--primary-1]" />
                        <p className="text-sm leading-relaxed">
                          {selectedOrder.customerInfo.address}
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
                            ₺{item.itemTotal.toFixed(2)}
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
    </div>
  );
};

export default OrdersPage;
