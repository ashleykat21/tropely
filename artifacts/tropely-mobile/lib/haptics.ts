import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const impactAsync = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS === "web") return;
  Haptics.impactAsync(style).catch(() => {});
};

export const notificationAsync = (type: Haptics.NotificationFeedbackType) => {
  if (Platform.OS === "web") return;
  Haptics.notificationAsync(type).catch(() => {});
};

export { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
