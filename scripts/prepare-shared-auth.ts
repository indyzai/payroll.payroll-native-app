import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shared = resolve(root, "vendor/pos-ui-shared");
const patch = resolve(root, "patches/shared-auth-theme.patch");
if (!existsSync(resolve(shared, "packages-native/feature-auth/package.json")))
  throw Error(
    "Initialize the shared submodule first: git submodule update --init --recursive",
  );
const git = (args: string[]) =>
  spawnSync("git", ["-C", shared, "apply", ...args, patch], { stdio: "pipe" });
if (git(["--reverse", "--check"]).status === 0) {
  console.log("Payroll shared-auth theme extension is already applied.");
} else {
  const check = git(["--check"]);
  if (check.status !== 0)
    throw Error(
      "Shared auth changed or has conflicting local edits. Review patches/shared-auth-theme.patch before updating the submodule. " +
        check.stderr.toString(),
    );
  execFileSync("git", ["-C", shared, "apply", patch], { stdio: "inherit" });
  console.log(
    "Applied payroll-only theme extension in its shared submodule checkout.",
  );
}
