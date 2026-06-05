// Generic "emin misiniz?" confirmation modal for NON-delete actions
// (approve / reject / any reversible-ish decision). Visually it mirrors
// ConfirmDeleteModal — same rounded card, centered icon circle, bold
// title, target-name-highlighted description and Vazgeç / <confirm>
// buttons — but the icon, accent and confirm-button colors are driven
// by `variant` so an "Onayla" prompt reads green/positive instead of
// borrowing the destructive red trash language.
//
// Wiring contract (identical to ConfirmDeleteModal):
//   • `onConfirm` is async — both buttons disable while it resolves so
//     the user can't double-fire. The caller dispatches the real thunk
//     and closes the modal afterwards (setSecondPopupContent(null)).
//   • `targetName` renders inside the description in the variant accent
//     color; `description` is the rest of the sentence AROUND it. The
//     component concatenates `targetName + " " + description`.
//   • `variant`: "success" (approve), "danger" (reject/destructive) or
//     "primary" (neutral, default). Pass `icon` to override.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const VARIANTS = {
  success: {
    Icon: CheckCircle,
    iconWrap: "bg-[--status-green]",
    iconColor: "text-[--green-2]",
    accent: "text-[--green-2]",
    confirmBtn: "bg-[--green-2] text-white hover:opacity-90",
  },
  danger: {
    Icon: XCircle,
    iconWrap: "bg-[--status-red]",
    iconColor: "text-[--red-1]",
    accent: "text-[--red-1]",
    confirmBtn: "bg-[--red-1] text-white hover:bg-red-700",
  },
  primary: {
    Icon: AlertCircle,
    iconWrap: "bg-[--status-primary-1]",
    iconColor: "text-[--primary-1]",
    accent: "text-[--primary-1]",
    confirmBtn: "bg-[--primary-1] text-white hover:opacity-90",
  },
};

const ConfirmActionModal = ({
  variant = "primary",
  icon: IconOverride,
  title,
  targetName,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const { setSecondPopupContent } = usePopup();
  const [loading, setLoading] = useState(false);

  const v = VARIANTS[variant] || VARIANTS.primary;
  const Icon = IconOverride || v.Icon;

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onConfirm?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-2] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[440px] flex flex-col items-center text-center shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <div
          className={`size-16 ${v.iconWrap} rounded-full flex items-center justify-center mb-6`}
        >
          <Icon className={`size-7 ${v.iconColor}`} strokeWidth={1.8} />
        </div>

        <h2 className="text-xl font-bold mb-3 tracking-tight">{title}</h2>

        <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
          {targetName && (
            <>
              <span className={`font-bold ${v.accent}`}>{targetName}</span>{" "}
            </>
          )}
          {description}
        </p>

        <div className="flex gap-4 w-full text-sm">
          <button
            type="button"
            onClick={() => setSecondPopupContent(null)}
            disabled={loading}
            className="flex-1 py-2 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--gr-3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel || t("deleteProduct.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-6 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-wait ${v.confirmBtn}`}
          >
            {loading ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </main>
  );
};

export default ConfirmActionModal;
