import { expect, test } from "bun:test";
import { applyCommand, seed } from "./model";
import { visibleWorkspace } from "./access";
import {
  financialYearMonths,
  financialYearPayRows,
  financialYearStart,
  indiaDateKey,
  latestRecordedPay,
  monthlyPayAmounts,
  payYearTotals,
} from "./pay-history";
const today = "2026-10-27";
test("India financial year switches at April 1, including India-time midnight", () => {
  expect(financialYearStart("2026-03-31")).toBe(2025);
  expect(financialYearStart("2026-04-01")).toBe(2026);
  expect(indiaDateKey(new Date("2026-03-31T18:29:59Z"))).toBe("2026-03-31");
  expect(indiaDateKey(new Date("2026-03-31T18:30:00Z"))).toBe("2026-04-01");
  expect(() => financialYearStart("2026-02-30")).toThrow();
  expect(financialYearMonths(2026)).toEqual([
    "2026-04",
    "2026-05",
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
    "2026-12",
    "2027-01",
    "2027-02",
    "2027-03",
  ]);
});
test("current FY distinguishes recorded actuals, pending current month, and future predictions", () => {
  const rows = financialYearPayRows(seed(), "IZ001", 2026, today);
  expect(rows.filter((row) => row.status === "actual")).toHaveLength(6);
  expect(rows.find((row) => row.month === "2026-10")?.status).toBe("pending");
  expect(rows.filter((row) => row.status === "prediction")).toHaveLength(5);
  expect(payYearTotals(rows)).toMatchObject({
    actual: 1092000,
    estimated: 1092000,
    combined: 2184000,
    actualMonths: 6,
    estimatedMonths: 6,
    missingMonths: 0,
  });
});
test("previous financial year uses recorded historical salary and variable bonus snapshots", () => {
  const rows = financialYearPayRows(seed(), "IZ001", 2025, today);
  expect(rows.every((row) => row.status === "actual")).toBe(true);
  expect(
    rows.find((row) => row.month === "2025-10")!.amounts!.bonus,
  ).toBeGreaterThan(0);
  expect(
    rows.find((row) => row.month === "2026-03")!.amounts!.bonus,
  ).toBeGreaterThan(0);
  expect(rows[0].amounts!.gross).toBeLessThan(monthlyPayAmounts(2400000).gross);
  expect(payYearTotals(rows).estimated).toBe(0);
});
test("salary changes update forecasts without rewriting historical actuals", () => {
  const original = seed();
  const previous = financialYearPayRows(original, "IZ001", 2026, today);
  const revised = {
    ...original,
    people: original.people.map((p) =>
      p.id === "IZ001" ? { ...p, ctc: 3000000 } : p,
    ),
  };
  const next = financialYearPayRows(revised, "IZ001", 2026, today);
  expect(next.find((row) => row.month === "2026-04")!.amounts).toEqual(
    previous.find((row) => row.month === "2026-04")!.amounts,
  );
  expect(
    next.find((row) => row.month === "2026-11")!.amounts!.net,
  ).toBeGreaterThan(
    previous.find((row) => row.month === "2026-11")!.amounts!.net,
  );
  expect(original.payHistory).toEqual(revised.payHistory);
});
test("missing past records remain missing instead of being filled with present salary", () => {
  const state = seed();
  state.payHistory = state.payHistory.filter(
    (r) => !(r.employeeId === "IZ001" && r.month === "2026-05"),
  );
  const rows = financialYearPayRows(state, "IZ001", 2026, today);
  const missing = rows.find((row) => row.month === "2026-05")!;
  expect(missing.status).toBe("missing");
  expect(missing.amounts).toBeNull();
  expect(payYearTotals(rows).missingMonths).toBe(1);
  expect(
    financialYearPayRows(state, "IZ001", 2024, today).every(
      (row) => row.status === "missing",
    ),
  ).toBe(true);
});
test("future years are predictions, and future-dated records cannot masquerade as actuals", () => {
  const state = seed();
  state.payHistory.push({
    employeeId: "IZ001",
    month: "2027-06",
    currency: "INR",
    source: "payroll",
    amounts: monthlyPayAmounts(9999999),
  });
  const rows = financialYearPayRows(state, "IZ001", 2027, today);
  expect(rows.every((row) => row.status === "prediction")).toBe(true);
  expect(rows[2].amounts!.gross).toBe(200000);
  expect(latestRecordedPay(state, "IZ001", today)?.month).toBe("2026-09");
});
test("months before employment have no pay, and exited staff do not get new predictions", () => {
  const state = seed();
  state.people = state.people.map((person) =>
    person.id === "IZ001" ? { ...person, joined: "2026-08-01" } : person,
  );
  expect(
    financialYearPayRows(state, "IZ001", 2026, today)
      .slice(0, 4)
      .every((row) => row.status === "not-employed" && row.amounts === null),
  ).toBe(true);
  expect(
    financialYearPayRows(state, "IZ008", 2027, today).every(
      (row) => row.status === "missing" && row.amounts === null,
    ),
  ).toBe(true);
});
test("every displayed component reconciles to gross, deductions, and take-home in whole rupees", () => {
  for (const ctc of [1100000, 1300000, 1600000, 2400000]) {
    const b = monthlyPayAmounts(ctc, 12450.5);
    expect(b.basic + b.hra + b.special + b.bonus).toBe(b.gross);
    expect(b.pf + b.pt + b.tds).toBe(b.deductions);
    expect(b.gross - b.deductions).toBe(b.net);
    expect(Object.values(b).every(Number.isInteger)).toBe(true);
  }
});
test("simulated disbursement records an immutable current-month snapshot once", () => {
  let state = seed();
  for (const r of state.requests)
    state = applyCommand(state, { type: "review", id: r.id, approved: true });
  for (let index = 0; index < 4; index++)
    state = applyCommand(state, { type: "advance" });
  expect(state.payHistory.some((r) => r.month === "2026-10")).toBe(false);
  state = applyCommand(state, { type: "advance" });
  expect(
    financialYearPayRows(state, "IZ001", 2026, today).find(
      (row) => row.month === "2026-10",
    )!.status,
  ).toBe("actual");
  expect(
    state.payHistory.filter(
      (r) => r.employeeId === "IZ001" && r.month === "2026-10",
    ),
  ).toHaveLength(1);
  expect(() => applyCommand(state, { type: "advance" })).toThrow();
  expect(
    state.payHistory
      .filter((r) => r.month === "2026-10")
      .every(
        (r) =>
          state.people.find((p) => p.id === r.employeeId)?.status !== "Exited",
      ),
  ).toBe(true);
});
test("employee financial history is scoped to their own records", () => {
  const state = visibleWorkspace(seed(), {
    role: "Employee",
    employeeId: "IZ001",
  });
  expect(state.payHistory.length).toBeGreaterThan(0);
  expect(
    state.payHistory.every((record) => record.employeeId === "IZ001"),
  ).toBe(true);
  expect(
    financialYearPayRows(state, "IZ002", 2026, today).every(
      (row) => row.amounts === null,
    ),
  ).toBe(true);
});
