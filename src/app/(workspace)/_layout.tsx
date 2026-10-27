import { Tabs } from "expo-router";
import { AppIcon, type IconName } from "@/components/app-icon";
import { StatusBar } from "expo-status-bar";
import { DemoProvider } from "@/demo/provider";
import { usePayrollSession } from "@/auth/session";
import { usePayrollTheme } from "@/theme/payroll-theme";
export default function Layout() {
  const { colors, isDark } = usePayrollTheme();
  const { session } = usePayrollSession();
  return (
    <DemoProvider initialPortal={session?.portal ?? "Employee"}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.line,
            height: 82,
            paddingTop: 10,
            paddingBottom: 22,
          },
          tabBarLabelStyle: { fontSize: 11 },
        }}
      >
        {[
          { name: "index", title: "Home", icon: "home" },
          { name: "payroll", title: "Payroll", icon: "payroll" },
          { name: "requests", title: "Requests", icon: "requests" },
          { name: "people", title: "People", icon: "people" },
          { name: "settings", title: "Account", icon: "account" },
        ].map((t) => (
          <Tabs.Screen
            key={t.name}
            name={t.name}
            options={{
              title: t.title,
              tabBarIcon: ({ color }) => (
                <AppIcon name={t.icon as IconName} color={color} />
              ),
            }}
          />
        ))}
      </Tabs>
    </DemoProvider>
  );
}
