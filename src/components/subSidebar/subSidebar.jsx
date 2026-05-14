//MODULES
import toast from "react-hot-toast";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Lock,
  ArrowLeft,
  PenLine,
  Settings,
  LayoutGrid,
  LayoutList,
  BookOpen,
  Tag,
  Package,
  Palette,
  Tv,
  QrCode,
} from "lucide-react";

//COMP
import UserProfile from "./userProfile";
import { usePopup } from "../../context/PopupContext";

// Paths that stay reachable even before the tenant is saved (Genel
// Ayarlar). The "edit" + "settings" entries cover the onboarding
// flow so a new owner can land on Restoranı Düzenle, fill in basic
// info, then tenant in Genel Ayarlar.
const ALWAYS_ALLOWED_PATHS = new Set(["restaurants", "edit", "settings"]);

// Once the tenant is saved we still want the Menus page reachable
// next — the menu is the gating asset for everything below
// (Categories / SubCategories / Products / Tags / QR pages all
// derive from menu structure). When at least one menu exists, the
// rest of the sidebar unlocks. Until then, only the entries above
// AND `menus` are clickable.
const MENU_GATED_PATHS = new Set([
  ...ALWAYS_ALLOWED_PATHS,
  "menus",
]);

function Sidebar({ openSidebar, setOpenSidebar }) {
  const { t } = useTranslation();
  const param = useParams();
  const sidebarRef = useRef();
  const id = param["*"].split("/")[1];
  const { popupContent, contentRef, setContentRef } = usePopup();

  // Onboarding guard: if tenant isn't saved yet, lock advanced navigation.
  const restaurantsList = useSelector(
    (s) => s.restaurants.getRestaurants?.restaurants?.data,
  );
  const fetchedRestaurant = useSelector(
    (s) => s.restaurants.getRestaurant?.restaurant,
  );
  const currentRestaurant =
    fetchedRestaurant?.id === id
      ? fetchedRestaurant
      : restaurantsList?.find?.((r) => r.id === id);
  const isTenantLocked = !currentRestaurant?.tenant;
  // Second-stage lock: once the tenant is saved, the Menus page
  // becomes the next required step. Anything past Menus
  // (Categories / Sub Categories / Products / Tags / QR pages)
  // stays disabled until the restaurant has at least one menu —
  // either added manually on the Menüler page or imported via
  // the SambaPOS / LiwaPOS Sync Tool. Reads `menus.get` to avoid a
  // dedicated count endpoint; the same slice already powers the
  // Menüler list, so this is free.
  const cachedMenus = useSelector((s) => s.menus.get?.menus);
  const cachedMenusFor = useSelector((s) => s.menus.get?.fetchedFor);
  const menusCountKnown = cachedMenusFor === id && Array.isArray(cachedMenus);
  const isMenuLocked =
    !isTenantLocked && menusCountKnown && cachedMenus.length === 0;
  const ICON_CLS = "size-[18px]";
  const ICON_STROKE = 2;
  const sidebarItems = [
    {
      icon: <ArrowLeft className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.back"),
      to: "/restaurants",
      path: "restaurants",
    },
    {
      icon: <PenLine className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.edit_restaurant"),
      to: `/restaurant/edit/${id}`,
      path: "edit",
    },
    {
      icon: <Settings className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.settings"),
      to: `/restaurant/settings/${id}`,
      // The 6 sub-pages (Rezervasyon, Duyuru, Anket, Çalışma Saatleri,
      // Sosyal Medya, Ödeme Yöntemleri) are now tabs inside Genel Ayarlar.
      // Mark this entry as active for any of those routes too.
      paths: [
        "settings",
        "reservationSettings",
        "announcementSettings",
        "surveySettings",
        "hours",
        "social",
        "payments",
      ],
      path: "settings",
    },
    // Order is the canonical setup flow:
    //   Menüler  → owners must define at least one menu first; every
    //              category/product downstream lives inside a menu.
    //   Kategoriler → defined inside the menu, group products.
    //   Alt Kategoriler → optional further breakdown of a category.
    //   Ürünler → the leaf entities.
    //   Etiketler → product-level extras (tags, options).
    // The previous order put Categories before Menus, which made the
    // first-time flow surface entries the user couldn't actually
    // populate yet (a category needs a menu to live in).
    {
      icon: <BookOpen className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.menus"),
      to: `/restaurant/menus/${id}/list`,
      path: "menus",
    },
    {
      icon: <LayoutGrid className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.categories"),
      to: `/restaurant/categories/${id}/list`,
      path: "categories",
    },
    {
      icon: <LayoutList className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.sub_categories"),
      to: `/restaurant/sub_categories/${id}/list`,
      path: "sub_categories",
    },
    {
      icon: <Package className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.products"),
      to: `/restaurant/products/${id}`,
      path: "products",
    },
    {
      icon: <Tag className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.tags"),
      to: `/restaurant/tags/${id}/`,
      path: "tags",
    },
    {
      icon: <Palette className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.qrthemes"),
      to: `/restaurant/qrthemes/${id}`,
      path: "qrthemes",
    },
    {
      icon: <Tv className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.tvthemes"),
      to: `/restaurant/tvthemes/${id}`,
      path: "tvthemes",
    },
    {
      icon: <QrCode className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.qr_code"),
      to: `/restaurant/qr/${id}`,
      path: "qr",
    },
  ];

  const route = Object.values(param)[0].split("/")[0];
  const path = route.length > 1 ? route : "edit";

  useEffect(() => {
    if (sidebarRef) {
      const refs = contentRef.filter((ref) => ref.id !== "sidebar");
      setContentRef([
        ...refs,
        {
          id: "sidebar",
          outRef: null,
          ref: sidebarRef,
          callback: () => setOpenSidebar(false),
        },
      ]);
    }
  }, [sidebarRef, openSidebar]);

  return (
    <nav
      className={`fixed -left-[280px] lg:left-0 top-0 flex flex-col justify-between bg-gradient-to-b from-[--white-2] to-[--white-1] border-r border-[--border-1] shadow-2xl w-[280px] transition-all ${
        !popupContent && "z-[999]"
      } ${openSidebar && "left-[0]"}`}
      ref={sidebarRef}
    >
      <div className="flex flex-col w-full relative">
        <header className="flex items-center justify-center px-6 h-16 w-full">
          <Link
            to="/"
            className="font-[conthrax] text-2xl tracking-wide bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent hover:from-indigo-500 hover:to-cyan-400 transition-all"
            style={{ animation: "sidebar-logo-in 500ms ease-out both" }}
          >
            LiwaMenu
          </Link>
        </header>

        <div className="flex flex-col justify-top w-full py-16 h-[100dvh] -mt-16">
          <div className="flex flex-col gap-1 px-3 pb-4 w-full overflow-y-auto">
            {sidebarItems.map((item, index) => {
              // Support both single `path` and a `paths` array — the
              // settings entry now stays highlighted across the tabbed
              // sub-pages (announcement, survey, hours, social, payments).
              const active = item.paths
                ? item.paths.includes(path)
                : path === item.path;
              // Two-stage lock:
              //   1. No tenant yet → only the onboarding entries
              //      (back / edit / settings) are clickable.
              //   2. Tenant saved but no menus yet → the Menüler
              //      entry unlocks too, but everything past it stays
              //      disabled until at least one menu exists.
              //      `MENU_GATED_PATHS` lists exactly the entries
              //      that survive stage 2.
              const locked = isTenantLocked
                ? !ALWAYS_ALLOWED_PATHS.has(item.path)
                : isMenuLocked && !MENU_GATED_PATHS.has(item.path);

              // The "Go Back" item (path === "restaurants") gets a
              // dedicated 3D-button treatment so it reads as a primary
              // navigation action rather than another menu pill. Keeps
              // the rest of the list using the standard pill style.
              if (item.path === "restaurants") {
                return (
                  <Link
                    to={item.to}
                    key={index}
                    onClick={() => setOpenSidebar(!openSidebar)}
                    style={{
                      animation: `sidebar-item-in 320ms ease-out ${index * 25}ms both`,
                    }}
                    className="block mb-3"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      className="
                        group relative w-full inline-flex items-center justify-center gap-2
                        h-9 px-3 rounded-lg text-[13px] font-semibold tracking-wide
                        text-white
                        bg-gradient-to-b from-indigo-500 to-indigo-600
                        shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_2px_0_0_rgb(67_56_202),0_3px_8px_-2px_rgb(99_102_241/0.30)]
                        active:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_0_0_rgb(67_56_202),0_1px_3px_-1px_rgb(99_102_241/0.20)]
                        active:translate-y-px
                        transition-transform duration-100
                      "
                    >
                      <span className="grid place-items-center size-5 rounded-md bg-white/10 ring-1 ring-white/15">
                        {item.icon}
                      </span>
                      <span className="leading-none">{item.text}</span>
                    </button>
                  </Link>
                );
              }

              return (
                <Link
                  to={locked ? "#" : item.to}
                  key={index}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault();
                      // Different copy depending on which stage of
                      // onboarding the user is stuck on so the toast
                      // names the actual missing step.
                      toast.error(
                        isTenantLocked
                          ? t("subSidebar.tenant_locked")
                          : t("subSidebar.menu_locked"),
                        {
                          id: "sidebar-locked",
                        },
                      );
                      return;
                    }
                    setOpenSidebar(!openSidebar);
                  }}
                  aria-disabled={locked}
                  style={{
                    animation: `sidebar-item-in 320ms ease-out ${index * 25}ms both`,
                  }}
                >
                  <div
                    className={`group relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-200 will-change-transform ${
                      locked
                        ? "cursor-not-allowed text-[--gr-3] dark:text-slate-500"
                        : active
                          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 font-semibold shadow-sm shadow-indigo-500/10 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30"
                          : "text-[--black-2] hover:bg-[--white-2] hover:text-[--black-1] hover:translate-x-0.5 cursor-pointer"
                    }`}
                  >
                    {active && !locked && (
                      <span
                        className="absolute -left-3 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-gradient-to-b from-indigo-500 via-indigo-600 to-cyan-500 origin-center"
                        style={{
                          animation: "sidebar-accent-in 220ms ease-out both",
                        }}
                      />
                    )}
                    <span
                      className={`grid place-items-center size-7 rounded-lg shrink-0 transition-all duration-200 ${
                        locked
                          ? "bg-[--white-2] text-[--gr-3] dark:bg-slate-700/50 dark:text-slate-500"
                          : active
                            ? "bg-[--white-1] text-indigo-600 ring-1 ring-indigo-100 shadow-sm shadow-indigo-500/15 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-400/20"
                            : "bg-[--white-2] text-[--gr-1] group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-500/15 dark:group-hover:text-indigo-300"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate flex-1 leading-none">
                      {item.text}
                    </span>
                    {locked && (
                      <Lock className="size-3 text-[--gr-3] dark:text-slate-500 shrink-0" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <UserProfile setOpenSidebar={setOpenSidebar} />
    </nav>
  );
}

export default Sidebar;
