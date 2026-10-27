import {
  seedPayHistory,
  monthlyPayAmounts,
  type PayRecord,
} from "./pay-history";
import { breakdown, employees } from "./source";
export { breakdown };
export type Request = {
  id: string;
  employeeId: string;
  kind: "Leave" | "Expense";
  title: string;
  amount: number;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  from?: string;
  to?: string;
};
export type Workspace = {
  payrollMonth: string;
  payHistory: PayRecord[];
  people: typeof employees;
  requests: Request[];
  stage: number;
  paid: boolean;
};
export type Command =
  | { type: "request"; request: Request }
  | { type: "review"; id: string; approved: boolean }
  | { type: "advance" };
export const stages = [
  "Inputs",
  "Validate",
  "Review",
  "Approve",
  "Disburse",
  "Complete",
];
export function seed(): Workspace {
  return {
    payrollMonth: "2026-10",
    payHistory: seedPayHistory(employees),
    people: employees.map((p) => ({ ...p })),
    stage: 0,
    paid: false,
    requests: [
      {
        id: "REQ-1001",
        employeeId: "IZ001",
        kind: "Expense",
        title: "Client visit · travel",
        amount: 12400,
        days: 0,
        status: "Pending",
      },
      {
        id: "REQ-1002",
        employeeId: "IZ002",
        kind: "Leave",
        title: "Annual leave",
        amount: 0,
        days: 2,
        from: "2026-11-02",
        to: "2026-11-03",
        status: "Pending",
      },
    ],
  };
}
export const money = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
export function leaveAvailable(state: Workspace, id: string) {
  return (
    24 -
    state.requests
      .filter(
        (r) =>
          r.employeeId === id && r.kind === "Leave" && r.status !== "Rejected",
      )
      .reduce((n, r) => n + r.days, 0)
  );
}
export function dateDays(from: string, to: string) {
  const parse = (v: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw Error("Use YYYY-MM-DD dates.");
    const date = new Date(v + "T00:00:00Z");
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== v
    )
      throw Error("Enter a valid calendar date.");
    return date.getTime();
  };
  const days = (parse(to) - parse(from)) / 86400000 + 1;
  if (days <= 0 || days > 366)
    throw Error("Choose an end date on or after the start, within one year.");
  return days;
}
export function applyCommand(state: Workspace, command: Command): Workspace {
  if (command.type === "request") {
    const r = command.request;
    if (
      !state.people.some((p) => p.id === r.employeeId) ||
      !r.title.trim() ||
      r.title.length > 160
    )
      throw Error(
        "Select an employee and enter a description (up to 160 characters).",
      );
    if (state.requests.some((x) => x.id === r.id))
      throw Error("This request already exists.");
    if (
      r.kind === "Expense" &&
      (!Number.isFinite(r.amount) || r.amount <= 0 || r.amount > 1000000)
    )
      throw Error("Enter an amount between ₹1 and ₹10,00,000.");
    if (r.kind === "Leave") {
      const days = dateDays(r.from ?? "", r.to ?? "");
      if (days !== r.days || days > leaveAvailable(state, r.employeeId))
        throw Error("Not enough leave available.");
      if (
        state.requests.some(
          (x) =>
            x.kind === "Leave" &&
            x.employeeId === r.employeeId &&
            x.status !== "Rejected" &&
            x.from! <= r.to! &&
            x.to! >= r.from!,
        )
      )
        throw Error("These dates overlap an existing leave request.");
    }
    return {
      ...state,
      requests: [{ ...r, status: "Pending" }, ...state.requests],
    };
  }
  if (command.type === "review") {
    const request = state.requests.find((r) => r.id === command.id);
    if (!request || request.status !== "Pending")
      throw Error("Only pending requests can be reviewed.");
    return {
      ...state,
      requests: state.requests.map((r) =>
        r.id === command.id
          ? { ...r, status: command.approved ? "Approved" : "Rejected" }
          : r,
      ),
    };
  }
  if (state.paid) throw Error("This payroll cycle is complete.");
  if (state.requests.some((r) => r.status === "Pending"))
    throw Error("Review pending requests before advancing payroll.");
  const completing = state.stage === 4;
  const snapshots: PayRecord[] = completing
    ? state.people
        .filter((person) => person.status !== "Exited")
        .map((person) => ({
          employeeId: person.id,
          month: state.payrollMonth,
          currency: "INR",
          source: "payroll",
          amounts: monthlyPayAmounts(person.ctc),
        }))
    : [];
  return {
    ...state,
    stage: state.stage + 1,
    paid: completing,
    payHistory: completing
      ? [
          ...state.payHistory.filter(
            (record) =>
              record.month !== state.payrollMonth ||
              !snapshots.some(
                (snapshot) => snapshot.employeeId === record.employeeId,
              ),
          ),
          ...snapshots,
        ]
      : state.payHistory,
  };
}
