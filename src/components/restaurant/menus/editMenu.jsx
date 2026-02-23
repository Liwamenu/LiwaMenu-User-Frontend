//MODULES
import toast from "react-hot-toast";
import isEqual from "lodash/isEqual";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

//COMP
import CustomInput from "../../common/customInput";
import CustomDatePicker from "../../common/customdatePicker";
import { CancelI, WaitI } from "../../../assets/icon";

//REDUX
import { editMenu, resetEditMenu } from "../../../redux/menus/editMenuSlice";
import { useParams } from "react-router-dom";

const DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const EditMenu = ({ menu, onClose, onSave, restaurantId }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { success, error } = useSelector((s) => s.menus.edit);

  const [menuName, setMenuName] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [categoryIds, setCategoryIds] = useState(menu?.categoryIds || []);

  const updatedMenu = {
    ...menu,
    restaurantId,
    menuId: menu.id,
    name: menuName,
    plans: schedules.map((sch) => ({
      id: sch.id,
      days: sch.days,
      startTime: sch.startTime,
      endTime: sch.endTime,
    })),
    categoryIds,
  };

  const addScheduleRow = (data = null) => {
    const newSchedule = {
      id: `sch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      days: data?.days || [],
      startTime: data?.startTime || "00:00",
      endTime: data?.endTime || "23:59",
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeScheduleRow = (rowId) => {
    setSchedules(schedules.filter((s) => s.id !== rowId));
  };

  const toggleScheduleDay = (rowId, dayIndex) => {
    setSchedules(
      schedules.map((sch) => {
        if (sch.id === rowId) {
          const days = sch.days.includes(dayIndex)
            ? sch.days.filter((d) => d !== dayIndex)
            : [...sch.days, dayIndex];
          return { ...sch, days };
        }
        return sch;
      }),
    );
  };

  const updateScheduleTime = (rowId, field, value) => {
    setSchedules(
      schedules.map((sch) =>
        sch.id === rowId ? { ...sch, [field]: value } : sch,
      ),
    );
  };

  // Helpers to convert between "HH:mm" strings and Date objects for CustomDatePicker
  const parseTimeToDate = (timeStr) => {
    if (!timeStr) return null;
    const [hh, mm] = timeStr.split(":").map((v) => parseInt(v, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  const formatDateToTimeString = (date) => {
    if (!date) return "";
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const handleSave = () => {
    if (!menuName.trim()) {
      toast.error(t("addMenu.name_required"));
      return;
    }

    if (schedules.length === 0) {
      toast.error(t("addMenu.schedule_required"));
      return;
    }

    //check if there is no changes using isEqual from lodash
    if (isEqual(menu.name, menuName) && isEqual(menu.plans, schedules)) {
      toast.error(t("editMenu.not_changed"));
      return;
    }

    const hasInvalidSchedules = schedules.some((sch) => sch.days.length === 0);
    if (hasInvalidSchedules) {
      toast.error(t("addMenu.schedule_days_required"));
      return;
    }

    console.log(updatedMenu);
    dispatch(editMenu(updatedMenu));
  };

  useEffect(() => {
    if (menu) {
      setMenuName(menu.name || "");
      setSchedules(
        (menu.plans || []).map((plan) => ({
          id: plan.id || `sch-${Date.now()}-${Math.random()}`,
          days: plan.days || [],
          startTime: plan.startTime || "00:00",
          endTime: plan.endTime || "23:59",
        })),
      );
    }
  }, [menu, open]);

  useEffect(() => {
    if (success) {
      toast.success(t("editMenu.success"));
      dispatch(resetEditMenu());
      onSave?.(updatedMenu);
      onClose?.();
    }
    if (error) dispatch(resetEditMenu());
  }, [success, error, dispatch]);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300">
      <div className="bg-[--white-1] rounded-2xl shadow-2xl w-full max-w-lg p-8 transform scale-95 transition-all duration-300 modal-content relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-[--border-1] pb-4">
          <h3 className="text-2xl font-bold text-[--black-1]">
            {t("editMenu.title")}
          </h3>
          <button
            onClick={onClose}
            className="text-[--gr-1] hover:text-[--black-2] transition-colors"
          >
            <CancelI className="size-[1.5rem]" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1 pt-4">
          <div>
            <label className="block text-[--black-2] text-sm font-medium mb-2">
              {t("addMenu.name_label")}{" "}
              <span className="text-[--red-1]">*</span>
            </label>
            <CustomInput
              required
              placeholder={t("addMenu.name_placeholder")}
              className="w-full rounded-xl border-[--border-1] bg-[--light-1] focus:bg-[--white-1] p-3.5 text-[--black-1] border focus:border-[--primary-1] focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
              value={menuName}
              onChange={(v) => setMenuName(v)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[--black-2] text-sm font-medium">
                {t("addMenu.days_title")}
              </label>
              <button
                type="button"
                onClick={() => addScheduleRow()}
                className="text-xs bg-[--status-primary-1] text-[--primary-1] px-3 py-1.5 rounded-lg hover:bg-[--status-primary-2] transition font-medium border border-[--border-1] flex gap-1 whitespace-nowrap"
              >
                <CancelI className="rotate-45 size-[1rem]" />{" "}
                {t("addMenu.add_plan")}
              </button>
            </div>

            <div className="space-y-3">
              {schedules.map((sch) => (
                <div
                  key={sch.id}
                  className="bg-[--light-1] p-3 rounded-xl border border-[--border-1] relative group transition-all hover:border-[--primary-1]"
                >
                  {/* Days */}
                  <div className="flex flex-wrap gap-1.5 mb-3 justify-center sm:justify-start">
                    {DAY_KEYS.map((dayKey, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleScheduleDay(sch.id, idx)}
                        className={`text-[10px] w-8 h-8 rounded-full border flex items-center justify-center transition-colors font-medium ${
                          sch.days.includes(idx)
                            ? "bg-[--primary-1] text-white border-[--primary-1]"
                            : "bg-[--white-1] text-[--gr-1] border-[--border-1]"
                        }`}
                      >
                        {t(`workingHours.${dayKey}`).substring(0, 2)}
                      </button>
                    ))}
                  </div>

                  {/* Times */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <WaitI className="size-[1rem] absolute right-2 top-8 -translate-y-1/2 text-[--gr-1] text-xs" />
                      <CustomDatePicker
                        value={parseTimeToDate(sch.startTime)}
                        onChange={(date) =>
                          updateScheduleTime(
                            sch.id,
                            "startTime",
                            formatDateToTimeString(date),
                          )
                        }
                        placeholder="--:--"
                        calendarClassName
                        timeOnly
                        className="w-full py-1"
                      />
                    </div>
                    <span className="text-[--gr-1] text-sm">-</span>
                    <div className="relative flex-1">
                      <WaitI className="size-[1rem] absolute right-2 top-8 -translate-y-1/2 text-[--gr-1] text-xs" />
                      <CustomDatePicker
                        value={parseTimeToDate(sch.endTime)}
                        onChange={(date) =>
                          updateScheduleTime(
                            sch.id,
                            "endTime",
                            formatDateToTimeString(date),
                          )
                        }
                        placeholder="--:--"
                        calendarClassName
                        timeOnly
                        className="w-full py-1"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeScheduleRow(sch.id)}
                    className="absolute -top-2 -right-2 bg-[--status-red] text-[--red-1] w-6 h-6 rounded-full flex items-center justify-center hover:bg-[--red-1] hover:text-white transition-colors shadow-sm"
                  >
                    <CancelI className="size-[1rem]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[--border-1] mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-[--black-2] bg-[--white-1] border border-[--border-1] rounded-xl hover:bg-[--light-1] transition-all"
          >
            {t("addMenu.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 text-sm font-medium text-white bg-[--primary-1] rounded-xl shadow-lg hover:bg-[--primary-2] transition-all"
          >
            {t("editMenu.update")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditMenu;
