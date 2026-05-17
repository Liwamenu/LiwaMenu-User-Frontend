import "./bootstrap/handoffAuth.js";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { createRoot } from "react-dom/client";
import toastOptions from "./config/toast.js";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store.js";
import { PopupProvider } from "./context/PopupContext.jsx";
import { FirebaseProvider } from "./context/firebase.jsx";
import { OrdersProvider } from "./context/ordersContext.jsx";
import { WaiterCallsProvider } from "./context/waiterCallsContext.jsx";
import { ReservationsProvider } from "./context/reservationsContext.jsx";
import "./config/i18n";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <FirebaseProvider>
        <OrdersProvider>
          <WaiterCallsProvider>
            <ReservationsProvider>
              <PopupProvider>
                <App />
                <Toaster
                  toastOptions={toastOptions}
                  // Push the toast container above every popup slot
                  // in components/common/popup.jsx (z-[99999] for the
                  // second-popup slot, z-[9999999] for the loading
                  // overlay) so success/error feedback fired from
                  // inside an open modal — e.g. the AI buttons in
                  // Edit Product — isn't trapped behind the dialog.
                  containerStyle={{ zIndex: 10000000 }}
                />
              </PopupProvider>
            </ReservationsProvider>
          </WaiterCallsProvider>
        </OrdersProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </Provider>,
);

// INJECT GOOGLE MAPS
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&v=weekly&libraries=marker,places&language=tr`;
    document.head.appendChild(script);
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
  });
}

window.initMap = function () {
  // console.log("Map initialized");
};

loadGoogleMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
// .then(() => console.log("Google Maps script loaded"))
// .catch((error) => console.error("Error loading Google Maps script:", error));
