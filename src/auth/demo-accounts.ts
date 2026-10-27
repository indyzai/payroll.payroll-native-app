import type { IdentitySession } from "./identity-client";
export type DemoRole = "Employee" | "HR" | "Admin";
export const demoPassword = "DemoPay2026!";
export const demoAccounts = [
  {
    role: "Employee",
    email: "employee@demo.indyzpay.test",
    name: "Aarav Sharma",
    employeeId: "IZ001",
  },
  {
    role: "HR",
    email: "hr@demo.indyzpay.test",
    name: "Ananya Rao",
    employeeId: "IZ006",
  },
  {
    role: "Admin",
    email: "admin@demo.indyzpay.test",
    name: "Demo Administrator",
    employeeId: "IZ004",
  },
] as const;
export type DemoSession = Omit<IdentitySession, "kind" | "portal"> & {
  kind: "demo";
  portal: DemoRole;
  demoRole: DemoRole;
  employeeId: string;
};
export type PayrollSession = IdentitySession | DemoSession;
export function demoLogin(email: string, password: string): DemoSession | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith("@demo.indyzpay.test")) return null;
  const account = demoAccounts.find((user) => user.email === normalized);
  if (!account || password !== demoPassword)
    throw Error(
      "Use one of the three displayed demo emails with password DemoPay2026!.",
    );
  const tenant = {
    id: "indyzpay-demo-org",
    name: "IndyzPay Demo Organization",
    role: account.role.toUpperCase(),
  };
  return {
    kind: "demo",
    demoRole: account.role,
    employeeId: account.employeeId,
    portal: account.role,
    name: account.name,
    email: account.email,
    tenant,
    user: {
      id: `demo-${account.role.toLowerCase()}`,
      email: account.email,
      firstName: account.name,
      tenants: [tenant],
    },
  };
}
// Only this explicit fictional namespace is routed locally; real accounts keep their normal login.
export async function loginWithDemo(
  email: string,
  password: string,
  loginReal: (email: string, password: string) => Promise<IdentitySession>,
): Promise<PayrollSession> {
  return demoLogin(email, password) ?? loginReal(email, password);
}
