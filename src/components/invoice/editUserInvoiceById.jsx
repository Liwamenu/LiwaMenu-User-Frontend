//COMP
import { useTranslation } from "react-i18next";
import CustomInput from "../common/customInput";
import CustomSelect from "../common/customSelector";
import CustomTextarea from "../common/customTextarea";

const EditUserInvoiceById = ({
  cities,
  districts,
  neighs,
  userInvoice,
  setUserInvoice,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex gap-4 max-sm:flex-col">
        <CustomInput
          required={true}
          label={t("invoice.name_title")}
          placeholder={t("invoice.name_title")}
          className="py-[.45rem] text-sm"
          value={userInvoice.title || ""}
          maxLength={100}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                title: e,
              };
            });
          }}
        />
      </div>
      <div className="flex gap-4 max-sm:flex-col">
        <CustomInput
          required={true}
          label={t("invoice.vkn_tckn")}
          placeholder={t("invoice.vkn_tckn")}
          className="py-[.45rem] text-sm"
          minLength={10}
          maxLength={11}
          name="digit"
          type="text"
          value={userInvoice.taxNumber || ""}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                taxNumber: e,
              };
            });
          }}
        />
        <CustomInput
          required={true}
          label={t("invoice.tax_office")}
          placeholder={t("invoice.tax_office")}
          className="py-[.45rem] text-sm"
          maxLength={30}
          value={userInvoice.taxOffice || ""}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                taxOffice: e,
              };
            });
          }}
        />
      </div>
      <div className="flex gap-4 max-sm:flex-col">
        <CustomInput
          type="text"
          label={t("invoice.trade_registry_number")}
          placeholder={t("invoice.trade_registry_number")}
          className="py-[.45rem] text-sm"
          maxLength={20}
          value={userInvoice.tradeRegistryNumber || ""}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                tradeRegistryNumber: e,
              };
            });
          }}
        />
        <CustomInput
          type="text"
          label={t("invoice.mersis_number")}
          placeholder={t("invoice.mersis_number")}
          className="py-[.45rem] text-sm"
          maxLength={20}
          value={userInvoice.mersisNumber || ""}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                mersisNumber: e,
              };
            });
          }}
        />
      </div>
      <div className="flex gap-4 max-sm:flex-col">
        <CustomSelect
          required={true}
          label={t("invoice.city")}
          placeholder={t("invoice.name")}
          style={{ padding: "1px 0px" }}
          className="text-sm"
          value={
            userInvoice.city?.value
              ? userInvoice.city
              : { value: null, label: t("invoice.select_city") }
          }
          options={[{ value: null, label: t("invoice.select_city") }, ...cities]}
          onChange={(selectedOption) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                city: selectedOption,
              };
            });
          }}
        />
        <CustomSelect
          required={true}
          label={t("invoice.district")}
          placeholder={t("invoice.name")}
          style={{ padding: "1px 0px" }}
          className="text-sm"
          value={
            userInvoice.district?.value
              ? userInvoice.district
              : { value: null, label: t("invoice.select_district") }
          }
          options={[{ value: null, label: t("invoice.select_district") }, ...districts]}
          onChange={(selectedOption) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                district: selectedOption,
              };
            });
          }}
        />
      </div>
      <div className="flex gap-4 max-sm:flex-col">
        <CustomSelect
          required={true}
          label={t("invoice.neighbourhood")}
          placeholder={t("invoice.name")}
          style={{ padding: "1px 0px" }}
          className="text-sm"
          value={
            userInvoice.neighbourhood?.value
              ? userInvoice.neighbourhood
              : { value: null, label: t("invoice.select_neighbourhood") }
          }
          options={[{ value: null, label: t("invoice.select_neighbourhood") }, ...neighs]}
          onChange={(selectedOption) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                neighbourhood: selectedOption,
              };
            });
          }}
        />
        <CustomTextarea
          required={true}
          label={t("invoice.address")}
          placeholder={t("invoice.address")}
          className="pb-14 text-sm"
          value={userInvoice.address || ""}
          onChange={(e) => {
            setUserInvoice((prev) => {
              return {
                ...prev,
                address: e.target.value,
              };
            });
          }}
        />
      </div>
    </>
  );
};

export default EditUserInvoiceById;
