import { PayrollThemeProvider, usePayrollTheme } from "@/theme/payroll-theme";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { PayrollSessionProvider, usePayrollSession } from "@/auth/session";
export default function RootLayout() {
  return (
    <PayrollThemeProvider>
      <ThemeStatusBar />
      <PayrollSessionProvider>
        <Navigator />
      </PayrollSessionProvider>
    </PayrollThemeProvider>
  );
}
function Navigator() {
  const { colors } = usePayrollTheme();
  const { session, initializing } = usePayrollSession();
  if (initializing)
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator
          accessibilityLabel="Connecting to your identity session"
          color={colors.green}
        />
      </View>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(workspace)" />
      </Stack.Protected>
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

function ThemeStatusBar() {
  const { isDark } = usePayrollTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}
