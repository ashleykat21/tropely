import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import App from "./App.tsx";
import "./index.css";
import { initOfflineQueue } from "./lib/offlineQueue";
import { Capacitor } from "@capacitor/core";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

console.log("Clerk key present:", Boolean(PUBLISHABLE_KEY));

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in artifacts/feltly/.env");
}

initOfflineQueue();

if (Capacitor.isNativePlatform()) {
  import("@capgo/capacitor-updater").then(({ CapacitorUpdater }) => {
    CapacitorUpdater.notifyAppReady();
  });
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    afterSignInUrl="/"
    afterSignUpUrl="/"
  >
    <App />
  </ClerkProvider>
);

// Service workers are not supported in native Capacitor apps.
if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
