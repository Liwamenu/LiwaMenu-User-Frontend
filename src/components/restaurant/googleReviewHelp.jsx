// Google review-link help modal — step-by-step guide for getting the
// Google Business "write a review" link that the owner pastes into the
// "Google Yorum Bağlantısı" field.
//
// Mirrors GoogleAnalyticsHelp's layout/behaviour. Opened from the (?)
// button next to the review-link input via setSecondPopupContent, so it
// stacks above the settings page. The opener passes its own `onClose`;
// we fall back to clearing the second slot for any legacy caller.

import { useTranslation } from "react-i18next";
import { Star, X, ExternalLink, Check } from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const BUSINESS_URL = "https://business.google.com/";

export default function GoogleReviewHelp({ onClose }) {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  const close = onClose || (() => setSecondPopupContent(null));

  const steps = [
    t(
      "gReviewHelp.step1",
      "Google Benim İşletmem (Google Business Profile) profilinize gidin.",
    ),
    t(
      "gReviewHelp.step2",
      "İşletme profilinizde 'Yorumları oku' bağlantısına tıklayın.",
    ),
    t(
      "gReviewHelp.step3",
      "Açılan pencerede 'Daha fazla yorum alın' altındaki Paylaş simgesini seçin.",
    ),
    t(
      "gReviewHelp.step4",
      "Bağlantıyı kopyalayıp buradaki 'Google Yorum Bağlantısı' alanına yapıştırın ve kaydedin.",
    ),
  ];

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-[520px] shadow-2xl ring-1 ring-[--border-1] overflow-hidden animate-[fadeIn_0.18s_ease-out] max-h-[90vh] flex flex-col">
        {/* Gradient strip */}
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* Header */}
        <div className="px-5 py-4 border-b border-[--border-1] flex items-center gap-3 shrink-0">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Star className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
              {t("gReviewHelp.title", "Google Yorum Bağlantısı Nasıl Alınır?")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "gReviewHelp.subtitle",
                "Müşterilerin işletmeniz hakkında yorum yazması için",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition shrink-0"
            aria-label={t("gReviewHelp.close", "Kapat")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body — numbered steps */}
        <div className="p-5 overflow-auto">
          <p className="text-[13px] leading-relaxed text-[--black-2] mb-3">
            {t(
              "gReviewHelp.lead",
              "Müşterilerin işletmeniz hakkında yorum yazabilmesi için:",
            )}
          </p>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid place-items-center size-6 rounded-full bg-indigo-50 text-indigo-700 text-[12px] font-bold shrink-0 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-400/30">
                  {i + 1}
                </span>
                <p className="text-[13px] leading-relaxed text-[--black-2] pt-0.5">
                  {step}
                </p>
              </li>
            ))}
          </ol>

          {/* Open Google Business in a new tab */}
          <a
            href={BUSINESS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <ExternalLink className="size-4" />
            {t("gReviewHelp.open_business", "Google İşletme Profilini Aç")}
          </a>

          {/* Note about where the value goes */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11.5px] leading-snug text-indigo-900 dark:bg-indigo-500/10 dark:border-indigo-400/30 dark:text-indigo-100">
            <Star className="size-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-300" />
            <span>
              {t(
                "gReviewHelp.note",
                "Bu bağlantı, müşteriyi doğrudan Google'da yorum yazma ekranına götürür.",
              )}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[--border-1] bg-[--white-2]/40 flex justify-end shrink-0">
          <button
            type="button"
            onClick={close}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Check className="size-4" />
            {t("gReviewHelp.got_it", "Anladım")}
          </button>
        </div>
      </div>
    </main>
  );
}
