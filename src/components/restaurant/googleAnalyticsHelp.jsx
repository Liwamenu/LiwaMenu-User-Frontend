// Google Analytics help modal — step-by-step guide for getting a GA4
// Measurement ID, opened from the (?) button next to the Google
// Analytics field in Genel Ayarlar.
//
// Pure presentational: no redux, no API. Rendered through the shared
// PopupContext (setSecondPopupContent) so it stacks above the settings
// page like the other secondary popups. Closes via the X button or the
// footer "Anladım" button.

import { useTranslation } from "react-i18next";
import {
  ChartLine,
  X,
  ExternalLink,
  Check,
} from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const GA_URL = "https://analytics.google.com/analytics/web";

export default function GoogleAnalyticsHelp() {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  const close = () => setSecondPopupContent(null);

  // Each step: a short instruction. The translation files hold the
  // localized copy; the defaults here keep the modal readable even if
  // a key is missing.
  const steps = [
    t(
      "gaHelp.step1",
      "analytics.google.com adresine girin ve Google hesabınızla oturum açın.",
    ),
    t(
      "gaHelp.step2",
      "Henüz bir hesabınız yoksa 'Ölçmeye başla' diyerek işletmeniz için bir hesap oluşturun.",
    ),
    t(
      "gaHelp.step3",
      "Bir 'Mülk' (Property) oluşturun ve veri akışı olarak 'Web' seçin; menü adresinizi girin.",
    ),
    t(
      "gaHelp.step4",
      "Yönetici (⚙️) → Veri Akışları → web akışınızı açın. Sağ üstte 'Ölçüm Kimliği' (Measurement ID) görünür.",
    ),
    t(
      "gaHelp.step5",
      "G- ile başlayan bu kimliği (örn. G-XXXXXXXXXX) kopyalayıp buradaki Google Analytics alanına yapıştırın ve kaydedin.",
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
            <ChartLine className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight truncate">
              {t("gaHelp.title", "Google Analytics Kimliği Nasıl Alınır?")}
            </h2>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t(
                "gaHelp.subtitle",
                "Menünüzün ziyaretçi istatistiklerini toplamak için",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:bg-[--white-2] transition shrink-0"
            aria-label={t("gaHelp.close", "Kapat")}
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body — numbered steps */}
        <div className="p-5 overflow-auto">
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

          {/* Open GA in a new tab */}
          <a
            href={GA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-1.5 w-full h-11 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 transition hover:brightness-110 active:brightness-95"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <ExternalLink className="size-4" />
            {t("gaHelp.open_ga", "Google Analytics'i Aç")}
          </a>

          {/* Note about where the value goes */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-[11.5px] leading-snug text-indigo-900 dark:bg-indigo-500/10 dark:border-indigo-400/30 dark:text-indigo-100">
            <ChartLine className="size-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-300" />
            <span>
              {t(
                "gaHelp.note",
                "Kimliği yapıştırdıktan sonra istatistikler birkaç saat içinde Google Analytics panelinizde görünmeye başlar.",
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
            {t("gaHelp.got_it", "Anladım")}
          </button>
        </div>
      </div>
    </main>
  );
}
