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
    signOut,
    busy: identityBusy,
    error: identityError,
    retry,
  } = usePayrollSession();
  const [confirm, setConfirm] = useState(false);
  const p = d.state.people.find((p) => p.id === d.employeeId)!;
  return (
    <Screen
      title="Your workspace."
      sub="Profile, demo controls, and request activity."
    >
      <Card>
        <Row title={p.name} detail={`${p.role} · ${p.id}`} />
        <Row title="Organization" value="Indyz Technologies" />
        <Row title="Region / currency" value="India / INR" />
        <Text style={s.small}>
          Use People to switch the demo employee. Portal switching is a demo
          control, not authentication.
        </Text>
      </Card>
      <Card>
        <Row
          title="Signed-in identity"
          detail={session?.email}
          value="IndyzAI"
        />
        <Text style={s.small}>
          Your identity is live. Employee records and payroll actions below are
          simulations. Signing out clears this app’s payroll workspace.
        </Text>
        <Row title="Identity organization" value={session?.tenant.name} />
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
          bank, HRMS, or government services are contacted. Sign-in uses the
          real IndyzAI identity service.
        </Text>
        <Button
          title={
            confirm ? "Confirm reset of all demo data" : "Reset demo workspace"
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
    </Screen>
  );
}
