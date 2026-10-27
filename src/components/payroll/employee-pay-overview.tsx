import { useRef, useState, type ComponentRef } from "react";
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
const rowHeight = 72;
export function EmployeePayOverview() {
  const { state, employeeId } = useDemo();
  const [tableWidth, setTableWidth] = useState(320);
  const [labelsFloating, setLabelsFloating] = useState(false);
  const labelWidth = 112;
  const monthHeader = useRef<ComponentRef<typeof ScrollView>>(null);
  const compact = tableWidth < 500;
  const monthWidth = compact
    ? Math.max(92, Math.floor((tableWidth - 2) / 3))
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
        Amounts in INR. Breakup names start in the first column and float above the values when you swipe across months. Swipe
        to compare all 12 months. Month headers stay above the amounts; scroll down inside the table for more breakups. Tap a month column for its detailed payslip
        below the table. Actuals are recorded demo payments; predictions are
        estimates.
      </Text>
      <View
        onLayout={({ nativeEvent }) => setTableWidth(nativeEvent.layout.width)}
        style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 12,
          overflow: "hidden", backgroundColor: colors.surface }}
      >
        <View style={{ flexDirection: "row", backgroundColor: colors.pale,
          borderBottomWidth: 2, borderColor: colors.line, zIndex: 1 }}>
          <ScrollView ref={monthHeader} horizontal scrollEnabled={false}
            showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={[cell, { width: labelWidth, fontWeight: "700" }]}>Salary breakup</Text>
            {rows.map((row) => (
              <Pressable key={row.month} accessibilityRole="button"
                accessibilityLabel={`${monthLabel(row.month)}, ${statusLabels[row.status]}. Select salary details.`}
                accessibilityState={{ selected: selected.month === row.month }}
                onPress={() => { setSelectedMonth(row.month); setShareError(""); }}
                style={{ width: monthWidth, borderRightWidth: 1, borderColor: colors.line }}>
                <Text accessibilityRole="header" style={[cell, { height: headerHeight, textAlign: "center", fontWeight: "700" }]}>
                  {compact ? monthLabel(row.month).split(" ")[0] : monthLabel(row.month)}
                </Text>
                <Text style={[cell, { height: statusHeight, textAlign: "center",
                  color: row.status === "actual" ? colors.green : colors.muted }]}>{statusLabels[row.status]}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        <ScrollView nestedScrollEnabled style={{ height: rowHeight * 5 }}
          accessibilityLabel="Salary breakdown rows. Scroll vertically for more breakups.">
          <View>
            {/* Floating row labels occupy only the space above the amounts. */}
            <View pointerEvents="none" style={{ opacity: labelsFloating ? 1 : 0, position: "absolute", left: 0, right: 0,
              top: 0, zIndex: 2 }}>
              {breakups.map((item) => (
                <View key={item.key} style={{ height: rowHeight, alignItems: "flex-start" }}>
                  <Text accessibilityRole="header" style={{ marginLeft: 8, marginTop: 5,
                    paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
                    fontSize: 12, fontWeight: item.total ? "700" : "500",
                    backgroundColor: colors.surface,
                    color: item.key === "net" ? colors.green : colors.muted,
                  }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <ScrollView horizontal nestedScrollEnabled directionalLockEnabled
              scrollEventThrottle={16} bounces={false}
              onScroll={({ nativeEvent }) => {
                const x = nativeEvent.contentOffset.x;
                setLabelsFloating(x > 1);
                monthHeader.current?.scrollTo({ x, animated: false });
              }}
              style={{ width: Math.max(0, tableWidth - 2), flexGrow: 0 }} showsHorizontalScrollIndicator
              accessibilityLabel={`${financialYearLabel(year)} salary amounts. Swipe horizontally to compare months.`}>
              <View style={{ width: labelWidth }}>
                {breakups.map((item) => (
                  <Text key={item.key} accessibilityRole="header"
                    style={[cell, { height: rowHeight, paddingTop: 34,
                      fontWeight: item.total ? "700" : "500", borderBottomWidth: 1,
                      borderRightWidth: 1, borderColor: colors.line,
                      color: item.key === "net" ? colors.green : colors.ink,
                    }]}>{item.label}</Text>
                ))}
              </View>
              {rows.map((row) => (
                <Pressable key={row.month} accessibilityRole="button"
                  accessibilityState={{ selected: selected.month === row.month }}
                  accessibilityLabel={`${monthLabel(row.month)}, ${statusLabels[row.status]}, take-home ${row.amounts ? money(row.amounts.net) : "not available"}. Select salary details.`}
                  onPress={() => { setSelectedMonth(row.month); setShareError(""); }}
                  style={({ pressed }) => ({ width: monthWidth, borderRightWidth: 1,
                    borderColor: colors.line, backgroundColor: pressed || selected.month === row.month ? colors.pale : colors.surface })}>
                  {breakups.map((item) => (
                    <Text key={item.key} style={[cell, { height: rowHeight, paddingTop: 34, paddingBottom: 12, textAlign: "right",
                      fontWeight: item.total ? "700" : "400", color: item.key === "net" ? colors.green : colors.ink,
                      backgroundColor: item.key === "net" ? colors.pale : undefined,
                      fontVariant: ["tabular-nums"], borderBottomWidth: 1, borderColor: colors.line,
                    }]}>{row.amounts ? compact ? Math.round(row.amounts[item.key]).toLocaleString("en-IN") : money(row.amounts[item.key]) : "—"}</Text>
                  ))}
                </Pressable>
              ))}
            </ScrollView>
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
