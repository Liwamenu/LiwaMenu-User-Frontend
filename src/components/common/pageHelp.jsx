// "Sayfa Yardımı" — drops into any page's hero header. Clicking the trigger
// slides a help panel in from the right edge of the screen with full
// per-field walkthroughs, examples, and warnings.
//
// We intentionally bypass the global PopupContext (which centres its
// content) and own the drawer's open state + positioning here, so the
// drawer can take the right edge cleanly without restructuring the popup
// system. ESC and backdrop-click both close it; body scroll locks while
// open so the drawer's internal scroll feels native.
import { useEffect, useState } from "react";
import {
  HelpCircle,
  X,
  Lightbulb,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const PageHelp = ({ pageKey, className = "" }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={t("pageHelp.button_label", "Sayfa Yardımı")}
        className={`inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-[--border-1] bg-[--white-1] text-[--gr-1] hover:text-indigo-700 hover:border-indigo-300 hover:bg-indigo-50 transition shrink-0 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-200 dark:hover:border-indigo-400/30 ${className}`}
      >
        <HelpCircle className="size-4" />
        <span className="hidden sm:inline">
          {t("pageHelp.button_label", "Sayfa Yardımı")}
        </span>
      </button>
      <PageHelpDrawer
        open={open}
        onClose={() => setOpen(false)}
        pageKey={pageKey}
        t={t}
      />
    </>
  );
};

const PageHelpDrawer = ({ open, onClose, pageKey, t }) => {
  // Close on ESC + lock body scroll while open. Both effects are no-ops
  // until the drawer is actually open so they don't interfere with the
  // rest of the page when the user never asks for help.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const raw = t(`pageHelp.${pageKey}.sections`, {
    returnObjects: true,
    defaultValue: [],
  });
  const sections = Array.isArray(raw) ? raw : [];
  const title = t(`pageHelp.${pageKey}.title`, t("pageHelp.button_label"));
  const intro = t(`pageHelp.${pageKey}.intro`, "");

  return (
    <>
      {/* Backdrop — fades, click to dismiss. */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[99998] bg-slate-900/55 backdrop-blur-[2px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Drawer — slides in from the right. Mobile: full-width; desktop:
          fixed-width (max ~30rem) so the underlying page stays peeking on
          the left as a context anchor. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`fixed right-0 top-0 z-[99999] h-[100dvh] w-full sm:w-[480px] md:w-[520px] bg-[--white-1] text-[--black-1] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Gradient accent strip */}
        <div
          className="h-1 shrink-0"
          style={{
            background:
              "linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
          }}
        />

        {/* Header — sadece sayfa başlığı + ikon + kapat. Intro gövdeye
            taşındı çünkü header genelde dar kalıyor ve uzun açıklama
            küçük puntoyla kaybolup gidiyordu. */}
        <header className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-[--border-1] shrink-0">
          <span
            className="grid place-items-center size-10 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            <HelpCircle className="size-5" />
          </span>
          <h2 className="flex-1 min-w-0 text-sm sm:text-base font-bold tracking-tight truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("pageHelp.close", "Kapat")}
            className="grid place-items-center size-8 rounded-md text-[--gr-2] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2">
          {intro && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 dark:bg-indigo-500/10 dark:border-indigo-400/30 px-3 py-2">
              <p className="text-[12px] text-indigo-900 dark:text-indigo-100 leading-snug whitespace-pre-line">
                {intro}
              </p>
            </div>
          )}
          {sections.length === 0 ? (
            <p className="text-sm text-[--gr-1] italic">—</p>
          ) : (
            sections.map((section, i) => (
              <SectionCard
                key={i}
                section={section}
                exampleLabel={t("pageHelp.example_label", "Örnek")}
                warningLabel={t("pageHelp.warning_label", "Dikkat")}
                tipLabel={t("pageHelp.tip_label", "İpucu")}
              />
            ))
          )}
        </div>

        <footer className="px-4 sm:px-5 py-3 border-t border-[--border-1] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
            style={{
              background:
                "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)",
            }}
          >
            {t("pageHelp.close", "Kapat")}
          </button>
        </footer>
      </aside>
    </>
  );
};

// One field's help block. `section` shape:
//   { heading: string, body: string, example?: string,
//     warning?: string, tip?: string }
// Compact layout — drawer is narrow and we want many fields to fit at
// once. Body uses `leading-snug` (not `leading-relaxed`) and callouts
// share a single inline row to avoid the previous "each section eats half
// the viewport" issue.
const SectionCard = ({ section, exampleLabel, warningLabel, tipLabel }) => (
  // `min-h-0` overrides the global `section { min-height: 100dvh }` rule
  // in index.css — without it every help card stretches to a full viewport.
  <section className="!min-h-0 rounded-lg border border-[--border-1] bg-[--white-2]/40 px-3 py-2.5">
    <h3 className="text-[12px] font-bold text-[--black-1] mb-1 leading-tight">
      {section.heading}
    </h3>
    {section.body && (
      <p className="text-[12px] text-[--gr-1] leading-snug whitespace-pre-line">
        {section.body}
      </p>
    )}
    {section.example && (
      <Callout
        tone="amber"
        icon={Lightbulb}
        label={exampleLabel}
        text={section.example}
      />
    )}
    {section.warning && (
      <Callout
        tone="rose"
        icon={AlertTriangle}
        label={warningLabel}
        text={section.warning}
      />
    )}
    {section.tip && (
      <Callout
        tone="indigo"
        icon={Info}
        label={tipLabel}
        text={section.tip}
      />
    )}
  </section>
);

const Callout = ({ tone, icon: Icon, label, text }) => {
  const tones = {
    amber:
      "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-400/30",
    rose: "bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:border-rose-400/30",
    indigo:
      "bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-400/30",
  };
  const labelTones = {
    amber: "text-amber-700 dark:text-amber-300",
    rose: "text-rose-700 dark:text-rose-300",
    indigo: "text-indigo-700 dark:text-indigo-300",
  };
  const bodyTones = {
    amber: "text-amber-900 dark:text-amber-100",
    rose: "text-rose-900 dark:text-rose-100",
    indigo: "text-indigo-900 dark:text-indigo-100",
  };
  return (
    <div
      className={`mt-1.5 rounded-md border px-2 py-1.5 flex items-start gap-1.5 ${tones[tone]}`}
    >
      <Icon
        className={`size-3 shrink-0 mt-0.5 ${labelTones[tone]}`}
        strokeWidth={2.25}
      />
      <p className={`text-[11px] leading-snug ${bodyTones[tone]}`}>
        <span
          className={`text-[9px] font-bold uppercase tracking-wider mr-1.5 ${labelTones[tone]}`}
        >
          {label}:
        </span>
        {text}
      </p>
    </div>
  );
};

export default PageHelp;
