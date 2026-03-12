import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let messaging;

export async function initFirebaseMessaging() {
  try {
    const supported = await isSupported();
    console.log("[Firebase] isSupported:", supported);
    if (!supported) return { supported: false, token: null };

    if (!app) {
      app = initializeApp(firebaseConfig);
      console.log("[Firebase] App initialized");
    }

    if (!messaging) {
      messaging = getMessaging(app);
      console.log("[Firebase] Messaging initialized");
    }

    // ── Register SW and wait until it is active ──────────────────────────────
    // The registration MUST be passed to getToken so Firebase ties the push
    // subscription to YOUR custom SW, not a default one.
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );
    // Wait for the SW to become active (important on first load)
    await navigator.serviceWorker.ready;
    console.log("[Firebase] Service worker ready:", registration.scope);

    const permission = await Notification.requestPermission();
    console.log("[Firebase] Notification permission:", permission);
    if (permission !== "granted") {
      return { supported: true, token: null };
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration, // ← critical fix
    });

    console.log(
      "[Firebase] Push token obtained:",
      token ? `${token.slice(0, 20)}...` : "null",
    );
    return { supported: true, token };
  } catch (err) {
    console.error("[Firebase] Init error:", err);
    return { supported: false, token: null };
  }
}

export function subscribeForegroundMessages(onPayload) {
  if (!messaging) {
    console.warn(
      "[Firebase] subscribeForegroundMessages called before messaging was initialized",
    );
    return () => {};
  }
  console.log("[Firebase] Foreground message listener registered");
  return onMessage(messaging, (payload) => {
    console.log("[Firebase] 🔔 Foreground message received:", payload);
    onPayload(payload);
  });
}
