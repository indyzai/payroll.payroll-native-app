import { IdentityError, type IdentityStorage } from "./identity-client";
export type SocialTransaction = {
  state: string;
  verifier: string;
  createdAt: number;
  scope: string;
};
export function createSocialCompletion<T>(
  storage: IdentityStorage,
  scope: string,
  exchange: (code: string, verifier: string) => Promise<T>,
  now = Date.now,
) {
  let inFlight:
    { code: string; state: string; promise: Promise<T> } | undefined;
  return {
    async begin(transaction: Omit<SocialTransaction, "scope" | "createdAt">) {
      inFlight = undefined;
      await storage.write(
        JSON.stringify({ ...transaction, scope, createdAt: now() }),
      );
    },
    finish(code: string, state: string): Promise<T> {
      if (inFlight?.code === code && inFlight.state === state)
        return inFlight.promise;
      if (inFlight)
        return Promise.reject(
          new IdentityError(
            "A different social callback is already being handled. Please start again.",
          ),
        );
      const promise = (async () => {
        if (!code || !state)
          throw new IdentityError(
            "The social sign-in response could not be verified. Please start again.",
          );
        let transaction: Partial<SocialTransaction> | null = null;
        try {
          transaction = JSON.parse((await storage.read()) ?? "null");
        } catch {
          /* invalid stored transaction */
        }
        if (
          !transaction ||
          transaction.scope !== scope ||
          transaction.state !== state ||
          typeof transaction.verifier !== "string" ||
          !transaction.verifier ||
          typeof transaction.createdAt !== "number" ||
          now() - transaction.createdAt > 10 * 60 * 1000 ||
          now() < transaction.createdAt
        )
          throw new IdentityError(
            "The social sign-in request expired or could not be verified. Please start again.",
          );
        // Consume the request once. Retries of the same callback share the exchange promise.
        await storage.clear();
        return exchange(code, transaction.verifier);
      })();
      inFlight = { code, state, promise };
      return promise;
    },
    async cancel() {
      inFlight = undefined;
      await storage.clear();
    },
  };
}
export function registeredSocialApplication(
  applications: unknown,
  appId: string,
): boolean {
  if (
    !applications ||
    typeof applications !== "object" ||
    Array.isArray(applications)
  )
    return false;
  return Object.entries(applications).some(
    ([name, value]) =>
      name === appId ||
      (!!value &&
        typeof value === "object" &&
        "clientId" in value &&
        value.clientId === appId),
  );
}
