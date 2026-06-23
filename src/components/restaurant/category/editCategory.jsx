//MODULES
import { isEqual } from "lodash";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
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
import { getMenus } from "../../../redux/menus/getMenusSlice";
import {
  getProductsByCategoryId,
  resetGetProductsByCategoryId,
} from "../../../redux/products/getProductsByCategoryIdSlice";
import { editProduct } from "../../../redux/products/editProductSlice";
import { getProductsLite } from "../../../redux/products/getProductsLiteSlice";

//UTILS
import { isCategoryOnCampaign } from "../../../utils/categoryCampaign";

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
  // Read the menus list straight from the slice. The earlier mirror-into-
  // local-state + resetGetMenus() pattern looped infinitely against the
  // fetch effect after the slice gained a fetchedFor cache — the reset
  // wiped the slice every render, the fetch refilled it, repeat. Reading
  // the slice directly lets us rely on its own cache (see useEffect below).
  const { menus, fetchedFor: menusFetchedFor } = useSelector(
    (s) => s.menus.get,
  );
  const menusData = menus;

  // Lite products — backs the *derived* Kampanya value for both the
  // initial toggle state and the cascade diff. Post-m2m migration the
  // backend no longer returns `category.campaign`, so seeding from
  // `category?.campaign` would always read false. We derive it from
  // products' `isCampaign` using the every-true rule (see
  // utils/categoryCampaign.js). The slice self-invalidates on
  // category/product mutations, so the value stays fresh.
  const { products: liteProducts, fetchedFor: liteFetchedFor } = useSelector(
    (s) => s.products.getLite,
  );
  const derivedCampaign = isCategoryOnCampaign(category?.id, liteProducts);
  const memberCount = (liteProducts || []).filter((p) => {
    if (Array.isArray(p.categories))
      return p.categories.some((m) => m?.categoryId === category?.id);
    if (Array.isArray(p.categoryIds))
      return p.categoryIds.includes(category?.id);
    return p.categoryId === category?.id;
  }).length;
  const categoryIsEmpty = memberCount === 0;

  // Seed `categoryData.campaign` from the derived value rather than
  // the (now nonexistent) category-level field.
  const [categoryData, setCategoryData] = useState({
    ...category,
    campaign: derivedCampaign,
    // `featured` (the Şef Tavsiyesi toggle value) starts from the stored
    // flag, then the on-open products fetch below corrects it to reflect
    // whether the category's products are actually recommended.
    featured: !!category?.featured,
  });
  const [preview, setPreview] = useState(
    category?.image
      ? URL.createObjectURL(category.image)
      : category?.imageAbsoluteUrl || null,
  );
  const [showCampaignWarning, setShowCampaignWarning] = useState(false);

  // Snapshot the AS-DERIVED campaign value so the success handler can
  // detect "did the user actually change it". Using derivedCampaign
  // instead of `category.campaign` here matters: the backend no longer
  // returns the column, so reading category.campaign would always
  // snapshot false and the cascade would fire on every toggle-ON-save
  // (even when products were already on campaign).
  const [originalCampaign] = useState(derivedCampaign);
  // Şef Tavsiyesi snapshot. The lite product DTO does NOT carry
  // `recommendation`, so (unlike campaign, which derives from
  // liteProducts.isCampaign) we can't read it from `liteProducts`. We
  // seed from the stored `featured` flag, then correct it from the
  // category's full products in the on-open effect below — ON when ANY
  // product is recommended, so a recommended category opens ON and can
  // be cleared by turning the toggle OFF. The success handler compares
  // against this snapshot to decide whether to cascade.
  const [originalRecommendation, setOriginalRecommendation] = useState(
    !!category?.featured,
  );

  // If the lite payload arrives after the dialog mounts (cold cache),
  // refresh the seeded value — but only when the user hasn't already
  // touched the toggle, so we never clobber a deliberate edit.
  const userTouchedCampaignRef = useRef(false);
  useEffect(() => {
    if (userTouchedCampaignRef.current) return;
    setCategoryData((prev) =>
      prev.campaign === derivedCampaign
        ? prev
        : { ...prev, campaign: derivedCampaign },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedCampaign]);

  // Determine the REAL Şef Tavsiyesi state from the category's full
  // products on open (lite lacks `recommendation`). some-true rule: ON
  // if any product in the category is recommended — so a category whose
  // products are recommended opens ON and the user can clear it by
  // turning the toggle OFF. Silent so opening the dialog doesn't flash
  // the global loader; skipped once the user touches the toggle so a
  // late fetch never clobbers a deliberate edit.
  const userTouchedFeaturedRef = useRef(false);
  useEffect(() => {
    if (!category?.id) return;
    let cancelled = false;
    (async () => {
      const action = await dispatch(
        getProductsByCategoryId({ categoryId: category.id, __silent: true }),
      );
      if (cancelled) return;
      const payload = action?.payload;
      const products = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      dispatch(resetGetProductsByCategoryId());
      const someRecommended = products.some((p) => p?.recommendation === true);
      if (userTouchedFeaturedRef.current) return;
      setOriginalRecommendation(someRecommended);
      setCategoryData((prev) => ({ ...prev, featured: someRecommended }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  const handleField = (key, value) => {
    setCategoryData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    setCategoryData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCampaignToggle = () => {
    const newCampaignState = !categoryData.campaign;
    userTouchedCampaignRef.current = true;
    handleToggle("campaign");
    setShowCampaignWarning(newCampaignState);
  };

  const handleFeaturedToggle = () => {
    userTouchedFeaturedRef.current = true;
    handleToggle("featured");
  };

  // Whether the recommendation toggle differs from its as-opened
  // (derived) value — i.e. a save will cascade. Drives the warning box,
  // which shows a DIFFERENT message for enable (mark all) vs disable
  // (clear all) so the destructive disable is explicit. Falls back to
  // hidden once the user toggles back to the original state.
  const recommendationPending =
    !!categoryData.featured !== originalRecommendation;

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

  // Build the EditProduct FormData needed to flip a product's
  // `isCampaign` and/or `recommendation` flags without losing any other
  // field. The endpoint is full-DTO-replace (per the uncategorizedSafety
  // post-mortem any omitted portion gets wiped to zero), so we
  // round-trip every field the lite category-product DTO carries plus
  // the m2m memberships + their flat backwards-compat aliases. Same
  // shape `editProduct.jsx`'s own handleSave assembles.
  //
  // `overrides` may carry `isCampaign` and/or `recommendation`; each
  // flag NOT in overrides falls back to the product's current value, so
  // cascading one flag never clobbers the other (important when both
  // Kampanya and Şef Tavsiyesi change in the same save).
  const buildProductPayload = (product, overrides = {}) => {
    const recommendation =
      overrides.recommendation !== undefined
        ? overrides.recommendation
        : product.recommendation;
    const isCampaign =
      overrides.isCampaign !== undefined
        ? overrides.isCampaign
        : product.isCampaign;
    const fd = new FormData();
    fd.append("id", product.id);
    fd.append("restaurantId", product.restaurantId || id || "");
    fd.append("name", product.name ?? "");
    fd.append("description", product.description ?? "");
    fd.append("recommendation", String(!!recommendation));
    fd.append("hide", String(!!product.hide));
    fd.append("freeTagging", String(!!product.freeTagging));
    fd.append("isCampaign", String(!!isCampaign));
    if (Array.isArray(product.portions)) {
      fd.append("portions", JSON.stringify(product.portions));
    }
    const memberships = Array.isArray(product.categories)
      ? product.categories.map((c) => ({
          categoryId: c.categoryId,
          ...(c.subCategoryId ? { subCategoryId: c.subCategoryId } : {}),
        }))
      : [];
    fd.append("categories", JSON.stringify(memberships));
    // Backwards-compat flat fields (see editProduct.jsx for context).
    const firstCat = memberships[0];
    fd.append("categoryId", firstCat?.categoryId || categoryData.id || "");
    fd.append("subCategoryId", firstCat?.subCategoryId || "");
    return fd;
  };

  // After a successful category save, cascade any changed category-level
  // flag (Kampanya / Şef Tavsiyesi) down to every product in the
  // category. Backend doesn't propagate yet (see
  // CATEGORY_CAMPAIGN_CASCADE_BRIEF.md) so the frontend fans out itself:
  // fetch the full product DTOs via `getProductsByCategoryId` (full
  // payload so portions/prices survive the round-trip), then PUT each
  // one in parallel with the changed flag(s) applied. BOTH flags go in a
  // SINGLE pass (one PUT per product) so two cascades never race and
  // clobber each other's value. `overrides` = { isCampaign?, recommendation? }.
  const runProductCascade = async (overrides) => {
    const action = await dispatch(
      getProductsByCategoryId({ categoryId: categoryData.id }),
    );
    const payload = action?.payload;
    const products = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];
    dispatch(resetGetProductsByCategoryId());
    if (products.length === 0) return { succeeded: 0, total: 0 };

    const toastId = "categoryCascade";
    toast.loading(
      t("editCategories.cascade_progress", {
        count: products.length,
        defaultValue: "{{count}} ürün güncelleniyor…",
      }),
      { id: toastId },
    );

    const results = await Promise.allSettled(
      products.map((p) =>
        dispatch(editProduct(buildProductPayload(p, overrides))),
      ),
    );
    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && !r.value?.error,
    ).length;
    const failed = results.length - succeeded;
    if (failed > 0) {
      toast.error(
        t("editCategories.cascade_partial", {
          succeeded,
          total: products.length,
          defaultValue:
            "{{succeeded}}/{{total}} ürün güncellendi, kalanı başarısız oldu.",
        }),
        { id: toastId, duration: 6000 },
      );
    } else {
      toast.success(
        t("editCategories.cascade_done", {
          count: succeeded,
          defaultValue: "{{count}} ürün güncellendi.",
        }),
        { id: toastId },
      );
    }
    return { succeeded, total: products.length };
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
      const campaignChanged = !!categoryData.campaign !== originalCampaign;
      const recommendationChanged =
        !!categoryData.featured !== originalRecommendation;
      setPopupContent(null);
      toast.success(t("editCategories.success"), { id: "categories" });
      dispatch(resetEditCategory());
      // Fire-and-forget — the popup is already closed so the parent
      // can keep working. Cascade results surface via its own toast.
      // Both changed flags go in ONE cascade pass so they never race.
      if (campaignChanged || recommendationChanged) {
        const overrides = {};
        if (campaignChanged) overrides.isCampaign = categoryData.campaign;
        if (recommendationChanged)
          overrides.recommendation = categoryData.featured;
        runProductCascade(overrides).catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("[editCategory] cascade failed:", err);
        });
      }
    }
    if (error) dispatch(resetEditCategory());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error]);

  // GET MENUS — fetch only when the slice cache is empty or scoped to
  // a different restaurant. The slice handles invalidation on menu
  // mutations, so this never re-fetches while the popup is open.
  useEffect(() => {
    if (!menus || menusFetchedFor !== id) {
      dispatch(getMenus({ restaurantId: id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // GET LITE PRODUCTS — drives the derived Kampanya value (initial
  // toggle + cascade diff) and the "empty category" hint shown next
  // to the toggle. Auto-invalidated on category/product mutations.
  useEffect(() => {
    if (!liteProducts || liteFetchedFor !== id) {
      dispatch(getProductsLite({ restaurantId: id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // NOTE: An earlier attempt added a reconcile useEffect here that
  // unioned category.menuIds with "menus whose categoryIds list this
  // category", to mask backend's lack of bidirectional m2m sync.
  // Reverted on 2026-05-19 because UNION can't distinguish:
  //   - ADD that hasn't synced (the other side legitimately knows
  //     the relationship → we want to show it), from
  //   - REMOVE that hasn't synced (the other side is just stale →
  //     we want to NOT show it).
  // Treating both as "add" wrongly resurrected just-removed
  // relationships in the symmetric EditMenu picker. The real fix
  // lives in backend — see CATEGORY_CAMPAIGN_CASCADE_BRIEF.md
  // Addendum 2 for the ask. Until that ships, this dialog reads the
  // raw `category.menuIds` as backend returns it.

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

            {/* Kategori Görseli — the <label> rendered by CustomFileInput
                IS the dropzone now. Passing the preview as children
                means clicks anywhere on the image (or the cloud CTA)
                naturally trigger the file picker via standard
                label-for-input HTML semantics, and drag-drop fires the
                label's onDrop handler directly. The earlier overlay/
                absolute-positioned pattern relied on hit-test stacking
                and was unreliable in real browsers. */}
            <div>
              <span className="text-[--black-2] text-sm font-medium mb-2 block">
                {t("editCategories.category_image_optional")}
              </span>
              <CustomFileInput
                required={false}
                value={categoryData.image}
                onChange={handleFileChange}
                accept="image/png, image/jpeg"
                className="!group !border-[--border-1] !rounded-xl !p-4 !bg-transparent text-center hover:!border-[--primary-1] transition-all"
              >
                {preview ? (
                  <div className="max-h-40 overflow-hidden flex justify-center items-center rounded-lg mx-auto shadow-md">
                    <img
                      src={preview}
                      className="max-h-40 w-auto object-cover rounded-md"
                      alt={t("addCategory.category_image_alt")}
                    />
                  </div>
                ) : (
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 bg-[--status-primary-1] text-[--primary-1] rounded-full flex items-center justify-center mx-auto mb-3">
                      <CloudUI className="size-[1.5rem] pt-1 pl-1" />
                    </div>
                    <p className="text-sm text-[--gr-1] group-hover:text-[--primary-1] font-medium">
                      {t("addCategory.image_click_to_select")}
                    </p>
                  </div>
                )}
              </CustomFileInput>
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

              {/* Kampanya — initial value is derived from products'
                  isCampaign (every-true rule). On save the EditCategory
                  payload carries `campaign`; the success effect also
                  cascades to every product in this category. */}
              <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
                <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                  {t("editCategories.campaign")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--black-2]">
                    {t("editCategories.status_active")}
                  </span>
                  <CustomToggle
                    checked={!!categoryData.campaign}
                    onChange={handleCampaignToggle}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
                {/* Empty-category footnote: the cascade has nothing to
                    stamp, so the toggle won't "stick" across reopens
                    until the category has products. */}
                {categoryIsEmpty && (
                  <p className="mt-2 text-[10px] leading-snug text-[--gr-1]">
                    {t("editCategories.campaign_empty_hint")}
                  </p>
                )}
              </div>

              {/* Şef Tavsiyesi — mirrors Kampanya: initial value is
                  derived from products' `recommendation` (every-true
                  rule). On save the change cascades recommendation to
                  every product in this category. The legacy `featured`
                  field carries the toggle value. */}
              <div className="flex flex-col p-4 bg-[--light-1] rounded-xl border border-[--border-1] hover:border-[--primary-1] transition-colors">
                <span className="text-xs font-semibold text-[--gr-1] uppercase tracking-wider mb-2">
                  {t("editCategories.featured")}
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[--black-2]">
                    {t("editCategories.status_active")}
                  </span>
                  <CustomToggle
                    checked={!!categoryData.featured}
                    onChange={handleFeaturedToggle}
                    className="peer-checked:bg-[var(--green-1)] bg-[--border-1] scale-[.7]"
                  />
                </div>
                {/* Empty-category footnote: the cascade has nothing to
                    stamp, so the toggle won't "stick" across reopens
                    until the category has products. */}
                {categoryIsEmpty && (
                  <p className="mt-2 text-[10px] leading-snug text-[--gr-1]">
                    {t("editCategories.recommendation_empty_hint")}
                  </p>
                )}
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

            {/* Şef Tavsiyesi Uyarısı — saving cascades to every product
                in this category: ON marks them all recommended, OFF
                removes the recommendation from all of them. */}
            {recommendationPending && (
              <div className="p-4 bg-[--status-orange] text-[--orange-1] dark:text-white rounded-xl border border-[--border-orange] text-sm font-medium transition-all duration-300 ease-in-out">
                <div className="flex items-center">
                  <WarnI className="text-[--orange-1] dark:text-white mr-3 size-[1.5rem]" />
                  <span>
                    {categoryData.featured
                      ? t("editCategories.recommendation_warning_on")
                      : t("editCategories.recommendation_warning_off")}
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
