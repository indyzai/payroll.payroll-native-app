import { useState } from "react";
import { Pressable, ScrollView, Share, Text, View } from "react-native";
import {
  Button,
  Card,
  Heading,
  Row,
  Screen,
  usePayrollUi,
} from "@/components/mobile-ui";
import { useDemo } from "@/demo/provider";
import { money } from "@/demo/model";
import {
  financialYearMonths,
  financialYearPayRows,
  financialYearStart,
  financialYearLabel,
  indiaDateKey,
  monthLabel,
  payYearTotals,
  statusLabels,
  type PayAmounts,
} from "@/demo/pay-history";
const breakups: { key: keyof PayAmounts; label: string; total?: boolean }[] = [
  { key: "basic", label: "Basic salary" },
  { key: "hra", label: "HRA" },
  { key: "special", label: "Special allowance" },
  { key: "bonus", label: "Bonus" },
  { key: "gross", label: "Gross pay", total: true },
  { key: "pf", label: "Provident fund" },
  { key: "pt", label: "Professional tax" },
  { key: "tds", label: "TDS (demo)" },
  { key: "deductions", label: "Total deductions", total: true },
  { key: "net", label: "Take-home", total: true },
];
const headerHeight = 54;
const statusHeight = 64;
const rowHeight = 52;
export function EmployeePayOverview() {
  const { state, employeeId } = useDemo();
  const [tableWidth, setTableWidth] = useState(320);
  const compact = tableWidth < 500;
  const labelWidth = compact ? 100 : 144;
  const monthWidth = compact
    ? Math.max(84, Math.floor((tableWidth - labelWidth - 2) / 2))
    : 132;
  const { s, colors } = usePayrollUi();
  const today = indiaDateKey();
  const currentYear = financialYearStart(today);
  const [year, setYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [shareError, setShareError] = useState("");
  const person = state.people.find((p) => p.id === employeeId)!;
  const rows = financialYearPayRows(state, employeeId, year, today);
  const totals = payYearTotals(rows);
  const selected =
    rows.find((row) => row.month === selectedMonth) ??
    rows
      .slice()
      .reverse()
      .find((row) => row.status === "actual") ??
    rows[0];
  const earliestYear = Math.min(
    currentYear - 1,
    ...state.payHistory
      .filter((record) => record.employeeId === employeeId)
      .map((record) => financialYearStart(record.month + "-01")),
  );
  const latestYear = currentYear + 2;
  function chooseYear(next: number) {
    setYear(next);
    setSelectedMonth(
      financialYearMonths(next).includes(today.slice(0, 7))
        ? today.slice(0, 7)
        : "",
    );
    setShareError("");
  }
  async function share() {
    if (selected.status !== "actual" || !selected.amounts) return;
    const b = selected.amounts;
    setShareError("");
    try {
      await Share.share({
        title: `IndyzPay simulated payslip · ${monthLabel(selected.month)}`,
        message: `SIMULATED PAYSLIP — NOT A REAL PAYMENT RECORD\n${monthLabel(selected.month)} · ${financialYearLabel(year)}\n${person.name} · ${person.id}\nBasic: ${money(b.basic)}\nHRA: ${money(b.hra)}\nSpecial allowance: ${money(b.special)}\nBonus: ${money(b.bonus)}\nGross: ${money(b.gross)}\nPF: ${money(b.pf)}\nProfessional tax: ${money(b.pt)}\nTDS (demo): ${money(b.tds)}\nDeductions: ${money(b.deductions)}\nNet take-home: ${money(b.net)}\nCurrency: INR\nRecorded demo snapshot. Not a statutory statement.`,
      });
    } catch {
      setShareError("Could not share the payslip. Please try again.");
    }
  }
  const cell = {
    paddingHorizontal: compact ? 6 : 12,
    paddingVertical: 16,
    color: colors.ink,
    fontSize: compact ? 12 : 13,
  };
  return (
    <Screen
      title="Your pay, month by month."
      sub={`${person.name} · India · INR · April–March financial year`}
    >
      <Card>
        <View style={s.row}>
          <Text accessibilityRole="header" style={s.heading}>
            {financialYearLabel(year)}
          </Text>
          {year === currentYear && <Text style={s.value}>Current FY</Text>}
        </View>
        <Text style={s.small}>
          April {year} to March {year + 1}
        </Text>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Button
              title="← Previous FY"
              secondary
              disabled={year <= earliestYear}
              onPress={() => chooseYear(year - 1)}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Next FY →"
              secondary
              disabled={year >= latestYear}
              onPress={() => chooseYear(year + 1)}
            />
          </View>
        </View>
        {year !== currentYear && (
          <Button
            title="Return to current financial year"
            secondary
            onPress={() => chooseYear(currentYear)}
          />
        )}
        <Row
          title="Recorded actual take-home"
          detail={`${totals.actualMonths} paid demo months`}
          value={money(totals.actual)}
        />
        <Row
          title="Predicted / pending take-home"
          detail={`${totals.estimatedMonths} estimated months`}
          value={money(totals.estimated)}
        />
        <Row
          title="Total available take-home"
          detail="Recorded actuals + estimates"
          value={money(totals.combined)}
        />
        {totals.missingMonths > 0 && (
          <Text style={s.small}>
            {totals.missingMonths} month(s) have no recorded payment and are
            excluded from totals.
          </Text>
        )}
      </Card>
      <Heading>Monthly take-home table</Heading>
      <Text style={s.small}>
        Amounts in INR. Months run across the top; salary breakups stay fixed on the left. Swipe
        to compare all 12 months. Tap a month column for its detailed payslip
        below the table. Actuals are recorded demo payments; predictions are
        estimates.
      </Text>
      <View
        onLayout={({ nativeEvent }) => setTableWidth(nativeEvent.layout.width)}
        style={{
          flexDirection: "row",
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            width: labelWidth,
            flexShrink: 0,
            borderRightWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text
            accessibilityRole="header"
            style={[
              cell,
              {
                height: headerHeight,
                backgroundColor: colors.pale,
                fontWeight: "700",
                borderBottomWidth: 1,
                borderColor: colors.line,
              },
            ]}
          >
            Salary breakup
          </Text>
          <Text
            style={[
              cell,
              {
                height: statusHeight,
                color: colors.muted,
                borderBottomWidth: 1,
                borderColor: colors.line,
              },
            ]}
          >
            Record type
          </Text>
          {breakups.map((item) => (
            <Text
              key={item.key}
              accessibilityRole="header"
              style={[
                cell,
                {
                  height: rowHeight,
                  fontWeight: item.total ? "700" : "500",
                  backgroundColor:
                    item.key === "net" ? colors.pale : colors.surface,
                  color: item.key === "net" ? colors.green : colors.ink,
                  borderBottomWidth: 1,
                  borderColor: colors.line,
                },
              ]}
            >
              {item.label}
            </Text>
          ))}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ flex: 1 }}
          accessibilityLabel={`${financialYearLabel(year)} take-home table, months across columns and salary breakups down rows`}
        >
          <View style={{ flexDirection: "row" }}>
            {rows.map((row) => (
              <Pressable
                key={row.month}
                accessibilityRole="button"
                accessibilityState={{ selected: selected.month === row.month }}
                accessibilityLabel={`${monthLabel(row.month)}, ${statusLabels[row.status]}, take-home ${row.amounts ? money(row.amounts.net) : "not available"}. Select for salary details.`}
                onPress={() => {
                  setSelectedMonth(row.month);
                  setShareError("");
                }}
                style={({ pressed }) => ({
                  width: monthWidth,
                  borderRightWidth: 1,
                  borderColor: colors.line,
                  backgroundColor:
                    pressed || selected.month === row.month
                      ? colors.pale
                      : colors.surface,
                })}
              >
                <Text
                  accessibilityRole="header"
                  style={[
                    cell,
                    {
                      height: headerHeight,
                      textAlign: "center",
                      fontWeight: "700",
                      backgroundColor: colors.pale,
                      borderBottomWidth: 1,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  {compact ? monthLabel(row.month).split(" ")[0] : monthLabel(row.month)}
                </Text>
                <Text
                  style={[
                    cell,
                    {
                      height: statusHeight,
                      textAlign: "center",
                      color:
                        row.status === "actual" ? colors.green : colors.muted,
                      borderBottomWidth: 1,
                      borderColor: colors.line,
                    },
                  ]}
                >
                  {statusLabels[row.status]}
                </Text>
                {breakups.map((item) => (
                  <Text
                    key={item.key}
                    style={[
                      cell,
                      {
                        height: rowHeight,
                        textAlign: "right",
                        fontWeight: item.total ? "700" : "400",
                        color: item.key === "net" ? colors.green : colors.ink,
                        backgroundColor:
                          item.key === "net" ? colors.pale : undefined,
                        fontVariant: ["tabular-nums"],
                        borderBottomWidth: 1,
                        borderColor: colors.line,
                      },
                    ]}
                  >
                    {row.amounts
                      ? compact
                        ? Math.round(row.amounts[item.key]).toLocaleString("en-IN")
                        : money(row.amounts[item.key])
                      : "—"}
                  </Text>
                ))}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <Text style={s.small}>
        Recorded demo snapshots cover April 2025–September 2026. Completing the
        simulated payroll cycle records that month. Predictions assume current
        CTC, no raises/bonuses, continued employment, and illustrative 8% TDS.
        Missing past records are never predicted. These are simulations, not
        actual bank payments or tax advice.
      </Text>
      <Heading>{monthLabel(selected.month)} · Salary details</Heading>
      <Card dark>
        <Text style={{ color: "#BCD0C5" }}>
          {statusLabels[selected.status].toUpperCase()}
        </Text>
        <Text style={s.heroValue}>
          {selected.amounts ? money(selected.amounts.net) : "—"}
        </Text>
        <Text style={{ color: "#BCD0C5" }}>
          {selected.status === "actual"
            ? "Net take-home · recorded demo snapshot"
            : selected.amounts
              ? "Estimated net take-home · not a paid payslip"
              : "No payment record available for this month."}
        </Text>
      </Card>
      {selected.amounts && (
        <>
          <Card>
            <Row title="Basic salary" value={money(selected.amounts.basic)} />
            <Row
              title="House rent allowance"
              value={money(selected.amounts.hra)}
            />
            <Row
              title="Special allowance"
              value={money(selected.amounts.special)}
            />
            <Row title="Bonus" value={money(selected.amounts.bonus)} />
            <Row title="Gross earnings" value={money(selected.amounts.gross)} />
          </Card>
          <Card>
            <Row title="Provident fund" value={money(selected.amounts.pf)} />
            <Row title="Professional tax" value={money(selected.amounts.pt)} />
            <Row
              title="Income tax · demo estimate"
              value={money(selected.amounts.tds)}
            />
            <Row
              title="Total deductions"
              value={money(selected.amounts.deductions)}
            />
          </Card>
        </>
      )}
      {shareError ? (
        <Text accessibilityRole="alert" style={s.error}>
          {shareError}
        </Text>
      ) : null}
      <Button
        title="Share selected simulated payslip ↗"
        disabled={selected.status !== "actual"}
        onPress={share}
      />
      {selected.status !== "actual" && (
        <Text style={s.small}>
          Select an Actual (demo) month to share a recorded payslip. Predictions
          and pending estimates are not payment records.
        </Text>
      )}
    </Screen>
  );
}
