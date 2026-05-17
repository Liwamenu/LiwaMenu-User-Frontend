import { useEffect } from "react";
import { usePopup } from "../../context/PopupContext";

const Popup = () => {
  const {
    popupContent,
    secondPopupContent,
    className,
    loadingComponent,
    cropImgPopup,
  } = usePopup();

  useEffect(() => {
    // Lock background scroll for every popup slot — including
    // `secondPopupContent`, which hosts Edit Product, the
    // categoryProducts picker etc. Without it, scrolling inside the
    // modal also moved the page underneath.
    if (
      popupContent ||
      secondPopupContent ||
      loadingComponent ||
      cropImgPopup
    ) {
      document.body.style.overflowY = "hidden";
    } else {
      document.body.style.overflowY = "auto";
    }

    return () => {
      document.body.style.overflowY = "auto";
    };
  }, [popupContent, secondPopupContent, loadingComponent, cropImgPopup]);

  return (
    <>
      {/* Loader overlay — backdrop only. We deliberately do NOT wrap the
          loader in the bg-[--btn-txt] full-width card the popups use,
          because that turns it into a tall horizontal strip across the
          screen. The loader component sizes itself; popup-style cards
          are reserved for the actual popup slots below. */}
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 justify-center items-center transition-colors p-[2%] z-[9999999] ${
          loadingComponent ? "flex bg-black/20" : "hidden"
        }`}
      >
        <div
          className={`transition-all ${
            loadingComponent ? "scale-100 opacity-100" : "scale-125 opacity-0"
          }`}
        >
          {loadingComponent}
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 right-0 bottom-0 justify-center items-center transition-colors p-[2%] bg-gray-900/60 backdrop-blur-sm z-[999999] ${
          cropImgPopup ? "flex bg-black/20" : "hidden"
        }`}
      >
        <div
          className={`w-full rounded-xl transition-all  ${
            cropImgPopup ? "scale-100 opacity-100 " : "scale-125 opacity-0"
          }`}
        >
          {cropImgPopup}
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 right-0 bottom-0 justify-center items-center transition-colors p-[2%] z-[99999] ${
          secondPopupContent ? "flex bg-black/20" : "hidden"
        } ${className || "bg-gray-900/60 backdrop-blur-sm"}`}
      >
        <div
          className={`bg-[--btn-txt] w-full rounded-xl transition-all ${
            secondPopupContent ? "scale-100 opacity-100" : "scale-125 opacity-0"
          }`}
        >
          {secondPopupContent}
        </div>
      </div>

      <div
        className={`fixed top-0 left-0 right-0 bottom-0 justify-center items-center transition-colors p-[2%] z-[9999] ${
          popupContent ? "flex bg-black/20" : "hidden"
        } ${className || "bg-gray-900/60 backdrop-blur-sm"}`}
      >
        <div
          className={`bg-[--btn-txt] w-full rounded-xl transition-all ${
            popupContent ? "scale-100 opacity-100" : "scale-125 opacity-0"
          }`}
        >
          {popupContent}
        </div>
      </div>
    </>
  );
};

export default Popup;
