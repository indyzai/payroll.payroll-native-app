import { Tabs } from "expo-router";
import { AppIcon, type IconName } from "@/components/app-icon";
import { StatusBar } from "expo-status-bar";
import { DemoProvider } from "@/demo/provider";
import { colors } from "@/components/mobile-ui";
export default function Layout() {
  return (
    <DemoProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.green,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: "#FFF",
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
