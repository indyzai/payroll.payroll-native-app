import type { IdentityConfiguration } from "./config";
import type { RegistrationPayload } from "@indyzai/pos-auth/types";
export type IdentityUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenants: { id: string; name: string; role: string }[];
};
export type IdentitySession = {
  user: IdentityUser;
  tenant: IdentityUser["tenants"][number];
  email: string;
  name: string;
  portal: "Employee";
};
export type IdentityStorage = {
  read: () => Promise<string | null>;
  write: (value: string) => Promise<void>;
  clear: () => Promise<void>;
};
export class IdentityError extends Error {
  constructor(
    message: string,
    public status = 0,
  ) {
    super(message);
    this.name = "IdentityError";
  }
}
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
function tokenPair(response: unknown) {
  const tokens =
    record(response) && record(response.tokens) ? response.tokens : response;
  if (
    !record(tokens) ||
    typeof tokens.accessToken !== "string" ||
    !tokens.accessToken ||
    typeof tokens.refreshToken !== "string" ||
    !tokens.refreshToken
  )
    throw new IdentityError(
      "The identity service returned an incomplete session. Please sign in again.",
    );
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}
function identityUser(response: unknown): IdentityUser {
  const user =
    record(response) && record(response.user) ? response.user : response;
  if (
    !record(user) ||
    typeof user.id !== "string" ||
    !user.id ||
    typeof user.email !== "string" ||
    !user.email ||
    !Array.isArray(user.tenants) ||
    user.tenants.some(
      (t) =>
        !record(t) ||
        typeof t.id !== "string" ||
        !t.id ||
        typeof t.name !== "string" ||
        typeof t.role !== "string",
    )
  )
    throw new IdentityError(
      "The identity service did not return a valid user and organization profile.",
    );
  return {
    id: user.id,
    email: user.email,
    firstName: typeof user.firstName === "string" ? user.firstName : undefined,
    lastName: typeof user.lastName === "string" ? user.lastName : undefined,
    tenants: user.tenants.map((t) => ({
      id: t.id,
      name: t.name,
      role: t.role,
    })),
  };
}
export function createIdentityClient(
  configuration: IdentityConfiguration,
  storage: IdentityStorage,
  fetcher: typeof fetch = fetch,
) {
  let session: IdentitySession | null = null;
  let refreshToken: string | null = null;
  let generation = 0;
  let renewal: Promise<IdentitySession | null> | undefined;
  let storageQueue: Promise<void> = Promise.resolve();
  const writeStorage = (action: () => Promise<void>) => {
    const task = storageQueue.then(action);
    storageQueue = task.catch(() => {});
    return task;
  };
  const scope = `${configuration.baseUrl}|${configuration.appId}`;
  const check = (version: number) => {
    if (version !== generation)
      throw new IdentityError("The sign-in request was cancelled.");
  };
  async function request(
    path: string,
    body?: unknown,
    token?: string,
    empty = false,
  ) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetcher(configuration.baseUrl + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        credentials: "omit",
        redirect: "error",
        signal: controller.signal,
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        if (response.ok && empty) return null;
      }
      if (!response.ok) {
        let message =
          response.status >= 500
            ? "The identity service is temporarily unavailable. Please try again."
            : "Sign-in failed. Please check your details.";
        if (response.status < 500 && record(result)) {
          const detail = Array.isArray(result.message)
            ? result.message.filter((v) => typeof v === "string").join(" ")
            : result.message;
          if (typeof detail === "string" && detail)
            message = detail.slice(0, 500);
        }
        throw new IdentityError(message, response.status);
      }
      if (!record(result) && !empty)
        throw new IdentityError(
          "The identity service returned an invalid response. Please try again.",
        );
      return result;
    } catch (error) {
      if (error instanceof IdentityError) throw error;
      throw new IdentityError(
        controller.signal.aborted
          ? "The identity service timed out. Please try again."
          : "Could not reach the identity service. Check your connection and try again.",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  async function clear(version: number) {
    if (version !== generation) return;
    session = null;
    refreshToken = null;
    await writeStorage(async () => {
      if (version === generation) await storage.clear();
    });
  }
  async function install(response: unknown, version: number) {
    const tokens = tokenPair(response);
    check(version);
    // Persist rotation before fetching the profile, so an outage cannot strand a rotated token.
    await writeStorage(async () => {
      check(version);
      await storage.write(
        JSON.stringify({
          version: 1,
          scope,
          refreshToken: tokens.refreshToken,
        }),
      );
    });
    check(version);
    refreshToken = tokens.refreshToken;
    try {
      const user = identityUser(
        await request("/users/me", undefined, tokens.accessToken),
      );
      check(version);
      const tenant =
        user.tenants.find((t) => t.id === session?.tenant.id) ??
        user.tenants[0];
      if (!tenant)
        throw new IdentityError(
          "Your account has no active organization membership. Contact your administrator.",
          403,
        );
      session = {
        user,
        tenant,
        email: user.email,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.email,
        portal: "Employee",
      };
      return session;
    } catch (error) {
      if (error instanceof IdentityError && [401, 403].includes(error.status))
        await clear(version);
      throw error;
    }
  }
  return {
    getSession: () => session,
    async login(email: string, password: string) {
      const identifier = email.trim();
      if (!/^(?:[^\s@]+@[^\s@]+|\+?[0-9]{7,15})$/.test(identifier) || !password)
        throw new IdentityError(
          "Enter your email or mobile number and password.",
        );
      const version = ++generation;
      const result = await request("/auth/login", {
        email: identifier,
        password,
        appId: configuration.appId,
        env: configuration.environment,
      });
      check(version);
      if (record(result) && typeof result.code === "string" && result.code)
        return install(
          await request("/auth/success", { code: result.code }),
          version,
        );
      return install(result, version);
    },
    async register(payload: RegistrationPayload) {
      if (
        !payload.fullName.trim() ||
        !/^\S+@\S+\.\S+$/.test(payload.email.trim()) ||
        payload.password.length < 8 ||
        !payload.companyName.trim() ||
        !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(payload.domainName.trim())
      )
        throw new IdentityError(
          "Enter a name, valid email, password of at least 8 characters, organization, and valid organization domain.",
        );
      const version = ++generation;
      const result = await request("/auth/register", {
        ...payload,
        email: payload.email.trim().toLowerCase(),
        fullName: payload.fullName.trim(),
        companyName: payload.companyName.trim(),
        domainName: payload.domainName.trim().toLowerCase(),
      });
      check(version);
      try {
        return await install(result, version);
      } catch (error) {
        throw new IdentityError(
          "Your account was created, but the session could not be verified. Please sign in. " +
            (error instanceof IdentityError ? error.message : ""),
          error instanceof IdentityError ? error.status : 0,
        );
      }
    },
    restore(): Promise<IdentitySession | null> {
      if (renewal) return renewal;
      const version = generation;
      const pending = (async () => {
        let saved: unknown;
        await storageQueue;
        const raw = await storage.read();
        check(version);
        try {
          saved = raw ? JSON.parse(raw) : null;
        } catch {
          await clear(version);
          return null;
        }
        if (!saved) return null;
        if (
          !record(saved) ||
          saved.version !== 1 ||
          saved.scope !== scope ||
          typeof saved.refreshToken !== "string" ||
          !saved.refreshToken
        ) {
          await clear(version);
          return null;
        }
        try {
          return await install(
            await request("/auth/refresh", {
              refreshToken: saved.refreshToken,
            }),
            version,
          );
        } catch (error) {
          if (
            error instanceof IdentityError &&
            [400, 401, 403].includes(error.status)
          )
            await clear(version);
          throw error;
        }
      })();
      renewal = pending;
      void pending
        .finally(() => {
          if (renewal === pending) renewal = undefined;
        })
        .catch(() => {});
      return pending;
    },
    async logout() {
      const token = refreshToken;
      const version = ++generation;
      await clear(version);
      // Clearing this app's session is independent of revocation availability.
      if (token) {
        try {
          await request(
            "/auth/logout",
            { refreshToken: token },
            undefined,
            true,
          );
        } catch {
          return false;
        }
      }
      return true;
    },
  };
}
