// MODULES
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import QRCodeStyling from "qr-code-styling";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Download,
  Plus,
  Image as ImageIcon,
  Palette,
  RefreshCcw,
  LayoutGrid,
  QrCode,
  Sliders,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";

// COMP
import CustomInput from "../../common/customInput";
import CustomToggle from "../../common/customToggle";
import PageHelp from "../../common/pageHelp";
import { getRestaurant } from "../../../redux/restaurants/getRestaurantSlice";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Renders a white-disc data URL with the given table number bold-centered
// in black. Used as the QR center "image" when the user hasn't uploaded a
// brand logo but is generating a sequential range — gives every printed QR
// a human-readable label so staff can identify the table at a glance.
// Returns a 480px PNG dataURL (chosen so the embedded image stays sharp
// at the largest supported QR size, 1024×1024).
const makeTableNumberBadge = (text) => {
  const size = 480;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // White disc — fills the QR's "image" cutout cleanly. The qr-code-styling
  // library hides background dots behind the image (hideBackgroundDots),
  // so the disc reads as a clean island in the middle of the pattern.
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Bold, centered black number. Scale shrinks for longer values so 999
  // doesn't overflow the disc.
  const label = String(text);
  const fontScale =
    label.length <= 2 ? 0.6 : label.length === 3 ? 0.46 : 0.36;
  ctx.fillStyle = "#000000";
  ctx.font = `900 ${size * fontScale}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // textBaseline=middle isn't perfectly centered visually due to font
  // metrics; nudge ~3% downward for a more balanced look.
  ctx.fillText(label, size / 2, size / 2 + size * 0.03);

  return canvas.toDataURL("image/png");
};

const QRPage = ({ data: restaurant }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const initialData = {
    tableStart: 1,
    tableEnd: 5,
    tablePrefix: "",
    tableSuffix: "",
    gradientStart: "#000000",
    gradientEnd: "#000000",
    logo: null,
    includeLogo: true,
    size: 1024,
    tenant: restaurant?.tenant || "demo",
    restaurantId: restaurant?.id || null,
  };

  const id = useParams()["*"].split("/")[1];
  const [config, setConfig] = useState(initialData);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fileInputRef = useRef(null);
  const previewInstance = useRef(null);
  const previewBoxRef = useRef(null);
  const [defaultQR, setDefaultQR] = useState(null);

  const getTableId = (tableNumber) =>
    `${config.tablePrefix || ""}${tableNumber}${config.tableSuffix || ""}`;

  const getTableUrl = (tableNumber) => {
    if (tableNumber !== undefined && tableNumber !== null) {
      return `https://${config.tenant}.liwamenu.com?tableNumber=${encodeURIComponent(getTableId(tableNumber))}`;
    }
    return `https://${config.tenant}.liwamenu.com`;
  };

  // Convert any reasonable label (TR, DE, FR, ES, PL, etc.) into a filename-safe
  // ASCII string by transliterating known special letters and stripping
  // combining diacritics. Whitespace and other punctuation collapse to "_".
  const TRANSLIT_MAP = {
    // Turkish
    ı: "i",
    İ: "I",
    ş: "s",
    Ş: "S",
    ğ: "g",
    Ğ: "G",
    ç: "c",
    Ç: "C",
    ü: "u",
    Ü: "U",
    ö: "o",
    Ö: "O",
    // German
    ä: "a",
    Ä: "A",
    ß: "ss",
    // Polish (chars that don't decompose via NFD)
    ł: "l",
    Ł: "L",
    // Scandinavian
    æ: "ae",
    Æ: "AE",
    ø: "o",
    Ø: "O",
    å: "a",
    Å: "A",
  };

  const getFileSafeTableId = (tableId) => {
    const str = String(tableId);
    let out = "";
    for (const ch of str) out += TRANSLIT_MAP[ch] ?? ch;
    // Strip remaining accents (é → e, ñ → n, ć → c, …)
    out = out.normalize("NFD").replace(/\p{M}+/gu, "");
    // Collapse non-ASCII / unsafe filename chars to underscore
    return out.replace(/[^a-zA-Z0-9-_]+/g, "_");
  };

  // Build a QR generator from current config (helper for both preview + batch)
  const buildGenerator = (overrides = {}) =>
    new QRCodeStyling({
      width: 480,
      height: 480,
      type: "svg",
      data: getTableUrl(),
      image: config.includeLogo ? config.logo || "" : "",
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
      ...overrides,
    });

  const initialGenerator = async () => {
    const generator = buildGenerator();
    try {
      const blob = await generator.getRawData("png");
      if (blob) setDefaultQR(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Error generating QR", err);
    }
  };

  function checkLicense() {
    if (!restaurant) return false;
    if (!restaurant?.hasQrLicense) {
      toast.error(t("qrPage.license_missing"), { id: "qr_page" });
      return false;
    }
    if (!restaurant?.licenseIsActive) {
      toast.error(t("qrPage.license_inactive"), { id: "qr_page" });
      return false;
    }
    return true;
  }

  // Initialize default preview + sync tenant
  useEffect(() => {
    if (!checkLicense()) return;
    initialGenerator();
    setConfig((prev) => ({
      ...prev,
      restaurantId: restaurant?.id || null,
      tenant: restaurant?.tenant || "demo",
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant, config.logo]);

  // Live preview that updates with config
  useEffect(() => {
    if (!previewBoxRef.current) return;
    if (!previewInstance.current) {
      previewInstance.current = buildGenerator();
      previewBoxRef.current.innerHTML = "";
      previewInstance.current.append(previewBoxRef.current);
      return;
    }
    previewInstance.current.update({
      data: getTableUrl(),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) =>
        setConfig((prev) => ({ ...prev, logo: event.target?.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = (e) => {
    e?.stopPropagation();
    setConfig((prev) => ({ ...prev, logo: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearGeneratedItems = () => {
    generatedItems.forEach((item) => URL.revokeObjectURL(item.dataUrl));
    setGeneratedItems([]);
  };

  const handleGenerateBatch = async () => {
    if (!checkLicense()) return;
    setIsGenerating(true);
    clearGeneratedItems();

    const startNum = parseInt(config.tableStart, 10);
    const endNum = parseInt(config.tableEnd, 10);
    const startValid = Number.isFinite(startNum) && startNum >= 1;
    const endValid = Number.isFinite(endNum) && endNum >= 1;
    const prefix = (config.tablePrefix || "").trim();
    const suffix = (config.tableSuffix || "").trim();

    // Build the list of QRs to generate. Two modes:
    //   • Range mode — at least one of Başlangıç / Bitiş is filled, so we
    //     emit one QR per number in the range, decorated with prefix+suffix.
    //   • Single mode — both range fields are empty; emit ONE QR that uses
    //     whatever pieces (prefix and/or suffix) the user filled in, never
    //     appending a number. Bail out if there is nothing to identify the
    //     table at all (no prefix, no suffix, no range).
    const plan = [];
    if (!startValid && !endValid) {
      const tableId = `${prefix}${suffix}`;
      if (!tableId) {
        toast.error(t("qrPage.toast_no_input"), { id: "qr_page" });
        setIsGenerating(false);
        return;
      }
      plan.push({ id: tableId, tableId });
    } else {
      const safeStart = startValid ? startNum : 1;
      const safeEnd = endValid ? endNum : safeStart;
      const start = Math.min(safeStart, safeEnd);
      const end = Math.max(safeStart, safeEnd);
      for (let i = start; i <= end; i++) {
        plan.push({ id: i, tableId: getTableId(i) });
      }
    }

    // If the user gave us a brand logo we always honour it. Otherwise, in
    // range mode the QR's center gets a white disc with the table number
    // baked in — useful when printing because it lets staff find the right
    // QR without scanning. In single mode (prefix/suffix only) we don't
    // know "the number", so we leave the center blank.
    const useLogo = config.includeLogo && !!config.logo;

    const newItems = [];
    for (const entry of plan) {
      const url = `https://${config.tenant}.liwamenu.com?tableNumber=${encodeURIComponent(entry.tableId)}`;
      const centerImage = useLogo
        ? config.logo
        : typeof entry.id === "number"
          ? makeTableNumberBadge(entry.id)
          : "";

      const generator = new QRCodeStyling({
        width: config.size,
        height: config.size,
        data: url,
        image: centerImage,
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
            id: entry.id,
            tableId: entry.tableId,
            url,
            dataUrl: URL.createObjectURL(blob),
          });
        }
      } catch (err) {
        console.error(`Error generating QR for ${entry.tableId}:`, err);
      }
    }

    setGeneratedItems(newItems);
    setIsGenerating(false);
    if (plan.length === 1 && !startValid && !endValid) {
      toast.success(
        t("qrPage.toast_generated_single", { id: plan[0].tableId }),
        { id: "qr_page" },
      );
    } else {
      toast.success(
        t("qrPage.toast_generated", {
          start: plan[0].id,
          end: plan[plan.length - 1].id,
        }),
        { id: "qr_page" },
      );
    }
  };

  const downloadQR = (dataUrl, name) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-table-${getFileSafeTableId(name)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate a high-resolution PNG of the default (tenant root) QR and save it.
  const downloadDefaultQR = async () => {
    try {
      const generator = new QRCodeStyling({
        width: config.size,
        height: config.size,
        data: getTableUrl(),
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
      const blob = await generator.getRawData("png");
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `qr-${config.tenant || "default"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Default QR download error", err);
    }
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder("QR_Codes");

    for (const item of generatedItems) {
      try {
        const response = await fetch(item.dataUrl);
        const blob = await response.blob();
        folder.file(`qr-table-${getFileSafeTableId(item.tableId)}.png`, blob);
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

  // Refresh restaurant data once
  useEffect(() => {
    dispatch(getRestaurant({ restaurantId: id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tableCount = (() => {
    const s = parseInt(config.tableStart, 10);
    const e = parseInt(config.tableEnd, 10);
    const sValid = Number.isFinite(s) && s >= 1;
    const eValid = Number.isFinite(e) && e >= 1;
    // Range empty but prefix or suffix filled → single QR.
    if (!sValid && !eValid) {
      const filler =
        (config.tablePrefix || "").trim() ||
        (config.tableSuffix || "").trim();
      return filler ? 1 : 0;
    }
    const safeStart = sValid ? s : 1;
    const safeEnd = eValid ? e : safeStart;
    return Math.abs(safeEnd - safeStart) + 1;
  })();

  return (
    <div className="w-full pb-8 mt-1 text-[--black-1]">
      <div className="bg-[--white-1] rounded-2xl border border-[--border-1] shadow-sm overflow-hidden">
        {/* Gradient strip */}
        <div className="h-0.5" style={{ background: PRIMARY_GRADIENT }} />

        {/* HERO HEADER */}
        <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3">
          <span
            className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
            style={{ background: PRIMARY_GRADIENT }}
          >
            <QrCode className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-semibold text-[--black-1] truncate tracking-tight">
              {t("qrPage.header_title")}
            </h1>
            <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
              {t("qrPage.header_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PageHelp pageKey="qrCode" />
            {generatedItems.length > 0 && (
              <button
                type="button"
                onClick={clearGeneratedItems}
                className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-400/30"
              >
                <RefreshCcw className="size-3.5" />
                {t("qrPage.clear_all")}
              </button>
            )}
            {/* "Tüm QR Kodları İndir" hero header'a taşındı — toplu üretim
                yapıldığında en görünür yerde duruyor; "Toplu Oluştur" da
                aşağıdaki çıktı panelinin başlığına geçti, böylece üretim
                sonrası tekrar üretme aksiyonu çıktının yanında oluyor. */}
            {generatedItems.length > 0 && (
              <button
                type="button"
                onClick={downloadAll}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Download className="size-3.5" />
                <span className="hidden sm:inline">
                  {t("qrPage.download_all")}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] min-h-[640px]">
          {/* LEFT — Settings */}
          <div className="border-b lg:border-b-0 lg:border-r border-[--border-1] flex flex-col">
            {/* Range section */}
            <Section
              icon={Sliders}
              title={t("qrPage.section_technical")}
              subtitle={`${tableCount} ${tableCount === 1 ? "QR" : "QR"}`}
            >
              <div className="grid grid-cols-2 gap-2.5">
                <CustomInput
                  type="text"
                  value={config.tablePrefix}
                  label={t("qrPage.table_prefix")}
                  className="py-[7px] mt-2 text-sm bg-[--white-1]"
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, tablePrefix: v || "" }))
                  }
                />
                <CustomInput
                  type="text"
                  value={config.tableSuffix}
                  label={t("qrPage.table_suffix")}
                  className="py-[7px] mt-2 text-sm bg-[--white-1]"
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, tableSuffix: v || "" }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <CustomInput
                  type="number"
                  value={config.tableStart}
                  label={t("qrPage.table_start")}
                  className="py-[7px] mt-2 text-sm bg-[--white-1]"
                  onChange={(v) =>
                    setConfig((c) => ({
                      ...c,
                      // Keep the raw string so the field can be cleared.
                      // Numeric coercion happens at batch-generate time.
                      tableStart: v,
                    }))
                  }
                />
                <CustomInput
                  type="number"
                  value={config.tableEnd}
                  label={t("qrPage.table_end")}
                  className="py-[7px] mt-2 text-sm bg-[--white-1]"
                  onChange={(v) =>
                    setConfig((c) => ({
                      ...c,
                      tableEnd: v,
                    }))
                  }
                />
              </div>
            </Section>

            {/* Visual section */}
            <Section icon={Palette} title={t("qrPage.section_visual")}>
              <div className="grid grid-cols-2 gap-2.5">
                <ColorField
                  label={t("qrPage.gradient_start")}
                  value={config.gradientStart}
                  onChange={(v) =>
                    setConfig((c) => ({ ...c, gradientStart: v }))
                  }
                />
                <ColorField
                  label={t("qrPage.gradient_end")}
                  value={config.gradientEnd}
                  onChange={(v) => setConfig((c) => ({ ...c, gradientEnd: v }))}
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[--white-2] rounded-lg border border-[--border-1]">
                <CustomToggle
                  label={t("qrPage.display_logo")}
                  className1="text-[--black-2] text-xs font-semibold"
                  checked={config.includeLogo}
                  onChange={() =>
                    setConfig((c) => ({ ...c, includeLogo: !c.includeLogo }))
                  }
                />
              </div>

              {config.includeLogo && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] mb-1.5">
                    {t("qrPage.brand_mark")}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full flex items-center gap-3 p-2.5 rounded-xl border transition text-left ${
                      config.logo
                        ? "border-[--border-1] bg-[--white-1] hover:border-indigo-300"
                        : "border-dashed border-[--border-1] bg-[--white-2] hover:border-indigo-300 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10"
                    }`}
                  >
                    <span className="grid place-items-center size-12 rounded-lg ring-1 ring-[--border-1] bg-[--white-1] overflow-hidden shrink-0">
                      {config.logo ? (
                        <img
                          src={config.logo}
                          alt="logo"
                          className="size-full object-contain p-1"
                        />
                      ) : (
                        <ImageIcon className="size-5 text-[--gr-2]" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[--black-1] truncate">
                        {config.logo
                          ? t("qrPage.upload_logo_line2")
                          : t("qrPage.upload_logo_line1")}
                      </p>
                      <p className="text-[10px] text-[--gr-1] truncate mt-0.5">
                        PNG, JPG, SVG
                      </p>
                    </div>
                    {config.logo && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleClearLogo}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleClearLogo(e)
                        }
                        className="grid place-items-center size-7 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/15 transition shrink-0"
                        aria-label="Remove logo"
                      >
                        <Trash2 className="size-3.5" />
                      </span>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </button>
                </div>
              )}
            </Section>

            {/* Live preview */}
            <Section
              icon={QrCode}
              title={t("qrPage.default_preview")}
              compact
            >
              <div className="grid place-items-center p-3 rounded-xl bg-[--white-2] border border-[--border-1]">
                <div
                  ref={previewBoxRef}
                  className="size-60 grid place-items-center rounded-lg bg-white p-3 shadow-inner [&>svg]:!w-full [&>svg]:!h-full [&>canvas]:!w-full [&>canvas]:!h-full"
                />
              </div>
              <button
                type="button"
                onClick={downloadDefaultQR}
                className="inline-flex items-center justify-center gap-1.5 w-full h-9 rounded-lg text-xs font-semibold text-white shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
                style={{ background: PRIMARY_GRADIENT }}
              >
                <Download className="size-3.5" />
                {t("qrPage.download_default", "PNG İndir")}
              </button>
              {/* Live tenant link — click to open the actual menu the QR
                  resolves to, in a new tab. Mirrors the URL the QR encodes
                  (the bare tenant root, no tableNumber param). */}
              {config.tenant && (
                <a
                  href={`https://${config.tenant}.liwamenu.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-2 transition min-w-0"
                  title={`https://${config.tenant}.liwamenu.com`}
                >
                  <ExternalLink className="size-3 shrink-0" />
                  <span className="truncate">
                    {config.tenant}.liwamenu.com
                  </span>
                </a>
              )}
            </Section>
          </div>

          {/* RIGHT — Output */}
          <div className="flex flex-col">
            {generatedItems.length > 0 ? (
              <>
                {/* Batch header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[--border-1] bg-[--white-2]/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="grid place-items-center size-10 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
                      style={{ background: PRIMARY_GRADIENT }}
                    >
                      <LayoutGrid className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-[--black-1] truncate">
                        {t("qrPage.batch_operational")}
                      </h2>
                      <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
                        {t("qrPage.batch_stats", {
                          count: generatedItems.length,
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateBatch}
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition shrink-0 disabled:opacity-60"
                    style={{ background: PRIMARY_GRADIENT }}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        {t("qrPage.processing")}
                      </>
                    ) : (
                      <>
                        <Plus className="size-4" />
                        {t("qrPage.generate_batch")}
                      </>
                    )}
                  </button>
                </div>

                {/* Grid — 4 columns on xl, responsive down to 1 col on mobile */}
                <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {generatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex flex-col gap-2 p-3 rounded-xl border border-[--border-1] bg-[--white-1] hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="relative aspect-square rounded-lg bg-[--white-2] border border-[--border-1] overflow-hidden grid place-items-center p-3">
                        <img
                          src={item.dataUrl}
                          alt={`Table ${item.id}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 grid place-items-center bg-slate-900/0 group-hover:bg-slate-900/55 backdrop-blur-0 group-hover:backdrop-blur-[1px] transition-all">
                          <button
                            type="button"
                            onClick={() =>
                              downloadQR(item.dataUrl, item.id.toString())
                            }
                            className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-white text-xs font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
                            style={{ background: PRIMARY_GRADIENT }}
                          >
                            <Download className="size-3.5" />
                            PNG
                          </button>
                        </div>
                      </div>
                      <div className="px-1 pb-0.5 text-center">
                        <p className="text-sm font-bold text-[--black-1] truncate">
                          {item.tableId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                t={t}
                onGenerate={handleGenerateBatch}
                isGenerating={isGenerating}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Section = ({ icon: Icon, title, subtitle, compact, children }) => (
  <div
    className={`p-4 ${compact ? "space-y-2" : "space-y-3"} border-b border-[--border-1] last:border-b-0`}
  >
    <div className="flex items-center gap-2">
      {Icon && <Icon className="size-3.5 text-indigo-600 shrink-0" />}
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1] flex-1">
        {title}
      </h3>
      {subtitle && (
        <span className="text-[10px] font-semibold text-[--gr-1]">
          {subtitle}
        </span>
      )}
    </div>
    {children}
  </div>
);

const ColorField = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
      {label}
    </label>
    <div className="flex items-center gap-2 p-1.5 bg-[--white-2] rounded-lg border border-[--border-1]">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-7 rounded border-none p-0 bg-transparent cursor-pointer overflow-hidden"
      />
      <span className="text-[10px] font-mono text-[--gr-1] uppercase truncate">
        {value}
      </span>
    </div>
  </div>
);

const EmptyState = ({ t, onGenerate, isGenerating }) => (
  <div className="flex-1 grid place-items-center text-center p-8">
    <div className="rounded-2xl border border-dashed border-[--border-1] bg-[--white-2]/50 p-8 sm:p-12 max-w-md w-full">
      <span
        className="mx-auto grid place-items-center size-16 rounded-2xl text-white shadow-lg shadow-indigo-500/25 mb-4"
        style={{ background: PRIMARY_GRADIENT }}
      >
        <QrCode className="size-7" strokeWidth={1.8} />
      </span>
      <p className="text-xs text-[--gr-1] mt-1.5 leading-snug">
        {t("qrPage.empty_description")}
      </p>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-5 inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-60"
        style={{ background: PRIMARY_GRADIENT }}
      >
        {isGenerating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t("qrPage.processing_workflow")}
          </>
        ) : (
          <>
            <Plus className="size-4" />
            {t("qrPage.initialize_generation")}
          </>
        )}
      </button>
    </div>
  </div>
);

export default QRPage;
