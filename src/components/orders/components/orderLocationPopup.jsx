// Popup that pins the customer's order location and the restaurant on a
// Google Map. Opened from the order detail drawer ONLY when both pairs of
// coordinates pass validation — the drawer hides its trigger row when
// either side is missing, so this component can trust its props.
//
// Google Maps script is injected once at app boot via main.jsx, so by the
// time a user opens an order drawer it's already on window. We still
// guard against the race (script not yet loaded) and show a loader.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bike, MapPin, Navigation, Store, X } from "lucide-react";

import { usePopup } from "../../../context/PopupContext";

const PRIMARY_GRADIENT =
  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #06b6d4 100%)";

// Straight-line distance in km using the Haversine formula. Good enough
// for "how far is the customer" — not driving distance, but the order
// drawer doesn't need to be a routing tool.
const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // earth radius, km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const OrderLocationPopup = ({ customer, restaurant }) => {
  const { t } = useTranslation();
  const { setPopupContent } = usePopup();
  const mapDivRef = useRef(null);
  const [ready, setReady] = useState(
    typeof window !== "undefined" && !!window.google?.maps,
  );

  // Wait for the Google Maps script to finish loading if we got here before
  // main.jsx's injected <script> resolved. Polls instead of subscribing to
  // a callback because main.jsx doesn't expose one.
  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (window.google?.maps) {
        setReady(true);
      } else {
        setTimeout(tick, 100);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // Draw the map + both markers once the script is up and the container
  // ref is mounted. Auto-fits the viewport to include both points with a
  // little padding so they aren't pinned to the edges.
  useEffect(() => {
    if (!ready || !mapDivRef.current) return;
    const g = window.google.maps;
    const map = new g.Map(mapDivRef.current, {
      mapId: "VITE_LIWAMENU_MAP_ID",
      center: { lat: restaurant.lat, lng: restaurant.lng },
      zoom: 13,
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
    });

    // Use AdvancedMarkerElement when available (newer Maps), else fall
    // back to the legacy Marker. The newer API is what `loadGoogleMaps`
    // in main.jsx requests (libraries=marker), so the modern path is
    // the expected one.
    const makeMarker = (pos, title, color) => {
      if (g.marker?.AdvancedMarkerElement) {
        const dot = document.createElement("div");
        dot.style.cssText = `
          width: 16px; height: 16px; border-radius: 50%;
          background: ${color};
          border: 3px solid #ffffff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.35);
        `;
        return new g.marker.AdvancedMarkerElement({
          map,
          position: pos,
          title,
          content: dot,
        });
      }
      return new g.Marker({ map, position: pos, title });
    };

    makeMarker(
      { lat: restaurant.lat, lng: restaurant.lng },
      restaurant.name || t("orders.location_restaurant"),
      "#4f46e5",
    );
    makeMarker(
      { lat: customer.lat, lng: customer.lng },
      t("orders.location_customer"),
      "#ef4444",
    );

    // Straight line between the two points so the relationship is
    // visually obvious at a glance.
    new g.Polyline({
      map,
      path: [
        { lat: restaurant.lat, lng: restaurant.lng },
        { lat: customer.lat, lng: customer.lng },
      ],
      strokeColor: "#4f46e5",
      strokeOpacity: 0.6,
      strokeWeight: 3,
      geodesic: true,
    });

    const bounds = new g.LatLngBounds();
    bounds.extend({ lat: restaurant.lat, lng: restaurant.lng });
    bounds.extend({ lat: customer.lat, lng: customer.lng });
    map.fitBounds(bounds, 60);
  }, [ready, customer.lat, customer.lng, restaurant.lat, restaurant.lng, restaurant.name, t]);

  const distance = haversineKm(
    { lat: restaurant.lat, lng: restaurant.lng },
    { lat: customer.lat, lng: customer.lng },
  );

  const openInGoogleMaps = () => {
    // Open the route in a new tab — uses Google's "directions from A to B"
    // URL so the user can hand the link to a courier or get turn-by-turn
    // navigation on their phone.
    const url = `https://www.google.com/maps/dir/?api=1&origin=${restaurant.lat},${restaurant.lng}&destination=${customer.lat},${customer.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="bg-[--white-1] text-[--black-1] rounded-2xl w-full max-w-3xl mx-auto shadow-2xl ring-1 ring-[--border-1] overflow-hidden flex flex-col"
      // Explicit height so the inner `flex-1` map area has space to
      // grow into. Without this the popup container sizes to content,
      // flex-1 evaluates to 0, and the map collapses to a sliver.
      style={{ height: "min(92dvh, 40rem)" }}
    >
      <div className="h-0.5 shrink-0" style={{ background: PRIMARY_GRADIENT }} />

      <header className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex items-center gap-3 shrink-0">
        <span
          className="grid place-items-center size-9 rounded-xl text-white shadow-md shadow-indigo-500/25 shrink-0"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
            {t("orders.location_title")}
          </h2>
          <p className="text-[11px] text-[--gr-1] truncate mt-0.5">
            {t("orders.location_subtitle", {
              distance: distance.toFixed(1),
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          aria-label={t("orders.close")}
          className="grid place-items-center size-8 rounded-md text-[--gr-1] hover:text-[--black-1] hover:bg-[--white-2] transition shrink-0"
        >
          <X className="size-4" />
        </button>
      </header>

      <div className="px-4 sm:px-5 py-3 border-b border-[--border-1] flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 shrink-0 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center size-7 rounded-lg bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/30 shrink-0">
            <Store className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
              {t("orders.location_restaurant")}
            </p>
            <p className="text-[--black-1] font-medium truncate">
              {restaurant.name || `${restaurant.lat}, ${restaurant.lng}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="grid place-items-center size-7 rounded-lg bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/30 shrink-0">
            <Bike className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[--gr-1]">
              {t("orders.location_customer")}
            </p>
            <p className="text-[--black-1] font-medium truncate tabular-nums">
              {customer.lat.toFixed(5)}, {customer.lng.toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* `min-h-[24rem]` on this relative wrapper guarantees the map
          stays usable even if the surrounding viewport is short — the
          absolutely-positioned map div inside fills the wrapper. */}
      <div className="flex-1 min-h-[24rem] relative bg-[--white-2]">
        {!ready ? (
          <div className="absolute inset-0 grid place-items-center text-[--gr-1] text-xs">
            {t("orders.location_loading")}
          </div>
        ) : null}
        <div ref={mapDivRef} className="absolute inset-0" />
      </div>

      <footer className="px-4 sm:px-5 py-3 border-t border-[--border-1] flex items-center justify-end gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setPopupContent(null)}
          className="h-10 px-4 rounded-lg border border-[--border-1] bg-[--white-1] text-[--black-2] text-sm font-medium hover:bg-[--white-2] transition"
        >
          {t("orders.close")}
        </button>
        <button
          type="button"
          onClick={openInGoogleMaps}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 active:brightness-95 transition"
          style={{ background: PRIMARY_GRADIENT }}
        >
          <Navigation className="size-4" />
          {t("orders.location_open_external")}
        </button>
      </footer>
    </div>
  );
};

export default OrderLocationPopup;
