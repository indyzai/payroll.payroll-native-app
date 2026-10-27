import { accessForSession } from "@/auth/access";
import { usePayrollSession } from "@/auth/session";
import { usePayrollTheme } from "@/theme/payroll-theme";
import { useState } from "react";
import { Switch, Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { useDemo } from "@/demo/provider";
export default function Settings() {
  const { s, colors } = usePayrollUi();
  const { mode, setMode } = usePayrollTheme();
  const d = useDemo();
  const {
    session,
    selectOrganization,
    signOut,
    busy: identityBusy,
    error: identityError,
    retry,
  } = usePayrollSession();
  const access = accessForSession(session);
  const [confirm, setConfirm] = useState(false);
  const p = d.state.people.find((p) => p.id === d.employeeId)!;
  return (
    <Screen
      title="Your workspace."
      sub={
        access.canManageWorkspace
          ? "Profile, administration, and request activity."
          : "Your profile, organization, and preferences."
      }
    >
      <Card>
        <Row title={session?.name ?? "Your account"} detail={session?.email} />
        <Row title="Demo employee" value={p.name} />
        <Row title="Organization" value={session?.tenant.name} />
        <Row title="Organization ID" value={session?.tenant.id} />
        <Row title="Membership role" value={session?.tenant.role} />
        <Row title="Region / currency" value="India / INR" />
        <Row title="Workspace role" value={access.role} />
      </Card>
      <Card>
        <Row
          title="Signed-in identity"
          detail={session?.email}
          value={
            session?.kind === "demo" ? `${session.demoRole} demo` : "IndyzAI"
          }
        />
        <Text style={s.small}>
          {session?.kind === "demo"
            ? "This is a local demo session. No identity service is called and no credentials are stored."
            : "Your identity is live. Employee records and payroll actions below are simulations."}{" "}
          Signing out clears this app’s payroll workspace.
        </Text>
        {session && session.user.tenants.length > 1 ? (
          <>
            <Heading>Switch organization</Heading>
            <Text style={s.small}>
              Choose an organization from your verified identity memberships.
              Switching resets the simulated payroll workspace.
            </Text>
            {session.user.tenants.map((organization) => (
              <Button
                key={organization.id}
                title={
                  organization.name +
                  (organization.id === session.tenant.id ? " · Selected" : "")
                }
                secondary
                disabled={
                  organization.id === session.tenant.id ||
                  d.busy ||
                  identityBusy
                }
                onPress={() => selectOrganization(organization.id)}
              />
            ))}
          </>
        ) : null}
        {identityError ? (
          <>
            <Text accessibilityRole="alert" style={s.error}>
              {identityError}
            </Text>
            <Button
              title="Retry identity connection"
              secondary
              onPress={retry}
            />
          </>
        ) : null}
        <Button
          title="Sign out"
          disabled={identityBusy}
          secondary
          onPress={() => {
            void signOut();
          }}
        />
      </Card>
      <Card>
        <Row title="Appearance" value={mode === "dark" ? "Dark" : "Light"} />
        <Button
          secondary
          title={mode === "light" ? "Use dark theme" : "Use light theme"}
          onPress={() => setMode(mode === "light" ? "dark" : "light")}
        />
      </Card>
      {access.canManageWorkspace ? (
        <>
          <Heading>Simulation controls</Heading>
          <Card>
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.body}>Fail the next request</Text>
                <Text style={s.small}>
                  Test error recovery. No changes are saved on failure.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Fail the next simulated request"
                disabled={d.busy}
                value={d.failNext}
                onValueChange={d.setFailNext}
                trackColor={{ true: colors.green }}
              />
            </View>
            <Text style={s.small}>
              Requests run locally with 550 ms latency. Data stays in memory; no
              bank, HRMS, or government services are contacted. Real-account
              sign-in uses the real IndyzAI identity service.
            </Text>
            <Button
              title={
                confirm
                  ? "Confirm reset of all demo data"
                  : "Reset demo workspace"
              }
              secondary
              onPress={() => {
                if (confirm) {
                  d.reset();
                  setConfirm(false);
                } else setConfirm(true);
              }}
            />
            {confirm ? (
              <Button
                title="Keep workspace"
                secondary
                onPress={() => setConfirm(false)}
              />
            ) : null}
          </Card>
          <Heading>Simulated request log</Heading>
          <Card>
            {d.log.length === 0 ? (
              <Text style={s.small}>
                No requests yet. Submit a request or advance payroll to see
                activity.
              </Text>
            ) : (
              d.log.map((l, i) => (
                <Row
                  key={`${l.id}-${i}`}
                  title={l.action}
                  detail={new Date(l.id).toLocaleTimeString()}
                  value={l.status}
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
