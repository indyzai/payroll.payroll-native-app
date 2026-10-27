import type { WorkspaceRole } from "@/auth/access";
import { applyCommand, type Command, type Workspace } from "./model";
export type WorkspaceAccess = { role: WorkspaceRole; employeeId: string };
export function visibleWorkspace(
  state: Workspace,
  access: WorkspaceAccess,
): Workspace {
  if (access.role !== "Employee") return state;
  return {
    ...state,
    people: state.people.filter((person) => person.id === access.employeeId),
    requests: state.requests.filter(
      (request) => request.employeeId === access.employeeId,
    ),
  };
}
export function applyAuthorizedCommand(
  state: Workspace,
  command: Command,
  access: WorkspaceAccess,
): Workspace {
  if (access.role === "Employee") {
    if (command.type !== "request")
      throw Error("Only HR or Admin can review requests or run payroll.");
    if (command.request.employeeId !== access.employeeId)
      throw Error(
        "You can only submit requests for your own employee profile.",
      );
  }
  return applyCommand(state, command);
}
export function canManageWorkspace(role: WorkspaceRole) {
  return role === "Admin";
}
