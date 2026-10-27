import { useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthUiProvider } from "@indyzai/pos-auth/ui";
import { usePayrollTheme } from "@/theme/payroll-theme";
function PayrollLogo({ size }: { size: number; color?: string }) {
  return (
    <Image
      source={require("../../assets/brand/icon.png")}
      style={{ width: size, height: size, borderRadius: size / 4 }}
      accessible={false}
    />
  );
}
export function PayrollAuthSurface({ children }: { children: ReactNode }) {
  const { themeColors, mode, setMode } = usePayrollTheme();
  const [message, setMessage] = useState("");
  const configuration = useMemo(
    () => ({
      brandName: "IndyzPay",
      productLabel: "PAYROLL",
      brandTagline: "PAYROLL, WITH PEACE OF MIND",
      brandingEyebrow: "PAYROLL, WITH PEACE OF MIND",
      brandHighlights: ["PAY", "REVIEW", "PLAN"],
      showThemeToggle: false,
      showBrandingMetrics: false,
      loginHeading: "Welcome to IndyzPay",
      loginDescription: "Your work. Your pay. All in one place.",
      loginTitle: "Welcome to IndyzPay",
      loginSubtitle: "Your work. Your pay. All in one place.",
      loginNote:
        "Sign in with your IndyzAI account, or explore one of the local demo accounts below.",
      signupTitle: "A calmer way to payday.",
      signupNote: "Payroll, with peace of mind · IndyzAI identity",
      registrationDomainField: true,
      registrationAcknowledgement:
        "I understand this creates a real IndyzAI account and organization.",
      organizationTypes: [
        "Startup",
        "Small Business",
        "Medium Business",
        "Enterprise",
        "NGO",
        "Educational Institution",
        "Healthcare",
        "Government",
        "Other",
      ],
      industries: [
        "Technology",
        "Healthcare",
        "Finance",
        "Education",
        "Retail",
        "Manufacturing",
        "Real Estate",
        "Marketing",
        "Consulting",
        "Non-Profit",
        "Other",
      ],
      signupSubtitle: "One identity for your team. A clear view of payday.",
      useTheme: usePayrollTheme,
      Logo: PayrollLogo,
      showSnackbar: (title: string, detail?: string) =>
        setMessage([title, detail].filter(Boolean).join(": ")),
    }),
    [],
  );
  return (
    <AuthUiProvider configuration={configuration}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: themeColors.background }}
        edges={["top", "left", "right", "bottom"]}
      >
        <View
          style={{
            alignItems: "flex-end",
            paddingHorizontal: 20,
            paddingTop: 4,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              mode === "light" ? "Use dark theme" : "Use light theme"
            }
            onPress={() => setMode(mode === "light" ? "dark" : "light")}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ color: themeColors.primary }}>
              {mode === "light" ? "Dark theme" : "Light theme"}
            </Text>
          </Pressable>
        </View>
        {message ? (
          <View style={{ padding: 16, backgroundColor: themeColors.errorSoft }}>
            <Text
              accessibilityRole="alert"
              style={{ color: themeColors.error }}
            >
              {message}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMessage("")}
              style={{ paddingTop: 10 }}
            >
              <Text style={{ color: themeColors.primary }}>Dismiss</Text>
            </Pressable>
          </View>
        ) : null}
        {children}
      </SafeAreaView>
    </AuthUiProvider>
  );
}
