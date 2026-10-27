import { expect, test } from "bun:test";
import { accessForSession, canOpenScreen } from "./access";
import { demoAccounts, demoLogin, demoPassword } from "./demo-accounts";
import type { IdentitySession } from "./identity-client";
for (const account of demoAccounts) {
  test(`${account.role} demo receives only its signed-in workspace capabilities`, () => {
    const access = accessForSession(demoLogin(account.email, demoPassword));
    expect(access.role).toBe(account.role);
    expect(access.canManagePayroll).toBe(account.role !== "Employee");
    expect(access.canManageWorkspace).toBe(account.role === "Admin");
    expect(canOpenScreen(access.role, "people")).toBe(
      account.role !== "Employee",
    );
    expect(canOpenScreen(access.role, "settings")).toBe(true);
  });
}
test("real access comes from the selected canonical membership, not presentation portal", () => {
  const base: IdentitySession = {
    kind: "identity",
    user: { id: "u", email: "u@example.test", tenants: [] },
    tenant: { id: "t", name: "Org", role: "member" },
    name: "User",
    email: "u@example.test",
    portal: "Employee",
  };
  for (const role of ["owner", "ADMIN"])
    expect(
      accessForSession({ ...base, tenant: { ...base.tenant, role } }).role,
    ).toBe("Admin");
  for (const role of ["hr", "HR Manager", "payroll_manager"])
    expect(
      accessForSession({ ...base, tenant: { ...base.tenant, role } }).role,
    ).toBe("HR");
  for (const role of ["member", "manager", "cashier", "guest", "unknown", ""])
    expect(
      accessForSession({
        ...base,
        tenant: { ...base.tenant, role },
        portal: "Admin" as never,
      }).role,
    ).toBe("Employee");
});
