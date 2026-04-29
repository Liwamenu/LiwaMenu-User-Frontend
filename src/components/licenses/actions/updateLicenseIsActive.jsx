//MODULES
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import { CancelI } from "../../../assets/icon";
import CustomInput from "../../common/customInput";
import { usePopup } from "../../../context/PopupContext";
import CustomCheckbox from "../../common/customCheckbox";

//REDUX
import {
  resetUpdateLicenseIsActiveState,
  updateLicenseIsActive,
} from "../../../redux/licenses/updateLicenseIsActiveSlice";

const EditLicenseIsActive = ({ licenseData, onSuccess }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();

  const handleClick = () => {
    setPopupContent();
    // <EditLicenseIsActivesPopup onSuccess={onSuccess} license={licenseData} />
  };

  return (
    <span
      className={`text-xs font-normal cursor-pointer ${
        licenseData.isActive
          ? "text-[--green-1] bg-[--status-green] border-[--green-1]"
          : "text-[--red-1] bg-[--status-red] border-[--red-1]"
      } px-3 py-1 border border-solid rounded-full`}
      onClick={handleClick}
    >
      ● {licenseData.isActive ? t("licenses.active") : t("licenses.passive")}
    </span>
  );
};

export default EditLicenseIsActive;

///*** *///
/////////////
// EDIT licenseData POPUP
function EditLicenseIsActivesPopup({ onSuccess, license }) {
  const dispatch = useDispatch();
  const toastId = useRef();
  const licenseDataIsActiveRef = useRef();

  const { setPopupContent } = usePopup();

  const { loading, success, error } = useSelector(
    (state) => state.licenses.updateLicenseIsActive
  );

  const [licenseData, setLicenseData] = useState({
    checked: false,
    isActive: license.isActive,
  });

  const closeForm = () => {
    setPopupContent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateLicenseIsActive({
        licenseId: license.id,
        active: licenseData.isActive,
      })
    );
  };

  // TOAST
  useEffect(() => {
    if (loading) {
      toastId.current = toast.loading("İşleniyor 🤩...");
    }
    if (error) {
      toastId.current && toast.dismiss(toastId.current);
      if (error?.message_TR) {
        toast.error(error.message_TR + "🙁");
      } else {
        toast.error("Something went wrong");
      }
      dispatch(resetUpdateLicenseIsActiveState());
    } else if (success) {
      toastId.current && toast.dismiss(toastId.current);
      onSuccess();
      setPopupContent(null);
      toast.success(
        `Lisans başarıyla ${
          license.isActive ? "Pasifleştirildi" : "Aktifleştirildi"
        } 🥳🥳`
      );
      dispatch(resetUpdateLicenseIsActiveState());
    }
  }, [loading, success, error]);

  return (
    <div className="w-full flex justify-center">
      <div
        className="w-full pt-12 pb-8 bg-[--white-1] rounded-lg border-2 border-solid border-[--border-1] text-[--black-2] max-w-2xl"
        ref={licenseDataIsActiveRef}
      >
        <div className="flex flex-col bg-[--white-1] relative">
          <div className="absolute -top-6 right-3">
            <div
              className="text-[--primary-2] p-2 border border-solid border-[--primary-2] rounded-full cursor-pointer hover:bg-[--primary-2] hover:text-[--white-1] transition-colors"
              onClick={closeForm}
            >
              <CancelI />
            </div>
          </div>
          <h1 className="self-center text-2xl font-bold">Lisans Durumu</h1>
          <div className="flex flex-col px-4 sm:px-14 mt-9 w-full text-left gap-8">
            <div className="w-full flex gap-12 items-center">
              <p className="min-w-28">Durum:</p>
              <p
                className={`py-3 border border-dashed w-24 text-center rounded-md ${
                  license.isActive
                    ? "text-[--green-1] border-[--green-1]"
                    : "text-[--red-1] border-[--red-1]"
                }`}
              >
                ● {license.isActive ? "Aktif" : "Pasif"}
              </p>
            </div>

            <div className="w-full flex gap-12 items-center">
              <p className="min-w-28">İşlem:</p>
              <CustomCheckbox
                className2={`${
                  license.isActive ? "text-[--red-1]" : "text-[--green-1]"
                }`}
                label={license.isActive ? "Pasifleştir" : "Aktifleştir"}
                checked={licenseData.checked}
                onChange={() =>
                  setLicenseData((prev) => {
                    return {
                      ...prev,
                      checked: !licenseData.checked,
                      isActive: !licenseData.isActive,
                    };
                  })
                }
              />
            </div>

            {license?.note && (
              <div className="w-full flex gap-12 items-center">
                <p className="min-w-28">Note:</p>
                <p className="text-sm font-normal">{license.note}</p>
              </div>
            )}

            {license?.passiveNote && (
              <div className="w-full flex gap-12 items-center">
                <p className="min-w-28">Pasif Note:</p>
                <CustomInput
                  placeholder="Note"
                  value={licenseData.passiveNote}
                  onChange={(e) => {
                    setLicenseData((prev) => {
                      return {
                        ...prev,
                        passiveNote: e,
                      };
                    });
                  }}
                  disabled={!licenseData.checked}
                  className="mt-[0] sm:mt-[0] text-sm"
                  className2="mt-[0] sm:mt-[0]"
                />
              </div>
            )}

            <div className="w-full flex gap-12 items-center justify-end">
              <button
                disabled={!licenseData.checked}
                onClick={handleSubmit}
                className={`py-3 w-24 text-center rounded-md border border-solid transition-colors disabled:cursor-not-allowed ${
                  license.isActive
                    ? "bg-[--status-red] text-[--red-1] border-[--red-1] hover:bg-[--red-1] hover:text-[--white-1] disabled:hover:bg-[--status-red] disabled:hover:text-[--red-1]"
                    : "bg-[--status-green] text-[--green-1] hover:bg-[--green-1] hover:text-[--white-1] border-[--green-1] disabled:hover:bg-[--status-green] disabled:hover:text-[--green-1]"
                }`}
              >
                {license.isActive ? "Pasifleştir" : "Aktifleştir"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
