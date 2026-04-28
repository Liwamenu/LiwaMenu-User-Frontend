//MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Save,
  Check,
  Banknote,
  Layers,
  Trash2,
  Plus,
  X,
  Loader2,
} from "lucide-react";

//COMP
import CustomToggle from "../common/customToggle";
import SettingsTabs from "./settingsTabs";
import { usePopup } from "../../context/PopupContext";

//REDUX
import {
  getPaymentMethods,
  resetGetPaymentMethods,
} from "../../redux/restaurant/getPaymentMethodsSlice";
import {
  setPaymentMethods,
  resetSetPaymentMethods,
} from "../../redux/restaurant/setPaymentMethodsSlice";
import {
  addPaymentMethod,
  resetAddPaymentMethod,
} from "../../redux/restaurant/addPaymentMethodSlice";
import {
  deletePaymentMethod,
  resetDeletePaymentMethod,
} from "../../redux/restaurant/deletePaymentMethodSlice";

const PaymentMethods = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  const id = useParams()["*"].split("/")[1];
  const { data } = useSelector((s) => s.restaurant.getPaymentMethods);
  const { loading, success } = useSelector(
    (s) => s.restaurant.setPaymentMethods
  );
  const { success: addSuccess, loading: addLoading } = useSelector(
    (s) => s.restaurant.addPaymentMethod,
  );
  const { success: deleteSuccess, loading: deleteLoading } = useSelector(
    (s) => s.restaurant.deletePaymentMethod,
  );

  const [paymentMethodsData, setPaymentMethodsData] = useState(null);

  // Is every method enabled?
  const allEnabled =
    paymentMethodsData?.length > 0 &&
    paymentMethodsData.every((pm) => pm.enabled);

  const onlineOrderActive = !!restaurant?.onlineOrder;

  const showAllDisabledWarning = () => {
    toast.error(t("paymentMethods.all_disabled_warning"), {
      id: "pm-all-disabled",
    });
  };

  // Master toggle handler — block when turning all OFF while Paket Servis is active.
  const toggleAll = () => {
    const next = !allEnabled;
    if (!next && onlineOrderActive) {
      showAllDisabledWarning();
      return;
    }
    setPaymentMethodsData((prev) =>
      prev.map((pm) => ({ ...pm, enabled: next }))
    );
  };

  // Per-method toggle — block disabling the LAST enabled method while Paket Servis is active.
  const toggleMethod = (M) => {
    const turningOff = M.enabled;
    if (turningOff && onlineOrderActive) {
      const remainingEnabled = paymentMethodsData.filter(
        (pm) => pm.id !== M.id && pm.enabled
      ).length;
      if (remainingEnabled === 0) {
        showAllDisabledWarning();
        return;
      }
    }
    setPaymentMethodsData((prev) =>
      prev.map((pm) =>
        pm.id === M.id ? { ...pm, enabled: !pm.enabled } : pm
      )
    );
  };

  function handleSubmit(e) {
    e.preventDefault();
    // Build array of enabled method IDs
    const enabledMethodIds = paymentMethodsData
      .filter((method) => method.enabled)
      .map((method) => method.id);
    if (onlineOrderActive && enabledMethodIds.length === 0) {
      showAllDisabledWarning();
      return;
    }
    dispatch(
      setPaymentMethods({ restaurantId: id, methodIds: enabledMethodIds })
    );
  }

  // GET THE DATA
  useEffect(() => {
    if (!paymentMethodsData) {
      dispatch(getPaymentMethods({ restaurantId: id }));
    }
  }, [dispatch, id]);

  //SET THE DATA
  useEffect(() => {
    if (data) {
      setPaymentMethodsData(data);
      dispatch(resetGetPaymentMethods());
    }
  }, [data]);

  // TOAST AND RESET
  useEffect(() => {
    if (loading) toast.loading("İşleniyor...");
    if (success) {
      toast.dismiss();
      toast.success("Ödeme Yöntemleri Güncellendi.");
      dispatch(resetSetPaymentMethods());
    }
  }, [loading, success, dispatch]);

  // ADD / DELETE — refresh list after success
  useEffect(() => {
    if (addSuccess) {
      toast.success(t("paymentMethods.add_success"));
      dispatch(resetAddPaymentMethod());
      // Trigger re-fetch by clearing local + redux state
      setPaymentMethodsData(null);
      dispatch(getPaymentMethods({ restaurantId: id }));
    }
  }, [addSuccess, dispatch, id, t]);

  useEffect(() => {
    if (deleteSuccess) {
      toast.success(t("paymentMethods.delete_success"));
      dispatch(resetDeletePaymentMethod());
      setPaymentMethodsData(null);
      dispatch(getPaymentMethods({ restaurantId: id }));
    }
  }, [deleteSuccess, dispatch, id, t]);

  const openAddPopup = () => {
    setPopupContent(
      <AddMethodPopup
        restaurantId={id}
        onClose={() => setPopupContent(null)}
      />,
    );
  };

  const openDeletePopup = (M) => {
    setPopupContent(
      <DeleteMethodPopup
        restaurantId={id}
        method={M}
        onClose={() => setPopupContent(null)}
      />,
    );
  };

  const enabledCount =
    paymentMethodsData?.filter((m) => m.enabled).length || 0;
  const totalCount = paymentMethodsData?.length || 0;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* gradient strip */}
        <div
          className="h-0.5"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />
        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <CreditCard className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("paymentMethods.title", { name: restaurant?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {totalCount > 0
                ? `${enabledCount} / ${totalCount} aktif`
                : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={openAddPopup}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {t("paymentMethods.add_method")}
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {/* Description */}
          <div className="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 flex items-start gap-3">
            <span className="grid place-items-center size-8 rounded-lg bg-[--white-1] text-indigo-600 ring-1 ring-indigo-100 shrink-0">
              <Banknote className="size-4" />
            </span>
            <p className="text-[12px] text-indigo-900/90 leading-relaxed flex-1 min-w-0">
              {t("paymentMethods.configure")}
            </p>
          </div>

          {paymentMethodsData && (
            <>
              {/* Master toggle */}
              <div className="rounded-xl border border-[--border-1] bg-[--white-2]/40 p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center size-9 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <Layers className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[--black-1] truncate">
                      {t("paymentMethods.enable_all")}
                    </h3>
                    <p className="text-[11px] text-[--gr-1] truncate">
                      {t("paymentMethods.enable_all_desc")}
                    </p>
                  </div>
                </div>
                <CustomToggle
                  className1="!w-auto !shrink-0"
                  checked={allEnabled}
                  onChange={toggleAll}
                />
              </div>

              {/* Methods list */}
              <div className="flex flex-col gap-2">
                {paymentMethodsData.map((M, i) => (
                  <label
                    key={M.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl border bg-[--white-1] transition-all cursor-pointer ${
                      M.enabled
                        ? "border-indigo-200 ring-1 ring-indigo-100 shadow-sm"
                        : "border-[--border-1] hover:border-indigo-300 hover:shadow-sm"
                    }`}
                  >
                    <span
                      className={`grid place-items-center size-9 rounded-lg shrink-0 text-xs font-bold transition-colors ${
                        M.enabled
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                          : "bg-[--white-2] text-[--gr-1]"
                      }`}
                    >
                      {M.enabled ? <Check className="size-4" /> : i + 1}
                    </span>
                    <span
                      className={`flex-1 min-w-0 text-sm truncate transition-colors ${
                        M.enabled
                          ? "font-semibold text-[--black-1]"
                          : "font-medium text-[--black-2]"
                      }`}
                    >
                      {M.name}
                    </span>
                    <CustomToggle
                      className1="!w-auto !shrink-0"
                      checked={M.enabled}
                      onChange={() => toggleMethod(M)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        openDeletePopup(M);
                      }}
                      aria-label={t("paymentMethods.delete_method")}
                      className="grid place-items-center size-8 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </label>
                ))}
              </div>
            </>
          )}

          {/* SUBMIT */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[--border-1]">
            <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide">
              {enabledCount} / {totalCount}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
              }}
            >
              <Save className="size-4" />
              {t("paymentMethods.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethods;

const AddMethodPopup = ({ restaurantId, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.restaurant.addPaymentMethod);
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch(
      addPaymentMethod({ restaurantId, paymentMethodName: trimmed }),
    ).then((res) => {
      if (!res.error) onClose();
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden">
      <div
        className="h-0.5"
        style={{
          background:
            "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
        }}
      />
      <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        >
          <Plus className="size-4" />
        </span>
        <h2 className="text-sm sm:text-base font-semibold text-[--black-1] flex-1 truncate">
          {t("paymentMethods.add_method_title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[--gr-1] mb-1 tracking-wide">
            {t("paymentMethods.method_name")}
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            autoFocus
            type="text"
            required
            maxLength={40}
            className="w-full h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder={t("paymentMethods.method_name_placeholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-[--border-1]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
          >
            {t("paymentMethods.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" strokeWidth={3} />
            )}
            {t("paymentMethods.add")}
          </button>
        </div>
      </form>
    </div>
  );
};

const DeleteMethodPopup = ({ restaurantId, method, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.restaurant.deletePaymentMethod);

  const handleDelete = () => {
    dispatch(
      deletePaymentMethod({ restaurantId, paymentMethodId: method.id }),
    ).then((res) => {
      if (!res.error) onClose();
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[--white-1] rounded-2xl shadow-2xl ring-1 ring-[--border-1] overflow-hidden">
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, #f43f5e 0%, #ef4444 100%)",
        }}
      />
      <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3">
        <span className="grid place-items-center size-9 rounded-xl bg-rose-50 text-rose-600 shrink-0">
          <Trash2 className="size-4" />
        </span>
        <h2 className="text-sm sm:text-base font-semibold text-[--black-1] flex-1 truncate">
          {t("paymentMethods.delete_method_title")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition"
          aria-label="Kapat"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-sm text-[--black-2] leading-relaxed">
          {t("paymentMethods.delete_confirm", { name: method?.name })}
        </p>
      </div>
      <div className="flex justify-end gap-2 px-5 pb-5 pt-2 border-t border-[--border-1]">
        <button
          type="button"
          onClick={onClose}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("paymentMethods.cancel")}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-rose-600 text-white text-sm font-semibold shadow-md shadow-rose-500/25 transition hover:bg-rose-700 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          {t("paymentMethods.delete")}
        </button>
      </div>
    </div>
  );
};
