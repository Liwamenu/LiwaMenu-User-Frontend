// MODULES
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiFacebook, FiInstagram, FiYoutube } from "react-icons/fi";
import { BsTiktok, BsWhatsapp } from "react-icons/bs";
import { Share2, Save, ExternalLink, Check } from "lucide-react";

// COMP
import SettingsTabs from "./settingsTabs";

// REDUX
import {
  getSocialMedias,
  resetGetSocialMedias,
} from "../../redux/restaurant/getSocialMediasSlice";
import {
  setSocialMedias,
  resetSetSocialMedias,
} from "../../redux/restaurant/setSocialMediasSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Per-platform branding so each row is recognisable at a glance.
const PLATFORMS = [
  {
    key: "facebookUrl",
    labelKey: "socialMedias.facebook",
    placeholderKey: "socialMedias.facebook_placeholder",
    Icon: FiFacebook,
    color: "#1877F2",
    tint: "rgba(24, 119, 242, 0.08)",
    fallbackHref: "https://facebook.com",
  },
  {
    key: "instagramUrl",
    labelKey: "socialMedias.instagram",
    placeholderKey: "socialMedias.instagram_placeholder",
    Icon: FiInstagram,
    color: "#E4405F",
    tint: "rgba(228, 64, 95, 0.08)",
    fallbackHref: "https://instagram.com",
  },
  {
    key: "tiktokUrl",
    labelKey: "socialMedias.tiktok",
    placeholderKey: "socialMedias.tiktok_placeholder",
    Icon: BsTiktok,
    color: "#000000",
    tint: "rgba(0, 0, 0, 0.06)",
    fallbackHref: "https://tiktok.com",
  },
  {
    key: "youtubeUrl",
    labelKey: "socialMedias.youtube",
    placeholderKey: "socialMedias.youtube_placeholder",
    Icon: FiYoutube,
    color: "#FF0000",
    tint: "rgba(255, 0, 0, 0.07)",
    fallbackHref: "https://youtube.com",
  },
  {
    key: "whatsappUrl",
    labelKey: "socialMedias.whatsapp",
    placeholderKey: "socialMedias.whatsapp_placeholder",
    Icon: BsWhatsapp,
    color: "#25D366",
    tint: "rgba(37, 211, 102, 0.1)",
    fallbackHrefFromPhone: (phone) => (phone ? `https://wa.me/${phone}` : "https://wa.me/"),
  },
];

const SocialMedias = ({ data: restaurant }) => {
  const dispatch = useDispatch();
  const id = useParams()["*"]?.split("/")[1];
  const { data } = useSelector((s) => s.restaurant.getSocialMedias);
  const { loading, success } = useSelector(
    (s) => s.restaurant.setSocialMedias,
  );
  const { t } = useTranslation();

  const [socialMediasData, setSocialMediasData] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    dispatch(setSocialMedias(socialMediasData));
  }

  useEffect(() => {
    if (!socialMediasData) {
      dispatch(getSocialMedias({ restaurantId: id }));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (data) {
      setSocialMediasData(data);
      dispatch(resetGetSocialMedias());
    }
  }, [data]);

  useEffect(() => {
    if (loading)
      toast.loading(t("socialMedias.processing"), { id: "socialMedias" });
    if (success) {
      toast.success(t("socialMedias.success"), { id: "socialMedias" });
      dispatch(resetSetSocialMedias());
    }
  }, [loading, success, dispatch]);

  const filledCount = PLATFORMS.filter((p) =>
    (socialMediasData?.[p.key] || "").trim(),
  ).length;
  const emptyCount = PLATFORMS.length - filledCount;

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <SettingsTabs />
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Share2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("socialMedias.title", { name: restaurant?.name || "" })}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {socialMediasData
                ? t("socialMedias.summary", {
                    count: filledCount,
                    empty: emptyCount,
                  })
                : t("socialMedias.subtitle")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-2">
            {PLATFORMS.map(
              ({
                key,
                labelKey,
                placeholderKey,
                Icon,
                color,
                tint,
                fallbackHref,
                fallbackHrefFromPhone,
              }) => {
                const value = socialMediasData?.[key] || "";
                const hasValue = !!value.trim();
                const href =
                  value ||
                  (fallbackHrefFromPhone
                    ? fallbackHrefFromPhone(restaurant?.phoneNumber)
                    : fallbackHref);
                const placeholder =
                  placeholderKey === "socialMedias.whatsapp_placeholder"
                    ? t(placeholderKey, { phone: restaurant?.phoneNumber })
                    : t(placeholderKey);

                return (
                  <div
                    key={key}
                    className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                      hasValue
                        ? "border-[--border-1] bg-[--white-1] shadow-sm"
                        : "border-[--border-1] bg-[--white-2]/40"
                    }`}
                  >
                    {/* Platform badge + label */}
                    <div className="flex items-center gap-2.5 w-full sm:w-44 shrink-0">
                      <span
                        className="grid place-items-center size-9 rounded-lg shrink-0 transition-colors"
                        style={{ background: tint, color }}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-[--black-1] truncate">
                          {t(labelKey)}
                        </div>
                        <div className="text-[10px] font-medium uppercase tracking-wider text-[--gr-2] flex items-center gap-1">
                          {hasValue ? (
                            <>
                              <Check
                                className="size-3 text-emerald-500"
                                strokeWidth={3}
                              />
                              <span className="text-emerald-600">linked</span>
                            </>
                          ) : (
                            <span>—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="text"
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-mono text-[12.5px]"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) =>
                          setSocialMediasData((prev) => ({
                            ...(prev || {}),
                            [key]: e.target.value,
                          }))
                        }
                      />
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("socialMedias.open_link")}
                        aria-label={t("socialMedias.open_link")}
                        className={`grid place-items-center size-10 rounded-lg border transition shrink-0 ${
                          hasValue
                            ? "border-[--border-1] text-[--black-2] hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                            : "border-[--border-1] text-[--gr-2] hover:border-[--border-1] hover:bg-[--white-2]"
                        }`}
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* SUBMIT */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[--border-1]">
            <span className="text-[11px] font-semibold text-[--gr-1] uppercase tracking-wide">
              {socialMediasData
                ? t("socialMedias.summary", {
                    count: filledCount,
                    empty: emptyCount,
                  })
                : ""}
            </span>
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:brightness-95 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ background: PRIMARY_GRADIENT }}
            >
              <Save className="size-4" />
              {t("socialMedias.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocialMedias;
