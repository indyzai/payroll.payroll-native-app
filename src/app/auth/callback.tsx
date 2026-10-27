import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { usePayrollSession } from "@/auth/session";
import { usePayrollTheme } from "@/theme/payroll-theme";
// On web, Expo returns the callback URL to the waiting opener. Tokens stay in that window.
WebBrowser.maybeCompleteAuthSession();
export default function AuthCallback() {
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const { session, busy, initializing, completeSocial } = usePayrollSession();
  const { colors } = usePayrollTheme();
  const [error, setError] = useState("");
  const handled = useRef(false);
  useEffect(() => {
    if (session) {
      router.replace("/");
      return;
    }
    if (Platform.OS === "web" || busy || initializing || handled.current)
      return;
    handled.current = true;
    void Promise.resolve().then(async () => {
      try {
        if (params.error)
          throw Error(
            "The provider did not complete sign-in. Please start again.",
          );
        await completeSocial(
          typeof params.code === "string" ? params.code : "",
          typeof params.state === "string" ? params.state : "",
        );
        router.replace("/");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not complete sign-in.",
        );
      }
    });
  }, [
    session,
    busy,
    initializing,
    completeSocial,
    params.code,
    params.state,
    params.error,
  ]);
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.bg,
      }}
    >
      {!error && <ActivityIndicator color={colors.green} />}
      <Text
        accessibilityRole={error ? "alert" : undefined}
        style={{
          color: error ? colors.error : colors.ink,
          textAlign: "center",
        }}
      >
        {error ||
          (Platform.OS === "web"
            ? "Completing sign-in in the original window. You can close this tab if it does not close automatically."
            : "Completing sign-in…")}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace("/login")}
        style={{ padding: 14 }}
      >
        <Text style={{ color: colors.green }}>Return to sign in</Text>
      </Pressable>
    </View>
  );
}
