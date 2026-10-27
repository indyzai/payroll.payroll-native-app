import { expect, test } from "bun:test";
import {
  applyAuthorizedCommand,
  canManageWorkspace,
  visibleWorkspace,
} from "./access";
import { seed, type Request } from "./model";
const employee = { role: "Employee" as const, employeeId: "IZ001" };
const request: Request = {
  id: "OWN-REQUEST",
  employeeId: "IZ001",
  kind: "Expense",
  title: "Travel",
  amount: 50,
  days: 0,
  status: "Pending",
};
test("employees cannot read another employee salary or request through workspace state", () => {
  const original = seed();
  const shown = visibleWorkspace(original, employee);
  expect(shown.people.map((p) => p.id)).toEqual(["IZ001"]);
  expect(shown.requests.every((r) => r.employeeId === "IZ001")).toBe(true);
  expect(shown.requests.some((r) => r.employeeId === "IZ002")).toBe(false);
  expect(original.people.length).toBeGreaterThan(1);
});
test("employees may submit their own requests but cannot impersonate, review, or run payroll", () => {
  const state = seed();
  expect(
    applyAuthorizedCommand(state, { type: "request", request }, employee)
      .requests[0].employeeId,
  ).toBe("IZ001");
  expect(() =>
    applyAuthorizedCommand(
      state,
      { type: "request", request: { ...request, employeeId: "IZ002" } },
      employee,
    ),
  ).toThrow("own employee");
  expect(() =>
    applyAuthorizedCommand(
      state,
      { type: "review", id: "REQ-1001", approved: true },
      employee,
    ),
  ).toThrow("Only HR or Admin");
  expect(() =>
    applyAuthorizedCommand(state, { type: "advance" }, employee),
  ).toThrow("Only HR or Admin");
  expect(state.stage).toBe(0);
  expect(state.requests[0].status).toBe("Pending");
});
for (const role of ["HR", "Admin"] as const) {
  test(`${role} may review team requests and advance payroll after resolving blockers`, () => {
    let state = seed();
    for (const r of state.requests)
      state = applyAuthorizedCommand(
        state,
        { type: "review", id: r.id, approved: true },
        { role, employeeId: "IZ006" },
      );
    expect(
      applyAuthorizedCommand(
        state,
        { type: "advance" },
        { role, employeeId: "IZ006" },
      ).stage,
    ).toBe(1);
    expect(
      visibleWorkspace(state, { role, employeeId: "IZ006" }).people.length,
    ).toBeGreaterThan(1);
  });
}
test("workspace reset and failure controls belong only to Admin", () => {
  expect(canManageWorkspace("Employee")).toBe(false);
  expect(canManageWorkspace("HR")).toBe(false);
  expect(canManageWorkspace("Admin")).toBe(true);
});
