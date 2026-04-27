//MODULES
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

//COMP
import CheckI from "../../../assets/icon/check";
import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";

//REEDUX
import { updatePriceList } from "../../../redux/products/updatePriceListSlice";

const BULK_TYPE_OPTIONS = [
  {
    value: "percent-increase",
    labelKey: "priceList.bulk_type_percent_increase",
  },
  {
    value: "percent-decrease",
    labelKey: "priceList.bulk_type_percent_decrease",
  },
  { value: "amount-add", labelKey: "priceList.bulk_type_amount_add" },
  { value: "amount-subtract", labelKey: "priceList.bulk_type_amount_subtract" },
];

const BULK_TARGET_OPTIONS = [
  { value: "price", labelKey: "priceList.bulk_target_price" },
  { value: "campaignPrice", labelKey: "priceList.bulk_target_campaign" },
  { value: "both", labelKey: "priceList.bulk_target_both" },
];

const PriceListApplyBulk = ({ list, setList }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const [history, setHistory] = useState(null);
  const [bulkValue, setBulkValue] = useState("");
  const [bulkTarget, setBulkTarget] = useState("price");
  const [bulkType, setBulkType] = useState("percent-increase");

  const bulkTypeOptions = BULK_TYPE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const bulkTargetOptions = BULK_TARGET_OPTIONS.map((opt) => ({
    value: opt.value,
    label: t(opt.labelKey),
  }));

  const applyBulkUpdate = () => {
    if (!bulkValue || isNaN(bulkValue)) {
      toast.error(t("priceList.bulk_error_invalid_value"), {
        id: "applyInBulk",
      });
      return;
    }

    // Save current state for undo
    setHistory([...list]);

    const value = parseFloat(bulkValue);

    const updatedList = list.map((product) => {
      const newProduct = { ...product };
      newProduct.portions = (product.portions || []).map((portion) => {
        const newPortion = { ...portion };
        const currentPrice = parseFloat(newPortion.price) || 0;
        const currentDiscounted = parseFloat(newPortion.campaignPrice) || 0;

        let newPrice = currentPrice;
        let newDiscountedPrice = currentDiscounted;

        // Apply to normal price
        if (bulkTarget === "price" || bulkTarget === "both") {
          if (bulkType === "percent-increase") {
            newPrice = currentPrice * (1 + value / 100);
          } else if (bulkType === "percent-decrease") {
            newPrice = currentPrice * (1 - value / 100);
          } else if (bulkType === "amount-add") {
            newPrice = currentPrice + value;
          } else if (bulkType === "amount-subtract") {
            newPrice = currentPrice - value;
          }
        }

        // Apply to discounted price
        if (bulkTarget === "campaignPrice" || bulkTarget === "both") {
          if (bulkType === "percent-increase") {
            newDiscountedPrice = currentDiscounted * (1 + value / 100);
          } else if (bulkType === "percent-decrease") {
            newDiscountedPrice = currentDiscounted * (1 - value / 100);
          } else if (bulkType === "amount-add") {
            newDiscountedPrice = currentDiscounted + value;
          } else if (bulkType === "amount-subtract") {
            newDiscountedPrice = currentDiscounted - value;
          }
        }

        newPortion.price = Math.max(0, newPrice).toFixed(2);
        newPortion.campaignPrice = Math.max(0, newDiscountedPrice).toFixed(2);
        return newPortion;
      });

      return newProduct;
    });

    setList(updatedList);
    dispatch(updatePriceList(updatedList));
    setBulkValue("");
  };

  const handleUndo = () => {
    if (history) {
      dispatch(updatePriceList(history));
      setList(history);
      setHistory(null);
    }
  };

  return (
    <div className="bg-[#222265]/50 rounded-2xl p-6 mb-8 text-white shadow-lg relative">
      <div className="relative z-10">
        {/* Title & Desc */}
        <div className="flex-1 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">{t("priceList.bulk_title")}</h2>
          </div>
          <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
            {t("priceList.bulk_description")}
          </p>
        </div>

        {/* Inputs Grid */}
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          {/* İşlem Türü */}
          <div className="w-full sm:w-48">
            <CustomSelect
              label={t("priceList.bulk_type_label")}
              value={bulkTypeOptions.find((opt) => opt.value === bulkType)}
              options={bulkTypeOptions}
              onChange={(opt) => setBulkType(opt.value)}
              isSearchable={false}
              className="text-sm font-light"
              style={{
                backgroundColor: "#36368d",
                color: "white",
                padding: "0px",
              }}
              singleValueStyle={{ color: "white" }}
            />
          </div>

          {/* Değer */}
          <div className="w-full sm:w-36">
            <CustomInput
              label={t("priceList.bulk_value_label")}
              type="number"
              placeholder={t("priceList.bulk_value_placeholder")}
              value={bulkValue}
              onChange={(v) => setBulkValue(v)}
              className="bg-[#3D3D8A] border-[#4F4F9E] text-white placeholder-indigo-400 focus:ring-2 focus:ring-indigo-400 py-[6px]"
            />
          </div>

          {/* Hedef */}
          <div className="w-full sm:w-56">
            <CustomSelect
              label={t("priceList.bulk_target_label")}
              value={bulkTargetOptions.find((opt) => opt.value === bulkTarget)}
              options={bulkTargetOptions}
              onChange={(opt) => setBulkTarget(opt.value)}
              isSearchable={false}
              className="text-sm font-light"
              style={{
                backgroundColor: "#36368d",
                color: "white",
                padding: "0px",
              }}
              singleValueStyle={{ color: "white" }}
            />
          </div>

          {/* Geri Al Button */}
          {history && (
            <div className="flex flex-col justify-end">
              <button
                onClick={handleUndo}
                className="flex items-center justify-center gap-2 bg-[#4F4F9E] hover:bg-[#5A5AAF] text-white font-light py-1.5 px-4 rounded-lg transition-all whitespace-nowrap"
                title={t("priceList.bulk_undo_title")}
              >
                {t("priceList.bulk_undo_button")}
              </button>
            </div>
          )}

          {/* Uygula Button */}
          <div className="flex flex-col justify-end w-full sm:w-auto">
            <button
              onClick={applyBulkUpdate}
              className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#5558E3] text-white font-light py-1.5 px-6 rounded-lg flex items-center justify-center gap-2"
            >
              <CheckI className="size-[1.1rem]" />
              {t("priceList.bulk_apply_button")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceListApplyBulk;
