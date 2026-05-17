//MODULES
import toast from "react-hot-toast";
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

//COMP
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import CustomSelect from "../../common/customSelector";
import CustomFileInput from "../../common/customFileInput";
import { usePopup } from "../../../context/PopupContext";
import { CancelI, CloudUI } from "../../../assets/icon";

//REDUX
import {
  addSubCategory,
  resetAddSubCategory,
} from "../../../redux/subCategories/addSubCategorySlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { useParams } from "react-router-dom";

const initialSubCategory = () => ({
  name: "",
  categoryId: "",
  image: null,
  isActive: true,
});

const AddSubCategory = ({ restaurant, onSuccess }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const { success, error } = useSelector((s) => s.subCategories.add);
  const { categories: data } = useSelector((state) => state.categories.get);

  const [categories, setCategories] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategory, setSubCategory] = useState(initialSubCategory());
  const [preview, setPreview] = useState(null);

  function assignCategoriesOptions(categories) {
    console.log(categories);
    if (!categories) return;
    const options = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
    }));
    setCategoryOptions(options);
  }

  const handleField = (key, value) => {
    setSubCategory((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setSubCategory((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileChange = (file) => {
    if (preview && preview.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }
    const blobUrl = file ? URL.createObjectURL(file) : null;
    setPreview(blobUrl);
    setSubCategory((prev) => ({
      ...prev,
      image: file || null,
    }));
  };

  const handleSave = () => {
    if (!subCategory.name.trim()) {
      toast.error(t("addSubCategory.name_required"), { id: "subCategories" });
      return;
    }

    if (!subCategory.categoryId) {
      toast.error(t("addSubCategory.category_required"), {
        id: "subCategories",
      });
      return;
    }

    try {
      const formData = new FormData();

      const { image, ...rest } = subCategory;
      const payloadSubCategory = [rest];

      formData.append("restaurantId", restaurant?.id);
      formData.append("subCategoryData", JSON.stringify(payloadSubCategory));

      if (subCategory.image) {
        formData.append(`image_0`, subCategory.image);
      }

      console.log("Adding subcategory:", subCategory);
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      dispatch(addSubCategory(formData));
    } catch (error) {
      console.error("Error preparing form data:", error);
    }
  };

  // TOAST
  useEffect(() => {
    if (success) {
      setPopupContent(null);
      toast.success(t("addSubCategory.success"), { id: "subCategories" });
      dispatch(resetAddSubCategory());
      onSuccess && onSuccess(subCategory);
    }
    if (error) dispatch(resetAddSubCategory());
  }, [success, error]);

  //GET CATEGORIES
  useEffect(() => {
    if (!categories) {
      dispatch(getCategories({ restaurantId: restaurant?.id }));
    }
  }, [categories]);

  //SET CATEGORIES
  useEffect(() => {
    if (data) {
      console.log(data);
      setCategories(data);
      assignCategoriesOptions(data);
    }
  }, [data]);

  return (
    <div className="w-full flex justify-center pb-5- mt-1-  text-[--black-2]">
      <div className="w-full max-w-xl flex bg-[--white-1] rounded-lg justify-center transition-all duration-300 max-h-[95dvh] overflow-y-auto">
        <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full transform scale-100 transition-all duration-300 modal-content p-8 max-sm:px-4 overflow-hidden">
          <div className="flex justify-between items-center mb-4 border-b border-[--light-3] pb-4">
            <h3 className="text-2xl font-bold text-[--black-1]">
              {t("addSubCategory.add")}
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
            {/* Alt Kategori Adı */}
            <CustomInput
              required
              label={`${t("addSubCategory.name")} *`}
              placeholder={t("addSubCategory.name_placeholder")}
              className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              className2=""
              value={subCategory.name}
              onChange={(v) => handleField("name", v)}
            />

            {/* Kategori Seçimi */}
            <div>
              <label className="block text-[--black-2] text-sm font-medium mb-2">
                {`${t("addSubCategory.category_label")} *`}
              </label>
              <CustomSelect
                required
                placeholder={t("addSubCategory.category_placeholder")}
                value={
                  subCategory.categoryId
                    ? categoryOptions.find(
                        (opt) => opt.value === subCategory.categoryId,
                      )
                    : {
                        label: t("addSubCategory.category_placeholder"),
                        value: "",
                      }
                }
                style={{ backgroundColor: "var(--light-1)" }}
                options={categoryOptions}
                onChange={(opt) => handleField("categoryId", opt?.value || "")}
                isSearchable={true}
                className="text-sm"
              />
              <p className="text-xs text-[--gr-1] mt-2">
                {t("addSubCategory.category_help")}
              </p>
            </div>

            {/* Alt Kategori Görseli — see editCategory.jsx; the label
                IS the dropzone, preview lives inside so clicks trigger
                the file picker via standard HTML semantics. */}
            <div>
              <span className="text-[--black-2] text-sm font-medium mb-2 block">
                {t("addSubCategory.image_optional")}
              </span>
              <CustomFileInput
                required={false}
                value={subCategory.image}
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="!group !border-[--border-1] !rounded-xl !p-6 !bg-transparent text-center hover:!border-[--primary-1] transition-all"
              >
                {preview ? (
                  <div className="mb-3 max-h-40 overflow-hidden flex justify-center items-center rounded-lg mx-auto shadow-md">
                    <img
                      src={preview}
                      className="max-h-40 w-auto object-cover rounded-md"
                      alt="Alt Kategori"
                    />
                  </div>
                ) : (
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 bg-[--status-primary-1] text-[--primary-1] rounded-full flex items-center justify-center mx-auto mb-3">
                      <CloudUI className="size-[1.5rem] pt-1 pl-1" />
                    </div>
                    <p className="text-sm text-[--gr-1] group-hover:text-[--primary-1] font-medium">
                      {t("addSubCategory.image_click_to_select")}
                    </p>
                  </div>
                )}
              </CustomFileInput>
            </div>

            {/* Durum Toggle */}
            <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
              <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                {t("editCategories.status")}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[--black-2]">
                  {t("editCategories.status_open")}
                </span>
                <CustomToggle
                  checked={subCategory.isActive}
                  onChange={() => handleToggle("isActive")}
                  className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                />
              </div>
            </div>

            {/* Info Note */}
            <div className="p-4 bg-[--status-primary-1] text-[--primary-1] rounded-xl border border-[--border-1] text-sm">
              <div className="flex items-start">
                <i className="fa-solid fa-circle-info mr-3 mt-0.5"></i>
                <span>{t("addSubCategory.info")}</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="absolute bottom-0 left-0 right-0 bg-[--white-1] flex justify-end space-x-3 p-3 border-t border-[--border-1]">
            <button
              onClick={() => setPopupContent(null)}
              className="px-6 py-2.5 text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] rounded-xl hover:bg-[--light-1] hover:text-[--black-1] transition-all"
            >
              {t("addSubCategory.cancel")}
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg shadow-[--light-1] hover:bg-[--primary-2] transform hover:-translate-y-0.5 transition-all"
            >
              {t("addSubCategory.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSubCategory;
