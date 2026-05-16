// MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";

// COMP
import ProductsHeader from "./header";
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import CustomSelect from "../../common/customSelector";
import CustomTextarea from "../../common/customTextarea";
import CustomFileInput from "../../common/customFileInput";

// UTILS
import { parsePrice, toNameCase } from "../../../utils/utils";
import { usePopup } from "../../../context/PopupContext";
import { CancelI, CloudUI, DeleteI } from "../../../assets/icon";

//REDUX
import {
  editProduct,
  resetEditProduct,
} from "../../../redux/products/editProductSlice";
import { getProducts } from "../../../redux/products/getProductsSlice";
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

const EditProduct = ({ product: prodToPopup, onSaved }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const restaurantId = params.id;
  const { t } = useTranslation();

  const { categories } = useSelector((s) => s.categories.get);
  const { success, error } = useSelector((s) => s.products.edit);
  const { subCategories } = useSelector((s) => s.subCategories.get);
  // Restaurant powers the "Özel Fiyat" gate — only visible when the
  // restaurant has the special-price feature enabled in Genel Ayarlar.
  // Robust lookup: fall back to the restaurants list cache when the
  // single-fetch slice is empty (typical when the user reached this
  // screen via /restaurants → click → product list, not a deep link),
  // otherwise the Özel column would be hidden even when the feature
  // is on.
  const restaurant = useSelector((s) => {
    const fetched = s.restaurants.getRestaurant?.restaurant;
    if (fetched?.id === restaurantId) return fetched;
    return s.restaurants.getRestaurants?.restaurants?.data?.find(
      (r) => r.id === restaurantId,
    );
  });

  const { setSecondPopupContent } = usePopup();
  const { product } = location?.state || {};

  // Initialize preview from the product's existing imageURL so editors see the
  // current image instead of an empty upload zone.
  const initialProduct = prodToPopup || product;
  const [preview, setPreview] = useState(initialProduct?.imageURL || null);
  const [productData, setProductData] = useState(initialProduct);
  // Tracks the case where the user explicitly cleared a previously
  // saved photo. Without this we can't tell "user did nothing" from
  // "user removed the image" — both leave productData.image as null.
  // On save the flag turns into removal signals for the backend.
  const [imageRemoved, setImageRemoved] = useState(false);

  // Per-row column visibility — Kampanya tied to the SELECTED category's
  // campaign flag, Özel tied to the restaurant's isSpecialPriceActive.
  // Mirrors AddProduct so both forms behave identically.
  const selectedCategory = (categories || []).find(
    (c) => c.id === productData?.categoryId,
  );
  const showCampaign = !!selectedCategory?.campaign;
  const showSpecial = !!restaurant?.isSpecialPriceActive;
  // Owner-supplied label for the special-price column (Genel Ayarlar
  // → "Özel Fiyat Tanımı"). Falls back to the generic "Özel" header
  // when no name is set.
  const specialLabel =
    restaurant?.specialPriceName?.trim() ||
    t("editProduct.portion_column_special");
  const priceCount = 1 + (showCampaign ? 1 : 0) + (showSpecial ? 1 : 0);
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
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState([]);

  function setCategoryOptionsFunc() {
    const options = (categories || []).map((c) => ({
      value: c.id,
      label: c.name,
      ...c,
    }));
    setCategoryOptions(options);
  }

  function setSubCategoryOptionsFunc() {
    const options = (subCategories || []).map((sc) => ({
      value: sc.id,
      label: sc.name,
      ...sc,
    }));
    setSubCategoryOptions(options);
  }

  const getSubcatOptions = (categoryId) =>
    (subCategoryOptions || []).filter((s) => s.categoryId === categoryId);

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
    if (file) {
      // Picking a new file replaces the existing one — no removal
      // signal needed (the file upload itself overrides the URL).
      setImageRemoved(false);
    } else if (initialProduct?.imageURL) {
      // Clearing a slot that previously had a saved photo → mark
      // for backend removal on save.
      setImageRemoved(true);
    }
  };

  const handleSave = () => {
    if (isEqual(productData, product || prodToPopup)) {
      toast.error(t("editProduct.no_changes"));
      return;
    }
    const formData = new FormData();

    // Append basic fields
    formData.append("id", productData.id);
    formData.append("restaurantId", restaurantId || productData.restaurantId);
    formData.append("name", productData.name || "");
    formData.append("description", productData.description || "");
    formData.append("recommendation", productData.recommendation);
    formData.append("hide", productData.hide);
    formData.append("categoryId", productData.categoryId || "");
    formData.append("subCategoryId", productData.subCategoryId || "");
    formData.append("freeTagging", productData.freeTagging);

    // Image handling: 3 mutually exclusive cases.
    //   1. User picked a new file → upload it (replaces existing)
    //   2. User cleared a previously saved photo → send removal
    //      signals so the backend deletes the imageURL instead of
    //      preserving it. The backend's image contract isn't in the
    //      swagger so we send several common markers (image="",
    //      imageURL/imageUrl="", removeImage="true") and trust the
    //      controller to pick up whichever it expects.
    //   3. Untouched → send nothing, backend keeps the existing URL.
    if (productData.image instanceof File) {
      formData.append("image", productData.image);
    } else if (imageRemoved) {
      formData.append("image", "");
      formData.append("imageURL", "");
      formData.append("imageUrl", "");
      formData.append("removeImage", "true");
    }

    // Append portions if changed
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

    // Log FormData entries for debugging
    console.log("FormData payload:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    dispatch(editProduct(formData));
  };

  //GET CATEGORIES IF NOT IN STORE
  useEffect(() => {
    if (!categories && categoryOptions.length === 0) {
      dispatch(getCategories({ restaurantId }));
    }
  }, []);

  //SET CATEGORIES
  useEffect(() => {
    if (categories) setCategoryOptionsFunc();
  }, [categories, dispatch]);

  //GET SUBCATEGORIES IF NOT IN STORE
  useEffect(() => {
    if (!subCategories && subCategoryOptions.length === 0) {
      dispatch(getSubCategories({ restaurantId }));
    }
  }, []);

  //SET SUBCATEGORIES
  useEffect(() => {
    if (subCategories) setSubCategoryOptionsFunc();
  }, [subCategories]);

  useEffect(() => {
    if (success) {
      toast.success(t("editProduct.success"));
      dispatch(resetEditProduct());
      if (prodToPopup) {
        // Opened as a popup → close it. Prefer the parent-supplied
        // `onSaved` callback so the host list refetches with its current
        // filters and page intact (e.g. Products page stays on page 12
        // with the chosen category filter); only fall back to a generic
        // `getProducts` for legacy callers that don't pass `onSaved` and
        // would otherwise see stale data after save.
        setSecondPopupContent(null);
        if (onSaved) {
          onSaved();
        } else {
          dispatch(
            getProducts({
              restaurantId: restaurantId || productData.restaurantId,
            }),
          );
        }
      } else {
        // Opened as a full page → go back to the products list. navigate(-1)
        // preserves the list's URL search params (page=N) so the user lands
        // on the exact page they came from.
        navigate(-1);
      }
    }
    if (error) dispatch(resetEditProduct());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  return (
    productData && (
      <section
        className={`w-full ${prodToPopup ? "flex items-center" : "pb-5 mt-1"}`}
      >
        <div
          className={`bg-[--white-1] rounded-lg text-[--black-2] shadow-2xl px-4 w-full  mx-auto ${
            prodToPopup
              ? "h-[95dvh] overflow-y-auto relative max-w-4xl pb-20"
              : "max-w-6xl pt-1"
          }`}
        >
          {!prodToPopup && (
            <div className="flex flex-wrap gap-2 my-3 text-sm">
              <ProductsHeader />
            </div>
          )}

          <div className="w-full py-8 relative flex flex-col sm:px-8">
            <div className="flex justify-between items-center mb-6 border-b border-[--border-1] pb-4">
              <h3 className="text-2xl font-bold text-[--black-2]">
                {t("editProduct.title")}
              </h3>

              {prodToPopup && (
                <div>
                  <button
                    onClick={() => setSecondPopupContent(null)}
                    className="text-[--gr-1] hover:text-[--black-2] transition-colors"
                    aria-label={t("editProduct.close")}
                  >
                    <CancelI />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6 pr-2 flex-1">
              {/* 2 Kolon */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol Kolon */}
                <div className="space-y-2">
                  {/* Mirror addProduct.jsx — auto-capitalise so
                      renaming a product produces the same casing
                      convention as creating one ("etli ekmek" →
                      "Etli Ekmek"). Turkish-aware folding. */}
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
                        onClick={() =>
                          toast(t("editProduct.ai_coming_soon"), {
                            id: "ai-coming-soon",
                            icon: "✨",
                          })
                        }
                        className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition font-medium border border-purple-200 flex items-center shadow-sm"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
                        {t("editProduct.description_ai_button")}
                      </button>
                    </div>
                    <CustomTextarea
                      value={productData.description}
                      onChange={(e) =>
                        handleField("description", e.target.value)
                      }
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
                      // Mobile: name (+ delete) on top, 1-3 price inputs
                      // in a row below. Desktop: dynamic grid via
                      // `desktopGridClass` (Kampanya / Özel cols
                      // collapse when their feature flags are off).
                      // The inner price wrapper uses `md:contents` so
                      // its visible children become direct grid
                      // children on md+ — no input duplication.
                      <div
                        key={idx}
                        className={`grid grid-cols-[1fr_30px] gap-2 items-center ${desktopGridClass}`}
                      >
                        <CustomInput
                          required
                          placeholder={t(
                            "editProduct.portion_name_placeholder",
                          )}
                          className="py-[6px] text-sm bg-[--white-2]"
                          value={portion.name}
                          onChange={(v) => handlePortionChange(idx, "name", v)}
                        />
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
                          {/* Inline mobile labels above each input —
                              hidden on desktop where the column header
                              already labels them. md:contents keeps the
                              inputs as direct grid children on md+. */}
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
        </div>

        {prodToPopup ? (
          <div className="w-full flex items-center  absolute bottom-5 right-0 left-0">
            <div className="w-full flex justify-end space-x-3 max-w-4xl mx-auto bg-[--white-1] py-4 px-6 border-t border-[--border-1] rounded-b-lg">
              <button
                onClick={() => setSecondPopupContent(null)}
                className="px-6 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all"
              >
                {t("editProduct.cancel")}
              </button>

              <button
                onClick={handleSave}
                className="px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg shadow-[--light-1] hover:bg-[--primary-2] transform hover:-translate-y-0.5 transition-all"
              >
                {t("editProduct.save_button")}
              </button>
            </div>
          </div>
        ) : (
          // Full-page mode: bottom action bar mirrors Add Product so users
          // always end the form with the same Vazgeç + Kaydet pair at the
          // bottom of the visible content area.
          <div className="w-full flex justify-end gap-3 px-4 sm:px-8 py-4 border-t border-[--border-1] bg-[--white-1]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 hover:text-rose-700 hover:border-rose-300 transition-all"
            >
              {t("editProduct.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-8 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg shadow-[--light-1] hover:bg-[--primary-2] transform hover:-translate-y-0.5 transition-all"
            >
              {t("editProduct.save_button")}
            </button>
          </div>
        )}
      </section>
    )
  );
};

// AI image prompt card — auto-resizing textarea (1 → up to 5 lines) plus a
// "Liwa AI ile Oluştur" button. When the AI flow eventually returns an image
// (File or url), it is forwarded via `onGenerated` so the same product image
// preview area displays it. The actual generation endpoint isn't wired here —
// the wiring is structural; the parent passes `handleFileChange` and the AI
// pipeline can be plugged in once available.
export const AIImagePromptCard = ({ t }) => {
  const [prompt, setPrompt] = useState("");
  const taRef = useRef(null);

  // Auto-resize: grow with content, capped at 5 lines.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20;
    const maxHeight = lineHeight * 5 + 16; // 5 lines + vertical padding
    const next = Math.min(ta.scrollHeight, maxHeight);
    ta.style.height = next + "px";
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [prompt]);

  const handleGenerate = async () => {
    // The AI generation backend isn't live yet — show an info toast so the
    // user knows the button is intentional, not broken.
    toast(t("editProduct.ai_coming_soon"), {
      id: "ai-coming-soon",
      icon: "✨",
    });
  };

  return (
    <div className="bg-[--light-4] p-3 rounded-xl border border-[--border-1]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <i className="fa-solid fa-palette mr-1" />
          {t("editProduct.image_ai_title")}
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          className="text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition font-medium shadow-sm flex items-center"
        >
          <i className="fa-solid fa-wand-magic-sparkles mr-1.5" />
          {t("editProduct.image_ai_button")}
        </button>
      </div>

      <textarea
        ref={taRef}
        rows={1}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={t("editProduct.image_prompt_placeholder")}
        className="w-full rounded-lg border border-[--border-1] bg-[--light-1] focus:bg-[--white-1] px-3 py-2 text-[--black-1] focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-colors outline-none text-sm leading-5 resize-none"
      />
    </div>
  );
};

// Image picker shared between Edit and Add Product flows.
// • Vertical layout: large preview area on top, action buttons below
// • Shows the current image (existing or AI-generated) as a tall preview
// • Button label switches between "Yükle" (no image) and "Değiştir"
// • "Kaldır" appears beside the change button when an image is set
export const ProductImagePicker = ({
  preview,
  image,
  onChange,
  onRemove,
  t,
}) => {
  const hasImage = !!preview;
  return (
    <div
      className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
        hasImage
          ? "border-[--border-1] bg-[--white-1]"
          : "border-dashed border-[--border-1] bg-[--light-2] hover:border-indigo-300"
      }`}
    >
      <label className="relative w-full aspect-[4/3] rounded-lg ring-1 ring-[--border-1] bg-[--white-2] grid place-items-center overflow-hidden cursor-pointer group">
        {hasImage ? (
          <>
            <img
              src={preview}
              alt="preview"
              className="size-full object-cover"
            />
            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors grid place-items-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-900/60 backdrop-blur-sm">
                {t("editProduct.image_change")}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <span className="grid place-items-center size-12 rounded-full bg-indigo-100 text-indigo-600">
              <CloudUI />
            </span>
            <span className="text-sm font-medium text-[--gr-1] group-hover:text-indigo-600 transition-colors">
              {t("editProduct.image_click_to_select")}
            </span>
            <span className="text-[11px] text-[--gr-1]">
              {t("editProduct.image_hint")}
            </span>
          </div>
        )}
        <input
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
            e.target.value = "";
          }}
          className="hidden"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        <label className="inline-flex flex-1 items-center justify-center gap-1.5 h-9 px-3 rounded-md text-xs font-semibold text-white bg-[--primary-1] hover:brightness-110 cursor-pointer transition shadow-sm">
          {hasImage
            ? t("editProduct.image_change")
            : t("editProduct.image_upload")}
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </label>
        {hasImage && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center justify-center gap-1 h-9 px-3 rounded-md text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
          >
            {t("editProduct.image_remove")}
          </button>
        )}
      </div>
    </div>
  );
};

export default EditProduct;
