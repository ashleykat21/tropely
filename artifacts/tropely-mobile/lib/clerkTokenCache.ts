import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const createTokenCache = () => {
  if (Platform.OS === "web") {
    return {
      getToken: async (key: string) => {
        try { return localStorage.getItem(key); } catch { return null; }
      },
      saveToken: async (key: string, token: string) => {
        try { localStorage.setItem(key, token); } catch {}
      },
      clearToken: async (key: string) => {
        try { localStorage.removeItem(key); } catch {}
      },
    };
  }
  return {
    getToken: (key: string) => SecureStore.getItemAsync(key),
    saveToken: (key: string, token: string) =>
      SecureStore.setItemAsync(key, token),
    clearToken: (key: string) => SecureStore.deleteItemAsync(key),
  };
};

export const tokenCache = createTokenCache();
