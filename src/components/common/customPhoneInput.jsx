// import { useEffect, useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const CustomPhoneInput = ({
  label,
  placeholder,
  value,
  onChange,
  required,
  className,
  className2,
  autoComplete = "new-password",
  className5,
  disabled,
  country,
}) => {
  // const [phone, setPhone] = useState(value);

  const handleChange = (value) => {
    onChange(value);
  };

  // useEffect(() => {
  //   handleChange(value);
  // }, [value]);

  return (
    <div className={`flex flex-col w-full relative ${className2}`}>
      <label
        className={`text-xs font-[600] tracking-wide text-[--gr-1] max-md:max-w-full text-left ${className5}`}
      >
        {label}
      </label>
      <PhoneInput
        country={country}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        inputProps={{
          required: required,
          autoComplete: autoComplete,
          className: `pl-12 py-2.5 text-base font-[300] rounded-md border border-solid border-[--border-1] text-[--black-1] max-md:pr-5 w-full autofill:shadow-white autofill:outline-none ${className}`,
        }}
      />
    </div>
  );
};

export default CustomPhoneInput;
