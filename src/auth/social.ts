import * as AuthSession from "expo-auth-session";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { identity, identityConfig } from "./identity";
import { IdentityError, type IdentityStorage } from "./identity-client";
import {
  createSocialCompletion,
  registeredSocialApplication,
} from "./social-transaction";
export type SocialProvider = "google" | "microsoft";
const transactionKey = "com.indyzai.payroll.app.oauth.v1";
let webTransaction: string | null = null;
const storage: IdentityStorage =
  Platform.OS === "web"
    ? {
        read: async () => webTransaction,
        write: async (value) => {
          webTransaction = value;
        },
        clear: async () => {
          webTransaction = null;
        },
      }
    : {
        read: () => SecureStore.getItemAsync(transactionKey),
        write: (value) =>
          SecureStore.setItemAsync(transactionKey, value, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          }),
        clear: () => SecureStore.deleteItemAsync(transactionKey),
      };
const completion = createSocialCompletion(
  storage,
  `${identityConfig.baseUrl}|${identityConfig.appId}`,
  (code, verifier) => identity.exchangeApplicationCode(code, verifier),
);
export const completeSocialSignIn = completion.finish;
export const cancelSocialSignIn = completion.cancel;
export async function signInWithSocial(provider: SocialProvider) {
  // Reserve a named popup during the user's click, before any asynchronous work.
  const windowName = "indyzpay-social-sign-in";
  const popup =
    Platform.OS === "web"
      ? window.open("about:blank", windowName, "popup=yes,width=500,height=700")
      : null;
  if (Platform.OS === "web" && !popup)
    throw new IdentityError(
      "Allow popups to continue with Google or Microsoft.",
    );
  let completed = false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(`${identityConfig.baseUrl}/auth/applications`, {
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
    } catch {
      throw new IdentityError(
        "Could not reach the social sign-in service. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok)
      throw new IdentityError(
        "Could not load social sign-in configuration. Please try again.",
      );
    if (
      !registeredSocialApplication(await response.json(), identityConfig.appId)
    )
      throw new IdentityError(
        "Social sign-in is not configured for IndyzPay yet. Ask your administrator to register the payroll application.",
      );
    const redirectUri = AuthSession.makeRedirectUri(
      Platform.OS === "web"
        ? { path: "auth/callback" }
        : { scheme: "indyzpay", path: "auth/callback" },
    );
    const state = new AuthSession.AuthRequest({
      clientId: identityConfig.appId,
      redirectUri,
      usePKCE: false,
    }).state;
    const callback = new URL(redirectUri);
    callback.searchParams.set("state", state);
    const request = new AuthSession.AuthRequest({
      clientId: identityConfig.appId,
      redirectUri: callback.toString(),
      responseType: AuthSession.ResponseType.Code,
      state,
      usePKCE: true,
      extraParams: {
        appName: identityConfig.appId,
        redirect: callback.toString(),
      },
    });
    const discovery = {
      authorizationEndpoint: `${identityConfig.baseUrl}/auth/${provider}`,
    };
    await request.makeAuthUrlAsync(discovery);
    if (!request.codeVerifier)
      throw new IdentityError(
        "Could not prepare secure social sign-in. Please try again.",
      );
    await completion.begin({ state, verifier: request.codeVerifier });
    const result = await request.promptAsync(discovery, { windowName });
    if (result.type === "cancel" || result.type === "dismiss") return null;
    if (result.type !== "success")
      throw new IdentityError(
        "Social sign-in was not completed. Please try again.",
      );
    const session = await completion.finish(
      result.params.code ?? "",
      result.params.state ?? "",
    );
    completed = true;
    return session;
  } finally {
    if (!completed) await completion.cancel();
    popup?.close();
  }
}
