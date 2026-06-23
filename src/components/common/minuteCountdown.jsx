import { useEffect, useState, useRef } from "react";
import { useAnimate } from "framer-motion";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const SECOND = 1000;
const MINUTE = SECOND * 60;

const MinuteCountdown = ({ minutes, setMinutes }) => {
  const [endTime, setEndTime] = useState();

  useEffect(() => {
    setEndTime(Date.now() + minutes * MINUTE);
  }, [minutes]);

  return (
    <div>
      <div className="mx-auto flex w-full max-w-12">
        <CountdownItem
          unit="Minute"
          endTime={endTime}
          text="min"
          minutes={minutes}
          setMinutes={setMinutes}
        />
        <div className="-mt-1">:</div>
        <CountdownItem
          unit="Second"
          endTime={endTime}
          text="s"
          minutes={minutes}
          setMinutes={setMinutes}
        />
      </div>
    </div>
  );
};

const CountdownItem = ({ unit, endTime, text, minutes, setMinutes }) => {
  const { ref, time } = useTimer(unit, endTime, minutes, setMinutes);

  return (
    <div className="flex w-1/2 flex-col items-center justify-center gap-1 font-mono md:gap-2">
      <div className="relative w-full overflow-hidden text-center rounded-sm">
        <span ref={ref} className="block text-sm font-medium">
          {time}
        </span>
      </div>
      <span className="text-xs font-light text-[--white-1]">{text}</span>
    </div>
  );
};

const useTimer = (unit, endTime, minutes, setMinutes) => {
  const { t } = useTranslation();
  const [ref, animate] = useAnimate();
  const intervalRef = useRef(null);
  const timeRef = useRef(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    intervalRef.current = setInterval(handleCountdown, 1000);
    return () => clearInterval(intervalRef.current || undefined);
  }, [endTime]);

  const handleCountdown = async () => {
    const now = Date.now();
    const distance = endTime - now;

    let newTime = 0;
    if (minutes === 0) return;
    if (distance <= 0) {
      clearInterval(intervalRef.current);
      toast(t("common.time_is_up"), { id: "time-is-up" });
      setTime("00");
      setMinutes(0);
      return;
    }

    if (unit === "Minute") {
      newTime = Math.floor(distance / MINUTE);
    } else {
      newTime = Math.floor((distance % MINUTE) / SECOND);
    }

    if (newTime !== timeRef.current) {
      // Exit animation
      await animate(
        ref.current,
        { y: ["0%", "-50%"], opacity: [1, 0] },
        { duration: 0.35 }
      );

      timeRef.current = newTime;
      setTime(newTime);

      // Enter animation
      await animate(
        ref.current,
        { y: ["50%", "0%"], opacity: [0, 1] },
        { duration: 0.35 }
      );
    }
  };

  return { ref, time };
};

export default MinuteCountdown;
