import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nevora.tropely",
  appName: "Tropely",
  webDir: "dist",
  server: {
    // Allows Clerk to talk to your app on mobile
    androidScheme: "https",
    iosScheme: "com.nevora.tropely"
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
    },
    // Adding this ensures Clerk knows where to send the user back after login
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;