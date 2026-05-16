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
import { parsePrice, toNameCase } from "../../../utils/utils";
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

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

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
  // Restaurant powers the "Özel Fiyat" gate — only visible when the
  // restaurant has the special-price feature enabled in Genel Ayarlar.
  // Robust lookup: depending on how the user reached this screen the
  // entity may sit in either restaurant slice (single-fetch from a
  // deep link, or the list cache from /restaurants → click). The old
  // `getRestaurant?.restaurant` only branch missed the common list-
  // cache case, which left the Özel column hidden even when the
  // feature was on.
  const restaurant = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    return s.restaurants.getRestaurants?.restaurants?.data?.find(
      (r) => r.id === restaurantId,
    );
  });

  const [preview, setPreview] = useState(null);
  const [productData, setProductData] = useState(defaultProduct);
  const [categoryOptions, setCategoryOptions] = useState([]);

  // Per-row column visibility:
  //   • Kampanya — only when the SELECTED category has campaign on
  //   • Özel    — only when the restaurant's isSpecialPriceActive is true
  // Both default to hidden when their gating flag is missing/false,
  // so the inputs stay out of the user's way until the underlying
  // feature is actually enabled.
  const selectedCategory = (categories || []).find(
    (c) => c.id === productData.categoryId,
  );
  const showCampaign = !!selectedCategory?.campaign;
  const showSpecial = !!restaurant?.isSpecialPriceActive;
  // Owner-supplied label for the special-price column (Genel Ayarlar
  // → "Özel Fiyat Tanımı"). Falls back to the generic "Özel" header
  // when no name is set, so existing flows keep their old wording.
  const specialLabel =
    restaurant?.specialPriceName?.trim() ||
    t("editProduct.portion_column_special");
  const priceCount = 1 + (showCampaign ? 1 : 0) + (showSpecial ? 1 : 0);
  // Tailwind needs the full class string at build time, so the
  // permutations are spelled out as a lookup instead of composed.
  const desktopGridClass = {
    // Portion name and price columns now share equal `1fr`s instead of
    // letting the name swallow all remaining space — keeps the price/
    // campaign/special inputs comfortably wide.
    1: "md:grid-cols-[1fr_1fr_30px]",
    2: "md:grid-cols-[1fr_1fr_1fr_30px]",
    3: "md:grid-cols-[1fr_1fr_1fr_1fr_30px]",
  }[priceCount];
  const deleteColStartClass = {
    1: "md:col-start-3",
    2: "md:col-start-4",
    3: "md:col-start-5",
  }[priceCount];
  const mobilePriceGridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  }[priceCount];

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
      price: parsePrice(p.price),
      campaignPrice: parsePrice(p.campaignPrice),
      specialPrice: parsePrice(p.specialPrice),
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
    // Full-width page form. This screen used to render as a centred,
    // popup-style card (max-w-6xl mx-auto + shadow-2xl + max-h /
    // overflow-hidden + an absolute footer) — which made the content
    // visibly jump toward the centre when switching here from the
    // full-width Ürünler / Fiyat Listesi tabs. It now uses the same
    // page shell as products.jsx / priceList.jsx so the tab bar and
    // content stay put across tab switches.
    <form className="w-full pb-8 mt-1 text-[--black-2]" onSubmit={handleSave}>
      {/* Top tabs (Manage / Price List / Add) */}
      <div className="flex flex-wrap gap-2 mb-3 text-sm">
        <ProductsHeader />
      </div>

      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        <div className="w-full py-8 relative flex flex-col px-4 sm:px-8">
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
                {/* Auto-capitalise the first letter of every word
                    (Turkish-aware: "ızgara" → "Izgara", "şiş" →
                    "Şiş") so menu items read consistently regardless
                    of what casing the author types. Same convention
                    used by addCategory.jsx / editRestaurant.jsx. */}
                <CustomInput
                  required
                  label={`${t("editProduct.name_label")} *`}
                  placeholder={t("editProduct.name_placeholder")}
                  className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                  className2=""
                  value={productData.name}
                  onChange={(v) => handleField("name", toNameCase(v))}
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

                {/* Column header — desktop only; mobile rows label inline.
                    Adapts to whichever price columns are actually visible
                    (Kampanya / Özel can both be off). */}
                <div
                  className={`hidden md:grid ${desktopGridClass} gap-2 text-[10px] text-[--gr-1] uppercase font-semibold mb-2`}
                >
                  <div>{t("editProduct.portion_column_name")}</div>
                  <div className="text-center">
                    {t("editProduct.portion_column_price")}
                  </div>
                  {showCampaign && (
                    <div className="text-center text-[--green-1]">
                      {t("editProduct.portion_column_campaign")}
                    </div>
                  )}
                  {showSpecial && (
                    <div className="text-center text-[--orange-1] truncate" title={specialLabel}>
                      {specialLabel}
                    </div>
                  )}
                  <div />
                </div>

                <div className="space-y-3">
                  {productData.portions.map((portion, idx) => (
                    // Mobile: 2-row layout — name (+ delete at right) on
                    // top, 1-3 price inputs in a row below. Desktop: dynamic
                    // grid via `desktopGridClass` (Kampanya / Özel cols
                    // collapse when their feature flags are off). The
                    // inner price wrapper uses `md:contents` to lift its
                    // children straight into the outer grid — no input
                    // duplication or extra event wiring.
                    <div
                      key={idx}
                      className={`grid grid-cols-[1fr_30px] gap-2 items-center ${desktopGridClass}`}
                    >
                      <CustomInput
                        required
                        placeholder={t("editProduct.portion_name_placeholder")}
                        className="py-[6px] text-sm bg-[--white-2]"
                        value={portion.name}
                        onChange={(v) => handlePortionChange(idx, "name", v)}
                      />
                      {/* Delete sits next to the name on mobile (col 2)
                          and jumps to the last column on desktop. The
                          target col index depends on how many price
                          columns are actually visible. */}
                      <div
                        className={`flex items-center justify-center ${deleteColStartClass} md:row-start-1`}
                      >
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
                      <div
                        className={`col-span-2 grid ${mobilePriceGridClass} gap-2 md:contents`}
                      >
                        {/* Each price gets a tiny inline label above it
                            on mobile (md:hidden span) — desktop already
                            has the column header above the row, so the
                            wrapper collapses there via md:contents. */}
                        <div className="flex flex-col gap-1 md:contents">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] md:hidden">
                            {t("editProduct.portion_column_price")}
                          </span>
                          <CustomInput
                            required
                            type="text"
                            inputMode="decimal"
                            name="price"
                            placeholder="Fiyat"
                            className="py-[6px] text-sm text-center bg-[--white-2]"
                            value={portion.price ?? ""}
                            onChange={(v) =>
                              handlePortionChange(idx, "price", v)
                            }
                          />
                        </div>
                        {showCampaign && (
                          <div className="flex flex-col gap-1 md:contents">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[--green-1] md:hidden">
                              {t("editProduct.portion_column_campaign")}
                            </span>
                            <CustomInput
                              type="text"
                              inputMode="decimal"
                              name="price"
                              placeholder="Kampanya"
                              className="py-[6px] text-sm text-end text-[--black-2] bg-green-400/30 border-green-300"
                              value={portion.campaignPrice ?? ""}
                              onChange={(v) =>
                                handlePortionChange(idx, "campaignPrice", v)
                              }
                            />
                          </div>
                        )}
                        {showSpecial && (
                          <div className="flex flex-col gap-1 md:contents">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[--orange-1] md:hidden truncate" title={specialLabel}>
                              {specialLabel}
                            </span>
                            <CustomInput
                              type="text"
                              inputMode="decimal"
                              name="price"
                              placeholder={specialLabel}
                              className="py-[6px] text-sm text-end text-[--black-2] bg-orange-400/30 border-orange-300"
                              value={portion.specialPrice ?? ""}
                              onChange={(v) =>
                                handlePortionChange(idx, "specialPrice", v)
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer — normal flow inside the card. Was `absolute
            bottom-0` in the old popup layout, which on a full-height
            page floated over the content or sat off-screen. */}
        <div className="w-full flex justify-end gap-3 bg-[--white-1] py-4 px-4 sm:px-6 border-t border-[--border-1]">
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
