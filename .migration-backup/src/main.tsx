import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOfflineQueue } from "./lib/offlineQueue";

initOfflineQueue();

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
