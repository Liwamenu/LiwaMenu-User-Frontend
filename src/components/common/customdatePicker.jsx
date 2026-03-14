import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import tr from "date-fns/locale/tr"; // Import Turkish locale from date-fns
//import { useTranslation } from "react-i18next";
registerLocale("tr", tr);

const CustomDatePicker = ({
  label,
  value,
  onChange,
  placeholder,
  isDisabled,
  className,
  className2,
  popperClassName,
  calendarClassName = "custom-datepicker",
  dateFormat = "dd.MM.yyyy HH:mm",
  timeOnly = false,
  dateOnly = false,
}) => {
  //const { i18n } = useTranslation();

  return (
    <div className={`flex flex-col mt-3 sm:mt-6 w-full relative ${className2}`}>
      <label className="text-xs font-[600] tracking-wide text-[--black-1] max-md:max-w-full text-left">
        {label}
      </label>
      <DatePicker
        locale="tr"
        selected={value}
        onChange={onChange}
        showTimeSelectOnly={timeOnly}
        showTimeSelect={!dateOnly && timeOnly}
        dateFormat={timeOnly ? "HH:mm" : dateOnly ? "dd.MM.yyyy" : dateFormat}
        timeFormat="HH:mm"
        placeholderText={placeholder}
        className={`px-4 sm:py-3 mt-1 sm:mt-2.5 border border-[--border-1] border-solid rounded-md bg-[--btn-txt] text-[--gr-1] font-[350] text-sm cursor-pointer ${className}`}
        disabled={isDisabled}
        popperClassName={popperClassName}
        calendarClassName={calendarClassName}
        //new props
        popperPlacement="bottom"
        popperProps={{ strategy: "fixed" }}
      />
    </div>
  ); //left 60px 640px-950px
};

export default CustomDatePicker;
