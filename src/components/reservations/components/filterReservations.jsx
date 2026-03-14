import { useEffect, useRef, useState } from "react";

import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import CustomDatePicker from "../../common/customdatePicker";
import { usePopup } from "../../../context/PopupContext";
import { useReservations } from "../../../context/reservationsContext";

const statusOptions = [
  { label: "All", value: null },
  { label: "Pending", value: "PendingOwnerDecision" },
  { label: "Accepted", value: "Accepted" },
  { label: "Rejected", value: "Rejected" },
];

const FilterReservations = () => {
  const filterReservationsRef = useRef();
  const { contentRef, setContentRef } = usePopup();
  const {
    filter,
    setFilter,
    handleApplyFilter,
    handleClearFilter,
    filterInitialState,
  } = useReservations();

  const [openFilter, setOpenFilter] = useState(false);

  useEffect(() => {
    if (filterReservationsRef) {
      const refs = contentRef.filter((ref) => ref.id !== "reservationsFilter");
      setContentRef([
        ...refs,
        {
          id: "reservationsFilter",
          outRef: null,
          ref: filterReservationsRef,
          callback: () => setOpenFilter(false),
        },
      ]);
    }
  }, [filterReservationsRef]);

  const handleFilter = (isApply) => {
    if (isApply) {
      handleApplyFilter();
    } else {
      const hasFilterChanged =
        JSON.stringify(filter) !== JSON.stringify(filterInitialState);
      if (hasFilterChanged) {
        handleClearFilter();
      }
    }
    setOpenFilter(false);
  };

  return (
    <div className="w-full relative" ref={filterReservationsRef}>
      <button
        className="w-full h-11 flex items-center justify-center text-[--primary-1] px-3 rounded-md text-sm font-normal border-[1.5px] border-solid border-[--primary-1]"
        onClick={() => setOpenFilter(!openFilter)}
      >
        Filter
      </button>

      <div
        className={`absolute right-0 top-12 px-4 pb-3 flex flex-col bg-[--white-1] w-[28rem] border border-solid border-[--light-3] rounded-lg drop-shadow-md -drop-shadow-md z-[999] min-w-max ${
          openFilter ? "visible" : "hidden"
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <CustomDatePicker
            label="Date From"
            className="text-sm sm:mt-1 py-2 sm:py-[0.5rem]"
            value={filter.dateFrom}
            dateOnly
            onChange={(selectedDate) => {
              setFilter((prev) => ({
                ...prev,
                dateFrom: selectedDate,
              }));
            }}
          />

          <CustomDatePicker
            label="Date To"
            className="text-sm sm:mt-1 py-2 sm:py-[0.5rem]"
            value={filter.dateTo}
            dateOnly
            onChange={(selectedDate) => {
              setFilter((prev) => ({
                ...prev,
                dateTo: selectedDate,
              }));
            }}
          />

          <CustomSelect
            label="Status"
            className="text-sm sm:mt-1"
            className2="sm:mt-3"
            options={statusOptions}
            value={filter.status}
            onChange={(selectedOption) => {
              setFilter((prev) => ({
                ...prev,
                statusId: selectedOption.value,
                status: selectedOption,
              }));
            }}
          />

          <CustomInput
            label="Search"
            placeholder="Search key"
            value={filter.searchKey}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                searchKey: value,
              }))
            }
            className2="sm:mt-3"
            className="text-sm sm:mt-1 py-2"
          />

          <CustomInput
            label="Full Name"
            placeholder="Guest name"
            value={filter.fullName}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                fullName: value,
              }))
            }
            className="text-sm sm:mt-1 py-2"
          />

          <CustomInput
            label="Phone"
            placeholder="Phone number"
            value={filter.phoneNumber}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                phoneNumber: value,
              }))
            }
            className="text-sm sm:mt-1 py-2"
          />

          <CustomInput
            type="number"
            min={1}
            label="Min Guests"
            placeholder="Min"
            value={filter.minGuestCount}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                minGuestCount: value,
              }))
            }
            className="text-sm sm:mt-1 py-2"
          />

          <CustomInput
            type="number"
            min={1}
            label="Max Guests"
            placeholder="Max"
            value={filter.maxGuestCount}
            onChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                maxGuestCount: value,
              }))
            }
            className="text-sm sm:mt-1 py-2"
          />
        </div>

        <div className="w-full flex gap-2 justify-center pt-8 text-base">
          <button
            className="text-white bg-[--red-1] py-2 px-12 rounded-lg hover:opacity-90"
            onClick={() => handleFilter(false)}
          >
            Clear
          </button>
          <button
            className="text-white bg-[--primary-1] py-2 px-12 rounded-lg hover:opacity-90"
            onClick={() => handleFilter(true)}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterReservations;
