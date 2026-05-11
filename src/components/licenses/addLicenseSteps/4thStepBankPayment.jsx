import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Copy,
  Landmark,
  User,
} from "lucide-react";
import { copyToClipboard } from "../../../utils/utils";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const BANK_INFO = {
  bankName: "Garanti Bankası",
  currency: "TL",
  iban: "TR76 0006 2000 4610 0006 2920 57",
  accountHolder: "Liwa Yazılım San. Tic. Ltd. Şti.",
};

const FourthStepBankPayment = ({ step, setStep }) => {
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    setStep(5);
  };

  const handleCopy = (text) => {
    copyToClipboard({ text, msg: t("addLicense.copied") });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <div className="px-4 sm:px-5 pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="grid place-items-center size-10 shrink-0 rounded-xl text-white shadow-md shadow-indigo-500/20"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <Landmark className="size-5" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-[--black-1] leading-tight">
              {t("addLicense.bank_account_title")}
            </h2>
            <p className="mt-1 text-xs text-[--gr-1] leading-snug">
              {t("addLicense.bank_account_subtitle")}
            </p>
          </div>
        </div>

        {/* Bank info card */}
        <div className="rounded-xl border border-[--border-1] overflow-hidden divide-y divide-[--border-1]">
          <BankInfoRow
            icon={Building2}
            label={t("addLicense.bank_name")}
            value={BANK_INFO.bankName}
          />
          <BankInfoRow
            icon={Banknote}
            label={t("addLicense.currency")}
            value={BANK_INFO.currency}
          />
          <BankInfoRow
            icon={Landmark}
            label={t("addLicense.iban")}
            value={BANK_INFO.iban}
            mono
            copyable
            onCopy={() => handleCopy(BANK_INFO.iban)}
            t={t}
          />
          <BankInfoRow
            icon={User}
            label={t("addLicense.account_holder")}
            value={BANK_INFO.accountHolder}
            copyable
            onCopy={() => handleCopy(BANK_INFO.accountHolder)}
            t={t}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-[--border-1] bg-[--white-1] text-[--black-1] text-sm font-medium hover:bg-[--white-2] transition"
        >
          <ArrowLeft className="size-4" />
          {t("addLicense.back")}
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition hover:shadow-indigo-500/30 hover:brightness-110 active:brightness-95"
          style={{ background: PRIMARY_GRADIENT }}
        >
          {t("addLicense.continue")}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
};

export default FourthStepBankPayment;

// ====== Bank info row ======

const BankInfoRow = ({ icon: Icon, label, value, mono, copyable, onCopy, t }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-[--primary-1]/10 text-[--primary-1]">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] select-none">
          {label}
        </p>
        {copyable ? (
          <button
            type="button"
            onClick={onCopy}
            title={t?.("addLicense.tap_to_copy")}
            className={`group mt-0.5 inline-flex items-center gap-2 -ml-1 px-1 rounded-md text-[--black-1] hover:bg-[--primary-1]/10 hover:text-[--primary-1] transition text-left ${
              mono ? "font-mono" : "font-semibold"
            }`}
          >
            <span className={`text-sm ${mono ? "tracking-wide" : ""}`}>
              {value}
            </span>
            <Copy className="size-3.5 text-[--gr-1] group-hover:text-[--primary-1] transition shrink-0" />
          </button>
        ) : (
          <p className="mt-0.5 text-sm font-semibold text-[--black-1] select-text">
            {value}
          </p>
        )}
      </div>
    </div>
  );
};
