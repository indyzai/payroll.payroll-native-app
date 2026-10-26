import { useState } from "react";
import { Text } from "react-native";
import { Button, Card, Field, Row, Screen, s } from "@/components/mobile-ui";
import { useDemo } from "@/demo/provider";
export default function People() {
  const d = useDemo();
  const [search, setSearch] = useState("");
  const people = d.state.people.filter((p) =>
    `${p.name} ${p.dept} ${p.id}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <Screen
      title="Good people. One team."
      sub="Indyz Technologies · Employee directory"
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
            <Button
              title={
                d.employeeId === p.id
                  ? "Current demo employee"
                  : "View as demo employee"
              }
              disabled={d.employeeId === p.id}
              secondary
              onPress={() => {
                d.setEmployeeId(p.id);
                d.setPortal("Employee");
              }}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
