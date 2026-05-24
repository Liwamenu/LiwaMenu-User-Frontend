//MODULES
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";

//COMP
import { DeleteI } from "../../../assets/icon";
import CustomCheckbox from "../../common/customCheckbox";
import { usePopup } from "../../../context/PopupContext";

//REDUX
import { privateApi } from "../../../redux/api";
import {
  deleteCategory,
  resetDeleteCategory,
} from "../../../redux/categories/deleteCategorySlice";

const baseURL = import.meta.env.VITE_BASE_URL;

// Why this isn't just `dispatch(deleteCategory(id))`:
//
// The backend's m2m migration (see PRODUCT_M2M_BACKEND_BRIEF.md §2.4)
// added an ORPHAN GUARD on DELETE Categories/{id} — it rejects if any
// product would be left with zero category memberships, surfaced as the
// "Bu kategoriyi silmek için içindeki ürünleri önce başka bir
// kategoriye taşıyın veya silin." toast. Before m2m a category-delete
// either cascade-deleted products or left them in some implicit
// "uncategorized" bucket, so the old flow worked. Now the orphan guard
// is correct behaviour, and it's the FRONTEND'S job to honour the
// "Alt kategorileri ve ilişkili öğeleri de sil" checkbox by walking
// the products in this category first.
//
// Per-product decision rule:
//   • Only this category (no other memberships) → DELETE Products/{id}
//   • Also in other categories → DELETE Products/{id}/Categories/{catId}
//     (junction endpoint — covers all subcategory variants under this
//      same parent, see PRODUCT_M2M_BACKEND_BRIEF.md §2.2)
//
// Sequential rather than concurrent: keeps the progress bar honest
// (each tick is a real action that committed), avoids hammering the
// backend with N deletes at once, and the product counts inside a
// single category are small enough that wall-clock is fine.

const DeleteCategory = ({ category, onSuccess }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  // Categories live under /restaurant/:id/... so useParams is always
  // available here. Falls back to category.restaurantId if the DTO
  // happens to include it (defensive — not all callers wire it the
  // same way).
  const params = useParams();
  const restaurantId = params?.id || category?.restaurantId;

  const [deleteSubItems, setDeleteSubItems] = useState(false);
  const [popCheckbox, setPopCheckbox] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({
    done: 0,
    total: 0,
    phase: "", // "fetching" | "products" | "category"
  });

  const handleSubmit = async () => {
    if (!deleteSubItems) {
      // Existing nudge — flash the checkbox so the user knows to
      // explicitly acknowledge the destructive action.
      setPopCheckbox(true);
      const removePop = setTimeout(() => setPopCheckbox(false), 1000);
      return () => clearTimeout(removePop);
    }
    if (busy) return;
    setBusy(true);

    try {
      const api = privateApi();

      // ── Phase 1: fetch products in this category ──
      // pageSize=2000 mirrors the convention used in the print and
      // backup exports; a single category over 2000 products is
      // theoretical at best.
      setProgress({ done: 0, total: 0, phase: "fetching" });
      const res = await api.get(
        `${baseURL}Products/getProductsByCategoryId`,
        {
          params: {
            restaurantId,
            categoryId: category.id,
            pageNumber: 1,
            pageSize: 2000,
          },
        },
      );
      const products = res?.data?.data || [];

      // ── Phase 2: per-product cleanup ──
      let failed = 0;
      if (products.length > 0) {
        setProgress({
          done: 0,
          total: products.length,
          phase: "products",
        });
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          try {
            // Defensive against the backend returning PascalCase here
            // (see CLAUDE.md "Backend response casing"). The slice
            // version of this endpoint runs `normalizeKeysDeep` but
            // we're calling api directly to keep the modal stateless,
            // so accept both shapes ourselves.
            const memberships = Array.isArray(p?.categories)
              ? p.categories
              : Array.isArray(p?.Categories)
                ? p.Categories
                : [];
            // Count memberships that point at OTHER parent categories.
            // Two memberships under the same parent (different
            // subcategories) still mean "only in this category", so
            // they group correctly here.
            const others = memberships.filter((m) => {
              const mid = m?.categoryId ?? m?.CategoryId;
              return mid && mid !== category.id;
            });
            if (others.length === 0) {
              // Only lives in this category → full delete is correct
              // (no orphan to worry about — the product goes away).
              await api.delete(
                `${baseURL}Products/DeleteProduct/${p.id}`,
              );
            } else {
              // Also in another category → just unhook this
              // membership. The junction-delete endpoint enforces its
              // own orphan guard, but `others.length > 0` already
              // guarantees we're not the last one.
              await api.delete(
                `${baseURL}Products/${p.id}/Categories/${category.id}`,
              );
            }
          } catch (err) {
            failed += 1;
            console.error(
              "[deleteCategory] product cleanup failed:",
              p?.name,
              err,
            );
          }
          setProgress({
            done: i + 1,
            total: products.length,
            phase: "products",
          });
        }
      }

      // If even one product cleanup failed, the backend orphan guard
      // would re-trip on the category delete — abort with a clear
      // error rather than show a confusing "...silmek için içindeki
      // ürünleri..." toast that doesn't say WHICH product is the
      // problem.
      if (failed > 0) {
        toast.error(
          t("deleteCategory.partial_fail", {
            count: failed,
            defaultValue:
              "{{count}} ürün işlenemedi — kategori silinmedi. Detay için konsola bakın.",
          }),
        );
        setBusy(false);
        return;
      }

      // ── Phase 3: delete the category itself ──
      // Dispatched via the thunk so the existing cross-slice
      // invalidation matchers fire (getCategoriesSlice,
      // getProductsSlice, getSubCategoriesSlice, getMenusSlice — all
      // listen on Categories/DeleteCategory/fulfilled).
      setProgress({ done: 0, total: 0, phase: "category" });
      await dispatch(deleteCategory(category.id)).unwrap();

      toast.success(t("deleteCategory.deleteSuccess"));
      dispatch(resetDeleteCategory());
      setPopupContent(false);
      onSuccess?.(category.id);
    } catch (err) {
      // Error toast comes from the privateApi response interceptor —
      // it already shows `message_TR`. Just log + reset busy.
      console.error("[deleteCategory] failed:", err);
      setBusy(false);
    }
  };

  // Reset the slice on unmount so a previous success state doesn't
  // trigger anything in a future modal open.
  useEffect(() => {
    return () => {
      dispatch(resetDeleteCategory());
    };
  }, [dispatch]);

  // Render-side progress copy.
  const phaseLabel = (() => {
    if (!busy) return "";
    if (progress.phase === "fetching")
      return t(
        "deleteCategory.phase_fetching",
        "Kategorideki ürünler kontrol ediliyor…",
      );
    if (progress.phase === "products")
      return t(
        "deleteCategory.phase_products",
        "Ürünler temizleniyor… {{done}}/{{total}}",
        { done: progress.done, total: progress.total },
      );
    if (progress.phase === "category")
      return t("deleteCategory.phase_category", "Kategori siliniyor…");
    return "";
  })();

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[440px] flex flex-col items-center text-center shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        {/* Icon Circle */}
        <div className="size-16 bg-[--status-red] rounded-full flex items-center justify-center mb-6">
          <DeleteI className="size-[1.8rem] text-[--red-1]" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-3 tracking-tight">
          {t("deleteCategory.title")}
        </h2>

        {/* Description */}
        <p className="text-[--gr-1] text-base mb-6 leading-relaxed px-2 font-medium">
          <span className="font-bold text-[--red-1]">{category.name}</span>{" "}
          {t("deleteCategory.description")}
        </p>

        {/* Multi-category disclaimer — surfaces the "only in this
            category" vs "also in other categories" decision rule so
            the user isn't surprised when a product that ALSO lives
            elsewhere stays alive after the delete. */}
        <p className="text-[--gr-1] text-[11px] mb-6 leading-snug px-3">
          {t(
            "deleteCategory.cross_category_note",
            "Yalnızca bu kategorideki ürünler silinir; başka kategorilerde de olan ürünler sadece bu kategoriden çıkarılır.",
          )}
        </p>

        {/* Delete sub categories and related items */}
        <div
          className={`mb-6 text-[--red-1] p-2  ${
            popCheckbox
              ? "border border-[--red-1] rounded-lg vibrate_sides bg-[--status-red-1]"
              : "border border-transparent"
          }`}
        >
          <CustomCheckbox
            required
            label={t("deleteCategory.delete_sub_items")}
            checked={deleteSubItems}
            onChange={() => !busy && setDeleteSubItems(!deleteSubItems)}
            disabled={busy}
          />
        </div>

        {/* Progress — visible only while busy */}
        {busy && (
          <div className="w-full mb-6 bg-[--white-2] rounded-lg p-3 ring-1 ring-[--border-1]">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[--black-2]">
              <Loader2 className="size-3.5 animate-spin text-[--red-1]" />
              <span className="truncate">{phaseLabel}</span>
            </div>
            {progress.phase === "products" && progress.total > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-[--white-1] overflow-hidden">
                <div
                  className="h-full bg-[--red-1] transition-all"
                  style={{
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 w-full text-sm">
          <button
            type="button"
            onClick={() => !busy && setPopupContent(false)}
            disabled={busy}
            className="flex-1 py-2 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--gr-3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("deleteCategory.cancel")}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 bg-[--red-1] text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {t("deleteCategory.delete")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default DeleteCategory;
