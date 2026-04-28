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

const ALWAYS_ALLOWED_PATHS = new Set(["restaurants", "edit", "settings"]);

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
    {
      icon: <LayoutGrid className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.categories"),
      to: `/restaurant/categories/${id}/list`,
      path: "categories",
    },
    // Ürünler kategorilerin hemen altında — kullanıcılar günlük menü
    // bakımının büyük kısmını "kategori → o kategorideki ürünler" sırasıyla
    // yapıyor, dolayısıyla iki giriş yan yana olunca akış doğal hissediyor.
    {
      icon: <Package className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.products"),
      to: `/restaurant/products/${id}`,
      path: "products",
    },
    {
      icon: <LayoutList className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.sub_categories"),
      to: `/restaurant/sub_categories/${id}/list`,
      path: "sub_categories",
    },
    {
      icon: <BookOpen className={ICON_CLS} strokeWidth={ICON_STROKE} />,
      text: t("subSidebar.menus"),
      to: `/restaurant/menus/${id}/list`,
      path: "menus",
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
            Liwamenu
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
              const locked =
                isTenantLocked && !ALWAYS_ALLOWED_PATHS.has(item.path);
              return (
                <Link
                  to={locked ? "#" : item.to}
                  key={index}
                  onClick={(e) => {
                    if (locked) {
                      e.preventDefault();
                      toast.error(t("subSidebar.tenant_locked"), {
                        id: "tenant-locked",
                      });
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
