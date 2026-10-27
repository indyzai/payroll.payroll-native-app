export type IdentityConfiguration = {
  baseUrl: string;
  appId: string;
  environment: string;
};
export function identityConfiguration(
  values: { baseUrl?: string; appId?: string; environment?: string },
  development = false,
): IdentityConfiguration {
  const url = new URL(values.baseUrl || "https://api.indyzai.com/auth/api/v1");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(development && url.protocol === "http:"))
  )
    throw Error(
      "Identity API must use HTTPS (HTTP is allowed only in development), without URL credentials, query, or fragment.",
    );
  const appId = values.appId || "payroll-app";
  if (!/^[a-zA-Z0-9._-]+$/.test(appId))
    throw Error("Invalid identity application ID.");
  return {
    baseUrl: url.toString().replace(/\/$/, ""),
    appId,
    environment: values.environment || "prod",
  };
}
