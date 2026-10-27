import type { PayrollSession } from "./demo-accounts";
export type WorkspaceRole = "Employee" | "HR" | "Admin";
export type WorkspaceScreen =
  "index" | "payroll" | "requests" | "people" | "settings";
export function accessForSession(session: PayrollSession | null) {
  let role: WorkspaceRole = "Employee";
  if (session?.kind === "demo") role = session.demoRole;
  else if (session) {
    const membership = session.tenant.role
      .trim()
      .toLowerCase()
      .replace(/[ -]+/g, "_");
    if (["owner", "admin"].includes(membership)) role = "Admin";
    else if (["hr", "hr_manager", "payroll_manager"].includes(membership))
      role = "HR";
    // Generic manager/member/guest and unknown roles do not imply payroll administration.
  }
  return {
    role,
    canManagePayroll: role === "HR" || role === "Admin",
    canManageWorkspace: role === "Admin",
  };
}
export function canOpenScreen(role: WorkspaceRole, screen: WorkspaceScreen) {
  return screen !== "people" || role !== "Employee";
}
