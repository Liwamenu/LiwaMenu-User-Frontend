//MODULES
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

//COMP
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import CustomCheckbox from "../../common/customCheckbox";
import { usePopup } from "../../../context/PopupContext";
import CustomFileInput from "../../common/customFileInput";
import { CancelI, CloudUI, WarnI } from "../../../assets/icon";
import { toNameCase } from "../../../utils/utils";

//REDUX
import {
  addCategory,
  resetAddCategory,
} from "../../../redux/categories/addCategorySlice";
import { getMenus, resetGetMenus } from "../../../redux/menus/getMenusSlice";

const initialCategory = () => ({
  name: "",
  image: null,
  isActive: true,
  featured: false,
  campaign: false,
  menuIds: [],
});

const AddCategory = ({ id, onSuccess, data: restaurant }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const { success, error } = useSelector((s) => s.categories.addCategory);
  const { menus, error: menusError } = useSelector((s) => s.menus.get);

  const [menusData, setMenusData] = useState(null);
  // Guards the "auto-select the only menu" effect so it runs once.
  // Without it, unticking the auto-selected menu would just immediately
  // re-tick on the next render — user could never opt out. With the
  // ref, the auto-apply fires only on the first arrival of `menusData`
  // (when no menus have been touched yet).
  const autoMenuAppliedRef = useRef(false);

  const [category, setCategory] = useState(initialCategory());
  const [preview, setPreview] = useState(null);
  const [showCampaignWarning, setShowCampaignWarning] = useState(false);

  const handleField = (key, value) => {
    setCategory((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setCategory((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCampaignToggle = () => {
    const newCampaignState = !category.campaign;
    handleToggle("campaign");
    setShowCampaignWarning(newCampaignState);
  };

  const handleFileChange = (file) => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const blobUrl = file ? URL.createObjectURL(file) : null;
    setPreview(blobUrl);
    setCategory((prev) => ({
      ...prev,
      image: file || null,
    }));
  };

  const toggleMenuSelection = (menuId) => {
    setCategory((prev) => ({
      ...prev,
      menuIds: prev.menuIds.includes(menuId)
        ? prev.menuIds.filter((id) => id !== menuId)
        : [...prev.menuIds, menuId],
    }));
  };

  const handleSave = () => {
    // Same heads-up as editCategory: a category not attached to any
    // menu is hidden on the customer side, so warn the user before
    // saving. Only when menus actually exist — if there are no
    // menus to pick from, the question is meaningless.
    const hasMenus = (menusData || []).length > 0;
    const noMenuSelected = !(category.menuIds || []).length;
    if (hasMenus && noMenuSelected) {
      const ok = window.confirm(t("editCategories.no_menu_confirm"));
      if (!ok) return;
    }
    try {
      const formData = new FormData();

      const { image, ...rest } = category;
      const payloadCategory = [rest];

      formData.append("restaurantId", restaurant?.id);
      formData.append("categoriesData", JSON.stringify(payloadCategory));

      if (category.image) {
        formData.append(`image_0`, category.image);
      }

      console.log("Adding category:", category);
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      dispatch(addCategory(formData));
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  // TOAST & RESET
  useEffect(() => {
    if (success) {
      setPopupContent(null);
      toast.success(t("addCategory.success"), { id: "categories" });
      dispatch(resetAddCategory());
      onSuccess && onSuccess({ ...category, imageAbsoluteUrl: preview });
    }
    if (error) dispatch(resetAddCategory());
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

  // When the restaurant has exactly one menu, pre-select it so the
  // new category isn't accidentally saved with an empty `menuIds` (a
  // common foot-gun that hides the category on the customer side).
  // For two or more menus we DON'T guess — the user has to pick
  // deliberately, and the inline banner + pre-save confirm below
  // surface the consequence if they leave it empty.
  // Guard against re-applying on every render so the user can still
  // deselect after the initial auto-tick.
  useEffect(() => {
    if (autoMenuAppliedRef.current) return;
    if (!menusData || menusData.length !== 1) return;
    if ((category.menuIds || []).length > 0) return;
    autoMenuAppliedRef.current = true;
    setCategory((prev) => ({ ...prev, menuIds: [menusData[0].id] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menusData]);

  return (
    <div className="w-full flex justify-center pb-5- mt-1-  text-[--black-2] max-h-[95dvh] overflow-hidden">
      {/* <div className="w-full flex flex-col px-4- sm:px-14-"> */}
      {/* <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 sm:-mx-14 px-4 sm:px-14 rounded-t-lg">
          {t("editCategories.title", { name: restaurant?.name })}
        </h1>

        <div className="flex justify-between items-center">
          <CategoriesHeader restaurant={restaurant} />
        </div> */}

      <div className="w-full max-w-xl flex bg-[--white-1] rounded-lg justify-center transition-all duration-300 relative">
        <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full p-8 max-sm:px-4 transform scale-100 transition-all duration-300 modal-content overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-[--light-3] pb-4">
            <h3 className="text-2xl font-bold text-[--black-1]">
              {t("addCategory.add")}
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
            {/* Kategori Adı — `toNameCase` capitalises the first letter
                of every word (Turkish-aware: "ısı" → "Isı", "şehir" →
                "Şehir") so menu titles read consistently regardless of
                what casing the author types. */}
            <CustomInput
              required
              label={`${t("addCategory.category_name")} *`}
              placeholder={t("addCategory.category_name_placeholder")}
              className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={category.name}
              onChange={(v) => handleField("name", toNameCase(v))}
            />

            {/* Kategori Görseli */}
            <div>
              <span className="text-[--black-2] text-sm font-medium mb-2 block">
                {t("addCategory.category_image_optional")}
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
                    value={category.image}
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
              <div className="bg-[--light-1] p-4 rounded-xl border border-[--border-1] space-y-3 max-h-44 overflow-y-auto">
                {menusData && menusData.length > 0 ? (
                  menusData &&
                  menusData.map((menu) => (
                    <div key={menu.id}>
                      <CustomCheckbox
                        id={`menu-${menu.id}`}
                        label={menu.name}
                        checked={category.menuIds.includes(menu.id)}
                        onChange={() => toggleMenuSelection(menu.id)}
                        className2="text-[--black-2] font-medium"
                      />
                    </div>
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
              {/* Inline reminder while no menu is selected — same
                  pattern as editCategory. Suppressed when no menus
                  exist at all (menus_empty already covers that). */}
              {menusData?.length > 0 &&
                !(category.menuIds || []).length && (
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
                    checked={category.isActive}
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
                    checked={category.campaign}
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
                    checked={category.featured}
                    onChange={() => handleToggle("featured")}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
              </div>
            </div>

            {/* Kampanya Uyarısı */}
            {showCampaignWarning && (
              <div className="p-4 bg-[--status-orange] text-[--orange-1] dark:text-white rounded-xl border border-[--border-orange] text-sm font-medium transition-all duration-300 ease-in-out">
                <div className="flex items-center">
                  <WarnI className="text-[--orange-1] dark:text-white mr-3 size-[1.5rem]" />
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

export default AddCategory;
