//MOD
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { User, Shield } from "lucide-react";

//COMP
import EditUserProfile from "./pages/editUserProfile";
import EditUserPassword from "./pages/editUserPassword";
import ActiveSessions from "./pages/activeSessions";

//REDUX
import { getAuth } from "../../redux/api";
import { getUser } from "../../redux/user/getUserSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Hydrate from localStorage so the first render is instant; once the
  // server returns fresh data we'll swap to that.
  const initialUser = getAuth()?.user || null;
  const { user: freshUser } = useSelector((state) => state.user.getUser);
  const [userData, setUserData] = useState(initialUser);
  const [selected, setSelected] = useState(0);

  // Always pull fresh user info from the server when this page opens.
  useEffect(() => {
    dispatch(getUser());
  }, [dispatch]);

  // When the server returns fresh data, propagate it into local state so
  // child components re-render with the latest values.
  useEffect(() => {
    if (freshUser) {
      setUserData(freshUser);
    }
  }, [freshUser]);

  const initials = `${userData?.firstName?.[0] || ""}${
    userData?.lastName?.[0] || ""
  }`.toUpperCase();

  const tabs = [
    {
      id: 0,
      icon: User,
      label: t("profilePage.edit_profile"),
    },
    {
      id: 1,
      icon: Shield,
      label: t("profilePage.security"),
    },
  ];

  return (
    <section className="lg:ml-[280px] pt-16 px-4 sm:px-6 lg:px-8 pb-8 min-h-[100dvh] section_row">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden mt-4">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-6 py-4 border-b border-[--border-1] flex items-center gap-3 sm:gap-4">
          <span
            className="grid place-items-center size-12 rounded-xl text-white font-bold text-base shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            {initials || <User className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-semibold text-[--black-1] truncate tracking-tight">
              {userData
                ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
                : t("profilePage.title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {userData?.email || t("profilePage.title")}
            </p>
          </div>
        </div>

        {/* TAB STRIP */}
        <div className="px-3 sm:px-4 pt-3 border-b border-[--border-1] flex gap-1 overflow-x-auto">
          {tabs.map(({ id, icon: Icon, label }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition border-b-2 ${
                  active
                    ? "text-indigo-700 border-indigo-600 bg-indigo-50/40 dark:text-indigo-200 dark:bg-indigo-500/10"
                    : "text-[--gr-1] border-transparent hover:text-[--black-2] hover:bg-[--white-2]"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {selected === 0 ? (
            <EditUserProfile user={userData} />
          ) : (
            <div className="space-y-6">
              <EditUserPassword user={userData} />
              <ActiveSessions />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
