import React from "react";
import { BrandMark } from "./app-icon";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDemo } from "@/demo/provider";
export const colors = {
  bg: "#F7F8F2",
  ink: "#173E34",
  green: "#18664F",
  muted: "#738078",
  line: "#E2E7DD",
  pale: "#EAF0E5",
  gold: "#E4BB69",
};
export function Screen({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  const d = useDemo();
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.row}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <BrandMark />
            <Text style={s.brand}>
              indyzpay<Text style={{ color: colors.green }}>.</Text>
            </Text>
          </View>
          <View style={s.badge}>
            <Text style={s.small}>INDIA · DEMO</Text>
          </View>
        </View>
        <View style={[s.row, { marginTop: 16 }]}>
          {(["Employee", "HR"] as const).map((p) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: d.portal === p }}
              key={p}
              onPress={() => d.setPortal(p)}
              style={[s.segment, d.portal === p && s.selected]}
            >
              <Text
                style={{
                  color: d.portal === p ? "white" : colors.muted,
                  fontWeight: "600",
                }}
              >
                {p === "HR" ? "HR workspace" : "My workspace"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.eyebrow}>PAYROLL, WITH PEACE OF MIND</Text>
        <Text accessibilityRole="header" style={s.title}>
          {title}
        </Text>
        <Text style={s.sub}>{sub}</Text>
        {d.error ? (
          <Text accessibilityRole="alert" style={s.error}>
            {d.error}
          </Text>
        ) : null}
        {d.notice ? (
          <Text accessibilityLiveRegion="polite" style={s.notice}>
            {d.notice}
          </Text>
        ) : null}
        {children}
        <Text style={s.footer}>
          A simulated workspace. No real payments or statutory filings.{"\n"}
          Data resets when the app restarts.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <View
      style={[
        s.card,
        dark && { backgroundColor: colors.ink, borderColor: colors.ink },
      ]}
    >
      {children}
    </View>
  );
}
export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const { busy } = useDemo();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        (pressed || disabled || busy) && { opacity: 0.5 },
      ]}
    >
      <Text
        style={{
          color: secondary ? colors.green : "white",
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {busy ? "Please wait…" : title}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  numeric = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  numeric?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Label>{label}</Label>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={numeric ? "decimal-pad" : "default"}
        autoCapitalize="none"
        style={s.input}
      />
    </View>
  );
}
export function Row({
  title,
  detail,
  value,
}: {
  title: string;
  detail?: string;
  value?: string;
}) {
  return (
    <View style={s.listRow}>
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={s.body}>{title}</Text>
        {detail ? <Text style={s.small}>{detail}</Text> : null}
      </View>
      {value ? <Text style={s.value}>{value}</Text> : null}
    </View>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: {
    padding: 24,
    gap: 16,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 36,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  brand: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 26,
    letterSpacing: -1,
  },
  badge: { padding: 8, borderRadius: 6, backgroundColor: colors.pale },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  segment: {
    flex: 1,
    padding: 13,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: colors.pale,
  },
  selected: { backgroundColor: colors.green },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: colors.green,
    marginTop: 16,
  },
  title: {
    fontSize: 36,
    fontFamily: "Georgia",
    color: colors.ink,
    letterSpacing: -1,
  },
  sub: { color: colors.muted, lineHeight: 22, marginTop: -8 },
  card: {
    padding: 22,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 14,
  },
  heading: { color: colors.ink, fontSize: 20, fontWeight: "600", marginTop: 8 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  body: { color: colors.ink, fontSize: 15, fontWeight: "500" },
  value: { color: colors.green, fontWeight: "600", fontSize: 15 },
  heroValue: {
    color: "white",
    fontSize: 42,
    letterSpacing: -1,
    fontWeight: "500",
  },
  button: {
    minHeight: 48,
    padding: 14,
    borderRadius: 9,
    justifyContent: "center",
    backgroundColor: colors.green,
  },
  secondary: { backgroundColor: colors.pale },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: 14,
    color: colors.ink,
    backgroundColor: "#FFF",
    minHeight: 48,
  },
  listRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  error: {
    color: "#9C3030",
    padding: 14,
    backgroundColor: "#FBE9E5",
    borderRadius: 8,
    lineHeight: 21,
  },
  notice: {
    color: colors.green,
    padding: 14,
    backgroundColor: colors.pale,
    borderRadius: 8,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: colors.muted,
    lineHeight: 19,
    marginTop: 16,
  },
});
