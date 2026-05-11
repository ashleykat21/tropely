import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.nevora.tropely",
  appName: "Tropely",
  webDir: "artifacts/feltly/dist",
  server: {
    androidScheme: "https",
    iosScheme: "https"
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
