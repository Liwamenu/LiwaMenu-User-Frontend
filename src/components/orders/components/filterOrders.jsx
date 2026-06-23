//MODULES
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { isEqual } from "lodash";
import { Check, Filter, Store, X } from "lucide-react";

//UTILS
import { formatDateString, formatSelectorData } from "../../../utils/utils";

//COMP
import CustomDatePicker from "../../common/customdatePicker";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";
import { useOrders } from "../../../context/ordersContext";

//REDUX
import { getOrders } from "../../../redux/orders/getOrdersSlice";
import { getRestaurants } from "../../../redux/restaurants/getRestaurantsSlice";

//ENUMS
import OrderTypeEnums from "../../../enums/orderTypeEnums";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const FilterOrders = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterOrdersRef = useRef();
  const { contentRef, setContentRef } = usePopup();
  const { restaurants } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );
  const { filter, pageSize, setFilter, setPageNumber, filterInitialState } =
    useOrders();

  const [openFilter, setOpenFilter] = useState(false);

  const restaurantOptions = formatSelectorData(restaurants?.data || []);

  const dateRanges = [
    { label: t("orders.filter_today"), id: 0 },
    { label: t("orders.filter_yesterday"), id: 1 },
    { label: t("orders.filter_this_week"), id: 2 },
    { label: t("orders.filter_last_week"), id: 4 },
  ];

  const statusOptions = [
    { label: t("orders.all"), value: null },
    { label: t("orders.status_pending"), value: "Pending" },
    { label: t("orders.status_accepted"), value: "Accepted" },
    { label: t("orders.status_preparing"), value: "Preparing" },
    { label: t("orders.status_on_the_way"), value: "OnTheWay" },
    { label: t("orders.status_delivered"), value: "Delivered" },
    { label: t("orders.status_cancelled"), value: "Cancelled" },
  ];

  const orderTypeOptions = [
    { label: t("orders.all"), value: null },
    ...OrderTypeEnums,
  ];

  const formatDate = (date) => {
    const dateInFront = formatDateString(date, true, true, true);
    const yearInFront = dateInFront.split("-").reverse().join("-");
    return yearInFront;
  };

  function handleApply() {
    const filterData = {
      page: 1,
      pageSize: pageSize.value,
      dateRange: filter.dateRange,
      startDateTime: filter.endDateTime
        ? formatDate(filter.startDateTime)
        : null,
      endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
      status: filter.statusId || null,
      restaurantIds: filter.restaurantIds?.length
        ? filter.restaurantIds
        : null,
      paymentMethodId: filter.paymentMethodId || null,
      orderType: filter.orderType || null,
      minTotalAmount:
        filter.minTotalAmount !== "" ? Number(filter.minTotalAmount) : null,
      maxTotalAmount:
        filter.maxTotalAmount !== "" ? Number(filter.maxTotalAmount) : null,
    };
    dispatch(getOrders(filterData));
    setPageNumber(1);
    setOpenFilter(false);
  }

  function handleClear() {
    if (!isEqual(filterInitialState, filter)) {
      setFilter(filterInitialState);
      dispatch(getOrders({ page: 1, pageSize: pageSize.value }));
    }
    setPageNumber(1);
    setOpenFilter(false);
  }

  const activeFilterCount = (() => {
    let n = 0;
    if (filter.dateRange) n++;
    if (filter.startDateTime) n++;
    if (filter.endDateTime) n++;
    if (filter.statusId) n++;
    if (filter.restaurantIds?.length) n += filter.restaurantIds.length;
    if (filter.orderType) n++;
    if (filter.minTotalAmount !== "" && filter.minTotalAmount != null) n++;
    if (filter.maxTotalAmount !== "" && filter.maxTotalAmount != null) n++;
    return n;
  })();

  useEffect(() => {
    if (!restaurants) dispatch(getRestaurants({}));
  }, [restaurants]);

  useEffect(() => {
    if (filterOrdersRef) {
      const refs = contentRef.filter((ref) => ref.id !== "ordersFilter");
      setContentRef([
        ...refs,
        {
          id: "ordersFilter",
          outRef: null,
          ref: filterOrdersRef,
          callback: () => setOpenFilter(false),
        },
      ]);
    }
  }, [filterOrdersRef]);

  return (
    <div className="relative" ref={filterOrdersRef}>
      <button
        type="button"
        onClick={() => setOpenFilter((v) => !v)}
        className={`h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
          activeFilterCount > 0
            ? "text-white shadow-md shadow-indigo-500/20"
            : "border border-[--border-1] bg-[--white-1] text-[--black-1] hover:border-[--primary-1]/40"
        }`}
        style={
          activeFilterCount > 0 ? { background: PRIMARY_GRADIENT } : undefined
        }
      >
        <Filter className="size-4" />
        {t("orders.filter_button")}
        {activeFilterCount > 0 && (
          <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-white text-[--primary-1] text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {openFilter && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] sm:w-[26rem] rounded-2xl bg-[--white-1] border border-[--border-1] shadow-2xl shadow-indigo-500/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border-1] bg-[--white-2]/60">
            <h3 className="text-sm font-bold text-[--black-1]">
              {t("orders.filter_button")}
            </h3>
            <button
              type="button"
              onClick={() => setOpenFilter(false)}
              className="grid place-items-center size-7 rounded-md hover:bg-[--white-2] text-[--gr-1]"
              aria-label={t("orders.close")}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[68vh] overflow-y-auto">
            {/* Quick date range */}
            <div>
              <p className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
                {t("orders.quick_date")}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {dateRanges.map((d) => (
                  <Chip
                    key={d.id}
                    selected={
                      filter.dateRange === d.id &&
                      !filter.startDateTime &&
                      !filter.endDateTime
                    }
                    onClick={() =>
                      setFilter((p) => ({
                        ...p,
                        dateRange: d.id,
                        startDateTime: "",
                        endDateTime: "",
                      }))
                    }
                  >
                    {d.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Custom date range */}
            <div>
              <p className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
                {t("orders.custom_date_range")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <CustomDatePicker
                  dateOnly
                  label=""
                  className="text-sm w-full"
                  value={filter.startDateTime}
                  onChange={(d) =>
                    setFilter((p) => ({
                      ...p,
                      dateRange: 0,
                      startDateTime: d,
                    }))
                  }
                />
                <CustomDatePicker
                  dateOnly
                  label=""
                  className="text-sm w-full"
                  value={filter.endDateTime}
                  onChange={(d) =>
                    setFilter((p) => ({
                      ...p,
                      dateRange: 0,
                      endDateTime: d,
                    }))
                  }
                />
              </div>
            </div>

            {/* Status */}
            <ChipGroup
              label={t("orders.status_label")}
              options={statusOptions}
              value={filter.statusId || null}
              onChange={(o) =>
                setFilter((p) => ({ ...p, statusId: o.value, status: o }))
              }
            />

            {/* Restaurants (multi-select) */}
            {restaurantOptions.length > 0 && (
              <RestaurantMultiSelect
                label={t("orders.restaurant_label")}
                clearLabel={t("orders.clear")}
                options={restaurantOptions}
                selectedIds={filter.restaurantIds || []}
                onToggle={(option) => {
                  setFilter((p) => {
                    const ids = p.restaurantIds || [];
                    const sel = p.restaurants || [];
                    const isSelected = ids.includes(option.value);
                    return {
                      ...p,
                      restaurantIds: isSelected
                        ? ids.filter((id) => id !== option.value)
                        : [...ids, option.value],
                      restaurants: isSelected
                        ? sel.filter((r) => r.value !== option.value)
                        : [...sel, option],
                    };
                  });
                }}
                onClear={() =>
                  setFilter((p) => ({
                    ...p,
                    restaurantIds: [],
                    restaurants: [],
                  }))
                }
              />
            )}

            {/* Order type */}
            <ChipGroup
              label={t("orders.order_type_label")}
              options={orderTypeOptions}
              value={filter.orderType || null}
              onChange={(o) =>
                setFilter((p) => ({
                  ...p,
                  orderType: o.value,
                  orderTypeOption: o,
                }))
              }
            />

            {/* Amount range */}
            <div>
              <p className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
                {t("orders.amount_range")}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Min"
                  value={filter.minTotalAmount}
                  onChange={(e) =>
                    setFilter((p) => ({
                      ...p,
                      minTotalAmount: e.target.value,
                    }))
                  }
                  className="h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] outline-none transition focus:border-[--primary-1] focus:ring-2 focus:ring-indigo-100"
                />
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Max"
                  value={filter.maxTotalAmount}
                  onChange={(e) =>
                    setFilter((p) => ({
                      ...p,
                      maxTotalAmount: e.target.value,
                    }))
                  }
                  className="h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] outline-none transition focus:border-[--primary-1] focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[--border-1] bg-[--white-2]/40">
            <button
              type="button"
              onClick={handleClear}
              className="h-10 px-3.5 rounded-lg text-sm font-medium text-[--gr-1] hover:bg-[--white-2] transition"
            >
              {t("orders.clear")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:brightness-110 transition"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Check className="size-4" />
              {t("orders.apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterOrders;

const ChipGroup = ({ label, options, value, onChange }) => (
  <div>
    <p className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
      {label}
    </p>
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <Chip
          key={String(o.value) + String(o.label)}
          selected={
            value === o.value || (value == null && o.value == null)
          }
          onClick={() => onChange(o)}
        >
          {o.label}
        </Chip>
      ))}
    </div>
  </div>
);

const RestaurantMultiSelect = ({ label, clearLabel, options, selectedIds, onToggle, onClear }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
        {label}
        {selectedIds.length > 0 && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[--primary-1] text-white text-[9px]">
            {selectedIds.length}
          </span>
        )}
      </p>
      {selectedIds.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] font-semibold text-rose-600 hover:underline"
        >
          {clearLabel}
        </button>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
      {options.map((o) => {
        const selected = selectedIds.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o)}
            className={`inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold transition ${
              selected
                ? "bg-[--primary-1] text-white ring-1 ring-[--primary-1]"
                : "bg-[--white-2] text-[--black-1] ring-1 ring-[--border-1] hover:ring-[--primary-1]/40"
            }`}
          >
            {selected ? (
              <Check className="size-3" strokeWidth={3} />
            ) : (
              <Store className="size-3" />
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  </div>
);

const Chip = ({ selected, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`h-8 px-3 rounded-full text-xs font-semibold transition ${
      selected
        ? "bg-[--primary-1] text-white ring-1 ring-[--primary-1]"
        : "bg-[--white-2] text-[--black-1] ring-1 ring-[--border-1] hover:ring-[--primary-1]/40"
    }`}
  >
    {children}
  </button>
);
