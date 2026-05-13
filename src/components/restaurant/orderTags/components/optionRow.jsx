import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, Trash2 } from "lucide-react";
import CustomCheckbox from "../../../common/customCheckbox";
import { maxInput, parsePrice } from "../../../../utils/utils";

const OptionRow = ({
  item,
  onUpdate,
  onDelete,
  dragHandleProps,
  isDragging,
  // Number of decimal places to format the saved price with. Sourced
  // from the restaurant's `decimalPoint` setting via the parent chain.
  // The input still accepts free-form ".," characters while focused —
  // we only reformat on blur so the user isn't fighting the cursor.
  decimals = 2,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`p-2 sm:p-2.5 rounded-lg border bg-[--white-1] transition group ${
        isDragging
          ? "border-indigo-300 ring-2 ring-indigo-100 shadow-lg"
          : "border-[--border-1] hover:border-indigo-200"
      }`}
    >
      {/* Desktop layout: 12-col grid */}
      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
        <button
          type="button"
          {...dragHandleProps}
          aria-label="drag"
          className="col-span-1 grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing mx-auto"
        >
          <GripVertical className="size-4" />
        </button>
        <div className="col-span-3">
          <input
            required
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t("orderTags.option_name_placeholder")}
            className="w-full h-9 px-2.5 rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-2">
          <TagPriceInput
            value={item.price}
            onChange={(next) => onUpdate({ price: next })}
            decimals={decimals}
            placeholder={t("orderTags.price_placeholder")}
            className="w-full h-9 px-2.5 rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <CustomCheckbox
            checked={item.isDefault}
            onChange={(e) => onUpdate({ isDefault: e.target.checked })}
            size="4 rounded-[4px]"
          />
        </div>
        <div className="col-span-1 flex justify-center">
          <CustomCheckbox
            checked={item.isMandatory}
            onChange={(e) => onUpdate({ isMandatory: e.target.checked })}
            size="4 rounded-[4px]"
          />
        </div>
        <div className="col-span-1">
          <input
            required
            type="number"
            value={item.minQuantity}
            onChange={(e) => onUpdate({ minQuantity: parseInt(e.target.value) || 0 })}
            className="w-full h-9 px-2 text-center rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-1">
          <input
            required
            type="number"
            value={item.maxQuantity}
            onChange={(e) => onUpdate({ maxQuantity: parseInt(e.target.value) || 1 })}
            className="w-full h-9 px-2 text-center rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-2 flex justify-end">
          <button
            type="button"
            onClick={onDelete}
            title={t("orderTags.delete_group")}
            className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile layout: stacked */}
      <div className="md:hidden flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...dragHandleProps}
            aria-label="drag"
            className="grid place-items-center size-7 rounded-md text-[--gr-2] hover:text-indigo-600 hover:bg-[--white-2] transition cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="size-4" />
          </button>
          <input
            required
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t("orderTags.option_name_placeholder")}
            className="flex-1 min-w-0 h-9 px-2.5 rounded-md border border-[--border-1] bg-[--white-1] text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={onDelete}
            title={t("orderTags.delete_group")}
            className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition shrink-0"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-1.5 pl-9">
          <div className="grid grid-cols-3 gap-1.5">
            <Field label={t("orderTags.col_price")}>
              <TagPriceInput
                value={item.price}
                onChange={(next) => onUpdate({ price: next })}
                decimals={decimals}
                className="w-full h-8 px-2 rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500"
              />
            </Field>
            <Field label={t("orderTags.col_min")}>
              <input
                required
                type="number"
                value={item.minQuantity}
                onChange={(e) => onUpdate({ minQuantity: parseInt(e.target.value) || 0 })}
                className="w-full h-8 px-2 text-center rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500"
              />
            </Field>
            <Field label={t("orderTags.col_max")}>
              <input
                required
                type="number"
                value={item.maxQuantity}
                onChange={(e) => onUpdate({ maxQuantity: parseInt(e.target.value) || 1 })}
                className="w-full h-8 px-2 text-center rounded-md border border-[--border-1] bg-[--white-1] text-sm outline-none transition focus:border-indigo-500"
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ChipCheck
              label={t("orderTags.col_default")}
              checked={!!item.isDefault}
              onChange={(v) => onUpdate({ isDefault: v })}
            />
            <ChipCheck
              label={t("orderTags.col_required")}
              checked={!!item.isMandatory}
              onChange={(v) => onUpdate({ isMandatory: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
      {label}
    </span>
    {children}
  </label>
);

const ChipCheck = ({ label, checked, onChange }) => (
  <label className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md border border-[--border-1] bg-[--white-2]/60 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-3.5 rounded border-[--border-1]"
    />
    <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
      {label}
    </span>
  </label>
);

// Price input for the OptionRow. When unfocused, displays the saved
// value formatted with the restaurant's `decimalPoint` setting via
// `Intl.NumberFormat("tr-TR")` — so a stored 150 reads as "150,00"
// (decimals=2) or "150" (decimals=0). On focus, swaps to a raw
// editable string so the user can type without the locale's thousand
// separator chasing the cursor — same pattern as PriceList's
// `PriceInput`. Sanitizes input live (`maxInput`) and leaves the raw
// string in parent state during editing; the parent's save path runs
// `parsePrice` to coerce to a Number, so we don't have to here.
const TagPriceInput = ({
  value,
  onChange,
  decimals = 2,
  className,
  placeholder,
}) => {
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("tr-TR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );

  const [focused, setFocused] = useState(false);
  // Local raw string while the input is focused. Mirrors what the
  // user is typing 1:1 (after sanitization), independent of the
  // parent's potentially formatted display.
  const [editStr, setEditStr] = useState("");

  // Coerce whatever the parent has into a Number for the formatted
  // (blurred) view. `parsePrice` already handles both Numbers and
  // strings like "1500,50" / "1.500,50" / "1500.50" sensibly.
  const numeric = parsePrice(value);
  // Empty string when the saved value is genuinely empty (avoids
  // showing "0,00" for a brand-new option row that hasn't been
  // touched yet — that placeholder belongs to the input, not the
  // formatter).
  const showFormatted =
    value === "" || value === null || value === undefined
      ? ""
      : formatter.format(numeric);

  const display = focused ? editStr : showFormatted;

  const handleFocus = (e) => {
    // Show the raw number while editing so the TR thousand /
    // decimal separators don't fight the cursor. Always normalize
    // through `parsePrice` first — the saved value might be either
    // a Number (loaded from backend) or a locale-formatted string
    // like "10,000" / "1.500,50" (mid-edit). Empty for a brand-new
    // option row so the placeholder shows through.
    if (value === "" || value === null || value === undefined) {
      setEditStr("");
    } else {
      // `String(Number)` drops trailing zeros (10 → "10", not
      // "10.000"); the user types what they need from there.
      setEditStr(numeric ? String(numeric) : "");
    }
    setFocused(true);
    e.target.select();
  };

  const handleChange = (e) => {
    // Reuse maxInput so the same digit/.,/maxLength rules apply as
    // before — but feed the sanitized string back into local edit
    // state AND up to the parent (parent still holds the raw string
    // during editing, matching the OrderTags save contract).
    const sanitized = maxInput({
      target: { ...e.target, name: "price", value: e.target.value },
    });
    setEditStr(sanitized);
    onChange(sanitized);
  };

  const handleBlur = () => {
    setFocused(false);
    // Don't reformat the parent state here — it stays as the raw
    // user-typed string until the OrderTagGroupCard save path runs
    // `normalizeItemsForSave` and converts via `parsePrice`. This
    // mirrors the existing edit contract; touching it would risk
    // double-parsing on the round trip.
  };

  return (
    <input
      required
      type="text"
      inputMode="decimal"
      name="price"
      value={display}
      onFocus={handleFocus}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default OptionRow;
