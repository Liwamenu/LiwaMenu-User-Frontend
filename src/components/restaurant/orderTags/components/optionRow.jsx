import { useTranslation } from "react-i18next";
import { GripVertical, Trash2 } from "lucide-react";
import CustomCheckbox from "../../../common/customCheckbox";

const OptionRow = ({
  item,
  onUpdate,
  onDelete,
  dragHandleProps,
  isDragging,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className={`p-2 sm:p-2.5 rounded-lg border bg-white transition group ${
        isDragging
          ? "border-indigo-300 ring-2 ring-indigo-100 shadow-lg"
          : "border-slate-200 hover:border-indigo-200"
      }`}
    >
      {/* Desktop layout: 12-col grid */}
      <div className="hidden md:grid grid-cols-12 gap-2 items-center">
        <button
          type="button"
          {...dragHandleProps}
          aria-label="drag"
          className="col-span-1 grid place-items-center size-7 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition cursor-grab active:cursor-grabbing mx-auto"
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
            className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-2">
          <input
            required
            type="number"
            value={item.price}
            onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
            placeholder={t("orderTags.price_placeholder")}
            className="w-full h-9 px-2.5 rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
            className="w-full h-9 px-2 text-center rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </div>
        <div className="col-span-1">
          <input
            required
            type="number"
            value={item.maxQuantity}
            onChange={(e) => onUpdate({ maxQuantity: parseInt(e.target.value) || 1 })}
            className="w-full h-9 px-2 text-center rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
            className="grid place-items-center size-7 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition cursor-grab active:cursor-grabbing shrink-0"
          >
            <GripVertical className="size-4" />
          </button>
          <input
            required
            type="text"
            value={item.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t("orderTags.option_name_placeholder")}
            className="flex-1 min-w-0 h-9 px-2.5 rounded-md border border-slate-200 bg-white text-sm font-medium outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
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
              <input
                required
                type="number"
                value={item.price}
                onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
                className="w-full h-8 px-2 rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500"
              />
            </Field>
            <Field label={t("orderTags.col_min")}>
              <input
                required
                type="number"
                value={item.minQuantity}
                onChange={(e) => onUpdate({ minQuantity: parseInt(e.target.value) || 0 })}
                className="w-full h-8 px-2 text-center rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500"
              />
            </Field>
            <Field label={t("orderTags.col_max")}>
              <input
                required
                type="number"
                value={item.maxQuantity}
                onChange={(e) => onUpdate({ maxQuantity: parseInt(e.target.value) || 1 })}
                className="w-full h-8 px-2 text-center rounded-md border border-slate-200 bg-white text-sm outline-none transition focus:border-indigo-500"
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
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </span>
    {children}
  </label>
);

const ChipCheck = ({ label, checked, onChange }) => (
  <label className="inline-flex items-center gap-1.5 h-8 px-2 rounded-md border border-slate-200 bg-slate-50/60 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="size-3.5 rounded border-slate-300"
    />
    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {label}
    </span>
  </label>
);

export default OptionRow;
