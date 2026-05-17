// Generic "Sil mi?" confirmation modal. The visual language mirrors
// the existing DeleteProduct popup (rose circle icon + bold title +
// description with the target name highlighted + Vazgeç / Sil
// buttons). Used by the Orders / Waiter Calls / Reservations pages
// so they don't each ship a near-identical copy.
//
// Wiring contract:
//   • `onConfirm` is async — the modal disables both buttons while
//     it's resolving so the user can't double-click. The caller is
//     responsible for dispatching the actual delete thunk + closing
//     the modal afterwards (typically via setSecondPopupContent(null)
//     in the success branch).
//   • `targetName` renders inside the description in rose; pass the
//     thing the user is about to lose (order id, customer name, etc.)
//     so the confirmation reads like "X silinecek".
//   • `description` is the rest of the message AROUND the target
//     name — e.g. "siparişi silmek üzeresiniz. Bu işlem geri
//     alınamaz." The component concatenates `targetName + " " +
//     description`, matching DeleteProduct's layout.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";

import { usePopup } from "../../context/PopupContext";

const ConfirmDeleteModal = ({
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
        <div className="size-16 bg-[--status-red] rounded-full flex items-center justify-center mb-6">
          <Trash2 className="size-7 text-[--red-1]" strokeWidth={1.8} />
        </div>

        <h2 className="text-xl font-bold mb-3 tracking-tight">{title}</h2>

        <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
          {targetName && (
            <>
              <span className="font-bold text-[--red-1]">{targetName}</span>{" "}
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
            className="flex-1 px-6 bg-[--red-1] text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {loading ? "..." : confirmLabel || t("deleteProduct.delete")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default ConfirmDeleteModal;
