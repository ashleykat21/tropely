import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react"; // Add this line
import App from "./App.tsx";
import "./index.css";
import { initOfflineQueue } from "./lib/offlineQueue";
import { Capacitor } from "@capacitor/core";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

initOfflineQueue();

if (Capacitor.isNativePlatform()) {
  import("@capgo/capacitor-updater").then(({ CapacitorUpdater }) => {
    CapacitorUpdater.notifyAppReady();
  });
}

// THIS IS THE PART THAT UNFREEZES THE BUTTONS:
createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    allowedRedirectOrigins={['capacitor://localhost', 'http://localhost']}
  >
    <App />
  </ClerkProvider>
);