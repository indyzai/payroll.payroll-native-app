# indyzpay mobile

React Native / Expo SDK 58 companion to [indyzai/indyzpay](https://github.com/indyzai/indyzpay). Built for iOS, Android, and web using Expo Router.

## Run with Bun

Use Node 22.13+ (Expo CLI requirement) and Bun 1.4+.

```sh
bun install
bun start
# or
bun run ios
bun run android
bun run web
```

`ios` and `android` open a locally configured simulator/emulator. Physical device support depends on an Expo Go version compatible with SDK 58; otherwise use a development build. No native project directories are maintained by hand.

## Included workflows

- Employee dashboard and an illustrative salary breakdown using the original indyzpay employee seed and calculation.
- Share a clearly labeled simulated payslip through the system share sheet.
- Annual leave requests with strict date validation, overlap detection, and a shared leave balance. Calendar days count; pending requests reserve balance.
- Expense claims in INR, with finite positive amount validation.
- HR approval/rejection with immediate updates across employee and HR workspaces.
- Five-step simulated payroll cycle that blocks on pending requests and prevents repeat disbursement.
- Searchable employee directory and demo employee switching.
- Failure injection, simulated request latency, bounded request log, and reset controls.

Use the workspace selector at the top of each screen to switch between Employee and HR. Use People to change the demo employee. All demo roles are freely selectable; this is not authentication or authorization.

## Architecture and limits

`src/demo/model.ts` contains pure commands and validation. `src/demo/provider.tsx` owns the single in-memory workspace, serializes mutations, and simulates 550 ms API latency and failures. Screens do not maintain copies of financial state. `src/demo/source.ts` preserves the web app's seed data and illustrative salary calculation.

This version is an India / INR demo, not full feature parity with the web application. It does not implement international payroll, tax declarations, statutory filings, POS, production authentication, backend connectivity, notifications, or persistence. Expense approvals are tracked separately and are not included in salary payments. All salaries, taxes, payslips, approvals, and transfers are simulations. No bank, government, identity, or HRMS API is called. Restarting the app resets the workspace.

## Checks

```sh
bun run typecheck
bun run lint
bun test
bun run export:web
bunx expo export --platform ios --platform android
```

Tests cover cross-workspace approval state, leave balance restoration, invalid dates, overlap and balance limits, expense amounts, payroll blockers, and prevention of duplicate disbursement. Bundle exports do not replace testing on physical devices.

## Brand assets

Launcher, Android adaptive/monochrome, splash, favicon, and navigation icons are generated from editable SVG sources in `assets/brand`. Regenerate them with `bun run icons`. Native launcher and splash changes require a new app build.

## GitHub Actions

The workflows follow the POS native app's CI + Android + iOS release structure, adapted to this single Expo app and Bun 1.4.1.

- `CI`: pull requests and pushes to `main`/`master`; frozen Bun install, typecheck, lint, tests, and web export. Also reused as the validation gate for native builds.
- `Android Release`: pushes to `main`/`master`, `v*` tags, or manual dispatch. Produces a debug-signed APK without signing secrets (requires Metro via `bun start`), or a signed release APK and AAB with the secrets below.
- `iOS Release`: the same release triggers; produces a standalone Release simulator `.app` in a ZIP. This is not an IPA for physical devices or App Store submission and needs no Apple signing secrets.
- Native artifacts are retained for 14 days and attached to GitHub Releases. Branch builds use `v<app-version>-alpha.<commit>` prereleases; version tags use the supplied tag. Android and iOS attach to the same release, with publication serialized to avoid concurrent creation.

Native projects are generated on the runners with Expo Prebuild. Package/bundle ID: `com.indyzai.payroll.app`. Confirm this identifier before registering the application in either store.

For signed Android release builds, configure these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded upload keystore |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Upload key alias |
| `ANDROID_KEY_PASSWORD` | Upload key password |
| `PLAY_STORE_SERVICE_ACCOUNT_JSON` | Raw Google Play service-account JSON; required only for publishing |

Google Play upload is opt-in through manual dispatch (`publish_to_play: true`, default track `internal`). The app must already be configured in Play Console, with access granted to the service account. No store publishing occurs on ordinary pushes. CI uses the built-in GitHub token; no POS repository PAT or submodule secrets are needed.

Native build numbers use the platform workflow's `github.run_number`; ensure this is greater than any previously uploaded store build before enabling publishing. Numeric versions are written only in the runner checkout; source files and git history are not rewritten.
