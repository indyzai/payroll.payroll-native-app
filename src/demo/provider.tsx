import React, { createContext, useContext, useRef, useState } from "react";
import { Command, seed, Workspace } from "./model";
import type { WorkspaceRole } from "@/auth/access";
import {
  applyAuthorizedCommand,
  visibleWorkspace,
  canManageWorkspace,
} from "./access";
type Entry = { id: number; action: string; status: string };
type Demo = {
  state: Workspace;
  employeeId: string;
  portal: WorkspaceRole;
  busy: boolean;
  error: string;
  notice: string;
  failNext: boolean;
  setFailNext: (v: boolean) => void;
  log: Entry[];
  run: (c: Command) => Promise<boolean>;
  reset: () => void;
};
const Context = createContext<Demo | null>(null);
export function DemoProvider({
  children,
  initialPortal = "Employee",
  initialEmployeeId = "IZ001",
}: {
  children: React.ReactNode;
  initialEmployeeId?: string;
  initialPortal?: WorkspaceRole;
}) {
  const [state, setState] = useState(seed);
  const current = useRef(state);
  const locked = useRef(false);
  const employeeId = initialEmployeeId;
  const portal = initialPortal;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [failNext, setFailNext] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  async function run(command: Command) {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    const fail = failNext;
    setFailNext(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 550));
      if (fail)
        throw Error(
          "Simulated connection failure. Your workspace is unchanged. Please retry.",
        );
      current.current = applyAuthorizedCommand(current.current, command, {
        role: portal,
        employeeId,
      });
      setState(current.current);
      setLog((l) =>
        [
          { id: Date.now(), action: command.type, status: "200 · Success" },
          ...l,
        ].slice(0, 30),
      );
      setNotice(
        command.type === "request"
          ? "Request sent to HR for review."
          : command.type === "review"
            ? "Request reviewed. Employee workspace updated."
            : "Payroll stage updated.",
      );
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
      setLog((l) =>
        [
          { id: Date.now(), action: command.type, status: "Failed" },
          ...l,
        ].slice(0, 30),
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  function reset() {
    if (locked.current || !canManageWorkspace(portal)) return;
    current.current = seed();
    setState(current.current);
    setLog([]);
    setError("");
    setNotice("Demo workspace reset.");
    setFailNext(false);
  }
  return (
    <Context.Provider
      value={{
        state: visibleWorkspace(state, { role: portal, employeeId }),
        employeeId,
        portal,
        busy,
        error,
        notice,
        failNext,
        setFailNext: (value) => {
          if (canManageWorkspace(portal)) setFailNext(value);
        },
        log: canManageWorkspace(portal) ? log : [],
        run,
        reset,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDemo() {
  const demo = useContext(Context);
  if (!demo) throw Error("DemoProvider is required");
  return demo;
}
