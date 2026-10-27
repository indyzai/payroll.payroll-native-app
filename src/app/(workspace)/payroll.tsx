import { Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { EmployeePayOverview } from "@/components/payroll/employee-pay-overview";
import { money, stages } from "@/demo/model";
import { monthlyPayAmounts, monthLabel } from "@/demo/pay-history";
import { useDemo } from "@/demo/provider";
export default function Payroll() {
  const { s, colors } = usePayrollUi();
  const d = useDemo();
  if (d.portal === "Employee") return <EmployeePayOverview />;
  const active = d.state.people.filter((person) => person.status !== "Exited");
  return (
    <Screen
      title="Make payday happen."
      sub={`${monthLabel(d.state.payrollMonth)} · India · INR`}
    >
      <Card dark>
        <Text style={{ color: "#BCD0C5" }}>ESTIMATED NET PAYROLL</Text>
        <Text style={s.heroValue}>
          {money(
            active.reduce(
              (total, person) => total + monthlyPayAmounts(person.ctc).net,
              0,
            ),
          )}
        </Text>
        <Text style={{ color: "#BCD0C5" }}>
          {active.length} employees · No real bank transfers
        </Text>
      </Card>
      <Heading>Payroll checklist</Heading>
      <Card>
        {stages.map((stage, i) => (
          <View key={stage} style={s.row}>
            <Text
              style={[
                s.body,
                { color: i <= d.state.stage ? colors.green : colors.muted },
              ]}
            >
              {i < d.state.stage || d.state.paid ? "✓" : `${i + 1}.`} {stage}
            </Text>
            <Text style={s.small}>
              {i === d.state.stage
                ? "Current"
                : i < d.state.stage
                  ? "Done"
                  : ""}
            </Text>
          </View>
        ))}
        <Text style={s.small}>
          All pending requests must be reviewed before advancing. Expense
          reimbursements are tracked separately from salary. Completing
          disbursement saves monthly salary snapshots in the shared demo
          workspace.
        </Text>
        <Button
          disabled={d.state.paid}
          title={
            d.state.paid
              ? "Simulated payment complete"
              : d.state.stage === 4
                ? "Simulate disbursement"
                : `Complete ${stages[d.state.stage].toLowerCase()} →`
          }
          onPress={() => {
            void d.run({ type: "advance" });
          }}
        />
      </Card>
      <Heading>Employee payroll</Heading>
      <Card>
        {active.map((person) => (
          <Row
            key={person.id}
            title={person.name}
            detail={person.dept}
            value={money(monthlyPayAmounts(person.ctc).net)}
          />
        ))}
      </Card>
    </Screen>
  );
}
