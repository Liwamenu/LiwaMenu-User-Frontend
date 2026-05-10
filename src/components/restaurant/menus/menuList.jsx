// MODULES
import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Calendar,
  Layers,
} from "lucide-react";

// COMP
import AddMenu from "./addMenu";
import EditMenu from "./editMenu";
import DeleteMenu from "./deleteMenu";
import PageHelp from "../../common/pageHelp";
import menusJSON from "../../../assets/js/Menus.json";
import { usePopup } from "../../../context/PopupContext";

// REDUX
import {
  getMenus,
  addMenuToCache,
  updateMenuInCache,
  removeMenuFromCache,
} from "../../../redux/menus/getMenusSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// Backend data has been seen using both 0-6 (legacy: 0=Monday … 6=Sunday)
// and ISO 1-7 (1=Monday … 7=Sunday). Map both safely; anything outside
// returns null so we just skip the chip instead of rendering "UNDEFINED".
const dayKeyForValue = (d) => {
  if (d === 0) return "monday";
  if (d === 7) return "sunday";
  if (d >= 1 && d <= 6) return DAY_KEYS[d];
  return null;
};

const MenuList = () => {
  const params = useParams();
  const restaurantId = params["*"]?.split("/")[1];
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  const { t } = useTranslation();

  const { menus, error, fetchedFor } = useSelector((s) => s.menus.get);

  // Render data: prefer the redux cache, fall back to the bundled mock list
  // when the backend errors out (kept from the legacy behavior so the page
  // never feels completely broken in dev).
  const menusData = useMemo(() => {
    if (error) return menusJSON.menus;
    return menus;
  }, [menus, error]);

  // Add/Edit/Delete handlers mutate the redux cache directly so the page
  // stays in sync with the source of truth — the slice's `menus` array.
  // This means the cache-skip logic below is safe even after CRUD ops:
  // the next visit doesn't need a refetch to see the new state.
  const handleAddMenu = (added) => {
    if (added?.id) {
      dispatch(addMenuToCache(added));
      return;
    }
    // Defensive fallback: if the AddMenu response didn't include an id
    // (older backends, envelope shape we didn't anticipate, etc.) the
    // cache would otherwise carry a row with id=undefined and later
    // delete attempts would hit DELETE /Menus/DeleteMenu/undefined →
    // 404. A full refetch canonicalises ids from the server.
    if (restaurantId) dispatch(getMenus({ restaurantId }));
  };
  const handleEditMenu = (edited) => dispatch(updateMenuInCache(edited));
  const handleDeleteMenu = (id) => dispatch(removeMenuFromCache(id));

  const onAddMenu = () => {
    setPopupContent(
      <AddMenu
        onClose={() => setPopupContent(false)}
        onSave={handleAddMenu}
        restaurantId={restaurantId}
      />,
    );
  };

  const onEditMenu = (menu) => {
    setPopupContent(
      <EditMenu
        menu={menu}
        onClose={() => setPopupContent(false)}
        onSave={handleEditMenu}
        restaurantId={restaurantId}
      />,
    );
  };

  const onDeleteMenu = (menu) => {
    setPopupContent(
      <DeleteMenu
        menu={menu}
        onClose={() => setPopupContent(false)}
        onDelete={handleDeleteMenu}
      />,
    );
  };

  // GET menus — only fetch when redux doesn't already have a fresh payload
  // for THIS restaurant. The backend GetMenusByRestaurantId is slow and the
  // global loadingMiddleware blocks the whole UI while it's in flight, so
  // we lean on the slice cache to make revisits feel instant.
  useEffect(() => {
    if (!restaurantId) return;
    if (!menus || fetchedFor !== restaurantId) {
      dispatch(getMenus({ restaurantId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const totalCount = menusData?.length || 0;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <BookOpen className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("menuList.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {menusData
                ? t("menuList.summary", { count: totalCount })
                : t("menuList.subtitle")}
            </p>
          </div>
          <PageHelp pageKey="menus" />
          <button
            type="button"
            onClick={onAddMenu}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">
              {t("menuList.add_menu")}
            </span>
          </button>
        </div>

        <div className="p-3 sm:p-5">
          {!menusData ? null : menusData.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[--border-1] bg-[--white-2]/60 p-8 grid place-items-center text-center">
              <span className="grid place-items-center size-12 rounded-xl bg-indigo-50 text-indigo-600 mb-3">
                <BookOpen className="size-6" />
              </span>
              <h3 className="text-sm font-semibold text-[--black-1]">
                {t("menuList.no_menus")}
              </h3>
              <p className="text-xs text-[--gr-1] mt-1 max-w-sm">
                {t("menuList.no_menus_info")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {menusData.map((menu) => (
                <MenuCard
                  key={menu.id}
                  menu={menu}
                  t={t}
                  onEdit={onEditMenu}
                  onDelete={onDeleteMenu}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =================== MENU CARD ===================
const MenuCard = ({ menu, t, onEdit, onDelete }) => {
  const planCount = Array.isArray(menu.plans) ? menu.plans.length : 0;
  const categoryCount = Array.isArray(menu.categoryIds)
    ? menu.categoryIds.length
    : 0;

  return (
    <div className="group rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden flex flex-col hover:border-indigo-200 hover:shadow-md transition-all">
      {/* Top accent strip */}
      <div className="h-1 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      {/* Header */}
      <div className="px-3 py-2.5 flex items-start gap-2 border-b border-[--border-1]">
        <span className="grid place-items-center size-8 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
          <BookOpen className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[--black-1] truncate leading-tight">
            {menu.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <Chip icon={Calendar} tone="indigo">
              {t("menuList.schedule_count", { count: planCount })}
            </Chip>
            {categoryCount > 0 && (
              <Chip icon={Layers} tone="emerald">
                {t("menuList.category_count", { count: categoryCount })}
              </Chip>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(menu)}
            title={t("menuList.edit")}
            className="grid place-items-center size-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition"
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(menu)}
            title={t("menuList.delete")}
            className="grid place-items-center size-8 rounded-md text-rose-600 hover:bg-rose-50 transition"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Schedule list */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        {menu.plans && menu.plans.length > 0 ? (
          menu.plans.map((plan, i) => {
            const rawDays = plan.days || [];
            // Resolve to canonical day keys, dropping unknowns and dedupping
            // across mixed conventions (0-6 vs 1-7).
            const seen = new Set();
            const resolvedKeys = rawDays
              .map(dayKeyForValue)
              .filter((k) => {
                if (!k || seen.has(k)) return false;
                seen.add(k);
                return true;
              });
            const isEveryDay = resolvedKeys.length === 7;
            return (
              <div
                key={i}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[--white-2] border border-[--border-1]"
              >
                <Clock className="size-3.5 text-indigo-500 shrink-0" />
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-[--black-1] shrink-0 tabular-nums">
                    {(plan.startTime || "00:00").replace(":00", "")} –{" "}
                    {(plan.endTime || "23:59").replace(":00", "")}
                  </span>
                  {isEveryDay ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-1.5 py-0.5 rounded-md shrink-0">
                      {t("menuList.every_day")}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-0.5 min-w-0">
                      {resolvedKeys.map((key) => (
                        <span
                          key={key}
                          className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 px-1 py-0.5 rounded"
                        >
                          {t(`workingHours.${key}_short`)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-[--gr-2] italic text-center py-3">
            {t("menuList.no_time_plan")}
          </div>
        )}
      </div>
    </div>
  );
};

// =================== CHIP ===================
const Chip = ({ icon: Icon, tone = "indigo", children }) => {
  const tones = {
    indigo: "text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100",
    emerald: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100",
    amber: "text-amber-700 bg-amber-50 ring-1 ring-amber-100",
    slate: "text-[--gr-1] bg-[--white-2] ring-1 ring-[--border-1]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${tones[tone] || tones.indigo}`}
    >
      <Icon className="size-3" strokeWidth={2.25} />
      {children}
    </span>
  );
};

export default MenuList;
