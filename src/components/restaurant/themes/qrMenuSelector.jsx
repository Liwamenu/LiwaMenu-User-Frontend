import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { setRestaurantTheme } from "../../../redux/restaurant/setRestaurantThemeSlice";

const THEMES = [
  {
    id: 0,
    name: "Tema 1",
    url: "https://demo1.liwamenu.com/",
    color: "hsl(24 95% 53%)",
  },
  {
    id: 1,
    name: "Tema 2",
    url: "https://demo2.liwamenu.com",
    color: "hsl(270 65% 65%)",
  },
  {
    id: 2,
    name: "Tema 3",
    url: "https://demo3.liwamenu.com",
    color: "hsl(142 58% 26%)",
  },
  {
    id: 3,
    name: "Tema 4",
    url: "https://demo4.liwamenu.com",
    color: "hsl(48 100% 50%)",
  },
  {
    id: 4,
    name: "Tema 5",
    url: "https://demo5.liwamenu.com",
    color: "hsl(120 100% 25%)",
  },
];

const ThemeSelector = ({ data }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const resraurantId = params.id;

  const { success } = useSelector((s) => s.restaurant.setRestaurantTheme);

  const [device, setDevice] = useState("iphone");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState(
    data?.themeId || THEMES[0].id,
  );

  const selectedTheme =
    THEMES.find((t) => t.id === selectedThemeId) || data?.themeId || THEMES[0];

  const handleSaveThemeId = () => {
    console.log(
      `Saving theme ${selectedThemeId} for restaurant ${resraurantId}`,
    );
    dispatch(
      setRestaurantTheme({
        themeId: selectedThemeId,
        restaurantId: resraurantId,
      }),
    );
  };

  // Reset loading state when theme or device changes
  useEffect(() => {
    setIsLoading(true);
  }, [selectedThemeId, device]);

  //SET initial theme from restaurant data
  useEffect(() => {
    if (data?.themeId) {
      setSelectedThemeId(data.themeId);
    }
  }, [data]);

  //TOAST
  useEffect(() => {
    if (success) {
      toast.success(t("qrThemeSelector.success_updated"), {
        id: "set-theme-success",
      });
    }
  }, [success, t]);

  return (
    <div className="w-full mt-1 bg-[--white-1] rounded-lg text-[--black-1] overflow-hidden shadow-lg border border-[--border-1] relative">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-indigo-800 text-white py-5 px-6 sm:px-14">
          <h1 className="text-xl font-bold mb-4 sm:mb-0">
            {t("qrThemeSelector.title", { name: data?.name })}
          </h1>
        </div>
        <div className="flex flex-col lg:flex-row min-h-[700px] bg-[--white-1]">
          {/* Left Side: Theme Selection (Compact) */}
          <div className="w-full lg:w-80 border-r border-[--border-1] px-6 flex flex-col gap-6 bg-[--white-2]">
            <div className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                  {t("qrThemeSelector.select_theme")}
                </h2>
                <button
                  onClick={handleSaveThemeId}
                  className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {t("qrThemeSelector.save")}
                </button>
              </div>
              <div className="space-y-2">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`w-full group relative flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      selectedThemeId === theme.id
                        ? "bg-[--white-1] border-[--gr-4] shadow-sm"
                        : "border-transparent hover:bg-[--white-1]"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-none flex items-center justify-center text-white font-bold text-xs 
                  shadow-sm"
                      style={{ backgroundColor: theme.color }}
                    >
                      {theme.name.charAt(0)}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <h3
                        className={`text-sm font-semibold truncate 
                      ${selectedThemeId === theme.id ? "text-indigo-600" : "text-gray-700"}`}
                      >
                        {theme.name}
                      </h3>
                    </div>
                    {selectedThemeId === theme.id ? (
                      <Check className="w-4 h-4 text-indigo-600 flex-none" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6 border-t border-gray-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                {t("qrThemeSelector.device_preview")}
              </h2>
              <div className="flex gap-2">
                {["iphone", "android", "tablet" /* , "monitor" */].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDevice(d)}
                    className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                      device === d
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                        : "bg-[--white-1] border-[--border-1] text-[--gr-1] hover:border-[--white-2]"
                    }`}
                  >
                    {d === "iphone" && <Smartphone className="w-4 h-4" />}
                    {d === "android" && (
                      <Smartphone className="w-4 h-4 rotate-12" />
                    )}
                    {d === "tablet" && <Tablet className="w-4 h-4" />}
                    {/* {d === "monitor" && <Monitor className="w-4 h-4" />} */}
                    <span className="text-[10px] font-bold uppercase">
                      {t(`qrThemeSelector.${d}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-[--white-1] rounded-2xl border border-[--gr-4]">
              <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">
                  {t("qrThemeSelector.live_url")}
                </span>
              </div>
              <p className="text-[10px] text-indigo-600 font-mono break-all mb-3 opacity-80">
                {selectedTheme.url}
              </p>
              <a
                href={selectedTheme.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-[--white-1] rounded-lg text-xs font-bold text-indigo-600 border border-[--gr-4] hover:bg-[--white-2] transition-colors shadow-sm"
              >
                {t("qrThemeSelector.open_new_tab")}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Right Side: Device Mockup (Immersive) */}
          <div className="flex-1 bg-[--gr-4] px-8 flex items-center justify-center overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col items-center w-full max-w-4xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${device}-${selectedThemeId}`}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.05, y: -20 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="relative"
                >
                  {/* Device Frames */}
                  {device === "iphone" && (
                    <div className="relative w-[340px] h-[702px] bg-black rounded-[3.5rem] border-[10px] border-gray-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-3xl z-30" />
                      <div className="absolute top-2 right-8 w-2 h-2 bg-gray-800 rounded-full z-30" />
                      <div className="absolute inset-0 rounded-[2.8rem] overflow-hidden bg-white">
                        <iframe
                          src={selectedTheme.url}
                          className="w-full h-full border-none"
                          onLoad={() => setIsLoading(false)}
                        />
                      </div>
                    </div>
                  )}

                  {device === "android" && (
                    <div className="relative w-[340px] h-[702px] bg-gray-900 rounded-[2rem] border-[8px] border-gray-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
                      <div
                        className="absolute top-4 left-1/2 -translate-x-1/2 w-3 h-3 bg-black rounded-full z-30 ring-1
                   ring-white/20"
                      />
                      <div className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-white">
                        <iframe
                          src={selectedTheme.url}
                          className="w-full h-full border-none"
                          onLoad={() => setIsLoading(false)}
                        />
                      </div>
                    </div>
                  )}

                  {device === "tablet" && (
                    <div className="relative w-[650px] h-[487px] bg-gray-900 rounded-[2.5rem] border-[12px] border-gray-800 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]">
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1 h-8 bg-gray-700 rounded-r-sm" />
                      <div className="absolute inset-0 rounded-[1.8rem] overflow-hidden bg-white">
                        <iframe
                          src={selectedTheme.url}
                          className="w-full h-full border-none"
                          onLoad={() => setIsLoading(false)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Loading Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-20 rounded-3xl">
                      <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                        <p className="text-xs font-bold text-indigo-900/40 uppercase tracking-widest">
                          {t("qrThemeSelector.loading_theme")}
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>{" "}
      </div>
    </div>
  );
};

export default ThemeSelector;
