import { usePayrollSession } from "@/auth/session";
import { useState } from "react";
import { Text } from "react-native";
import { Card, Field, Row, Screen, usePayrollUi } from "@/components/mobile-ui";
import { useDemo } from "@/demo/provider";
export default function People() {
  const { session } = usePayrollSession();
  const { s } = usePayrollUi();
  const d = useDemo();
  const [search, setSearch] = useState("");
  const people = d.state.people.filter((p) =>
    `${p.name} ${p.dept} ${p.id}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Screen
      title="Good people. One team."
      sub={`${session?.tenant.name} · Demo employee directory`}
    >
      <Field
        label="Search people"
        placeholder="Name, department, or employee ID"
        value={search}
        onChangeText={setSearch}
      />
      {people.length === 0 ? (
        <Text style={s.small}>No people match your search.</Text>
      ) : (
        people.map((p) => (
          <Card key={p.id}>
            <Row title={p.name} detail={`${p.role} · ${p.dept}`} value={p.id} />
            <Text style={s.small}>
              {p.status} · Joined {p.joined}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}
