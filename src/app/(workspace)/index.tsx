import { usePayrollSession } from "@/auth/session";
import { router } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { breakdown, leaveAvailable, money } from "@/demo/model";
import { useDemo } from "@/demo/provider";
export default function Home() {
  const { session } = usePayrollSession();
  const { s } = usePayrollUi();
  const { state, employeeId, portal } = useDemo();
  const person = state.people.find((p) => p.id === employeeId)!;
  const pay = breakdown(person.ctc);
  const pending = state.requests.filter((r) => r.status === "Pending");
  const active = state.people.filter((p) => p.status !== "Exited");
  return (
    <Screen
      title={
        portal === "Employee"
          ? `Hello, ${person.name.split(" ")[0]}.`
          : portal === "Admin"
            ? "Admin overview."
            : "A clear view of payday."
      }
      sub={
        portal === "Employee"
          ? "Your work. Your pay. All in one place."
          : `${session?.tenant.name} · India demo workspace`
      }
    >
      <Card dark>
        <View style={s.row}>
          <Text style={{ color: "#B6CEC0", fontSize: 12 }}>
            {portal === "Employee"
              ? "SEPTEMBER 2026 · NET PAY"
              : "OCTOBER 2026 · ESTIMATED NET PAY"}
          </Text>
          <Text style={{ color: "#E4BB69" }}>↗</Text>
        </View>
        <Text style={s.heroValue}>
          {money(
            portal === "Employee"
              ? pay.net
              : active.reduce((n, p) => n + breakdown(p.ctc).net, 0),
          )}
        </Text>
        <Text style={{ color: "#B6CEC0", fontSize: 12 }}>
          Simulated payroll · INR
        </Text>
        <Button
          title={
            portal === "Employee"
              ? "View salary breakdown →"
              : "Open payroll cycle →"
          }
          onPress={() => router.push("/payroll")}
        />
      </Card>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.small}>
              {portal === "Employee" ? "Leave available" : "Active employees"}
            </Text>
            <Text style={[s.heading, { fontSize: 29 }]}>
              {portal === "Employee"
                ? leaveAvailable(state, employeeId)
                : active.length}
              <Text style={s.small}>
                {portal === "Employee" ? " days" : " people"}
              </Text>
            </Text>
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Text style={s.small}>Awaiting review</Text>
            <Text style={[s.heading, { fontSize: 29 }]}>
              {
                pending.filter(
                  (r) => portal !== "Employee" || r.employeeId === employeeId,
                ).length
              }
              <Text style={s.small}> requests</Text>
            </Text>
          </Card>
        </View>
      </View>
      <Heading>A little less admin.</Heading>
      <Card>
        <Row
          title="Time for a break?"
          detail="Plan leave and keep your team in the loop."
        />
        <Button
          title={
            portal === "Employee"
              ? "Leave & expense requests →"
              : "Review team requests →"
          }
          secondary
          onPress={() => router.push("/requests")}
        />
      </Card>
      <Heading>Workspace activity</Heading>
      <Card>
        {state.requests.slice(0, 3).map((r) => (
          <Row
            key={r.id}
            title={r.title}
            detail={`${state.people.find((p) => p.id === r.employeeId)?.name} · ${r.kind}`}
            value={r.status}
          />
        ))}
        {portal !== "Employee" && (
          <Row
            title="October payroll"
            detail="Current simulated cycle"
            value={state.paid ? "Complete" : "In progress"}
          />
        )}
      </Card>
    </Screen>
  );
}
