import { describe, expect, test } from "bun:test";
import {
  createIdentityClient,
  IdentityError,
  type IdentityStorage,
} from "./identity-client";
import { identityConfiguration } from "./config";
const config = identityConfiguration({});
const user = {
  id: "user-1",
  email: "user@example.test",
  firstName: "Test",
  lastName: "User",
  tenants: [{ id: "tenant-1", name: "Test Organization", role: "OWNER" }],
};
const tokens = { accessToken: "test-access", refreshToken: "test-refresh" };
function fixture(
  responses: { body?: unknown; status?: number; error?: boolean }[],
  persisted: string | null = null,
) {
  let stored = persisted;
  const calls: { url: string; init?: RequestInit }[] = [];
  const storage: IdentityStorage = {
    read: async () => stored,
    write: async (value) => {
      stored = value;
    },
    clear: async () => {
      stored = null;
    },
  };
  const fetcher = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw Error("Unexpected request");
    if (next.error) throw new TypeError("Network failure");
    return new Response(JSON.stringify(next.body ?? {}), {
      status: next.status ?? 200,
    });
  }) as typeof fetch;
  return {
    client: createIdentityClient(config, storage, fetcher),
    calls,
    stored: () => stored,
    storage,
  };
}
const saved = (refreshToken = tokens.refreshToken) =>
  JSON.stringify({
    version: 1,
    scope: `${config.baseUrl}|${config.appId}`,
    refreshToken,
  });
describe("real identity service contract (mock HTTP only)", () => {
  test("password sign-in exchanges code and hydrates canonical user", async () => {
    const f = fixture([
      {
        body: { code: "one-time-code", redirectUrl: "https://unrelated.test" },
      },
      { body: { tokens } },
      { body: user },
    ]);
    const session = await f.client.login(
      " user@example.test ",
      "not-a-real-password",
    );
    expect(session.email).toBe(user.email);
    expect(session.tenant.id).toBe("tenant-1");
    expect(f.calls.map((c) => new URL(c.url).pathname)).toEqual([
      "/auth/api/v1/auth/login",
      "/auth/api/v1/auth/success",
      "/auth/api/v1/users/me",
    ]);
    expect(JSON.parse(f.calls[0].init!.body as string)).toEqual({
      email: user.email,
      password: "not-a-real-password",
      appId: "payroll-app",
      env: "prod",
    });
    expect(JSON.parse(f.calls[1].init!.body as string)).toEqual({
      code: "one-time-code",
    });
    expect(f.calls[2].init!.headers).toMatchObject({
      Authorization: "Bearer test-access",
    });
    expect(
      f.calls.every(
        (c) => c.init?.credentials === "omit" && c.init?.redirect === "error",
      ),
    ).toBe(true);
    expect(f.stored()).not.toContain(tokens.accessToken);
    expect(f.stored()).not.toContain("not-a-real-password");
  });
  test("direct token responses also work, without trusting their cached profile", async () => {
    const f = fixture([
      { body: { ...tokens, user: { id: "unverified" } } },
      { body: user },
    ]);
    expect((await f.client.login(user.email, "password")).user.id).toBe(
      user.id,
    );
  });
  test("401 rejects without inventing a session or silently using demo accounts", async () => {
    const f = fixture([{ status: 401, body: { message: "Account locked" } }]);
    await expect(f.client.login(user.email, "wrong-password")).rejects.toThrow(
      "Account locked",
    );
    expect(f.client.getSession()).toBeNull();
    expect(f.stored()).toBeNull();
    expect(f.calls).toHaveLength(1);
  });
  test("malformed/incomplete token responses are rejected", async () => {
    for (const body of [
      {},
      { accessToken: "access-only" },
      { tokens: { refreshToken: "refresh-only" } },
    ]) {
      const f = fixture([{ body }]);
      await expect(f.client.login(user.email, "password")).rejects.toThrow(
        "incomplete session",
      );
      expect(f.stored()).toBeNull();
    }
  });
  test("malformed canonical membership records cannot be installed", async () => {
    const f = fixture([
      { body: tokens },
      { body: { ...user, tenants: [null] } },
    ]);
    await expect(f.client.login(user.email, "password")).rejects.toThrow(
      "valid user",
    );
    expect(f.client.getSession()).toBeNull();
  });
  test("no active organization membership clears the new session", async () => {
    const f = fixture([{ body: tokens }, { body: { ...user, tenants: [] } }]);
    await expect(f.client.login(user.email, "password")).rejects.toThrow(
      "no active organization",
    );
    expect(f.stored()).toBeNull();
  });
  test("refresh is deduplicated, rotates storage, and revalidates memberships", async () => {
    const f = fixture(
      [
        { body: { accessToken: "new-access", refreshToken: "new-refresh" } },
        { body: { user } },
      ],
      saved(),
    );
    const a = f.client.restore(),
      b = f.client.restore();
    expect(a).toBe(b);
    await a;
    expect(f.calls).toHaveLength(2);
    expect(f.stored()).toBe(saved("new-refresh"));
    expect(f.client.getSession()?.user.id).toBe(user.id);
  });
  test("expired refresh credentials are cleared", async () => {
    const f = fixture(
      [{ status: 401, body: { message: "Invalid refresh token" } }],
      saved(),
    );
    await expect(f.client.restore()).rejects.toBeInstanceOf(IdentityError);
    expect(f.stored()).toBeNull();
  });
  test("temporary service failures preserve refresh credentials for retry", async () => {
    const f = fixture([{ status: 503 }], saved());
    await expect(f.client.restore()).rejects.toThrow("temporarily unavailable");
    expect(f.stored()).toBe(saved());
  });
  test("profile outages preserve the rotated refresh credential", async () => {
    const f = fixture(
      [
        { body: { accessToken: "new-access", refreshToken: "new-refresh" } },
        { error: true },
      ],
      saved(),
    );
    await expect(f.client.restore()).rejects.toThrow("Could not reach");
    expect(f.stored()).toBe(saved("new-refresh"));
    expect(f.client.getSession()).toBeNull();
  });
  test("corrupt or differently scoped persisted records are not sent to this service", async () => {
    for (const persisted of [
      "{invalid",
      JSON.stringify({
        version: 1,
        scope: "another-app",
        refreshToken: "other-refresh",
      }),
      JSON.stringify({
        version: 1,
        scope: `${config.baseUrl}|${config.appId}`,
        refreshToken: 12,
      }),
    ]) {
      const f = fixture([], persisted);
      expect(await f.client.restore()).toBeNull();
      expect(f.calls).toHaveLength(0);
      expect(f.stored()).toBeNull();
    }
  });
  test("logout clears local credentials even when revocation is unavailable", async () => {
    const f = fixture([{ body: tokens }, { body: user }, { error: true }]);
    await f.client.login(user.email, "password");
    expect(await f.client.logout()).toBe(false);
    expect(f.stored()).toBeNull();
    expect(f.client.getSession()).toBeNull();
    expect(JSON.parse(f.calls[2].init!.body as string)).toEqual({
      refreshToken: tokens.refreshToken,
    });
  });
  test("logout prevents an in-flight renewal from reinstalling a session", async () => {
    let release!: (value: Response) => void;
    let stored: string | null = saved();
    const storage = {
      read: async () => stored,
      write: async (value: string) => {
        stored = value;
      },
      clear: async () => {
        stored = null;
      },
    };
    const fetcher = (() =>
      new Promise<Response>((resolve) => {
        release = resolve;
      })) as typeof fetch;
    const client = createIdentityClient(config, storage, fetcher);
    const pending = client.restore();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await client.logout();
    release(new Response(JSON.stringify(tokens)));
    await expect(pending).rejects.toThrow("cancelled");
    expect(client.getSession()).toBeNull();
    expect(stored).toBeNull();
  });
  test("registration sends a real domain and hydrates server identity", async () => {
    const payload = {
      fullName: " Test User ",
      email: " USER@example.test ",
      password: "test-password",
      companyName: " Test Team ",
      domainName: " Test-Team ",
      organizationType: "Small Business",
      industry: "Technology",
    };
    const f = fixture([{ body: tokens }, { body: user }]);
    await f.client.register(payload);
    expect(JSON.parse(f.calls[0].init!.body as string)).toMatchObject({
      domainName: "test-team",
      organizationType: "Small Business",
      industry: "Technology",
      email: "user@example.test",
      companyName: "Test Team",
    });
  });
  test("bad registration input does not reach the network", async () => {
    const f = fixture([]);
    await expect(
      f.client.register({
        fullName: "Test",
        email: "bad-email",
        password: "short",
        companyName: "Team",
        domainName: "spaces invalid",
        organizationType: "Other",
        industry: "Other",
      }),
    ).rejects.toThrow();
    expect(f.calls).toHaveLength(0);
  });
  test("post-registration session failure warns that the account already exists", async () => {
    const f = fixture([
      { body: tokens },
      { status: 401, body: { message: "Account pending approval" } },
    ]);
    await expect(
      f.client.register({
        fullName: "Test",
        email: "user@example.test",
        password: "test-password",
        companyName: "Team",
        domainName: "test-team",
        organizationType: "Other",
        industry: "Other",
      }),
    ).rejects.toThrow("Your account was created");
  });
});
describe("identity endpoint configuration", () => {
  test("defaults target production payroll, not POS", () => {
    expect(config).toEqual({
      baseUrl: "https://api.indyzai.com/auth/api/v1",
      appId: "payroll-app",
      environment: "prod",
    });
  });
  test("rejects insecure production URLs, URL credentials, and query strings", () => {
    for (const baseUrl of [
      "http://example.test",
      "https://user:password@example.test",
      "https://example.test/?token=x",
      "https://example.test/#secret",
    ])
      expect(() => identityConfiguration({ baseUrl })).toThrow();
  });
  test("explicit HTTP development overrides are supported", () => {
    expect(
      identityConfiguration({ baseUrl: "http://localhost:3504/api/v1/" }, true)
        .baseUrl,
    ).toBe("http://localhost:3504/api/v1");
  });
});

test("social application codes exchange through the identity API and hydrate /me", async () => {
  const f = fixture([{ body: { tokens } }, { body: user }]);
  expect(
    (await f.client.exchangeApplicationCode("social-code", "pkce-verifier"))
      .tenant.name,
  ).toBe(user.tenants[0].name);
  expect(f.calls[0].url).toBe(config.baseUrl + "/auth/app/success");
  expect(JSON.parse(f.calls[0].init!.body as string)).toEqual({
    code: "social-code",
    codeVerifier: "pkce-verifier",
  });
  expect(f.calls[1].url).toBe(config.baseUrl + "/users/me");
});
test("organization selection uses canonical memberships and refresh preserves only valid selections", async () => {
  const organization = {
    id: "tenant-2",
    name: "Second Organization",
    role: "MEMBER",
  };
  const f = fixture([
    { body: tokens },
    { body: { ...user, tenants: [...user.tenants, organization] } },
    { body: tokens },
    { body: { ...user, tenants: [...user.tenants, organization] } },
    { body: tokens },
    { body: user },
  ]);
  await f.client.login(user.email, "password");
  expect(f.client.selectOrganization("tenant-2").tenant).toEqual(organization);
  expect(() =>
    f.client.selectOrganization("unauthorized-organization"),
  ).toThrow();
  expect((await f.client.restore())?.tenant.id).toBe("tenant-2");
  expect((await f.client.restore())?.tenant.id).toBe("tenant-1");
});
