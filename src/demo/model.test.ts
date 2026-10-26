import { describe, expect, test } from "bun:test";
import {
  applyCommand,
  dateDays,
  leaveAvailable,
  seed,
  type Request,
} from "./model";
const leave: Request = {
  id: "test",
  employeeId: "IZ001",
  kind: "Leave",
  title: "Holiday",
  from: "2026-11-05",
  to: "2026-11-06",
  days: 2,
  amount: 0,
  status: "Pending",
};
describe("shared mobile workspace", () => {
  test("submission reserves leave and rejection restores it without mutating the source", () => {
    const initial = seed();
    const submitted = applyCommand(initial, {
      type: "request",
      request: leave,
    });
    expect(initial.requests).toHaveLength(2);
    expect(leaveAvailable(submitted, "IZ001")).toBe(22);
    const rejected = applyCommand(submitted, {
      type: "review",
      id: "test",
      approved: false,
    });
    expect(leaveAvailable(rejected, "IZ001")).toBe(24);
    expect(submitted.requests[0].status).toBe("Pending");
  });
  test("HR approval appears in the same employee request", () => {
    const state = applyCommand(seed(), {
      type: "review",
      id: "REQ-1001",
      approved: true,
    });
    expect(state.requests.find((r) => r.employeeId === "IZ001")?.status).toBe(
      "Approved",
    );
    expect(() =>
      applyCommand(state, { type: "review", id: "REQ-1001", approved: false }),
    ).toThrow();
  });
  test("payroll blocks pending requests, completes once, and cannot pay twice", () => {
    let state = seed();
    expect(() => applyCommand(state, { type: "advance" })).toThrow();
    for (const r of state.requests)
      state = applyCommand(state, { type: "review", id: r.id, approved: true });
    for (let i = 0; i < 5; i++)
      state = applyCommand(state, { type: "advance" });
    expect(state.paid).toBe(true);
    expect(state.stage).toBe(5);
    expect(() => applyCommand(state, { type: "advance" })).toThrow();
  });
  test("invalid and reverse dates are rejected, including impossible calendar dates", () => {
    for (const [a, b] of [
      ["2026-02-30", "2026-03-01"],
      ["2026-11-06", "2026-11-05"],
      ["", "2026-11-05"],
    ])
      expect(() => dateDays(a, b)).toThrow();
    expect(dateDays("2026-11-05", "2026-11-06")).toBe(2);
  });
  test("overlaps and excessive leave cannot be installed", () => {
    const state = applyCommand(seed(), { type: "request", request: leave });
    expect(() =>
      applyCommand(state, {
        type: "request",
        request: { ...leave, id: "overlap" },
      }),
    ).toThrow();
    expect(() =>
      applyCommand(seed(), {
        type: "request",
        request: { ...leave, to: "2026-12-06", days: 32 },
      }),
    ).toThrow();
  });
  test("expense amounts must be finite and positive", () => {
    for (const amount of [NaN, Infinity, 0, -1, 1000001])
      expect(() =>
        applyCommand(seed(), {
          type: "request",
          request: { ...leave, kind: "Expense", amount },
        }),
      ).toThrow();
  });
});
