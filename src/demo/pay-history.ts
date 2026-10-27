import { breakdown, type Employee } from "./source";
import type { Workspace } from "./model";
export type PayAmounts = {
  basic: number;
  hra: number;
  special: number;
  bonus: number;
  gross: number;
  pf: number;
  pt: number;
  tds: number;
  deductions: number;
  net: number;
};
export type PayRecord = {
  employeeId: string;
  month: string;
  currency: "INR";
  source: "seed" | "payroll";
  amounts: PayAmounts;
};
export type PayRowStatus =
  "actual" | "pending" | "prediction" | "missing" | "not-employed";
export type MonthlyPayRow = {
  month: string;
  status: PayRowStatus;
  amounts: PayAmounts | null;
};
export const statusLabels: Record<PayRowStatus, string> = {
  actual: "Actual (demo)",
  pending: "Pending estimate",
  prediction: "Prediction",
  missing: "No record",
  "not-employed": "Not employed",
};
const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export function indiaDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function financialYearStart(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey))
    throw Error("A YYYY-MM-DD date is required.");
  const date = new Date(dateKey + "T00:00:00Z");
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateKey
  )
    throw Error("Invalid calendar date.");
  const year = Number(dateKey.slice(0, 4));
  return Number(dateKey.slice(5, 7)) >= 4 ? year : year - 1;
}
export const financialYearLabel = (start: number) =>
  `FY ${start}–${String(start + 1).slice(-2)}`;
export function financialYearMonths(start: number) {
  if (!Number.isInteger(start) || start < 1900 || start > 9998)
    throw Error("Invalid financial year.");
  return Array.from({ length: 12 }, (_, index) => {
    const monthIndex = index + 3;
    return `${start + Math.floor(monthIndex / 12)}-${String((monthIndex % 12) + 1).padStart(2, "0")}`;
  });
}
export function monthLabel(month: string) {
  return `${monthNames[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}
// Round components once, and balance the residual in special allowance so each displayed row reconciles.
export function monthlyPayAmounts(ctc: number, bonus = 0): PayAmounts {
  const base = breakdown(ctc);
  const basic = Math.round(base.basic);
  const hra = Math.round(base.hra);
  const special = Math.round(base.gross) - basic - hra;
  const roundedBonus = Math.round(bonus);
  const gross = basic + hra + special + roundedBonus;
  const pf = Math.round(base.pf);
  const pt = Math.round(base.pt);
  const tds = Math.round(base.tds + roundedBonus * 0.08);
  const deductions = pf + pt + tds;
  return {
    basic,
    hra,
    special,
    bonus: roundedBonus,
    gross,
    pf,
    pt,
    tds,
    deductions,
    net: gross - deductions,
  };
}
export function seedPayHistory(people: Employee[]): PayRecord[] {
  // Explicit fixture payments, not live payroll. Never extend this range based on the device date.
  const months = [
    ...financialYearMonths(2025),
    ...financialYearMonths(2026).slice(0, 6),
  ];
  return people
    .filter((person) => person.status !== "Exited")
    .flatMap((person) =>
      months
        .filter((month) => month >= person.joined.slice(0, 7))
        .map((month) => {
          const historicalCtc =
            month < "2026-04" ? person.ctc * 0.94 : person.ctc;
          const bonus =
            month === "2025-10"
              ? (historicalCtc / 12) * 0.05
              : month === "2026-03"
                ? (historicalCtc / 12) * 0.1
                : 0;
          return {
            employeeId: person.id,
            month,
            currency: "INR" as const,
            source: "seed" as const,
            amounts: monthlyPayAmounts(historicalCtc, bonus),
          };
        }),
    );
}
export function latestRecordedPay(
  state: Workspace,
  employeeId: string,
  today: string,
) {
  financialYearStart(today);
  return state.payHistory
    .filter(
      (record) =>
        record.employeeId === employeeId && record.month <= today.slice(0, 7),
    )
    .sort((a, b) => b.month.localeCompare(a.month))[0];
}
export function financialYearPayRows(
  state: Workspace,
  employeeId: string,
  start: number,
  today: string,
): MonthlyPayRow[] {
  financialYearStart(today);
  const currentMonth = today.slice(0, 7);
  const person = state.people.find((p) => p.id === employeeId);
  if (!person)
    return financialYearMonths(start).map((month) => ({
      month,
      status: "missing",
      amounts: null,
    }));
  const records = new Map(
    state.payHistory
      .filter(
        (r) =>
          r.employeeId === employeeId &&
          r.currency === "INR" &&
          r.month <= currentMonth,
      )
      .map((r) => [r.month, r]),
  );
  return financialYearMonths(start).map((month) => {
    if (month < person.joined.slice(0, 7))
      return { month, status: "not-employed", amounts: null };
    const recorded = records.get(month);
    if (recorded)
      return { month, status: "actual", amounts: { ...recorded.amounts } };
    if (month < currentMonth || person.status === "Exited")
      return { month, status: "missing", amounts: null };
    return {
      month,
      status: month === currentMonth ? "pending" : "prediction",
      amounts: monthlyPayAmounts(person.ctc),
    };
  });
}
export function payYearTotals(rows: MonthlyPayRow[]) {
  const actual = rows.filter((row) => row.status === "actual");
  const estimated = rows.filter(
    (row) => row.status === "pending" || row.status === "prediction",
  );
  const sum = (items: MonthlyPayRow[]) =>
    items.reduce((total, row) => total + (row.amounts?.net ?? 0), 0);
  return {
    actual: sum(actual),
    estimated: sum(estimated),
    combined: sum(actual) + sum(estimated),
    actualMonths: actual.length,
    estimatedMonths: estimated.length,
    missingMonths: rows.filter((row) => row.status === "missing").length,
  };
}
