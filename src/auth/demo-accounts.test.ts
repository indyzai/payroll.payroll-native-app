import { expect, test } from "bun:test";
import {
  demoAccounts,
  demoLogin,
  demoPassword,
  loginWithDemo,
} from "./demo-accounts";
import type { IdentitySession } from "./identity-client";
for (const account of demoAccounts) {
  test(`${account.role} credentials produce a distinct local demo session`, async () => {
    let calls = 0;
    const session = await loginWithDemo(
      ` ${account.email.toUpperCase()} `,
      demoPassword,
      async () => {
        calls++;
        throw Error("Unexpected real login");
      },
    );
    expect(session.kind).toBe("demo");
    expect(session.portal).toBe(account.role);
    expect(session.user.id).toBe(`demo-${account.role.toLowerCase()}`);
    expect(session.tenant.name).toBe("IndyzPay Demo Organization");
    expect(calls).toBe(0);
    expect(JSON.stringify(session)).not.toContain("refreshToken");
    expect(JSON.stringify(session)).not.toContain("accessToken");
  });
}
test("bad demo credentials never reach real identity sign-in", async () => {
  let calls = 0;
  const real = async (): Promise<IdentitySession> => {
    calls++;
    throw Error("Unexpected call");
  };
  await expect(
    loginWithDemo(demoAccounts[0].email, "wrong", real),
  ).rejects.toThrow("displayed demo emails");
  await expect(
    loginWithDemo("unknown@demo.indyzpay.test", demoPassword, real),
  ).rejects.toThrow("displayed demo emails");
  expect(calls).toBe(0);
});
test("real accounts keep the real identity login path", async () => {
  expect(demoLogin("person@company.com", "password")).toBeNull();
  let credentials: string[] = [];
  const tenant = { id: "real-org", name: "Real Organization", role: "MEMBER" };
  const real: IdentitySession = {
    kind: "identity",
    user: { id: "real-user", email: "person@company.com", tenants: [tenant] },
    tenant,
    email: "person@company.com",
    name: "Person",
    portal: "Employee",
  };
  expect(
    await loginWithDemo(
      real.email,
      "real-password",
      async (email, password) => {
        credentials = [email, password];
        return real;
      },
    ),
  ).toBe(real);
  expect(credentials).toEqual([real.email, "real-password"]);
});
