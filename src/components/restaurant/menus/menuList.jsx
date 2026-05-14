// MODULES
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
  Plug,
  ListOrdered,
  Hand,
  Download,
  FileText,
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle2,
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

// External links surfaced on the Integration tab. Read from env so
// the binary URL can be rotated without a redeploy of this app.
// Falls back to the public Liwa CDN paths so the buttons keep
// working in dev / preview when the env vars aren't set yet.
const SYNC_TOOL_URL =
  import.meta.env.VITE_SYNC_TOOL_URL ||
  "https://cdn.liwamenu.com/tools/LiwaSyncTool-Setup.exe";
const INTEGRATION_DOCS_URL =
  import.meta.env.VITE_INTEGRATION_DOCS_URL ||
  "https://docs.liwamenu.com/integrations/sync-tool";

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

  // GET menus — only fetch when redux doesn't already have a fresh
  // payload for THIS restaurant. The backend GetMenusByRestaurantId
  // is slow and the global loadingMiddleware blocks the whole UI
  // while it's in flight, so we lean on the slice cache to make
  // revisits feel instant.
  //
  // `menus` + `fetchedFor` are deliberately in the dep list (not
  // just `restaurantId`): the slice's cross-domain invalidation
  // matcher clears the cache to null after any Menus/Add|Edit|Delete
  // fulfills. The page's own optimistic mutation reducers
  // (`addMenuToCache` / `updateMenuInCache` / `removeMenuFromCache`)
  // bail out when `state.menus` is null, so without re-running this
  // effect on cache clear the list would render blank until a hard
  // reload. The condition still prevents a refetch loop — once a
  // fresh payload lands, `menus` is truthy and `fetchedFor` matches,
  // so the next tick is a no-op.
  useEffect(() => {
    if (!restaurantId) return;
    if (!menus || fetchedFor !== restaurantId) {
      dispatch(getMenus({ restaurantId }));
    }
  }, [restaurantId, menus, fetchedFor, dispatch]);

  const totalCount = menusData?.length || 0;

  // Two-tab layout: the existing menu list, plus a permanent
  // Integration tab that hosts the SambaPOS / LiwaPOS / 3rd-party
  // Sync Tool docs + download. The integration tab stays available
  // forever (not just during onboarding) so owners who already have
  // menus can come back, grab a fresh Sync Tool build, or read the
  // docs without leaving the admin.
  const [activeTab, setActiveTab] = useState("list"); // "list" | "integration"
  // First-time users (no menus yet) see a welcome card on the list
  // tab with two routes: "Manuel Kurulum" (opens Add Menu dialog)
  // or "Entegrasyon" (jumps to the Integration tab). Once at least
  // one menu exists, the welcome card stays out of the way.
  const isFirstTime = menusData?.length === 0;

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
          {/* Add Menu only on the list tab — out of place on the
              Integration tab where the action is "import via tool". */}
          {activeTab === "list" && (
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
          )}
        </div>

        {/* TABS */}
        <div className="px-3 sm:px-4 pt-3 border-b border-[--border-1] flex gap-1 overflow-x-auto">
          <TabButton
            active={activeTab === "list"}
            onClick={() => setActiveTab("list")}
            icon={ListOrdered}
            label={t("menuList.tab_list")}
            badge={totalCount > 0 ? totalCount : null}
          />
          <TabButton
            active={activeTab === "integration"}
            onClick={() => setActiveTab("integration")}
            icon={Plug}
            label={t("menuList.tab_integration")}
          />
        </div>

        <div className="p-3 sm:p-5">
          {activeTab === "integration" ? (
            <IntegrationPanel
              t={t}
              restaurantId={restaurantId}
              onSyncCompleted={() => {
                // Drop the cache + refetch. If the Sync Tool ran
                // successfully there will now be menus, and the
                // first-time welcome card flips to the list view.
                dispatch(getMenus({ restaurantId }));
                toast.success(t("menuList.integration_sync_refresh"));
                setActiveTab("list");
              }}
            />
          ) : !menusData ? null : isFirstTime ? (
            <FirstTimeChooser
              t={t}
              onManual={onAddMenu}
              onIntegration={() => setActiveTab("integration")}
            />
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

// =================== TAB BUTTON ===================
const TabButton = ({ active, onClick, icon: Icon, label, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition border-b-2 ${
      active
        ? "text-indigo-700 border-indigo-600 bg-indigo-50/40"
        : "text-[--gr-1] border-transparent hover:text-[--black-2] hover:bg-[--white-2]"
    }`}
  >
    <Icon className="size-4" />
    {label}
    {badge != null && (
      <span className="ml-0.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
        {badge}
      </span>
    )}
  </button>
);

// =================== FIRST-TIME CHOOSER ===================
// Shown when the restaurant has zero menus. Two big cards: pick the
// manual route (opens the existing Add Menu dialog) or jump to the
// Integration tab to download the Sync Tool. Mirrors the wizard step
// the user is being guided through; once any menu exists the chooser
// is hidden and the standard list takes over.
const FirstTimeChooser = ({ t, onManual, onIntegration }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
    <ChoiceCard
      icon={Hand}
      iconClass="bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
      title={t("menuList.choice_manual_title")}
      description={t("menuList.choice_manual_desc")}
      cta={t("menuList.choice_manual_cta")}
      onClick={onManual}
    />
    <ChoiceCard
      icon={Plug}
      iconClass="bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30"
      title={t("menuList.choice_integration_title")}
      description={t("menuList.choice_integration_desc")}
      cta={t("menuList.choice_integration_cta")}
      ctaTone="emerald"
      onClick={onIntegration}
    />
  </div>
);

const ChoiceCard = ({
  icon: Icon,
  iconClass,
  title,
  description,
  cta,
  ctaTone = "indigo",
  onClick,
}) => {
  const ctaClasses =
    ctaTone === "emerald"
      ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25"
      : "bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-indigo-500/25";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left rounded-2xl border border-[--border-1] bg-[--white-1] p-5 sm:p-6 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col gap-3"
    >
      <span className={`grid place-items-center size-12 rounded-xl ${iconClass}`}>
        <Icon className="size-6" strokeWidth={1.8} />
      </span>
      <h3 className="text-sm sm:text-base font-bold text-[--black-1]">
        {title}
      </h3>
      <p className="text-xs text-[--gr-1] leading-relaxed flex-1">
        {description}
      </p>
      <span
        className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md transition group-hover:brightness-110 self-start ${ctaClasses}`}
      >
        {cta}
        <ArrowRight className="size-3.5" />
      </span>
    </button>
  );
};

// =================== INTEGRATION PANEL ===================
// Permanent tab — always reachable, even after the restaurant has
// menus. Hosts the Sync Tool download, a docs link, and a
// "Senkronizasyon Tamamlandı" button that triggers a menus refetch
// so newly-imported menus appear without a hard reload.
const IntegrationPanel = ({ t, restaurantId, onSyncCompleted }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleSyncComplete = async () => {
    if (!restaurantId) return;
    setRefreshing(true);
    try {
      await onSyncCompleted();
    } finally {
      // Brief delay so the spinner is perceivable on fast networks.
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-3 sm:gap-4">
      {/* Left — explanatory copy + step-by-step */}
      <div className="rounded-2xl border border-[--border-1] bg-[--white-2]/40 p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center size-10 rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30 shrink-0">
            <Plug className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-[--black-1]">
              {t("menuList.integration_title")}
            </h3>
            <p className="text-xs text-[--gr-1] mt-1 leading-relaxed">
              {t("menuList.integration_subtitle")}
            </p>
          </div>
        </div>

        <ol className="space-y-2.5">
          {[1, 2, 3, 4].map((n) => (
            <li
              key={n}
              className="flex items-start gap-3 p-3 rounded-xl border border-[--border-1] bg-[--white-1]"
            >
              <span className="grid place-items-center size-7 rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 text-xs font-bold shrink-0 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
                {n}
              </span>
              <p className="text-xs sm:text-[13px] text-[--black-2] leading-relaxed">
                {t(`menuList.integration_step_${n}`)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* Right — actions panel */}
      <div className="rounded-2xl border border-[--border-1] bg-[--white-1] p-4 sm:p-5 flex flex-col gap-3 self-start">
        <div className="flex items-center gap-2">
          <Download className="size-4 text-indigo-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[--gr-1]">
            {t("menuList.integration_actions")}
          </h4>
        </div>

        <a
          href={SYNC_TOOL_URL}
          download
          className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Download className="size-3.5" />
          {t("menuList.integration_download_tool")}
        </a>

        <a
          href={INTEGRATION_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-xs font-semibold border border-[--border-1] bg-[--white-1] text-[--black-2] hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition"
        >
          <FileText className="size-3.5" />
          {t("menuList.integration_open_docs")}
        </a>

        <div className="my-1 border-t border-dashed border-[--border-1]" />

        <button
          type="button"
          onClick={handleSyncComplete}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-emerald-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-60"
          style={{
            background:
              "linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%)",
          }}
        >
          {refreshing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          {t("menuList.integration_sync_done")}
        </button>

        <p className="text-[11px] text-[--gr-1] leading-snug flex items-start gap-1.5">
          <RefreshCw className="size-3 mt-0.5 shrink-0 text-[--gr-2]" />
          {t("menuList.integration_sync_done_hint")}
        </p>
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
