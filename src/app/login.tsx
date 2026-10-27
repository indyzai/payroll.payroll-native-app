import { DemoLogins } from "@/auth/demo-logins";
import { usePayrollTheme } from "@/theme/payroll-theme";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { LoginScreen } from "@indyzai/pos-auth/ui";
import { PayrollAuthSurface } from "@/auth/payroll-auth";
import { usePayrollSession } from "@/auth/session";
export default function Login() {
  const { themeColors: c } = usePayrollTheme();
  const { signIn, signInSocial, error, retry } = usePayrollSession();
  return (
    <PayrollAuthSurface>
      {error ? (
        <View style={{ padding: 16, backgroundColor: c.errorSoft, gap: 10 }}>
          <Text accessibilityRole="alert" style={{ color: c.error }}>
            {error}
          </Text>
          <Pressable accessibilityRole="button" onPress={retry}>
            <Text style={{ color: c.primary }}>Retry session connection</Text>
          </Pressable>
        </View>
      ) : null}
      <LoginScreen
        onLogin={({ email, password }) => signIn(email, password)}
        onSocialLogin={signInSocial}
        onSignUp={() => router.push("/signup")}
        onDeviceLogin={async () => {
          throw Error("Device unlock is not configured for payroll.");
        }}
      />
      <DemoLogins />
    </PayrollAuthSurface>
  );
}
