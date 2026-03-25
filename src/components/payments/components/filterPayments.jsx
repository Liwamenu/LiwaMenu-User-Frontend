//MODULES
import { useDispatch } from "react-redux";
import { useEffect, useRef, useState } from "react";

//UTILS
import statuses from "../../../enums/statuses";
import { formatDate } from "../../../utils/utils";
import paymentLicenseType from "../../../enums/paymentLicenseType";

//COMP
import CustomSelect from "../../common/customSelector";
import CustomDatePicker from "../../common/customDatePicker";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";

//REDUX
import { getPayments } from "../../../redux/payments/getPaymentsSlice";
import PaymentMethod from "../../../enums/paymentMethods";

const FilterPayments = ({
  filter,
  searchVal,
  setFilter,
  pageNumber,
  itemsPerPage,
  setPageNumber,
}) => {
  const dispatch = useDispatch();
  const filterPaymentsRef = useRef();
  const { contentRef, setContentRef } = usePopup();

  const [openFilter, setOpenFilter] = useState(false);

  function handleFilter(bool) {
    if (bool) {
      const filterData = {
        pageNumber: 1,
        pageSize: itemsPerPage,
        searchKey: searchVal,
        startDateTime: filter?.endDateTime
          ? formatDate(filter.startDateTime)
          : null,
        endDateTime: filter?.endDateTime
          ? formatDate(filter.endDateTime)
          : null,
        status: filter?.statusId,
        type: filter?.typeId,
        paymentMethod: filter?.paymentMethodId,
      };
      dispatch(getPayments(filterData));
    } else {
      setFilter(null);
      dispatch(getPayments({ pageNumber, pageSize: itemsPerPage }));
    }
    setPageNumber(1);
    setOpenFilter(false);
  }

  //HIDE FILTER
  useEffect(() => {
    if (filterPaymentsRef) {
      const refs = contentRef.filter((ref) => ref.id !== "getPaymentsFilter");
      setContentRef([
        ...refs,
        {
          id: "getPaymentsFilter",
          outRef: null,
          ref: filterPaymentsRef,
          callback: () => setOpenFilter(false),
        },
      ]);
    }
  }, [filterPaymentsRef]);

  return (
    <div className="flex justify-end">
      <div className="flex gap-2">
        <div className="w-full relative" ref={filterPaymentsRef}>
          <button
            className="w-full h-11 flex items-center justify-center text-[--primary-2] px-3 rounded-md text-sm font-normal border-[1.5px] border-solid border-[--primary-2]"
            onClick={() => setOpenFilter(!openFilter)}
          >
            Filtre
          </button>

          <div
            className={`absolute right-0 top-12 px-4 pb-3 flex flex-col bg-[--white-1] w-[22rem] border border-solid border-[--light-3] rounded-lg drop-shadow-md -drop-shadow-md z-[999] min-w-max ${
              openFilter ? "visible" : "hidden"
            }`}
          >
            <div className="flex gap-6">
              <div>
                <CustomDatePicker
                  dateOnly
                  label="Başlangıç Tarihi"
                  calendarClassName="dateOnly"
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-1"
                  value={filter?.startDateTime}
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
                  dateOnly
                  label="Bitiş Tarihi"
                  calendarClassName="dateOnly"
                  className="text-sm sm:mt-1 w-36 py-2 sm:py-[0.5rem]"
                  style={{ padding: "0 !important" }}
                  popperClassName="react-datepicker-popper-filter-order-2"
                  value={filter?.endDateTime}
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
                label="Durum"
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { value: null, label: "Hepsi", id: null },
                  ...statuses,
                ]}
                value={filter?.status || { label: "Hepsi" }}
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

              <CustomSelect
                label="Type"
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { value: null, label: "Hepsi", id: null },
                  ...paymentLicenseType,
                ]}
                value={filter?.type || { label: "Hepsi" }}
                onChange={(selectedOption) => {
                  setFilter((prev) => {
                    return {
                      ...prev,
                      typeId: selectedOption.value,
                      type: selectedOption,
                    };
                  });
                }}
              />
            </div>

            <div className="flex gap-6">
              <CustomSelect
                label="Ödeme Yöntemi"
                className="text-sm sm:mt-1"
                className2="sm:mt-3"
                style={{ padding: "0 !important" }}
                options={[
                  { value: null, label: "Hepsi", id: null },
                  ...PaymentMethod,
                ]}
                value={filter?.paymentMethod || { label: "Hepsi" }}
                onChange={(selectedOption) => {
                  setFilter((prev) => {
                    return {
                      ...prev,
                      paymentMethodId: selectedOption.value,
                      paymentMethod: selectedOption,
                    };
                  });
                }}
              />
            </div>

            <div className="w-full flex gap-2 justify-center pt-10">
              <button
                className="text-white bg-[--red-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(false)}
              >
                Temizle
              </button>
              <button
                className="text-white bg-[--primary-1] py-2 px-12 rounded-lg hover:opacity-90"
                onClick={() => handleFilter(true)}
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPayments;
