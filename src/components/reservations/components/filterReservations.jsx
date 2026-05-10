import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import CustomDatePicker from "../../common/customdatePicker";
import { usePopup } from "../../../context/PopupContext";
import { useReservations } from "../../../context/reservationsContext";

const FilterReservations = () => {
  const { t } = useTranslation();
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

  // Status options are translated dynamically so a language switch
  // updates the dropdown labels in place. The `value` strings stay in
  // their backend-canonical form (PendingOwnerDecision / Accepted /
  // Rejected) — only the user-facing labels move with the locale.
  const statusOptions = useMemo(
    () => [
      { label: t("filterReservations.status_all"), value: null },
      {
        label: t("filterReservations.status_pending"),
        value: "PendingOwnerDecision",
      },
      { label: t("filterReservations.status_accepted"), value: "Accepted" },
      { label: t("filterReservations.status_rejected"), value: "Rejected" },
    ],
    [t],
  );

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
        {t("filterReservations.filter")}
      </button>

      <div
        className={`absolute right-0 top-12 px-4 pb-3 flex flex-col bg-[--white-1] w-[28rem] border border-solid border-[--light-3] rounded-lg drop-shadow-md -drop-shadow-md z-[999] min-w-max ${
          openFilter ? "visible" : "hidden"
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <CustomDatePicker
            label={t("filterReservations.date_from")}
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
            label={t("filterReservations.date_to")}
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
            label={t("filterReservations.status")}
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
            label={t("filterReservations.search")}
            placeholder={t("filterReservations.search_placeholder")}
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
            label={t("filterReservations.full_name")}
            placeholder={t("filterReservations.full_name_placeholder")}
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
            label={t("filterReservations.phone")}
            placeholder={t("filterReservations.phone_placeholder")}
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
            label={t("filterReservations.min_guests")}
            placeholder={t("filterReservations.min_placeholder")}
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
            label={t("filterReservations.max_guests")}
            placeholder={t("filterReservations.max_placeholder")}
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
            {t("filterReservations.clear")}
          </button>
          <button
            className="text-white bg-[--primary-1] py-2 px-12 rounded-lg hover:opacity-90"
            onClick={() => handleFilter(true)}
          >
            {t("filterReservations.apply")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterReservations;
