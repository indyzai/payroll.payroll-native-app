import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { identityConfiguration } from "./config";
import { createIdentityClient, type IdentityStorage } from "./identity-client";
export const identityConfig = identityConfiguration(
  {
    baseUrl: process.env.EXPO_PUBLIC_AUTH_API_URL,
    appId: process.env.EXPO_PUBLIC_AUTH_APP_ID,
    environment: process.env.EXPO_PUBLIC_AUTH_ENV,
  },
  process.env.NODE_ENV !== "production",
);
const key = "com.indyzai.payroll.app.identity.v1";
let browserRefreshToken: string | null = null;
// Web credentials remain in memory. Never read or clear another app's cookies/storage.
const storage: IdentityStorage =
  Platform.OS === "web"
    ? {
        read: async () => browserRefreshToken,
        write: async (value) => {
          browserRefreshToken = value;
        },
        clear: async () => {
          browserRefreshToken = null;
        },
      }
    : {
        read: () => SecureStore.getItemAsync(key),
        write: (value) =>
          SecureStore.setItemAsync(key, value, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        clear: () => SecureStore.deleteItemAsync(key),
      };
export const identity = createIdentityClient(identityConfig, storage);
