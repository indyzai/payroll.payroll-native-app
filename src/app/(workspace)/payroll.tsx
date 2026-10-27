import { useState } from "react";
import { Share, Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { breakdown, money, stages } from "@/demo/model";
import { useDemo } from "@/demo/provider";
export default function Payroll() {
  const { s, colors } = usePayrollUi();
  const d = useDemo();
  const [shareError, setShareError] = useState("");
  const p = d.state.people.find((p) => p.id === d.employeeId)!;
  const b = breakdown(p.ctc);
  async function share() {
    try {
      await Share.share({
        title: "IndyzPay simulated payslip",
        message: `SIMULATED PAYSLIP — NOT A PAYMENT RECORD\nSeptember 2026\n${p.name} · ${p.id}\nGross: ${money(b.gross)}\nDeductions: ${money(b.ded)}\nNet: ${money(b.net)}\nCurrency: INR\nDemo estimate, not statutory advice.`,
      });
    } catch {
      setShareError("Could not share the payslip. Please try again.");
    }
  }
  const active = d.state.people.filter((p) => p.status !== "Exited");
  return (
    <Screen
      title={
        d.portal === "Employee" ? "Your pay, explained." : "Make payday happen."
      }
      sub={
        d.portal === "Employee"
          ? "September 2026 · Simulated salary statement"
          : "October 2026 · India · INR"
      }
    >
      {d.portal === "Employee" ? (
        <>
          <Card dark>
            <Text style={{ color: "#BCD0C5" }}>NET TAKE-HOME</Text>
            <Text style={s.heroValue}>{money(b.net)}</Text>
            <Text style={{ color: "#BCD0C5" }}>
              {p.name} · {p.id}
            </Text>
          </Card>
          <Heading>Earnings</Heading>
          <Card>
            <Row title="Basic salary" value={money(b.basic)} />
            <Row title="House rent allowance" value={money(b.hra)} />
            <Row title="Special allowance" value={money(b.special)} />
            <Row title="Gross earnings" value={money(b.gross)} />
          </Card>
          <Heading>Deductions · demo estimates</Heading>
          <Card>
            <Row title="Provident fund" value={money(b.pf)} />
            <Row title="Professional tax" value={money(b.pt)} />
            <Row title="Income tax (illustrative 8%)" value={money(b.tds)} />
            <Row title="Total deductions" value={money(b.ded)} />
          </Card>
          {shareError ? <Text style={s.error}>{shareError}</Text> : null}
          <Button title="Share simulated payslip ↗" onPress={share} />
        </>
      ) : (
        <>
          <Card dark>
            <Text style={{ color: "#BCD0C5" }}>ESTIMATED NET PAYROLL</Text>
            <Text style={s.heroValue}>
              {money(active.reduce((n, p) => n + breakdown(p.ctc).net, 0))}
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
                  {i < d.state.stage || d.state.paid ? "✓" : `${i + 1}.`}{" "}
                  {stage}
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
              reimbursements are tracked separately from salary.
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
            {active.map((p) => (
              <Row
                key={p.id}
                title={p.name}
                detail={p.dept}
                value={money(breakdown(p.ctc).net)}
              />
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}
