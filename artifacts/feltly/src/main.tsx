import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOfflineQueue } from "./lib/offlineQueue";
import { Capacitor } from "@capacitor/core";

initOfflineQueue();

if (Capacitor.isNativePlatform()) {
  import("@capgo/capacitor-updater").then(({ CapacitorUpdater }) => {
    CapacitorUpdater.notifyAppReady();
  });
}

createRoot(document.getElementById("root")!).render(<App />);

// Service workers are not supported in native Capacitor apps.
// Only register in web contexts.
if (!Capacitor.isNativePlatform() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
