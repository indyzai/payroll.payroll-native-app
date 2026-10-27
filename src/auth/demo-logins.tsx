import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { usePayrollTheme } from "@/theme/payroll-theme";
import { usePayrollSession } from "./session";
import { demoAccounts, demoPassword } from "./demo-accounts";
export function DemoLogins() {
  const { colors } = usePayrollTheme();
  const { signIn, busy } = usePayrollSession();
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingVertical: 14,
        gap: 10,
        backgroundColor: colors.pale,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{ minHeight: 44, justifyContent: "center" }}
      >
        <Text
          style={{
            color: colors.green,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {expanded
            ? "Hide demo accounts"
            : "Demo accounts · Employee, HR & Admin"}
        </Text>
      </Pressable>
      {expanded ? (
        <>
          <Text
            style={{ color: colors.ink, textAlign: "center", fontSize: 12 }}
          >
            Password for all three: {demoPassword}
          </Text>
          <Text
            style={{ color: colors.muted, textAlign: "center", fontSize: 11 }}
          >
            Tap a role to sign in locally, or enter its credentials above.
          </Text>
          {demoAccounts.map((account) => (
            <Pressable
              key={account.role}
              accessibilityRole="button"
              accessibilityLabel={`Open ${account.role} demo`}
              disabled={busy}
              onPress={() => {
                setError("");
                void signIn(account.email, demoPassword).catch((reason) =>
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : "Could not open demo.",
                  ),
                );
              }}
              style={{
                paddingVertical: 10,
                minHeight: 44,
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "space-between",
                opacity: busy ? 0.5 : 1,
              }}
            >
              <Text style={{ color: colors.green, fontWeight: "700" }}>
                {account.role}
              </Text>
              <Text selectable style={{ color: colors.ink, fontSize: 12 }}>
                {account.email}
              </Text>
            </Pressable>
          ))}
          <Text
            style={{ color: colors.muted, textAlign: "center", fontSize: 11 }}
          >
            Simulated users only. No real account, token, or payment.
          </Text>
          {error ? (
            <Text accessibilityRole="alert" style={{ color: colors.error }}>
              {error}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
