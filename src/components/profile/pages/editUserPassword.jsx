//MOD
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Loader2, Lock, ShieldCheck, Info } from "lucide-react";

//COMP
import CustomInput from "../../common/customInput";

// REDUX
import {
  resetUpdateUserPassword,
  updateUserPassword,
} from "../../../redux/user/updateUserPasswordSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

const EditUserPassword = () => {
  const { t } = useTranslation();
  const toastId = useRef();
  const dispatch = useDispatch();

  const { loading, success, error } = useSelector(
    (state) => state.user.updatePassword,
  );

  const [userPassword, setUserPassword] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading(t("editUserPassword.processing"));
    } else if (error) {
      toast.dismiss(toastId.current);
      // Show server-provided message (e.g. wrong current password) when present.
      const msg =
        error?.message_TR || error?.message || t("editUserPassword.error");
      toast.error(msg, { id: "updatePasswordError" });
      dispatch(resetUpdateUserPassword());
    } else if (success) {
      toast.dismiss(toastId.current);
      toast.success(t("editUserPassword.success"));
      setUserPassword({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      dispatch(resetUpdateUserPassword());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, success, error]);

  function handleSubmit(e) {
    e.preventDefault();
    if (userPassword.confirmPassword !== userPassword.password) {
      toast.error(t("editUserPassword.passwords_not_match"));
      return;
    }
    dispatch(
      updateUserPassword({
        currentPassword: userPassword.currentPassword,
        newPassword: userPassword.password,
      }),
    );
  }

  const passwordsMatch =
    userPassword.password &&
    userPassword.password === userPassword.confirmPassword;
  const passwordsMismatch =
    userPassword.confirmPassword &&
    userPassword.password !== userPassword.confirmPassword;

  const canSubmit =
    !loading &&
    passwordsMatch &&
    userPassword.password.length >= 5 &&
    userPassword.currentPassword.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-[--border-1] bg-[--white-1] overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-[--white-2]/60 border-b border-[--border-1]">
          <span className="grid place-items-center size-7 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 shrink-0">
            <Lock className="size-3.5" />
          </span>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
            {t("editUserPassword.section_change")}
          </h3>
        </div>

        <div className="p-3 sm:p-4 space-y-3">
          <CustomInput
            required
            label={t("editUserPassword.current_password")}
            placeholder={t("editUserPassword.current_password_placeholder")}
            className="py-2.5 text-sm"
            letIcon={true}
            value={userPassword.currentPassword}
            onChange={(e) =>
              setUserPassword((prev) => ({ ...prev, currentPassword: e }))
            }
            maxLength={32}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <CustomInput
              required
              label={t("editUserPassword.password")}
              placeholder={t("editUserPassword.password_placeholder")}
              className="py-2.5 text-sm"
              letIcon={true}
              value={userPassword.password}
              onChange={(e) =>
                setUserPassword((prev) => ({ ...prev, password: e }))
              }
              minLength={5}
              maxLength={32}
            />
            <CustomInput
              required
              label={t("editUserPassword.confirm_password")}
              placeholder={t("editUserPassword.confirm_password_placeholder")}
              className="py-2.5 text-sm"
              letIcon={true}
              value={userPassword.confirmPassword}
              onChange={(e) =>
                setUserPassword((prev) => ({ ...prev, confirmPassword: e }))
              }
              minLength={5}
              maxLength={32}
            />
          </div>

          {/* Inline validation hint */}
          {passwordsMismatch ? (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 ring-1 ring-rose-200 text-rose-700 dark:bg-rose-500/10 dark:ring-rose-400/30 dark:text-rose-200">
              <Info className="size-3.5 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                {t("editUserPassword.passwords_not_match")}
              </p>
            </div>
          ) : passwordsMatch ? (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50 ring-1 ring-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:ring-emerald-400/30 dark:text-emerald-200">
              <ShieldCheck className="size-3.5 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                {t("editUserPassword.passwords_match")}
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[--white-2] ring-1 ring-[--border-1]">
              <Info className="size-3.5 shrink-0 mt-0.5 text-[--gr-1]" />
              <p className="text-[11px] leading-snug text-[--gr-1]">
                {t("editUserPassword.hint")}
              </p>
            </div>
          )}

          {/* Heads-up: changing the password revokes sessions on other
              devices (backend keeps this device signed in). */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:ring-indigo-400/30 dark:text-indigo-200">
            <ShieldCheck className="size-3.5 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-snug">
              {t("editUserPassword.other_devices_note")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-[--border-1]">
        <button
          type="submit"
          disabled={!canSubmit}
          className={`inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-sm font-semibold transition shrink-0 ${
            canSubmit
              ? "text-white shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95"
              : "text-[--gr-1] bg-[--white-2] border border-[--border-1] cursor-not-allowed"
          }`}
          style={canSubmit ? { background: PRIMARY_GRADIENT } : undefined}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShieldCheck className="size-4" />
          )}
          {loading
            ? t("editUserPassword.processing")
            : t("editUserPassword.save")}
        </button>
      </div>
    </form>
  );
};

export default EditUserPassword;
