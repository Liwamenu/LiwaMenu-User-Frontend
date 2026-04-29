//MODULES
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation, Trans } from "react-i18next";

//COMP
import { DeleteI } from "../../../assets/icon";
import { usePopup } from "../../../context/PopupContext";

//REDUX
import {
  deleteOrderTag,
  resetDeleteOrderTag,
} from "../../../redux/orderTags/deleteOrderTagSlice";

const DeleteOrderTag = ({ group, onDelete }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { setPopupContent } = usePopup();
  const { success } = useSelector((s) => s.orderTags.delete);

  function onConfirm() {
    dispatch(deleteOrderTag(group.id));
  }

  useEffect(() => {
    if (success) {
      dispatch(resetDeleteOrderTag());
      toast.success(t("orderTags.delete_success"));
      onDelete();
      setPopupContent(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  return (
    <main className="flex justify-center">
      <div className="bg-[--white-2] text-[--black-2] rounded-[32px] p-8 md:p-10 w-full max-w-[440px] flex flex-col items-center text-center shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        {/* Icon Circle */}
        <div className="size-16 bg-[--status-red] rounded-full flex items-center justify-center mb-6">
          <DeleteI className="size-[1.8rem] text-[--red-1]" strokeWidth={1.8} />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold mb-3 tracking-tight">
          {t("orderTags.delete_title")}
        </h2>

        {/* Description — use Trans so the {{name}} can be wrapped in a
            highlighted span without splitting the translation text. */}
        <p className="text-[--gr-1] text-base mb-10 leading-relaxed px-2 font-medium">
          <Trans
            i18nKey="orderTags.delete_description"
            values={{ name: group.name }}
            components={{
              b: <span className="font-bold text-[--red-1]" />,
            }}
          >
            <span className="font-bold text-[--red-1]">{group.name}</span>
          </Trans>
        </p>

        {/* Buttons */}
        <div className="flex gap-4 w-full text-sm">
          <button
            onClick={() => setPopupContent(false)}
            className="flex-1 py-2 px-6 border border-[--border-1] rounded-xl text-[--gr-1] font-semibold hover:bg-[--gr-3] transition-colors"
          >
            {t("orderTags.delete_cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 bg-[--red-1] text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            {t("orderTags.delete_confirm")}
          </button>
        </div>
      </div>
    </main>
  );
};

export default DeleteOrderTag;
