//MODULES
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { Check, Filter, X } from "lucide-react";

//UTILS
import statuses from "../../../enums/statuses";
import { formatDate } from "../../../utils/utils";
import paymentLicenseType from "../../../enums/paymentLicenseType";
import PaymentMethod from "../../../enums/paymentMethods";

//COMP
import CustomDatePicker from "../../common/customdatePicker";

//CONTEXT
import { usePopup } from "../../../context/PopupContext";

//REDUX
import { getPayments } from "../../../redux/payments/getPaymentsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const FilterPayments = ({
  filter,
  searchVal,
  setFilter,
  pageNumber,
  itemsPerPage,
  setPageNumber,
  activeFilterCount = 0,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filterPaymentsRef = useRef();
  const { contentRef, setContentRef } = usePopup();

  const [openFilter, setOpenFilter] = useState(false);
  const [draft, setDraft] = useState(filter || {});

  useEffect(() => {
    if (openFilter) setDraft(filter || {});
  }, [openFilter]);

  function handleApply() {
    const filterData = {
      pageNumber: 1,
      pageSize: itemsPerPage,
      searchKey: searchVal,
      startDateTime: draft?.startDateTime
        ? formatDate(draft.startDateTime)
        : null,
      endDateTime: draft?.endDateTime ? formatDate(draft.endDateTime) : null,
      status: draft?.statusId ?? null,
      type: draft?.typeId ?? null,
      paymentMethod: draft?.paymentMethodId ?? null,
    };
    setFilter(draft);
    dispatch(getPayments(filterData));
    setPageNumber(1);
    setOpenFilter(false);
  }

  function handleClear() {
    setFilter(null);
    setDraft({});
    dispatch(getPayments({ pageNumber: 1, pageSize: itemsPerPage }));
    setPageNumber(1);
    setOpenFilter(false);
  }

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
    <div className="relative" ref={filterPaymentsRef}>
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
        {t("paymentsPage.filter_button")}
        {activeFilterCount > 0 && (
          <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-white text-[--primary-1] text-[10px] font-bold">
            {activeFilterCount}
          </span>
        )}
      </button>

      {openFilter && (
        <div className="absolute right-0 top-12 z-50 w-[20rem] sm:w-[24rem] rounded-2xl bg-[--white-1] border border-[--border-1] shadow-2xl shadow-indigo-500/10 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[--border-1] bg-[--white-2]/60">
            <h3 className="text-sm font-bold text-[--black-1]">
              {t("paymentsPage.filter_title")}
            </h3>
            <button
              type="button"
              onClick={() => setOpenFilter(false)}
              className="grid place-items-center size-7 rounded-md hover:bg-[--white-2] text-[--gr-1]"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
                {t("paymentsPage.filter_date_range")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <CustomDatePicker
                  dateOnly
                  label=""
                  calendarClassName="dateOnly"
                  className="text-sm w-full"
                  value={draft?.startDateTime}
                  onChange={(d) =>
                    setDraft((p) => ({ ...p, startDateTime: d }))
                  }
                />
                <CustomDatePicker
                  dateOnly
                  label=""
                  calendarClassName="dateOnly"
                  className="text-sm w-full"
                  value={draft?.endDateTime}
                  onChange={(d) => setDraft((p) => ({ ...p, endDateTime: d }))}
                />
              </div>
            </div>

            <ChipSelect
              label={t("paymentsPage.filter_status")}
              options={statuses}
              value={draft?.statusId ?? null}
              onChange={(v) => setDraft((p) => ({ ...p, statusId: v }))}
              t={t}
            />

            <ChipSelect
              label={t("paymentsPage.filter_type")}
              options={paymentLicenseType}
              value={draft?.typeId ?? null}
              onChange={(v) => setDraft((p) => ({ ...p, typeId: v }))}
              t={t}
            />

            <ChipSelect
              label={t("paymentsPage.filter_method")}
              options={PaymentMethod}
              value={draft?.paymentMethodId ?? null}
              onChange={(v) => setDraft((p) => ({ ...p, paymentMethodId: v }))}
              t={t}
            />
          </div>

          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[--border-1] bg-[--white-2]/40">
            <button
              type="button"
              onClick={handleClear}
              className="h-10 px-3.5 rounded-lg text-sm font-medium text-[--gr-1] hover:bg-[--white-2] transition"
            >
              {t("paymentsPage.filter_clear")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:brightness-110 transition"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Check className="size-4" />
              {t("paymentsPage.filter_apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPayments;

const ChipSelect = ({ label, options, value, onChange, t }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
      {label}
    </label>
    <div className="flex flex-wrap gap-1.5">
      <Chip selected={value == null} onClick={() => onChange(null)}>
        {t("paymentsPage.filter_all")}
      </Chip>
      {options.map((o) => (
        <Chip
          key={o.value}
          selected={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.labelKey ? t(o.labelKey) : o.label}
        </Chip>
      ))}
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
