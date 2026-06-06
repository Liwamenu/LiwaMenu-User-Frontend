// MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { FiFacebook, FiInstagram, FiYoutube } from "react-icons/fi";
import { BsTiktok, BsWhatsapp } from "react-icons/bs";
import { Share2, Save, ExternalLink, Check, Star, HelpCircle } from "lucide-react";

// COMP
import SettingsTabs from "./settingsTabs";
import GoogleReviewHelp from "./googleReviewHelp";
import { useDirtyTracking } from "../../context/DirtyNavContext";
import { usePopup } from "../../context/PopupContext";

// REDUX
import {
  getSocialMedias,
  resetGetSocialMedias,
} from "../../redux/restaurant/getSocialMediasSlice";
import {
  setSocialMedias,
  resetSetSocialMedias,
} from "../../redux/restaurant/setSocialMediasSlice";
import useSmartRevalidate from "../../hooks/useSmartRevalidate";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Social links are STORED as full URLs but ENTERED as just a handle on top
// of a fixed, read-only prefix (e.g. the user types "liwacafe" and we store
// "https://instagram.com/liwacafe"). YouTube/TikTok prefixes already include
// the leading "@". These helpers convert between the stored URL and handle.
const stripHandle = (raw) =>
  String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/^\++/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\s+/g, "");

const extractHandle = (prefix, url) => {
  if (!url) return "";
  let h = String(url)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
  const domain = prefix.replace(/@+$/, ""); // prefix without the trailing "@"
  if (h.toLowerCase().startsWith(domain.toLowerCase())) h = h.slice(domain.length);
  return h.replace(/^@+/, "").replace(/^\/+/, "").replace(/\/+$/, "").trim();
};

const buildSocialUrl = (prefix, handle) => {
  const clean = stripHandle(handle);
  return clean ? `https://${prefix}${clean}` : "";
};

// Per-platform branding so each row is recognisable at a glance.
const PLATFORMS = [
  {
    key: "facebookUrl",
    labelKey: "socialMedias.facebook",
    placeholderKey: "socialMedias.facebook_placeholder",
    Icon: FiFacebook,
    color: "#1877F2",
    tint: "rgba(24, 119, 242, 0.08)",
    prefix: "facebook.com/",
    fallbackHref: "https://facebook.com",
  },
  {
    key: "instagramUrl",
    labelKey: "socialMedias.instagram",
    placeholderKey: "socialMedias.instagram_placeholder",
    Icon: FiInstagram,
    color: "#E4405F",
    tint: "rgba(228, 64, 95, 0.08)",
    prefix: "instagram.com/",
    fallbackHref: "https://instagram.com",
  },
  {
    key: "tiktokUrl",
    labelKey: "socialMedias.tiktok",
    placeholderKey: "socialMedias.tiktok_placeholder",
    Icon: BsTiktok,
    color: "#000000",
    tint: "rgba(0, 0, 0, 0.06)",
    prefix: "tiktok.com/@",
    fallbackHref: "https://tiktok.com",
  },
  {
    key: "youtubeUrl",
    labelKey: "socialMedias.youtube",
    placeholderKey: "socialMedias.youtube_placeholder",
    Icon: FiYoutube,
    color: "#FF0000",
    tint: "rgba(255, 0, 0, 0.07)",
    prefix: "youtube.com/@",
    fallbackHref: "https://youtube.com",
  },
  {
    key: "whatsappUrl",
    labelKey: "socialMedias.whatsapp",
    placeholderKey: "socialMedias.whatsapp_placeholder",
    Icon: BsWhatsapp,
    color: "#25D366",
    tint: "rgba(37, 211, 102, 0.1)",
    prefix: "wa.me/",
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
  const { setSecondPopupContent } = usePopup();

  const [socialMediasData, setSocialMediasData] = useState(null);
  const [socialMediasDataBefore, setSocialMediasDataBefore] = useState(null);
  useDirtyTracking(socialMediasData, socialMediasDataBefore);

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
      // Only re-seed the form when it's pristine, so a background
      // revalidate (tab focus / in-app nav / cross-device change)
      // never wipes unsaved edits. On first load both are null →
      // isEqual true → seeds normally.
      if (isEqual(socialMediasData, socialMediasDataBefore)) {
        // `googleReviewLink` is a restaurant-entity field shared with the
        // "Genel" tab (NOT part of the social-links payload) — seed it from
        // the restaurant entity so both tabs show the same value. Saving
        // here sends it back and the patcher syncs the cached entity.
        const seeded = {
          ...data,
          googleReviewLink: restaurant?.googleReviewLink ?? "",
        };
        setSocialMediasData(seeded);
        setSocialMediasDataBefore(seeded);
      }
      dispatch(resetGetSocialMedias());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Cross-device / returning-to-tab freshness — see useSmartRevalidate.
  useSmartRevalidate(
    id ? `socialMedias:${id}` : null,
    () => dispatch(getSocialMedias({ restaurantId: id, __silent: true })),
  );

  useEffect(() => {
    if (loading)
      toast.loading(t("socialMedias.processing"), { id: "socialMedias" });
    if (success) {
      toast.success(t("socialMedias.success"), { id: "socialMedias" });
      // Re-baseline so the DirtyNav check stops nagging post-save.
      setSocialMediasDataBefore(socialMediasData);
      dispatch(resetSetSocialMedias());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                prefix,
                fallbackHref,
                fallbackHrefFromPhone,
              }) => {
                const value = socialMediasData?.[key] || "";
                const hasValue = !!value.trim();
                // The user edits only the handle on top of the fixed prefix;
                // the stored value stays a full URL.
                const handle = extractHandle(prefix, value);
                const href =
                  value ||
                  (fallbackHrefFromPhone
                    ? fallbackHrefFromPhone(restaurant?.phoneNumber)
                    : fallbackHref);
                const placeholder = t(placeholderKey);

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
                      {/* Fixed read-only prefix + handle-only input. The
                          user types just the username/number; we store the
                          full URL (prefix already includes "@" for YT/TikTok
                          and country code is reminded for WhatsApp). */}
                      <div className="flex items-stretch flex-1 min-w-0 h-10 rounded-lg border border-[--border-1] bg-[--white-1] overflow-hidden transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
                        <span className="grid place-items-center pl-3 pr-1.5 bg-[--white-2]/60 text-[--gr-1] text-[12.5px] font-mono whitespace-nowrap select-none shrink-0 border-r border-[--border-1]">
                          {prefix}
                        </span>
                        <input
                          type="text"
                          inputMode={key === "whatsappUrl" ? "tel" : "text"}
                          autoComplete="off"
                          spellCheck={false}
                          className="flex-1 min-w-0 h-full px-2 bg-transparent text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none border-0 font-mono text-[12.5px]"
                          placeholder={placeholder}
                          value={handle}
                          onChange={(e) =>
                            setSocialMediasData((prev) => ({
                              ...(prev || {}),
                              [key]: buildSocialUrl(prefix, e.target.value),
                            }))
                          }
                        />
                      </div>
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

            {/* Google review link — same restaurant-entity value as the
                "Genel" tab; editable + saved here too, kept in sync. */}
            {(() => {
              const value = socialMediasData?.googleReviewLink || "";
              const hasValue = !!value.trim();
              return (
                <div
                  className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl border transition-all ${
                    hasValue
                      ? "border-[--border-1] bg-[--white-1] shadow-sm"
                      : "border-[--border-1] bg-[--white-2]/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full sm:w-44 shrink-0">
                    <span
                      className="grid place-items-center size-9 rounded-lg shrink-0"
                      style={{
                        background: "rgba(79,70,229,0.08)",
                        color: "#4f46e5",
                      }}
                    >
                      <Star className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-[--black-1] flex items-center gap-1">
                        {/* No `truncate` on the row: in the narrow w-44
                            column it clipped the (?) help button (overflow
                            hidden). Let the label wrap instead so the full
                            text AND the (?) stay visible. */}
                        <span className="min-w-0 leading-tight">
                          {t(
                            "restaurantSettings.google_review_link",
                            "Google Yorum Bağlantısı",
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSecondPopupContent(
                              <GoogleReviewHelp
                                onClose={() => setSecondPopupContent(null)}
                              />,
                            )
                          }
                          title={t(
                            "restaurantSettings.google_review_link_help",
                            "Google yorum bağlantısı nasıl alınır?",
                          )}
                          aria-label={t(
                            "restaurantSettings.google_review_link_help",
                            "Google yorum bağlantısı nasıl alınır?",
                          )}
                          className="grid place-items-center size-4 rounded-full text-indigo-600 hover:bg-indigo-50 transition shrink-0 dark:hover:bg-indigo-500/15"
                        >
                          <HelpCircle className="size-3.5" />
                        </button>
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

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <input
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-1] placeholder:text-[--gr-2] text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-mono text-[12.5px]"
                      placeholder={t(
                        "restaurantSettings.google_review_link_placeholder",
                        "https://g.page/r/XXXXXXXXXXXX/review",
                      )}
                      value={value}
                      onChange={(e) =>
                        setSocialMediasData((prev) => ({
                          ...(prev || {}),
                          googleReviewLink: e.target.value,
                        }))
                      }
                    />
                    <a
                      href={value || "https://business.google.com/"}
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
            })()}
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
