//MODULES
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

//REDUX
import { resetAddByOnlinePay } from "../../../redux/licenses/addLicense/addByOnlinePaySlice";

const FifthStepOnlinePayment = ({ setStep, setPaymentStatus }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const currentPath = location.pathname;

  const iframeRef = useRef(null);
  const settledRef = useRef(false);
  const [htmlResponse, setHtmlResponse] = useState(null);
  const { data } = useSelector((state) => state.licenses.addByPay);

  // The iframe loads PayTR's 3DS page (cross-origin), then PayTR redirects
  // back to a merchant-return URL on our origin. PayTR does NOT call
  // window.postMessage, so the only reliable cue is the iframe flipping
  // from cross-origin back to same-origin. Reading contentWindow.location
  // throws while on paytr.com and succeeds when we're back home.
  const finish = (status) => {
    if (settledRef.current) return;
    settledRef.current = true;
    setStep(6);
    setPaymentStatus(status);
    if (status === "success") {
      toast.success("Ödeme başarılı 😃", { id: "payment_success" });
    } else {
      toast.error("Ödeme başarısız 😞", { id: "payment_failed" });
    }
  };

  // Returns true once we've detected a settled state (so the caller can
  // stop polling). Throws while the iframe is on PayTR — handled by the
  // try/catch.
  const tryDetectFromIframe = () => {
    if (settledRef.current) return true;
    try {
      const win = iframeRef.current?.contentWindow;
      if (!win) return false;
      const href = win.location.href;
      // Initial srcDoc render — not a real navigation.
      if (!href || href === "about:srcdoc" || href === "about:blank") {
        return false;
      }

      // We can read the URL → iframe is back on our origin, payment flow
      // is done. Distinguish success vs failure from URL hints; default to
      // success since the backend webhook is the authoritative ledger.
      const url = new URL(href);
      const p = url.pathname.toLowerCase();
      const status = (
        url.searchParams.get("status") ||
        url.searchParams.get("result") ||
        ""
      ).toLowerCase();
      const failed =
        status === "failed" ||
        status === "failure" ||
        status === "fail" ||
        p.includes("payment-failed") ||
        p.includes("payment-fail");
      finish(failed ? "failure" : "success");
      return true;
    } catch {
      return false; // cross-origin (PayTR domain) — keep waiting.
    }
  };

  useEffect(() => {
    if (data) {
      setHtmlResponse(data);
      dispatch(resetAddByOnlinePay());
    }

    // Primary signal: the backend's PayTR return endpoints
    // (/api/PayTR/PaymentSuccessReturn|PaymentFailReturn) post
    // { status, source: 'paytr' } to window.top. Filter on `source` to
    // ignore any unrelated postMessage traffic on the page.
    const handleMessage = (event) => {
      if (event.data?.source !== "paytr") return;
      const s = event.data?.status;
      if (s === "success") finish("success");
      else if (s === "fail" || s === "failed" || s === "failure") {
        finish("failure");
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [data, dispatch]);

  // Polling fallback — onLoad alone isn't always enough: some redirect
  // chains don't surface a load event, or fire it before the URL settles.
  // ~2/sec is cheap and the interval is cleared on settle or unmount.
  useEffect(() => {
    if (!htmlResponse) return;
    const id = setInterval(() => {
      if (tryDetectFromIframe()) clearInterval(id);
    }, 500);
    return () => clearInterval(id);
  }, [htmlResponse]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-[--border-1]">
        <div className="grid place-items-center size-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
          <ShieldCheck className="size-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-[--black-1] leading-tight">
            {t("payment.secure_3d_title")}
          </h2>
          <p className="mt-0.5 text-xs text-[--gr-1] leading-snug">
            {t("payment.secure_3d_subtitle")}
          </p>
        </div>
      </div>

      {/* Iframe area */}
      <div className="relative bg-[--white-2]/40 min-h-[28rem]">
        {htmlResponse ? (
          <iframe
            ref={iframeRef}
            onLoad={tryDetectFromIframe}
            title="3D Secure Frame"
            width="100%"
            height="500"
            srcDoc={htmlResponse}
            sandbox="allow-scripts allow-forms allow-same-origin"
            className="bg-[--white-1] block"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <div className="flex flex-col items-center gap-3 text-[--gr-1]">
              <Loader2 className="size-8 animate-spin text-[--primary-1]" />
              <p className="text-xs">{t("payment.loading_3d")}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[--border-1] bg-[--white-2]/40 px-4 sm:px-5 py-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => navigate(currentPath.replace("/add-license", ""))}
          className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-rose-200 bg-[--white-1] text-rose-600 text-sm font-medium hover:bg-rose-50 transition"
        >
          <ArrowLeft className="size-4" />
          {t("payment.cancel_payment")}
        </button>
      </div>
    </div>
  );
};

export default FifthStepOnlinePayment;
