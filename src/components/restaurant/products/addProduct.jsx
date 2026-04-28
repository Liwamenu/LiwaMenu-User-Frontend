// MODULES
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

// COMP
import CustomInput from "../../common/customInput";
import CustomSelect from "../../common/customSelector";
import CustomTextarea from "../../common/customTextarea";
import CustomToggle from "../../common/customToggle";
import CustomFileInput from "../../common/customFileInput";
import { ProductImagePicker, AIImagePromptCard } from "./editProduct";

// DATA
import categoriesJSON from "../../../assets/js/Categories.json";
import subCategories from "../../../assets/js/SubCategories.json";

// UTILS
import { formatToPrice } from "../../../utils/utils";
import ProductsHeader from "./header";
import { CloudUI, DeleteI } from "../../../assets/icon";
import { Loader2 } from "lucide-react";

//REDUX
import {
  addProduct,
  resetAddProduct,
} from "../../../redux/products/addProductSlice";
import { resetGetProducts } from "../../../redux/products/getProductsSlice";
import { getCategories } from "../../../redux/categories/getCategoriesSlice";
import { getSubCategories } from "../../../redux/subCategories/getSubCategoriesSlice";

const emptyPortion = () => ({
  id: undefined,
  productId: undefined,
  name: "",
  price: 0,
  campaignPrice: 0,
  specialPrice: 0, // local optional “Özel” price
});

// First portion is pre-named "Normal" so single-portion products can be saved
// without an extra rename step. Additional portions added by the user start
// blank as before.
const defaultProduct = {
  sortOrder: 0,
  name: "",
  image: null, // File
  description: "",
  recommendation: false,
  hide: false,
  categoryId: "",
  categoryName: "",
  subCategoryId: "",
  subCategoryName: "",
  freeTagging: true,
  portions: [{ ...emptyPortion(), name: "Normal" }],
};

const AddProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const restaurantId = params.id;
  const dispatch = useDispatch();

  const { t } = useTranslation();

  const { categories } = useSelector((s) => s.categories.get);
  const { success, error, loading } = useSelector((s) => s.products.add);
  const { subCategories } = useSelector((s) => s.subCategories.get);

  const [preview, setPreview] = useState(null);
  const [productData, setProductData] = useState(defaultProduct);
  const [categoryOptions, setCategoryOptions] = useState([]);

  function setCategoryOptionsFunc() {
    const options = (categories || []).map((c) => ({
      value: c.id,
      label: c.name,
      ...c,
    }));
    setCategoryOptions(options);
  }

  const getSubcatOptions = (categoryId) =>
    (subCategories || [])
      .filter((s) => s.categoryId === categoryId)
      .map((sc) => ({ value: sc.id, label: sc.name, ...sc }));

  //handlers
  const handleField = (key, value) => {
    setProductData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSpecialPrice = (value) => {
    // change special price for all portions
    setProductData((prev) => {
      const next = { ...prev };
      next.specialPrice = value;
      next.portions = next.portions.map((p) => ({
        ...p,
        specialPrice: value,
      }));
      return next;
    });
  };

  const handleToggle = (key) => {
    setProductData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePortionChange = (idx, key, value) => {
    setProductData((prev) => {
      const next = { ...prev };
      const portions = [...next.portions];
      portions[idx] = { ...portions[idx], [key]: value };
      next.portions = portions;
      return next;
    });
  };

  const addPortion = () => {
    setProductData((prev) => ({
      ...prev,
      portions: [...prev.portions, emptyPortion()],
    }));
  };

  const deletePortion = (idx) => {
    setProductData((prev) => {
      const portions = [...prev.portions];
      portions.splice(idx, 1);
      return { ...prev, portions };
    });
  };

  const handleFileChange = (file) => {
    const blobUrl = file ? URL.createObjectURL(file) : null;
    setPreview(blobUrl);
    setProductData((prev) => ({
      ...prev,
      image: file || null,
    }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    const formData = new FormData();

    // Append basic fields
    formData.append("restaurantId", restaurantId);
    formData.append("name", productData.name || "");
    formData.append("description", productData.description || "");
    formData.append("recommendation", productData.recommendation);
    formData.append("hide", productData.hide);
    formData.append("categoryId", productData.categoryId || "");
    formData.append("subCategoryId", productData.subCategoryId || "");
    formData.append("freeTagging", productData.freeTagging);

    // Append image file if present
    if (productData.image instanceof File) {
      formData.append("image", productData.image);
    }

    // Append portions as JSON string (or send separately based on API requirement)
    const portions = productData.portions.map((p) => ({
      id: p.id,
      productId: p.productId,
      name: p.name,
      price: Number(p.price) || 0,
      campaignPrice: Number(p.campaignPrice) || 0,
      specialPrice: Number(p.specialPrice) || 0,
    }));
    formData.append("portions", JSON.stringify(portions));

    dispatch(addProduct(formData));
  };

  //GET CATEGORIES IF NOT IN STORE
  useEffect(() => {
    if (!categories) {
      dispatch(getCategories({ restaurantId }));
    }
  }, [categories]);

  //SET CATEGORIES
  useEffect(() => {
    if (categories) setCategoryOptionsFunc();
  }, [categories, dispatch]);

  //GET SUBCATEGORIES IF NOT IN STORE
  useEffect(() => {
    if (!subCategories) {
      dispatch(getSubCategories({ restaurantId }));
    }
  }, [subCategories]);

  useEffect(() => {
    if (success) {
      toast.success(t("addProduct.success"));
      setPreview(null);
      setProductData(defaultProduct);
      dispatch(resetAddProduct());
      dispatch(resetGetProducts());
    } else if (error) {
      // Surface the backend's validation messages instead of failing silently.
      const fieldErrors = error?.errors
        ? Object.values(error.errors).flat().filter(Boolean).join(" · ")
        : null;
      const msg =
        fieldErrors ||
        error?.message_TR ||
        error?.title ||
        error?.message ||
        t("addProduct.error", "Ürün eklenemedi.");
      toast.error(msg, { id: "addProductError" });
      dispatch(resetAddProduct());
    }
  }, [success, error, dispatch]);

  return (
    <form
      className="w-full mt-1 bg-[--white-1] rounded-lg text-[--black-2] shadow-2xl relative max-h-[97dvh] overflow-hidden"
      onSubmit={handleSave}
    >
      <div className="px-4 max-w-6xl mx-auto max-h-[90dvh] overflow-y-auto pb-20">
        {/* <h1 className="text-2xl font-bold bg-indigo-800 text-white py-4 -mx-4 px-4 sm:px-14 rounded-t-lg">
          Fiyat Listesi {restaurant?.name} Restoranı
        </h1> */}

        <div className="flex flex-wrap gap-2 my-3 text-sm">
          <ProductsHeader />
        </div>

        <div className="w-full py-8 relative flex flex-col sm:px-8">
          <div className="flex justify-between items-center mb-6 border-b border-[--border-1] pb-4">
            <h3 className="text-2xl font-bold text-[--black-2]">
              {t("addProduct.title")}
            </h3>
          </div>

          <div className="space-y-6 pr-2 flex-1">
            {/* 2 Kolon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sol Kolon */}
              <div className="space-y-2">
                <CustomInput
                  required
                  label={`${t("editProduct.name_label")} *`}
                  placeholder={t("editProduct.name_placeholder")}
                  className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  className2=""
                  value={productData.name}
                  onChange={(v) => handleField("name", v)}
                />

                <CustomSelect
                  required
                  label={`${t("editProduct.category_label")} *`}
                  placeholder={t("editProduct.category_placeholder")}
                  value={
                    productData.categoryId
                      ? {
                          value: productData.categoryId,
                          label: productData.categoryName,
                        }
                      : {
                          value: "",
                          label: t("editProduct.category_placeholder"),
                        }
                  }
                  style={{ backgroundColor: "var(--light-1)" }}
                  options={categoryOptions}
                  onChange={(opt) =>
                    setProductData((prev) => ({
                      ...prev,
                      categoryId: opt?.value || "",
                      categoryName: opt?.label || "",
                    }))
                  }
                  isSearchable={true}
                  className="text-sm"
                />

                <CustomSelect
                  label={t("editProduct.subCategory_label")}
                  disabled={!productData.categoryId}
                  placeholder={t("editProduct.subCategory_placeholder")}
                  value={
                    productData.subCategoryId
                      ? {
                          value: productData.subCategoryId,
                          label: productData.subCategoryName,
                        }
                      : null
                  }
                  isClearable
                  style={{ backgroundColor: "var(--light-1)" }}
                  options={getSubcatOptions(productData.categoryId)}
                  onChange={(opt) =>
                    setProductData((prev) => ({
                      ...prev,
                      subCategoryId: opt?.value || "",
                      subCategoryName: opt?.label || "",
                    }))
                  }
                  className="text-sm"
                />

                <div>
                  <div className="flex justify-between items-center mb-1 py-2">
                    <label className="block text-[--black-2] text-sm font-medium">
                      {t("editProduct.description_label")}
                    </label>
                    <button
                      type="button"
                      onClick={() => console.log("AI desc")}
                      className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition font-medium border border-purple-200 flex items-center shadow-sm"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
                      {t("editProduct.description_ai_button")}
                    </button>
                  </div>
                  <CustomTextarea
                    value={productData.description}
                    onChange={(e) => handleField("description", e.target.value)}
                    placeholder={t("editProduct.description_placeholder")}
                    className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none text-sm"
                  />
                </div>

                <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-indigo-200 transition-colors">
                  <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                    {t("editProduct.status_section")}
                  </span>
                  <div className="flex items-center justify-between">
                    <CustomToggle
                      label={t("editProduct.status_label")}
                      className1="text-sm"
                      className="peer-checked:bg-[--green-1] bg-[--border-1] scale-[.9]"
                      checked={!productData.hide}
                      onChange={() => handleToggle("hide")}
                    />
                  </div>
                </div>

                <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-indigo-200 transition-colors">
                  <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                    {t("editProduct.recommendation_section")}
                  </span>
                  <div className="flex items-center justify-between">
                    <CustomToggle
                      label={t("editProduct.recommendation_label")}
                      checked={productData.recommendation}
                      className1="text-sm"
                      className="peer-checked:bg-[--green-1] bg-[--border-1] scale-[.9]"
                      onChange={() => handleToggle("recommendation")}
                    />
                  </div>
                </div>
              </div>

              {/* Sağ Kolon */}
              <div className="space-y-2">
                <span className="text-[--black-2] text-sm font-medium block">
                  {t("editProduct.image_label")}
                </span>

                <AIImagePromptCard
                  t={t}
                  onGenerated={handleFileChange}
                />

                <ProductImagePicker
                  preview={preview}
                  image={productData.image}
                  onChange={handleFileChange}
                  onRemove={() => handleFileChange(null)}
                  t={t}
                />

              </div>
            </div>

            {/* Alt Kısım */}
            <div className="pt-4 border-t border-[--border-1]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[--black-2] text-sm font-medium">
                    {t("editProduct.portions_title")}
                  </label>
                  <button
                    type="button"
                    onClick={addPortion}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-medium border border-indigo-200"
                  >
                    <i className="fa-solid fa-plus mr-1" />
                    {t("editProduct.add_portion")}
                  </button>
                </div>

                <div className="grid grid-cols-[1fr_80px_80px_80px_30px] gap-2 text-[10px] text-[--gr-1] uppercase font-semibold mb-2">
                  <div>{t("editProduct.portion_column_name")}</div>
                  <div className="text-center">
                    {t("editProduct.portion_column_price")}
                  </div>
                  <div className="text-center text-[--green-1]">
                    {t("editProduct.portion_column_campaign")}
                  </div>
                  <div className="text-center text-[--orange-1]">
                    {t("editProduct.portion_column_special")}
                  </div>
                  <div />
                </div>

                <div className="space-y-3">
                  {productData.portions.map((portion, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-[1fr_80px_80px_80px_30px] gap-2 items-center"
                    >
                      <CustomInput
                        required
                        placeholder={t("editProduct.portion_name_placeholder")}
                        className="py-[6px] text-sm bg-[--white-2]"
                        value={portion.name}
                        onChange={(v) => handlePortionChange(idx, "name", v)}
                      />
                      <CustomInput
                        required
                        type="number"
                        placeholder="Fiyat"
                        className="py-[6px] text-sm text-center bg-[--white-2]"
                        value={formatToPrice(portion.price) || "0"}
                        onChange={(v) => handlePortionChange(idx, "price", v)}
                      />
                      <CustomInput
                        type="number"
                        placeholder="Kampanya"
                        className="py-[6px] text-sm text-end text-[--black-2] bg-green-400/30 border-green-300"
                        value={formatToPrice(portion.campaignPrice) || "0"}
                        onChange={(v) =>
                          handlePortionChange(idx, "campaignPrice", v)
                        }
                      />
                      <CustomInput
                        type="number"
                        placeholder="Özel"
                        className="py-[6px] text-sm text-end text-[--black-2] bg-orange-400/30 border-orange-300"
                        value={formatToPrice(portion.specialPrice) || "0"}
                        onChange={(v) =>
                          handlePortionChange(idx, "specialPrice", v)
                        }
                      />
                      <div className="flex items-center justify-center">
                        {productData.portions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => deletePortion(idx)}
                            className="text-[--red-1] text-xs"
                            aria-label={t("editProduct.portion_delete_aria")}
                          >
                            <DeleteI
                              strokeWidth={1}
                              className="size-[1.3rem]"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex items-center  absolute bottom-0 right-0 left-0">
        <div className="w-full flex justify-end space-x-3 max-w-6xl mx-auto bg-[--white-1] py-4 px-6 border-t border-[--border-1] rounded-b-lg">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all"
          >
            {t("addProduct.cancel")}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg shadow-[--light-1] hover:bg-[--primary-2] transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading
              ? t("addProduct.saving", "Kaydediliyor...")
              : t("addProduct.save")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddProduct;
