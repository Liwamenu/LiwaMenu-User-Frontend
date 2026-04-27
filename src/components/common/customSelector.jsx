import Select from "react-select";

const CustomSelect = ({
  label,
  value,
  isSearchable,
  isClearable,
  options,
  onChange,
  placeholder,
  className,
  className2,
  disabled,
  required,
  style,
  inputStyle,
  optionStyle,
  singleValueStyle,
  menuPlacement,
}) => {
  const formatOptionLabel = ({ label }) => (
    <div dangerouslySetInnerHTML={{ __html: label }} />
  );

  return (
    <div className={`flex flex-col w-full relative ${className2}`}>
      <label className="text-xs font-[600] tracking-wide text-[--gr-1] max-md:max-w-full text-left">
        {label}
      </label>
      <Select
        // menuIsOpen={true}
        value={value}
        onChange={onChange}
        options={options}
        required={required}
        placeholder={placeholder}
        className={`text-base font-[350] ${className}`}
        isDisabled={disabled}
        isSearchable={isSearchable !== undefined ? isSearchable : true}
        isClearable={isClearable}
        formatOptionLabel={formatOptionLabel}
        menuPlacement={menuPlacement || "bottom"}
        styles={{
          control: (provided, state) => ({
            ...provided,
            boxShadow: "none",
            cursor: "pointer",
            border: "1px solid var(--border-1)",
            backgroundColor: "var(--white-1)",
            borderRadius: ".375rem",
            padding: "4px 0px",
            ...style,
          }),
          option: (provided, state) => ({
            ...provided,
            backgroundColor:
              state.label === value?.label ? "var(--light-1)" : "var(--white-1)",
            color:
              state.label === value?.label ? "var(--black-2)" : "var(--black-1)",
            ...optionStyle,
          }),
          singleValue: (provided, state) => ({
            ...provided,
            color: "var(--black-2)",
            ...singleValueStyle,
          }),
          menu: (provided, state) => ({
            ...provided,
            backgroundColor: "var(--white-1)",
            zIndex: "9999",
          }),
          menuList: (provided, state) => ({
            ...provided,
            maxHeight: "16rem",
            borderBottomLeftRadius: ".3rem",
            borderBottomRightRadius: ".3rem",
            paddingBottom: "0",
          }),
          input: (provided, state) => ({
            ...provided,
            color: "var(--black-1)",
            ...inputStyle,
          }),
        }}
      />
      {required && !value?.value && (
        <input
          type="text"
          required={required}
          value=""
          onChange={() => {}}
          style={{
            position: "absolute",
            top: 50,
            left: 0,
            opacity: 0,
            width: "100%",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
};

export default CustomSelect;
