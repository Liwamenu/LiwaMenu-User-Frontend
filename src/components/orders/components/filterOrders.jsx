import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { usePopup } from "../../../context/PopupContext";
import { useFirebase } from "../../../context/firebase";
import { formatDateString } from "../../../utils/utils";
import { getOrders } from "../../../redux/orders/getOrdersSlice";
import { isEqual } from "lodash";
import { useTranslation } from "react-i18next";
import CustomDatePicker from "../../common/customdatePicker";
import CustomSelect from "../../common/customSelector";

const FilterOrders = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterOrdersRef = useRef();
  const { contentRef, setContentRef } = usePopup();

  const orderFilterDates = [
    { label: t("orders.filter_today"), value: "0", id: 0, show: true },
    { label: t("orders.filter_yesterday"), value: "1", id: 1, show: true },
    { label: t("orders.filter_this_week"), value: "2", id: 2, show: true },
    { label: t("orders.filter_this_month"), value: "3", id: 3, show: false },
    { label: t("orders.filter_last_week"), value: "4", id: 4, show: true },
    {
      label: t("orders.filter_last_three_months"),
      value: "5",
      id: 5,
      show: false,
    },
    {
      label: t("orders.filter_last_six_months"),
      value: "6",
      id: 6,
      show: false,
    },
    { label: t("orders.filter_this_year"), value: "7", id: 7, show: false },
  ];

  const {
    filter,
    pageSize,
    searchVal,
    setFilter,
    setPageNumber,
    filterInitialState,
  } = useFirebase();

  const [openFilter, setOpenFilter] = useState(false);

  const formatDate = (date) => {
    return formatDateString(date, true, true, true, true, true);
  };

  function handleFilter(bool) {
    if (bool) {
      const filterData = {
        page: 1,
        searchKey: searchVal,
        pageSize: pageSize.value,
        dateRange: filter.dateRange,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        status: filter.statusId,
        marketplaceId: filter.marketplaceId,
      };
      dispatch(getOrders(filterData));
    } else {
      if (!isEqual(filterInitialState, filter)) {
        setFilter(filterInitialState);
        dispatch(getOrders({ page: 1, pageSize: pageSize.value }));
      }
    }
    setPageNumber(1);
    setOpenFilter(false);
  }

  //HIDE FILTER
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
    <div className="flex justify-end">
      <div className="flex gap-2">
        <div className="w-full relative" ref={filterOrdersRef}>
          <button
            className="w-full h-11 flex items-center justify-center text-[--primary-1] px-3 rounded-md text-sm font-normal border-[1.5px] border-solid border-[--primary-1]"
            onClick={() => setOpenFilter(!openFilter)}
          >
            {t("orders.filter_button")}
          </button>

          <div
            className={`absolute right-0 top-12 px-4 pb-3 flex flex-col bg-[--white-1] w-[22rem] border border-solid border-[--light-3] rounded-lg drop-shadow-md -drop-shadow-md z-[999] min-w-max ${
              openFilter ? "visible" : "hidden"
            }`}
          >
            <div className="grid grid-flow-row grid-cols-2 gap-1.5 my-2">
              {orderFilterDates
                .filter((D) => D.show)
                .map((D) => (
                  <div key={D.id} className="text-sm">
                    <button
                      onClick={() => {
                        setFilter((prev) => {
                          return {
                            ...prev,
                            dateRange: D.id,
                            startDateTime: "",
                            endDateTime: "",
                          };
                        });
                      }}
                      className={`p-2 border border-[--border-1] text-[--gr-1] rounded-md w-40 text-center ${
                        D.id === filter.dateRange &&
                        "text-white bg-[--primary-1]"
                      }`}
                    >
                      {D.label}
                    </button>
                  </div>
                ))}
            </div>

            <div className="flex gap-6">
              <div>
                <CustomDatePicker
                  label={t("orders.start_date")}
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-1"
                  value={filter.startDateTime}
                  onChange={(selectedDate) => {
                    setFilter((prev) => {
                      return {
                        ...prev,
                        dateRange: 0,
                        startDateTime: selectedDate,
                      };
                    });
                  }}
                />
                <style>
                  {`
                  .react-datepicker-popper-filter-order-1 {
                    right: -2rem
                  }
                `}
                </style>
              </div>

              <div>
                <CustomDatePicker
                  label={t("orders.end_date")}
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-2"
                  value={filter.endDateTime}
                  onChange={(selectedDate) => {
                    setFilter((prev) => {
                      return {
                        ...prev,
                        dateRange: 0,
                        endDateTime: selectedDate,
                      };
                    });
                  }}
                />
                <style>
                  {`
                  .react-datepicker-popper-filter-order-2 {
                    right: -22rem
                  }
                `}
                </style>
              </div>
            </div>

            <div className="flex gap-6">
              <CustomSelect
                label={t("orders.status_label")}
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { label: t("orders.status_all"), value: null },
                  { label: t("orders.status_pending"), value: 0 },
                  { label: t("orders.status_accepted"), value: 1 },
                  { label: t("orders.status_on_the_way"), value: 2 },
                  { label: t("orders.status_delivered"), value: 3 },
                  { label: t("orders.status_cancelled"), value: 4 },
                ]}
                value={filter.status}
                onChange={(selectedOption) => {
                  setFilter((prev) => {
                    return {
                      ...prev,
                      statusId: selectedOption.value,
                      status: selectedOption,
                    };
                  });
                }}
              />
              {/* <CustomSelect
                label="Pazaryeri"
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { value: null, label: "Hepsi", id: null },
                  ...filteredMarketplaces,
                ]}
                value={filter.marketplace}
                onChange={(selectedOption) => {
                  setFilter((prev) => {
                    return {
                      ...prev,
                      marketplaceId: selectedOption.id,
                      marketplace: selectedOption,
                    };
                  });
                }}
              /> */}
            </div>

            <div className="w-full flex gap-2 justify-center pt-10">
              <button
                className="text-white bg-[--red-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(false)}
              >
                {t("orders.clear")}
              </button>
              <button
                className="text-white bg-[--primary-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(true)}
              >
                {t("orders.apply")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterOrders;
