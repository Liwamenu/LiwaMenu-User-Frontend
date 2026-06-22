// Reliable "payment settled" detector for the license-purchase 3DS step.
//
// Why this exists: after PayTR 3DS, the iframe lands on a CROSS-ORIGIN page
// (paytr.com, then the backend's return URL — never the app's own origin),
// so the FE cannot read the iframe URL to detect completion (SecurityError),
// and the return-page `postMessage` frequently never arrives. That left the
// user stuck on the "Lütfen Bekleyin" spinner even though the backend had
// already created/extended the license. So instead of trusting the fragile
// iframe handoff, we poll the authoritative source — the restaurant's
// licenses. When the license set changes (a license is created, extended, or
// (de)activated), the payment has settled → success. A timeout guards against
// an infinite spinner when nothing ever changes (e.g. the user abandons 3DS).

import { useEffect, useRef } from "react";
import { privateApi } from "../../../redux/api";

const baseURL = import.meta.env.VITE_BASE_URL;
const api = privateApi();

// A change-detecting fingerprint of a restaurant's licenses. Covers add
// (new id appears), extend (endDateTime moves), and activation toggles.
const signatureOf = (list) =>
  (Array.isArray(list) ? list : [])
    .map((l) => `${l?.id}:${l?.endDateTime}:${l?.isActive}`)
    .sort()
    .join("|");

export function usePaymentSettleWatch({
  restaurantId,
  active,
  onConfirmed,
  onTimeout,
  intervalMs = 3000,
  timeoutMs = 90000,
}) {
  // Keep callbacks in a ref so the polling loop always calls the latest
  // versions without re-subscribing (and restarting) the effect.
  const cbRef = useRef({});
  cbRef.current = { onConfirmed, onTimeout };

  useEffect(() => {
    if (!active || !restaurantId) return undefined;

    let cancelled = false;
    let pollTimer;
    let deadlineTimer;
    let baseline = null;
    let done = false;

    const settle = (kind) => {
      if (done || cancelled) return;
      done = true;
      if (kind === "confirmed") cbRef.current.onConfirmed?.();
      else cbRef.current.onTimeout?.();
    };

    const tick = async () => {
      if (cancelled || done) return;
      try {
        const res = await api.get(
          `${baseURL}Licenses/GetLicensesByRestaurantId`,
          { params: { restaurantId }, skipErrorToast: true },
        );
        const d = res?.data;
        const list = Array.isArray(d?.data)
          ? d.data
          : Array.isArray(d)
            ? d
            : [];
        const sig = signatureOf(list);
        if (baseline === null) {
          baseline = sig; // first sample = pre-settlement baseline
        } else if (sig !== baseline) {
          settle("confirmed");
          return;
        }
      } catch {
        // transient — keep polling
      }
      if (!cancelled && !done) pollTimer = setTimeout(tick, intervalMs);
    };

    tick();
    deadlineTimer = setTimeout(() => settle("timeout"), timeoutMs);

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(deadlineTimer);
    };
  }, [active, restaurantId, intervalMs, timeoutMs]);
}

export default usePaymentSettleWatch;
