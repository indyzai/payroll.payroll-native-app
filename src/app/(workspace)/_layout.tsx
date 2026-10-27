import { accessForSession, canOpenScreen } from "@/auth/access";
import { Tabs } from "expo-router";
import { AppIcon } from "@/components/app-icon";
import { StatusBar } from "expo-status-bar";
import { DemoProvider } from "@/demo/provider";
import { usePayrollSession } from "@/auth/session";
import { usePayrollTheme } from "@/theme/payroll-theme";
export default function Layout() {
  const { colors, isDark } = usePayrollTheme();
  const { session } = usePayrollSession();
  const access = accessForSession(session);
  return (
    <DemoProvider
      key={`${session?.kind}:${session?.user.id}:${session?.tenant.id}:${access.role}`}
      initialEmployeeId={
        session?.kind === "demo" ? session.employeeId : "IZ001"
      }
      initialPortal={access.role}
    >
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
        <Tabs.Screen
          name="index"
          options={{
            title: access.role === "Employee" ? "Home" : "Overview",
            tabBarIcon: ({ color }) => <AppIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="payroll"
          options={{
            title: access.role === "Employee" ? "My pay" : "Payroll",
            tabBarIcon: ({ color }) => <AppIcon name="payroll" color={color} />,
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: access.role === "Employee" ? "My requests" : "Approvals",
            tabBarIcon: ({ color }) => (
              <AppIcon name="requests" color={color} />
            ),
          }}
        />
        <Tabs.Protected guard={canOpenScreen(access.role, "people")}>
          <Tabs.Screen
            name="people"
            options={{
              title: "People",
              tabBarIcon: ({ color }) => (
                <AppIcon name="people" color={color} />
              ),
            }}
          />
        </Tabs.Protected>
        <Tabs.Screen
          name="settings"
          options={{
            title: "Account",
            tabBarIcon: ({ color }) => <AppIcon name="account" color={color} />,
          }}
        />
      </Tabs>
    </DemoProvider>
  );
}
