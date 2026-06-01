// Google Analytics help modal — step-by-step guide for getting a GA4
// Measurement ID.
//
// Opened from two places, into DIFFERENT popup slots:
//   • Genel Ayarlar (?) button → setSecondPopupContent (it stacks
//     above the settings page, which itself lives in the primary slot)
//   • Google Analytics launcher page → setPopupContent (primary slot)
//
// So the modal can't hard-code which slot to clear on close — doing
// `setSecondPopupContent(null)` only worked from settings and left the
// modal stuck open when launched from the launcher page (wrong slot
// cleared). The opener now passes its OWN close handler via `onClose`;
// we fall back to clearing the second slot for any legacy caller that
// doesn't pass one.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  ChartLine,
  X,
  ExternalLink,
  Check,
  Copy,
} from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const GA_URL = "https://analytics.google.com/analytics/web";

// Build the restaurant's public menu URL from its tenant slug — same
// pattern qrPage.jsx uses (`https://<tenant>.liwamenu.com`). This is the
// exact "website URL" the owner pastes into GA's web-stream setup, so we
// hand it to them ready to copy instead of telling them to "enter the
// menu address".
const menuUrlForTenant = (tenant) =>
  tenant ? `https://${tenant}.liwamenu.com` : "";

export default function GoogleAnalyticsHelp({ onClose, tenant }) {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  // Prefer the opener's close handler (it knows which slot it used);
  // fall back to clearing the second slot for callers that don't pass
  // one.
  const close = onClose || (() => setSecondPopupContent(null));

  const menuUrl = menuUrlForTenant(tenant);
  const [copied, setCopied] = useState(false);

  const copyMenuUrl = async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API can fail (insecure context / permissions). Fall
      // back to a toast with the URL so the owner can still copy it
      // manually.
      toast(menuUrl, { icon: "🔗", duration: 6000 });
    }
  };

  // Each step renders as a numbered row. step3 is special: instead of
  // "enter the menu address" it shows the restaurant's actual URL with
  // a one-click copy button (when a tenant is known).
  const steps = [
    t(
      "gaHelp.step1",
      "analytics.google.com adresine girin ve Google hesabınızla oturum açın.",
    ),
    t(
      "gaHelp.step2",
      "Henüz bir hesabınız yoksa 'Ölçmeye başla' diyerek işletmeniz için bir hesap oluşturun.",
    ),
    // step3 handled specially in the render (URL + copy) — placeholder
    // here keeps the numbering aligned for the simple-string rows.
    null,
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
                {/* step3 (index 2) is the special "create a Web data
                    stream" step — show the restaurant's own menu URL
                    with a copy button instead of "enter the menu
                    address". Falls back to plain copy text when the
                    tenant isn't known yet. */}
                {i === 2 ? (
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[13px] leading-relaxed text-[--black-2]">
                      {t(
                        "gaHelp.step3_lead",
                        "Bir 'Mülk' (Property) oluşturun ve veri akışı olarak 'Web' seçin. Web sitesi adresi olarak menü adresinizi girin:",
                      )}
                    </p>
                    {menuUrl ? (
                      <button
                        type="button"
                        onClick={copyMenuUrl}
                        title={t("gaHelp.copy_url", "Adresi kopyala")}
                        className="mt-2 group flex items-center gap-2 w-full rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-left transition hover:bg-indigo-50 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20"
                      >
                        <code className="flex-1 min-w-0 truncate text-[12.5px] font-mono font-semibold text-indigo-700 dark:text-indigo-200">
                          {menuUrl}
                        </code>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300 shrink-0">
                          {copied ? (
                            <>
                              <Check className="size-3.5" />
                              {t("gaHelp.copied", "Kopyalandı")}
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5" />
                              {t("gaHelp.copy", "Kopyala")}
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      <p className="mt-1.5 text-[11.5px] text-[--gr-1] italic">
                        {t(
                          "gaHelp.step3_no_tenant",
                          "Menü adresiniz, restoranın yayın adresi (tenant) tanımlandıktan sonra burada görünür.",
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-[13px] leading-relaxed text-[--black-2] pt-0.5">
                    {step}
                  </p>
                )}
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
