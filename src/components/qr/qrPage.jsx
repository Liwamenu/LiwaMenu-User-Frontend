//MODULES
import toast from "react-hot-toast";
import QRCodeStyling from "qr-code-styling";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import {
  Download,
  Plus,
  Image as ImageIcon,
  Palette,
  RefreshCcw,
  LayoutGrid,
} from "lucide-react";

//COMP
import Badge from "./components/badge";
import Button from "./components/button";
import CustomInput from "../common/customInput";
import CustomToggle from "../common/customToggle";
import { EyeI, ParamsI, QRI } from "../../assets/icon";

const QRPage = ({ data: restaurant }) => {
  const { t } = useTranslation();
  const initalData = {
    tableStart: 1,
    tableEnd: 5,
    gradientStart: "#9705E6",
    gradientEnd: "#18A0CD",
    logo: null,
    includeLogo: true,
    size: 1024,
    tenant: restaurant?.tenant || "demo",
    restaurantId: restaurant?.id || null,
  };

  const [config, setConfig] = useState(initalData);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const previewInstance = useRef(null);
  const [defaultQR, setDefaultQR] = useState(null);

  const initalGenerator = async () => {
    const generator = new QRCodeStyling({
      width: 300,
      height: 300,
      type: "svg",
      data: `https://${config.tenant}.liwamenu.com?restaurantId=${config.restaurantId}&tableNumber=1`,
      image: config.logo || "",
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 5,
        hideBackgroundDots: true,
      },
      dotsOptions: {
        type: "extra-rounded",
        gradient: {
          type: "linear",
          rotation: 0,
          colorStops: [
            { offset: 0, color: config.gradientStart },
            { offset: 1, color: config.gradientEnd },
          ],
        },
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: config.gradientStart,
      },
      cornersDotOptions: { type: "dot", color: config.gradientStart },
      backgroundOptions: { color: "#ffffff" },
    });

    try {
      const blob = await generator.getRawData("png");
      if (blob) {
        setDefaultQR(URL.createObjectURL(blob));
      }
    } catch (err) {
      console.error(`Error generating QR`, err);
    }
  };

  function checkLicense() {
    if (!restaurant) return false;
    if (!restaurant?.hasLicense) {
      toast.error(t("qrPage.license_missing"), { id: "qr_page" });
      return false; //testing
    }
    if (!restaurant?.licenseIsActive) {
      toast.error(t("qrPage.license_inactive"), { id: "qr_page" });
      return false; //testing
    }
    return true;
  }

  // Initialize and clean up preview QR
  useEffect(() => {
    if (!checkLicense()) return;
    initalGenerator();
    setConfig((prev) => {
      return {
        ...prev,
        restaurantId: restaurant?.id || null,
        tenant: restaurant?.tenant || "demo",
      };
    });
  }, [restaurant, config.logo]);

  // Sync preview with configuration changes
  useEffect(() => {
    if (previewInstance.current) {
      previewInstance.current.update({
        data: `https://${config.tenant}.liwamenu.com?restaurantId=${config.restaurantId}&tableNumber=1`,
        image: config.includeLogo ? config.logo || "" : "",
        dotsOptions: {
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: config.gradientStart },
              { offset: 1, color: config.gradientEnd },
            ],
          },
        },
        cornersSquareOptions: { color: config.gradientStart },
        cornersDotOptions: { color: config.gradientStart },
      });
    }
  }, [config]);

  // Handle logo file input
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setConfig((prev) => ({ ...prev, logo: event.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Cleanup Object URLs to prevent memory leaks
  const clearGeneratedItems = () => {
    generatedItems.forEach((item) => URL.revokeObjectURL(item.dataUrl));
    setGeneratedItems([]);
  };

  // Batch generation logic
  const handleGenerateBatch = async () => {
    if (!checkLicense()) return;
    setIsGenerating(true);
    clearGeneratedItems();

    const newItems = [];
    const start = Math.min(config.tableStart, config.tableEnd);
    const end = Math.max(config.tableStart, config.tableEnd);

    for (let i = start; i <= end; i++) {
      // Scanned URL includes restaurantId and tableNumber as query parameters
      const url = `https://${config.tenant}.liwamenu.com?restaurantId=${config.restaurantId}&tableNumber=${i}`;

      const generator = new QRCodeStyling({
        width: config.size,
        height: config.size,
        data: url,
        image: config.includeLogo ? config.logo || "" : "",
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          hideBackgroundDots: true,
        },
        dotsOptions: {
          type: "extra-rounded",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: config.gradientStart },
              { offset: 1, color: config.gradientEnd },
            ],
          },
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: config.gradientStart,
        },
        cornersDotOptions: { type: "dot", color: config.gradientStart },
        backgroundOptions: { color: "#ffffff" },
      });

      try {
        const blob = await generator.getRawData("png");
        if (blob) {
          newItems.push({
            id: i,
            url,
            dataUrl: URL.createObjectURL(blob),
          });
        }
      } catch (err) {
        console.error(`Error generating QR for table ${i}:`, err);
      }
    }

    setGeneratedItems(newItems);
    setIsGenerating(false);
    toast.success(t("qrPage.toast_generated", { start, end }), {
      id: "qr_page",
    });
  };

  const downloadQR = (dataUrl, name) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-table-${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder("QR_Codes");

    for (const item of generatedItems) {
      try {
        const response = await fetch(item.dataUrl);
        const blob = await response.blob();
        folder.file(`qr-table-${item.id}.png`, blob);
      } catch (error) {
        console.error(`Failed to add QR ${item.id} to zip:`, error);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "qr-codes.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-[--white-2] py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[--primary-1] rounded-2xl text-white shadow-xl shadow-[--white-1] transform -rotate-3">
              <QRI className="size-[2rem]" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[--black-2] tracking-tight">
                {t("qrPage.header_title")}
              </h1>
              <p className="text-[--gr-1] text-sm font-medium">
                {t("qrPage.header_subtitle")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={clearGeneratedItems}
              className="border-[--border-1]"
            >
              <RefreshCcw size={16} className="mr-2" />
              {t("qrPage.clear_all")}
            </Button>
            <Button
              variant="primary"
              onClick={handleGenerateBatch}
              disabled={isGenerating}
              className="shadow-lg shadow-[--white-1]"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[--border-1] border-t-[--white-1] rounded-full animate-spin mr-2" />
                  {t("qrPage.processing")}
                </>
              ) : (
                <>
                  <Plus size={18} className="mr-2" />
                  {t("qrPage.generate_batch")}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-4 space-y-6">
            <main className="bg-[--white-1] rounded-xl border border-[--border-1] shadow-sm overflow-hidden">
              <div className="p-6 space-y-8 border-none shadow-xl">
                <div className="flex items-center gap-2 border-b border-[--white-2]">
                  <ParamsI size={18} className="text-[--primary-1]" />
                  <h3 className="font-bold text-[--black-2] tracking-tight uppercase text-xs">
                    {t("qrPage.section_technical")}
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* Tenant */}
                  {/* <div>
                    <div className="flex items-center relative">
                      <div className="absolute left-3 top-[70%] -translate-y-1/2 pointer-events-none z-[999] text-[--gr-1]">
                        <ArrowRight size={16} />
                      </div>

                      <CustomInput
                        value={config?.tenant || "demo"}
                        label="Liwamenu Tenant"
                        className="py-[7px] pl-10 mt-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-[--white-1]"
                        onChange={(v) => setConfig({ ...config, tenant: v })}
                      />
                    </div>
                    <label className="text-xs text-[--gr-1]">
                      .liwamenu.com (Custom domain prefix)
                    </label>
                  </div> */}

                  {/* Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <CustomInput
                      type="number"
                      value={config?.tableStart}
                      label={t("qrPage.table_start")}
                      className="py-[7px] mt-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-[--white-1]"
                      onChange={(v) =>
                        setConfig({ ...config, tableStart: parseInt(v) || 1 })
                      }
                    />

                    <CustomInput
                      type="number"
                      value={config?.tableEnd}
                      label={t("qrPage.table_end")}
                      className="py-[7px] mt-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-[--white-1]"
                      onChange={(v) =>
                        setConfig({ ...config, tableEnd: parseInt(v) || 1 })
                      }
                    />
                  </div>
                </div>
              </div>
            </main>

            <main className="p-6 space-y-4 border-none bg-[--white-1] rounded-xl border border-[--border-1] shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[--white-2]">
                <Palette size={18} className="text-[--primary-1]" />
                <h3 className="font-bold text-[--black-2] tracking-tight uppercase text-xs">
                  {t("qrPage.section_visual")}
                </h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[--gr-2] uppercase tracking-widest">
                      {t("qrPage.gradient_start")}
                    </label>
                    <div className="flex items-center gap-3 bg-[--white-2] p-2 rounded-xl border border-[--border-1]">
                      <input
                        type="color"
                        value={config?.gradientStart}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            gradientStart: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer shadow-sm overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-[--gr-1]">
                        {config.gradientStart}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[--gr-2] uppercase tracking-widest">
                      {t("qrPage.gradient_end")}
                    </label>
                    <div className="flex items-center gap-3 bg-[--white-2] p-2 rounded-xl border border-[--border-1]">
                      <input
                        type="color"
                        value={config?.gradientEnd}
                        onChange={(e) =>
                          setConfig({ ...config, gradientEnd: e.target.value })
                        }
                        className="w-8 h-8 rounded-lg border-none p-0 bg-transparent cursor-pointer shadow-sm overflow-hidden"
                      />
                      <span className="text-[10px] font-mono text-[--gr-1]">
                        {config.gradientEnd}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[--white-2] rounded-xl border border-[--border-1]">
                  <CustomToggle
                    label={t("qrPage.display_logo")}
                    className1="text-[--gr-1] text-sm"
                    checked={config.includeLogo}
                    onChange={(val) =>
                      setConfig({ ...config, includeLogo: !config.includeLogo })
                    }
                  />
                </div>

                {config.includeLogo && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t("qrPage.brand_mark")}
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[--border-1] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                    >
                      {config.logo ? (
                        <div className="relative group">
                          <img
                            src={config.logo}
                            alt="Logo preview"
                            className="w-24 h-24 object-contain rounded-xl border border-[--border-1] bg-white p-2 shadow-sm"
                          />
                          <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                            <RefreshCcw
                              size={20}
                              className="text-white animate-spin-slow"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-slate-100 rounded-full text-slate-400 group-hover:text-[--primary-1] transition-colors">
                            <ImageIcon size={24} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-400 text-center">
                            {t("qrPage.upload_logo_line1")}
                            <br />
                            {t("qrPage.upload_logo_line2")}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                )}
              </div>
            </main>

            <main className="p-6 bg-[--white-1] border-none rounded-xl border border-[--border-1] shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[--gr-4] rounded-xl text-[--primary-1]">
                  <EyeI className="size-[1.3rem]" />
                </div>
                <h4 className="font-bold text-[--gr-2] text-sm">
                  {t("qrPage.default_preview")}
                </h4>
              </div>
              <div className="flex justify-center items-center bg-[--gr-4] p-6 rounded-2xl border-2 border-[--border-1] shadow-inner">
                <div className="max-w-full shadow-2xl p-4 bg-[--white-1] border-2 border-[--white-1] rounded-[2.5rem]">
                  <img
                    src={defaultQR}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <Badge variant="info">{t("qrPage.badge_extra_rounded")}</Badge>
                <Badge variant="success">{t("qrPage.badge_svg")}</Badge>
                <Badge variant="warning">{t("qrPage.badge_linear")}</Badge>
              </div>
            </main>
          </div>

          {/* Display Grid */}
          <div className="lg:col-span-8">
            {generatedItems.length > 0 ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <main className="p-8 bg-[--white-1] text-[--black-1] flex flex-col md:flex-row items-center justify-between gap-8 border-none shadow-2xl shadow-[--white-1] relative overflow-hidden rounded-xl border border-[--border-1]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-2xl border border-white/20 shadow-inner">
                      <LayoutGrid size={32} />
                    </div>
                    <div>
                      <h4 className="font-black text-2xl tracking-tighter uppercase italic">
                        {t("qrPage.batch_operational")}
                      </h4>
                      <p className="text-white text-sm font-medium opacity-80">
                        {t("qrPage.batch_stats", {
                          count: generatedItems.length,
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="shadow-2xl font-black tracking-tight"
                    onClick={downloadAll}
                  >
                    <Download size={22} className="mr-3" />
                    {t("qrPage.download_all")}
                  </Button>
                </main>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {generatedItems.map((item) => (
                    <main
                      key={item.id}
                      className="p-5 group hover:[--primary-1] transition-all transform hover:-translate-y-2 shadow-sm hover:shadow-2xl border-[--border-1] bg-[--white-1] rounded-xl border overflow-hidden"
                    >
                      <div className="relative mb-6 aspect-square bg-[--white-2] rounded-3xl overflow-hidden flex items-center justify-center p-3 border border-[--border-1] shadow-inner group-hover:bg-[--white-1] transition-colors">
                        <img
                          src={item.dataUrl}
                          alt={`Table ${item.id}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-indigo-950/0 group-hover:bg-indigo-950/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[4px] rounded-3xl">
                          <Button
                            size="md"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadQR(item.dataUrl, item.id.toString());
                            }}
                            className="rounded-2xl scale-75 group-hover:scale-100 transition-transform duration-300 text-xs"
                          >
                            <Download size={20} className="mr-2" />
                            Save PNG
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {t("qrPage.location_label")}
                          </span>
                          <span className="text-base font-black tracking-tight text-[--primary-1]">
                            {t("qrPage.table_label", { id: item.id })}
                          </span>
                        </div>
                      </div>
                    </main>
                  ))}
                </div>
              </div>
            ) : (
              <main className="h-full min-h-[700px] flex flex-col items-center justify-center text-center p-16 border-dashed border-2 relative bg-[--white-1] rounded-xl border-[--gr-3] shadow-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[--black-2] rounded-full blur-[120px] opacity-40 -mr-[250px] -mt-[250px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[--black-2] rounded-full blur-[120px] opacity-40 -ml-[250px] -mb-[250px]"></div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-40 h-40 bg-[--gr-3] rounded-[50px] shadow-2xl shadow-[--white-1] flex items-center justify-center text-[--primary-1] mb-10 border border-[--border-1] transform -rotate-12 transition-transform hover:rotate-0 duration-500">
                    <QRI className="size-[7rem]" strokeWidth={0.5} />
                  </div>
                  <h3 className="text-3xl font-black text-[--black-2] mb-4 tracking-tighter uppercase italic">
                    {t("qrPage.batch_offline")}
                  </h3>
                  <p className="text-[--gr-1] max-w-md mb-12 leading-relaxed text-sm font-medium">
                    {t("qrPage.empty_description")}
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-14 h-16 text-xl font-black shadow-2xl shadow-indigo-300 rounded-3xl"
                    onClick={handleGenerateBatch}
                    disabled={isGenerating}
                  >
                    {isGenerating
                      ? t("qrPage.processing_workflow")
                      : t("qrPage.initialize_generation")}
                  </Button>
                </div>
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRPage;
