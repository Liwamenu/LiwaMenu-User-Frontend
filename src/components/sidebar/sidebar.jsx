//MODULES
import toast from "react-hot-toast";
import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CreditCard,
  Lock,
  PackageOpen,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";

//ASSETS
import UserProfile from "./userProfile";

//COMP
import { usePopup } from "../../context/PopupContext";

//REDUX
import { getRestaurants } from "../../redux/restaurants/getRestaurantsSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

function Sidebar({ openSidebar, setOpenSidebar }) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef();
  const { showPopup, contentRef, setContentRef } = usePopup();

  const { restaurants, loading } = useSelector(
    (state) => state.restaurants.getRestaurants,
  );

  // Eagerly fetch restaurants once so gating logic has data even on a deep-linked route.
  useEffect(() => {
    if (!restaurants && !loading) {
      dispatch(getRestaurants({ pageNumber: 1, pageSize: 50 }));
    }
  }, []);

  const { hasRestaurants, hasActiveLicense } = useMemo(() => {
    const data = restaurants?.data || [];
    return {
      hasRestaurants: (restaurants?.totalCount || data.length) > 0,
      hasActiveLicense: data.some(
        (r) => r.isActive && r.licenseIsActive && !r.licenseIsExpired,
      ),
    };
  }, [restaurants]);

  const sections = [
    {
      label: t("sidebar.section_management"),
      items: [
        {
          icon: Store,
          text: t("sidebar.restaurants"),
          to: "/restaurants",
          path: "restaurants",
          // always enabled
        },
        {
          icon: ShieldCheck,
          text: t("sidebar.licenses"),
          to: "/licenses",
          path: "licenses",
          disabled: !hasRestaurants,
          disabledReason: t("sidebar.locked_no_restaurant"),
        },
        {
          icon: CreditCard,
          text: t("sidebar.payments"),
          to: "/payments",
          path: "payments",
          disabled: !hasRestaurants || !hasActiveLicense,
          disabledReason: !hasRestaurants
            ? t("sidebar.locked_no_restaurant")
            : t("sidebar.locked_no_license"),
        },
      ],
    },
    {
      label: t("sidebar.section_operations"),
      items: [
        {
          icon: ShoppingBag,
          text: t("sidebar.orders"),
          to: "/orders",
          path: "orders",
          disabled: !hasActiveLicense,
          disabledReason: !hasRestaurants
            ? t("sidebar.locked_no_restaurant")
            : t("sidebar.locked_no_license"),
        },
        {
          icon: PackageOpen,
          text: t("sidebar.waiter_calls"),
          to: "/waiterCalls",
          path: "waiterCalls",
          disabled: !hasActiveLicense,
          disabledReason: !hasRestaurants
            ? t("sidebar.locked_no_restaurant")
            : t("sidebar.locked_no_license"),
        },
        {
          icon: Bell,
          text: t("sidebar.reservations"),
          to: "/reservations",
          path: "reservations",
          disabled: !hasActiveLicense,
          disabledReason: !hasRestaurants
            ? t("sidebar.locked_no_restaurant")
            : t("sidebar.locked_no_license"),
        },
      ],
    },
  ];

  const currentPath = location.pathname.split("/")[1] || "restaurants";

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

  const handleItemClick = (e, item) => {
    if (item.disabled) {
      e.preventDefault();
      e.stopPropagation();
      toast.dismiss();
      toast(item.disabledReason, { icon: "🔒", id: "sidebar-locked" });
      return;
    }
    setOpenSidebar(false);
  };

  return (
    <nav
      ref={sidebarRef}
      className={`fixed -left-[280px] lg:left-0 top-0 flex flex-col bg-[--white-1] border-r border-[--border-1] shadow-2xl w-[280px] h-[100dvh] transition-all ${
        !showPopup && "z-[999]"
      } ${openSidebar && "left-[0]"}`}
    >
      {/* Brand header */}
      <header className="flex items-center gap-3 h-16 px-5 shrink-0 border-b border-[--border-1]">
        <Link
          to="/"
          onClick={() => setOpenSidebar(false)}
          className="flex items-center gap-2.5"
        >
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/20"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Store className="size-4" strokeWidth={2.5} />
          </span>
          <span className="font-[conthrax] text-lg tracking-wide text-[--black-1]">
            LiwaMenu
          </span>
        </Link>
      </header>

      {/* Nav body */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="px-3 mb-2 text-[10px] font-bold tracking-widest text-[--gr-1]/80 uppercase">
              {section.label}
            </p>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const isActive = currentPath === item.path;
                const Icon = item.icon;

                // Each item is a refined pill-button: padded, rounded, with a
                // dedicated icon chip on the left so the row reads as a card
                // rather than a flat link. Active/hover/disabled have distinct
                // backgrounds and icon-chip colors.
                const baseClasses =
                  "group relative flex items-center gap-2.5 pl-2.5 pr-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 will-change-transform";
                const stateClasses = isActive
                  ? "text-indigo-700 bg-indigo-50 ring-1 ring-indigo-100 font-semibold shadow-sm shadow-indigo-500/10"
                  : item.disabled
                    ? "text-slate-400 cursor-not-allowed"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-0.5";

                const iconChip = isActive
                  ? "bg-white text-indigo-600 ring-1 ring-indigo-100 shadow-sm shadow-indigo-500/15"
                  : item.disabled
                    ? "bg-slate-50 text-slate-300"
                    : "bg-slate-100/70 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600";

                const inner = (
                  <>
                    {isActive && (
                      <span
                        className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full"
                        style={{ background: PRIMARY_GRADIENT }}
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={`grid place-items-center size-8 rounded-lg shrink-0 transition-all duration-200 ${iconChip}`}
                    >
                      <Icon
                        className="size-4"
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </span>
                    <span className="flex-1 truncate">{item.text}</span>
                    {item.disabled && (
                      <Lock
                        className="size-3.5 text-slate-400 shrink-0"
                        strokeWidth={2}
                      />
                    )}
                  </>
                );

                return (
                  <li key={item.path}>
                    {item.disabled ? (
                      <button
                        type="button"
                        onClick={(e) => handleItemClick(e, item)}
                        title={item.disabledReason}
                        className={`${baseClasses} ${stateClasses} w-full text-left`}
                      >
                        {inner}
                      </button>
                    ) : (
                      <Link
                        to={item.to}
                        onClick={(e) => handleItemClick(e, item)}
                        className={`${baseClasses} ${stateClasses}`}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User profile footer */}
      <UserProfile setOpenSidebar={setOpenSidebar} />
    </nav>
  );
}

export default Sidebar;
