//MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import CustomInput from "../../common/customInput";
import { CancelI } from "../../../assets/icon";
import {
  PriceListSelect,
  MenuCategoryPicker,
  DEFAULT_PRICE_LIST_TYPE,
  buildPlansForBackend,
  isOvernightRange,
} from "./menuFormSections";
import { Info } from "lucide-react";

//REDUX
import { editMenu, resetEditMenu } from "../../../redux/menus/editMenuSlice";
import {
  getCategories,
  resetGetCategories,
} from "../../../redux/categories/getCategoriesSlice";
import { privateApi } from "../../../redux/api";
import { useParams } from "react-router-dom";

const baseURL = import.meta.env.VITE_BASE_URL;

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const EditMenu = ({ menu, onClose, onSave, restaurantId }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { success, error, data: editResponse } = useSelector(
    (s) => s.menus.edit,
  );
  // Live categories — needed to look up each affected category's full
  // payload when we sync the OTHER side of the m2m after save (backend
  // only updates `menu.categoryIds`, never the mirror
  // `category.menuIds`, so the frontend does the mirror itself).
  const { categories: liveCategories } = useSelector(
    (s) => s.categories.get,
  );

  // Local flag covering the brief window between EditMenu's success
  // and the follow-up category-sync round-trips finishing. Disables
  // the Save button so a rage-click doesn't fire the save again
  // mid-sync.
  const [syncing, setSyncing] = useState(false);

  const [menuName, setMenuName] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [categoryIds, setCategoryIds] = useState(menu?.categoryIds || []);
  // Which product price column this menu serves while it's active —
  // Normal / Kampanya / Özel. See menuFormSections.jsx.
  const [priceListType, setPriceListType] = useState(
    menu?.priceListType || DEFAULT_PRICE_LIST_TYPE,
  );

  // Plans payload: pass each row through buildPlansForBackend, which
  // preserves backend-issued ids for non-overnight rows and splits
  // overnight rows (start > end, e.g. 23:50 → 02:30) into two same-week
  // plans to work around the backend's `startTime < endTime` validator.
  // Client-generated row ids (the "sch-" prefix used as React keys) are
  // stripped inside the helper — only ids the backend issued round-trip.
  const updatedMenu = {
    ...menu,
    restaurantId,
    menuId: menu.id,
    name: menuName,
    plans: buildPlansForBackend(schedules),
    categoryIds,
    priceListType,
  };

  const addScheduleRow = (data = null) => {
    const newSchedule = {
      id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      days: data?.days || [],
      startTime: data?.startTime || "00:00",
      endTime: data?.endTime || "23:59",
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeScheduleRow = (rowId) => {
    setSchedules(schedules.filter((s) => s.id !== rowId));
  };

  const toggleScheduleDay = (rowId, dayIndex) => {
    setSchedules(
      schedules.map((sch) => {
        if (sch.id === rowId) {
          const days = sch.days.includes(dayIndex)
            ? sch.days.filter((d) => d !== dayIndex)
            : [...sch.days, dayIndex];
          return { ...sch, days };
        }
        return sch;
      }),
    );
  };

  const updateScheduleTime = (rowId, field, value) => {
    setSchedules(
      schedules.map((sch) =>
        sch.id === rowId ? { ...sch, [field]: value } : sch,
      ),
    );
  };

  const handleSave = () => {
    if (!menuName.trim()) {
      toast.error(t("addMenu.name_required"));
      return;
    }

    if (schedules.length === 0) {
      toast.error(t("addMenu.schedule_required"));
      return;
    }

    // Treat the menu as unchanged only when the name, schedules,
    // category selection AND price list all match the original.
    // categoryIds is order-insensitive, so compare sorted copies.
    const sortedIds = (arr) => [...(arr || [])].sort();
    if (
      isEqual(menu.name, menuName) &&
      isEqual(menu.plans, schedules) &&
      isEqual(sortedIds(menu.categoryIds), sortedIds(categoryIds)) &&
      (menu.priceListType || DEFAULT_PRICE_LIST_TYPE) === priceListType
    ) {
      toast.error(t("editMenu.not_changed"));
      return;
    }

    const hasInvalidSchedules = schedules.some((sch) => sch.days.length === 0);
    if (hasInvalidSchedules) {
      toast.error(t("addMenu.schedule_days_required"));
      return;
    }

    console.log(updatedMenu);
    dispatch(editMenu(updatedMenu));
  };

  useEffect(() => {
    if (menu) {
      setMenuName(menu.name || "");
      setSchedules(
        (menu.plans || []).map((plan) => ({
          id: plan.id || `sch-${Date.now()}-${Math.random()}`,
          days: plan.days || [],
          startTime: plan.startTime || "00:00",
          endTime: plan.endTime || "23:59",
        })),
      );
      setCategoryIds(menu.categoryIds || []);
      setPriceListType(menu.priceListType || DEFAULT_PRICE_LIST_TYPE);
    }
  }, [menu, open]);

  // Backend confirmed they don't cascade EditMenu → category.menuIds
  // (their stance: "the data is already being sent, call both endpoints").
  // So after the menu save lands we walk every category whose membership
  // changed and PUT EditCategory with the updated menuIds. Earlier read-
  // side reconcile attempts couldn't tell ADD-not-synced from REMOVE-
  // not-synced (see CATEGORY_CAMPAIGN_CASCADE_BRIEF Addendum 2); doing
  // it on WRITE is unambiguous because we know exactly which IDs the
  // user just added vs removed in this save.
  const syncCategoryMenuIds = async (menuId, oldCatIds, newCatIds) => {
    const oldSet = new Set(oldCatIds || []);
    const newSet = new Set(newCatIds || []);
    const added = [...newSet].filter((id) => !oldSet.has(id));
    const removed = [...oldSet].filter((id) => !newSet.has(id));
    if (added.length === 0 && removed.length === 0) return;

    const api = privateApi();
    const affected = [...added, ...removed];

    await Promise.allSettled(
      affected.map(async (catId) => {
        const cat = (liveCategories || []).find((c) => c.id === catId);
        if (!cat) {
          console.warn(
            "[menu→category sync] category not in local cache, skip:",
            catId,
          );
          return;
        }
        const isAdding = added.includes(catId);
        const currentMenuIds = Array.isArray(cat.menuIds) ? cat.menuIds : [];
        const nextMenuIds = isAdding
          ? currentMenuIds.includes(menuId)
            ? currentMenuIds
            : [...currentMenuIds, menuId]
          : currentMenuIds.filter((mid) => mid !== menuId);

        const fd = new FormData();
        fd.append("restaurantId", restaurantId);
        // Same payload shape EditCategory uses elsewhere — only the
        // menuIds field actually differs from the cached state. We do
        // NOT send any image field, so the backend keeps the existing
        // image untouched (no DonotPostTheImages flag here — that's
        // an `EditCategories` bulk-endpoint concern).
        fd.append(
          "categoriesData",
          JSON.stringify([
            {
              id: cat.id,
              restaurantId,
              name: cat.name,
              isActive: !!cat.isActive,
              featured: !!cat.featured,
              campaign: !!cat.campaign,
              menuIds: nextMenuIds,
            },
          ]),
        );
        try {
          await api.put(`${baseURL}Categories/EditCategory`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          console.warn(
            "[menu→category sync] EditCategory failed for",
            cat?.name,
            err?.response?.data?.message_TR ||
              err?.response?.data?.message ||
              err?.message,
          );
        }
      }),
    );
  };

  useEffect(() => {
    if (success) {
      // Wrap in an IIFE so we can await the cross-side sync before
      // closing the modal. Modal stays open for the ~1s the syncs
      // take so the user doesn't navigate away to a half-synced
      // state.
      (async () => {
        setSyncing(true);
        try {
          await syncCategoryMenuIds(
            menu.id,
            menu.categoryIds,
            categoryIds,
          );
        } finally {
          setSyncing(false);
        }

        // Force a fresh categories fetch on the next render — direct
        // api.put calls inside syncCategoryMenuIds skip the slice
        // matchers, so the cache would still hold the pre-sync
        // menuIds otherwise.
        dispatch(resetGetCategories());
        dispatch(getCategories({ restaurantId }));

        toast.success(t("editMenu.success"));
        const saved =
          editResponse?.data || editResponse || updatedMenu;
        const merged = {
          ...updatedMenu,
          ...saved,
          id: saved?.id || menu.id,
        };
        dispatch(resetEditMenu());
        onSave?.(merged);
        onClose?.();
      })();
    }
    if (error) dispatch(resetEditMenu());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error, dispatch]);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
      <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full max-w-2xl p-8 transform scale-95 transition-all duration-300 modal-content relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-[--border-1] pb-4">
          <h3 className="text-2xl font-bold text-[--black-1]">
            {t("editMenu.title")}
          </h3>
          <button
            onClick={onClose}
            className="text-[--gr-1] hover:text-[--black-2] transition-colors"
          >
            <CancelI className="size-[1.5rem]" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 pt-4">
          <div>
            <label className="block text-[--black-2] text-sm font-medium mb-2">
              {t("addMenu.name_label")}{" "}
              <span className="text-[--red-1]">*</span>
            </label>
            <CustomInput
              required
              placeholder={t("addMenu.name_placeholder")}
              className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={menuName}
              onChange={(v) => setMenuName(v)}
            />
          </div>

          {/* Hidden 2026-05-25 per product decision. State + payload
              field stay wired so re-enabling is a one-line uncomment;
              meanwhile the menu just keeps whatever priceListType it
              already had (defaults to "normal" for fresh menus, see
              DEFAULT_PRICE_LIST_TYPE). Re-enable when the special-
              pricing flow is ready to ship. */}
          {/* <PriceListSelect
            restaurantId={restaurantId}
            value={priceListType}
            onChange={setPriceListType}
          /> */}

          <MenuCategoryPicker
            restaurantId={restaurantId}
            selectedIds={categoryIds}
            onChange={setCategoryIds}
          />

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[--black-2] text-sm font-medium">
                {t("addMenu.days_title")}
              </label>
              <button
                type="button"
                onClick={() => addScheduleRow()}
                className="text-xs bg-[--status-primary-1] text-[--primary-1] px-3 py-1.5 rounded-lg hover:bg-[--status-primary-2] transition font-medium border border-[--border-1] flex gap-1 whitespace-nowrap"
              >
                <CancelI className="rotate-45 size-[1rem]" />{" "}
                {t("addMenu.add_plan")}
              </button>
            </div>

            <div className="space-y-3">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-[--light-1] p-3 rounded-xl border border-[--border-1] relative group transition-all hover:border-[--primary-1]"
                >
                  {/* Days */}
                  <div className="flex flex-wrap gap-1.5 mb-3 justify-center sm:justify-start">
                    {DAY_KEYS.map((dayKey, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleScheduleDay(sch.id, idx)}
                        className={`text-xs h-8 px-3 rounded-full border flex items-center justify-center transition-colors font-medium whitespace-nowrap ${
                          sch.days.includes(idx)
                            ? "bg-[--primary-1] text-white border-[--primary-1]"
                            : "bg-[--white-1] text-[--gr-1] border-[--border-1]"
                        }`}
                      >
                        {t(`workingHours.${dayKey}`)}
                      </button>
                    ))}
                  </div>

                  {/* Times — native HH:mm input. The browser supplies the
                      clock icon and picker; no positioning hacks needed. */}
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={sch.startTime || ""}
                      onChange={(e) =>
                        updateScheduleTime(sch.id, "startTime", e.target.value)
                      }
                      className="flex-1 h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                    <span className="text-[--gr-1] text-sm select-none">
                      –
                    </span>
                    <input
                      type="time"
                      value={sch.endTime || ""}
                      onChange={(e) =>
                        updateScheduleTime(sch.id, "endTime", e.target.value)
                      }
                      className="flex-1 h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-sm text-[--black-1] tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                    />
                  </div>

                  {/* Overnight hint — surfaces what the backend split will
                      do so the user understands why two plans appear on
                      the next edit. Only shown when the row actually
                      wraps midnight (start > end). */}
                  {isOvernightRange(sch.startTime, sch.endTime) && (
                    <div className="mt-2 flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 text-[11px] leading-snug dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
                      <Info className="size-3.5 mt-px shrink-0" />
                      <span>{t("addMenu.overnight_hint")}</span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeScheduleRow(sch.id)}
                    className="absolute -top-2 -right-2 bg-[--status-red] text-[--red-1] w-6 h-6 rounded-full flex items-center justify-center hover:bg-[--red-1] hover:text-white transition-colors shadow-sm"
                  >
                    <CancelI className="size-[1rem]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[--border-1] mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] rounded-xl hover:bg-[--light-1] transition-all"
          >
            {t("addMenu.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={syncing}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg hover:bg-[--primary-2] transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {syncing
              ? t("editMenu.syncing", "Senkronize ediliyor…")
              : t("editMenu.update")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMenu;
