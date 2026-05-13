import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Tropely",
  slug: "tropely",
  version: "1.0.0",
  orientation: "portrait",
  scheme: "tropely",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "com.nevora.tropely",
    supportsTablet: false,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.nevora.tropely",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "tropely" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  extra: {
    eas: {
      projectId: "c1cf53d3-29fc-4d08-9d0a-b6ad79f1fadd",
    },
  },
  plugins: [
    "expo-secure-store",
    [
      "expo-build-properties",
      {
        ios: { deploymentTarget: "16.0" },
        android: { compileSdkVersion: 36, targetSdkVersion: 36 },
      },
    ],
  ],
});
