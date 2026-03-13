import { initializeApp } from "firebase/app";
import {
  getToken,
  onMessage,
  isSupported,
  getMessaging,
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

function ensureFirebaseMessaging() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    console.log("[Firebase] App initialized");
  }

  if (!messaging) {
    messaging = getMessaging(app);
    console.log("[Firebase] Messaging initialized");
  }

  return messaging;
}

export async function initFirebaseMessaging() {
  const supported = await isSupported();
  console.log("[Firebase] isSupported:", supported);
  if (!supported)
    return { supported: false, token: null, permission: "unsupported" };

  ensureFirebaseMessaging();

  await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  console.log("[Firebase] Service worker registered");

  const permission = await Notification.requestPermission();
  console.log("[Firebase] Notification permission:", permission);
  if (permission !== "granted") {
    return { supported: true, token: null, permission };
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  console.log(
    "[Firebase] Push token:",
    token ? `${token.slice(0, 20)}...` : "null",
  );
  return { supported: true, token, permission };
}

export async function requestPushPermissionToken() {
  const supported = await isSupported();
  if (!supported)
    return { supported: false, token: null, permission: "unsupported" };

  ensureFirebaseMessaging();
  await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const permission = await Notification.requestPermission();
  console.log("[Firebase] Permission request (manual):", permission);

  if (permission !== "granted") {
    return { supported: true, token: null, permission };
  }

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
  });

  return { supported: true, token, permission };
}

export function subscribeForegroundMessages(onPayload) {
  if (!messaging) return () => {};
  console.log("[Firebase] Foreground message listener registered");
  return onMessage(messaging, (payload) => {
    console.log("[Firebase] 🔔 Foreground message received:", payload);
    onPayload(payload);
  });
}
