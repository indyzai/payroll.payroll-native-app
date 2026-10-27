import { expect, test } from "bun:test";
import {
  createSocialCompletion,
  registeredSocialApplication,
} from "./social-transaction";
function fixture(now = 1000) {
  let stored: string | null = null;
  const exchanges: string[][] = [];
  const storage = {
    read: async () => stored,
    write: async (v: string) => {
      stored = v;
    },
    clear: async () => {
      stored = null;
    },
  };
  const completion = createSocialCompletion(
    storage,
    "payroll-scope",
    async (code, verifier) => {
      exchanges.push([code, verifier]);
      return "verified-session";
    },
    () => now,
  );
  return { completion, exchanges, storage, stored: () => stored };
}
test("social callback verifies state and supplies the original PKCE verifier once", async () => {
  const f = fixture();
  await f.completion.begin({
    state: "random-state",
    verifier: "original-verifier",
  });
  const first = f.completion.finish("auth-code", "random-state");
  const duplicate = f.completion.finish("auth-code", "random-state");
  expect(first).toBe(duplicate);
  expect(await first).toBe("verified-session");
  expect(f.exchanges).toEqual([["auth-code", "original-verifier"]]);
  expect(f.stored()).toBeNull();
  await expect(
    f.completion.finish("another-code", "random-state"),
  ).rejects.toThrow("different social callback");
});
test("missing and mismatched states never exchange a code", async () => {
  for (const state of ["", "wrong-state"]) {
    const f = fixture();
    await f.completion.begin({ state: "expected", verifier: "verifier" });
    await expect(f.completion.finish("code", state)).rejects.toThrow();
    expect(f.exchanges).toHaveLength(0);
  }
});
test("expired, malformed, and differently scoped transactions are rejected", async () => {
  for (const raw of [
    "{invalid",
    JSON.stringify({
      state: "state",
      verifier: "verifier",
      createdAt: 0,
      scope: "payroll-scope",
    }),
    JSON.stringify({
      state: "state",
      verifier: "verifier",
      createdAt: 1000000,
      scope: "pos-scope",
    }),
  ]) {
    const f = fixture(1000000);
    await f.storage.write(raw);
    await expect(f.completion.finish("code", "state")).rejects.toThrow();
    expect(f.exchanges).toHaveLength(0);
  }
});
test("cancellation removes the pending verifier and supports a new attempt", async () => {
  const f = fixture();
  await f.completion.begin({ state: "old", verifier: "old-verifier" });
  await f.completion.cancel();
  expect(f.stored()).toBeNull();
  await f.completion.begin({ state: "new", verifier: "new-verifier" });
  expect(await f.completion.finish("new-code", "new")).toBe("verified-session");
  expect(f.exchanges).toEqual([["new-code", "new-verifier"]]);
});
test("application discovery accepts payroll by name/client ID, not another app", () => {
  const apps = {
    "payroll-app": { clientId: "payroll-client" },
    "pos-app": { clientId: "pos-client" },
  };
  expect(registeredSocialApplication(apps, "payroll-app")).toBe(true);
  expect(registeredSocialApplication(apps, "payroll-client")).toBe(true);
  expect(
    registeredSocialApplication({ "pos-app": apps["pos-app"] }, "payroll-app"),
  ).toBe(false);
  expect(registeredSocialApplication([], "payroll-app")).toBe(false);
});
