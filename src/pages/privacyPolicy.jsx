import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CONTENT from "./privacyPolicyContent.json";

const headingClass = "text-base sm:text-lg font-semibold text-slate-900 mb-2";

// The terms text is hand-authored per legal-tone requirements and kept in a
// dedicated content file (`privacyPolicyContent.json`) rather than the shared
// i18n translation.json files: routing each legal paragraph through `i18n.t`
// would balloon the locale files and make legal review awkward. The JSON holds
// one entry per supported language ({ intro, sections[], closing }); we render
// whichever matches the active language and fall back to English otherwise.
//
// We subscribe to i18n's `languageChanged` event explicitly because
// `useTranslation()`'s auto-subscription doesn't always re-render components
// rendered inside the popup portal — the JSX gets captured at openPrivacy()
// time and the inner component reads a stale i18n language until something
// else triggers a re-render. The explicit listener forces a state update on
// every language change, which reliably swaps the language even with the
// popup already open.

const Terms = ({ content }) => (
  <article className="text-sm leading-relaxed text-slate-600 space-y-4">
    <p className="font-medium text-slate-700">{content.intro}</p>
    {content.sections.map((s, i) => (
      <div key={i}>
        <h3 className={headingClass}>{s.title}</h3>
        <p>{s.body}</p>
        {s.warning && (
          <p className="mt-2 font-medium text-rose-700">{s.warning}</p>
        )}
      </div>
    ))}
    <p className="font-medium text-slate-700">{content.closing}</p>
  </article>
);

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language);
  useEffect(() => {
    const handler = (next) => setLang(next);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);
  // Normalise the active i18n language (e.g. "en-US" → "en") to a content key;
  // anything not translated falls back to English.
  const key = (lang || "en").slice(0, 2).toLowerCase();
  return <Terms content={CONTENT[key] || CONTENT.en} />;
};

export default PrivacyPolicy;
