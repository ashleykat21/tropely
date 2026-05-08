import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.tropely",
  appName: "Tropely",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  ios: {
    contentInset: "automatic",
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
    },
  },
};

export default config;
