import { useState } from "react";
import { Text, View } from "react-native";
import {
  Button,
  Card,
  Field,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { dateDays, leaveAvailable, money, Request } from "@/demo/model";
import { useDemo } from "@/demo/provider";
export default function Requests() {
  const { s } = usePayrollUi();
  const d = useDemo();
  const [kind, setKind] = useState<"Leave" | "Expense">("Leave");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  async function submit() {
    setError("");
    try {
      const request: Request = {
        id: `REQ-${Date.now()}`,
        employeeId: d.employeeId,
        kind,
        title: title.trim(),
        amount: kind === "Expense" ? Number(amount) : 0,
        days: kind === "Leave" ? dateDays(from, to) : 0,
        status: "Pending",
        ...(kind === "Leave" ? { from, to } : {}),
      };
      if (await d.run({ type: "request", request })) {
        setTitle("");
        setAmount("");
        setFrom("");
        setTo("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const requests = d.state.requests.filter(
    (r) => d.portal !== "Employee" || r.employeeId === d.employeeId,
  );
  return (
    <Screen
      title={
        d.portal === "Employee"
          ? "Make room for life."
          : "Keep your team moving."
      }
      sub={
        d.portal === "Employee"
          ? "Leave, expenses, and a little less paperwork."
          : "Review requests · Changes appear in employee workspaces."
      }
    >
      {d.portal === "Employee" ? (
        <>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Button
                title="Annual leave"
                secondary={kind !== "Leave"}
                onPress={() => setKind("Leave")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Expense claim"
                secondary={kind !== "Expense"}
                onPress={() => setKind("Expense")}
              />
            </View>
          </View>
          <Card>
            <Heading>
              {kind === "Leave" ? "A well-earned break." : "Claim an expense."}
            </Heading>
            {kind === "Leave" ? (
              <>
                <Text style={s.small}>
                  {leaveAvailable(d.state, d.employeeId)} days available ·
                  Pending requests reserve balance. Calendar days are counted.
                </Text>
                <Field
                  label="From · YYYY-MM-DD"
                  value={from}
                  onChangeText={setFrom}
                  placeholder="2026-11-02"
                />
                <Field
                  label="To · YYYY-MM-DD"
                  value={to}
                  onChangeText={setTo}
                  placeholder="2026-11-03"
                />
              </>
            ) : (
              <Field
                label="Amount · INR"
                value={amount}
                onChangeText={setAmount}
                numeric
                placeholder="0.00"
              />
            )}
            <Field
              label={
                kind === "Leave" ? "Reason for leave" : "Expense description"
              }
              value={title}
              onChangeText={setTitle}
              placeholder={
                kind === "Leave"
                  ? "A few days with family"
                  : "Client visit · travel"
              }
            />
            {error ? (
              <Text accessibilityRole="alert" style={s.error}>
                {error}
              </Text>
            ) : null}
            <Button title="Submit for approval →" onPress={submit} />
          </Card>
        </>
      ) : null}
      <Heading>
        {d.portal !== "Employee" ? "Team requests" : "Your requests"}
      </Heading>
      {requests.length === 0 ? (
        <Card>
          <Text style={s.small}>
            No requests yet. Your submitted requests will appear here.
          </Text>
        </Card>
      ) : (
        requests.map((r) => (
          <Card key={r.id}>
            <Row
              title={r.title}
              detail={`${r.kind} · ${d.state.people.find((p) => p.id === r.employeeId)?.name}`}
              value={r.status}
            />
            <Text style={s.small}>
              {r.kind === "Leave"
                ? `${r.from} → ${r.to} · ${r.days} days`
                : money(r.amount)}{" "}
              · {r.id}
            </Text>
            {d.portal !== "Employee" && r.status === "Pending" ? (
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Approve"
                    onPress={() => {
                      void d.run({ type: "review", id: r.id, approved: true });
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Reject"
                    secondary
                    onPress={() => {
                      void d.run({ type: "review", id: r.id, approved: false });
                    }}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        ))
      )}
    </Screen>
  );
}
