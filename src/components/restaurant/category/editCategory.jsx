//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

//COMP
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import menusJSON from "../../../assets/js/Menus.json";
import { usePopup } from "../../../context/PopupContext";
import CustomCheckbox from "../../common/customCheckbox";
import CustomFileInput from "../../common/customFileInput";
import { CancelI, CloudUI, WarnI } from "../../../assets/icon";
import { toNameCase } from "../../../utils/utils";

//REDUX
import {
  editCategory,
  resetEditCategory,
} from "../../../redux/categories/editCategorySlice";
import { getMenus, resetGetMenus } from "../../../redux/menus/getMenusSlice";

const EditCategory = ({
  id,
  category,
  onSuccess,
  setCategoriesData,
  setCategoriesDataBefore,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const { success, error } = useSelector((s) => s.categories.editCategory);
  const { menus, error: menusError } = useSelector((s) => s.menus.get);

  const [categoryData, setCategoryData] = useState(category);
  const [preview, setPreview] = useState(
    category?.image
      ? URL.createObjectURL(category.image)
      : category?.imageAbsoluteUrl || null,
  );
  const [showCampaignWarning, setShowCampaignWarning] = useState(false);
  const [menusData, setMenusData] = useState(null);

  const handleField = (key, value) => {
    setCategoryData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setCategoryData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCampaignToggle = () => {
    const newCampaignState = !categoryData.campaign;
    handleToggle("campaign");
    setShowCampaignWarning(newCampaignState);
  };

  const handleFileChange = (file) => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const blobUrl = file ? URL.createObjectURL(file) : null;
    setPreview(blobUrl);
    setCategoryData((prev) => ({
      ...prev,
      image: file || null,
    }));
  };

  const toggleMenuSelection = (menuId) => {
    const menuIds = categoryData?.menuIds || [];
    setCategoryData((prev) => ({
      ...prev,
      menuIds: menuIds.includes(menuId)
        ? menuIds.filter((id) => id !== menuId)
        : [...menuIds, menuId],
    }));
  };

  const handleSave = () => {
    if (isEqual(categoryData, category)) {
      toast.error(t("editCategories.not_changed"), { id: "categories" });
      return;
    }
    // Heads-up before saving a category that's not attached to any
    // menu: the customer-facing app filters categories by the menu
    // currently active for the time slot, so a category with an
    // empty `menuIds` array is invisible in production even though
    // the admin list shows it. Only prompt when menus actually
    // exist (no point asking when the restaurant has no menus to
    // pick from). User can still proceed — explicit opt-in.
    const hasMenus = (menusData || []).length > 0;
    const noMenuSelected = !(categoryData.menuIds || []).length;
    if (hasMenus && noMenuSelected) {
      const ok = window.confirm(t("editCategories.no_menu_confirm"));
      if (!ok) return;
    }
    try {
      const formData = new FormData();

      const { id, restaurantId, menuIds, name, isActive, featured, campaign } =
        categoryData;
      const payloadCategory = [
        {
          id,
          restaurantId,
          menuIds,
          name,
          isActive,
          featured,
          campaign,
        },
      ];

      formData.append("restaurantId", categoryData?.restaurantId);
      formData.append("categoriesData", JSON.stringify(payloadCategory));

      if (categoryData.image) {
        formData.append(`image_0`, categoryData.image);
      }

      console.log("Editing categories:", payloadCategory);
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      dispatch(editCategory(formData));
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  // TOAST
  useEffect(() => {
    if (success) {
      onSuccess(categoryData);
      setCategoriesData((prev) =>
        prev.map((cat) =>
          cat.id === categoryData.id
            ? { ...categoryData, imageAbsoluteUrl: preview }
            : cat,
        ),
      );
      setCategoriesDataBefore((prev) =>
        prev.map((cat) =>
          cat.id === categoryData.id
            ? { ...categoryData, imageAbsoluteUrl: preview }
            : cat,
        ),
      );
      setPopupContent(null);
      toast.success(t("editCategories.success"), { id: "categories" });
      dispatch(resetEditCategory());
    }
    if (error) dispatch(resetEditCategory());
  }, [success, error]);

  //GET MENUS
  useEffect(() => {
    if (!menusData) {
      dispatch(getMenus({ restaurantId: id }));
    }
  }, [menusData]);

  //SET MENUS
  useEffect(() => {
    if (menus) {
      setMenusData(menus);
      dispatch(resetGetMenus());
    }
    if (menusError) dispatch(resetGetMenus());
  }, [menus, menusError]);

  return (
    <div className="w-full flex justify-center pb-5- mt-1- text-[--black-2] max-h-[95dvh] overflow-hidden ">
      {/* <div className="flex flex-col px-4- sm:px-14-"> */}
      {/* <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editCategories.title", { name: restaurant?.name })}
        </h1>

        <div className="flex justify-between items-center">
          <CategoriesHeader restaurant={restaurant} />
        </div> */}

      <div className="w-full max-w-xl flex bg-[--white-1] rounded-lg justify-center transition-all duration-300 relative">
        <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full p-8 max-sm:px-4 transform transition-all duration-300 modal-content overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-[--light-3] pb-4">
            <h3 className="text-2xl font-bold text-[--black-1]">
              {t("editCategories.edit")}
            </h3>
            <button
              onClick={() => setPopupContent(null)}
              className="text-[--gr-1] hover:text-[--black-2] transition-colors"
              aria-label={t("categoryProducts.close")}
            >
              <CancelI clsassName="" />
            </button>
          </div>

          <div className="space-y-6 overflow-y-auto max-h-[80dvh] pb-14">
            {/* Kategori Adı */}
            <CustomInput
              required
              label={`${t("addCategory.category_name")} *`}
              placeholder={t("addCategory.category_name_placeholder")}
              // Mirror addCategory.jsx — auto-capitalise so renaming a
              // category produces the same casing convention as adding
              // one ("salata" → "Salata").
              className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={categoryData.name}
              onChange={(v) => handleField("name", toNameCase(v))}
            />

            {/* Kategori Görseli */}
            <div>
              <span className="text-[--black-2] text-sm font-medium mb-2 block">
                {t("editCategories.category_image_optional")}
              </span>
              <div className="group border-2 border-dashed border-[--border-1] rounded-xl p-4 text-center hover:border-[--primary-1] transition-all relative cursor-pointer">
                {preview ? (
                  <div className="max-h-40 overflow-hidden flex justify-center items-center rounded-lg mx-auto shadow-md">
                    <img
                      src={preview}
                      className="max-h-40 w-auto object-cover rounded-md"
                      alt="Kategori"
                    />
                  </div>
                ) : (
                  <div className="group-hover:scale-110 transition-transform duration-300 pointer-events-none">
                    <div className="w-12 h-12 bg-[--status-primary-1] text-[--primary-1] rounded-full flex items-center justify-center mx-auto mb-3">
                      <CloudUI className="size-[1.5rem] pt-1 pl-1" />
                    </div>
                    <p className="text-sm text-[--gr-1] group-hover:text-[--primary-1] font-medium">
                      {t("addCategory.image_click_to_select")}
                    </p>
                  </div>
                )}
                <div className="absolute inset-0 opacity-0">
                  <CustomFileInput
                    required={false}
                    value={categoryData.image}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                    className="h-full w-full"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox for Menu IDs */}
            <div>
              <label className="block text-[--black-2] text-sm font-medium mb-3">
                {t("addCategory.menus_optional")}
              </label>
              <div className="bg-[--light-1] p-4 rounded-xl border border-[--border-1] space-y-3 max-h-40 overflow-y-auto">
                {menusData?.length > 0 ? (
                  menusData.map((menu) => (
                    <CustomCheckbox
                      key={menu.id}
                      id={`menu-${menu.id}`}
                      label={menu.name}
                      checked={categoryData?.menuIds?.includes(menu.id)}
                      onChange={() => toggleMenuSelection(menu.id)}
                      className="w-full"
                      className2="text-[--black-2] font-medium"
                    />
                  ))
                ) : (
                  <p className="text-sm text-[--gr-1] italic">
                    {t("addCategory.menus_empty")}
                  </p>
                )}
              </div>
              <p className="text-xs text-[--gr-1] mt-2">
                {t("addCategory.menus_help")}
              </p>
              {/* Surface the "no menu = hidden in customer app"
                  consequence while the user is still configuring,
                  not just at save time. Only shown when menus exist
                  AND none are selected. */}
              {menusData?.length > 0 &&
                !(categoryData.menuIds || []).length && (
                  <div
                    role="alert"
                    className="mt-2 flex items-start gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-100"
                  >
                    <WarnI className="text-amber-600 dark:text-amber-300 mr-1 size-[1rem] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-snug">
                      {t("editCategories.no_menu_warning")}
                    </p>
                  </div>
                )}
            </div>

            {/* Toggle'lar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Durum */}
              <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
                <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                  {t("editCategories.status")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--black-2]">
                    {t("editCategories.status_open")}
                  </span>
                  <CustomToggle
                    checked={categoryData.isActive}
                    onChange={() => handleToggle("isActive")}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
              </div>

              {/* Kampanya */}
              <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
                <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                  {t("editCategories.campaign")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--black-2]">
                    {t("editCategories.status_active")}
                  </span>
                  <CustomToggle
                    checked={categoryData.campaign}
                    onChange={handleCampaignToggle}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
              </div>

              {/* Öne Çıkan */}
              <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
                <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                  {t("editCategories.featured")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--black-2]">
                    {t("editCategories.status_active")}
                  </span>
                  <CustomToggle
                    checked={categoryData.featured}
                    onChange={() => handleToggle("featured")}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
              </div>
            </div>

            {/* Kampanya Uyarısı */}
            {showCampaignWarning && (
              <div className="p-4 bg-[--status-orange] text-[--orange-1] rounded-xl border border-[--border-orange] text-sm font-medium transition-all duration-300 ease-in-out">
                <div className="flex items-center">
                  <WarnI className="text-[--orange-1] mr-3 size-[1.5rem]" />
                  <span>
                    {t("addCategory.campaign_warning", {
                      tab: t("addCategory.campaign_warning_tab"),
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="absolute bottom-0 left-0 right-0 bg-[--white-1] flex justify-end space-x-3 p-3 border-t border-[--border-1]">
            <button
              onClick={() => setPopupContent(null)}
              className="px-6 py-2.5 text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] rounded-xl hover:bg-[--light-1] hover:text-[--black-1] transition-all"
            >
              {t("addCategory.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg shadow-[--light-1] hover:bg-[--primary-2] transform hover:-translate-y-0.5 transition-all"
            >
              {t("addCategory.save")}
            </button>
          </div>
        </div>
      </div>
      {/* </div> */}
    </div>
  );
};

export default EditCategory;
