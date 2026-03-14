//MODULES
import { isEqual } from "lodash";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";

//UTILS
import { usePopup } from "../../../context/PopupContext";
import { formatDateString } from "../../../utils/utils";
import { useWaiterCalls } from "../../../context/waiterCallsContext";

//REDUX
import { getWaiterCalls } from "../../../redux/waiterCalls/getWaiterCallsSlice";
import CustomDatePicker from "../../common/customdatePicker";
import CustomSelect from "../../common/customSelector";

const FilterWaiterCalls = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterWaiterCallsRef = useRef();
  const { contentRef, setContentRef } = usePopup();
  const { pageSize, setPageNumber, filterInitialState, filter, setFilter } =
    useWaiterCalls();

  const [openFilter, setOpenFilter] = useState(false);

  const formatDate = (date) => {
    const dateInFront = formatDateString(date, true, true, true);
    const yearInFront = dateInFront.split("-").reverse().join("-");
    return yearInFront;
  };

  function handleFilter(bool) {
    if (bool) {
      const filterData = {
        page: 1,
        pageSize: pageSize.value,
        startDateTime: filter.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter.endDateTime ? formatDate(filter.endDateTime) : null,
        isResolved: filter.isResolved.value,
        tableNUmber: filter.tableNumber,
      };
      dispatch(getWaiterCalls(filterData));
    } else {
      if (!isEqual(filterInitialState, filter)) {
        setFilter(filterInitialState);
        dispatch(getWaiterCalls({ page: 1, pageSize: pageSize.value }));
      }
    }
    setPageNumber(1);
    setOpenFilter(false);
  }

  //HIDE FILTER
  useEffect(() => {
    if (filterWaiterCallsRef) {
      const refs = contentRef.filter((ref) => ref.id !== "waiterCallsFilter");
      setContentRef([
        ...refs,
        {
          id: "waiterCallsFilter",
          outRef: null,
          ref: filterWaiterCallsRef,
          callback: () => setOpenFilter(false),
        },
      ]);
    }
  }, [filterWaiterCallsRef]);

  return (
    <div className="flex justify-end">
      <div className="flex gap-2">
        <div className="w-full relative" ref={filterWaiterCallsRef}>
          <button
            className="w-full h-11 flex items-center justify-center text-[--primary-1] px-3 rounded-md text-sm font-normal border-[1.5px] border-solid border-[--primary-1]"
            onClick={() => setOpenFilter(!openFilter)}
          >
            {t("waiterCalls.filter_button")}
          </button>

          <div
            className={`absolute right-0 top-12 px-4 pb-3 flex flex-col bg-[--white-1] w-[22rem] border border-solid border-[--light-3] rounded-lg drop-shadow-md -drop-shadow-md z-[999] min-w-max ${
              openFilter ? "visible" : "hidden"
            }`}
          >
            <div className="flex gap-6">
              <div>
                <CustomDatePicker
                  label={t("waiterCalls.start_date")}
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-1"
                  value={filter.startDateTime}
                  dateOnly={true}
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
                  label={t("waiterCalls.end_date")}
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-2"
                  value={filter.endDateTime}
                  dateOnly={true}
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
                label={t("waiterCalls.is_resolved")}
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { label: t("waiterCalls.status_all"), value: null },
                  { label: t("waiterCalls.status_resolved"), value: true },
                  { label: t("waiterCalls.status_pending"), value: false },
                ]}
                value={filter.isResolved}
                onChange={(selectedOption) => {
                  setFilter((prev) => {
                    return {
                      ...prev,
                      statusId: selectedOption.value,
                      isResolved: selectedOption,
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

            <div className="w-full flex gap-2 justify-center pt-10 text-base">
              <button
                className="text-white bg-[--red-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(false)}
              >
                {t("waiterCalls.clear")}
              </button>
              <button
                className="text-white bg-[--primary-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(true)}
              >
                {t("waiterCalls.apply")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterWaiterCalls;
