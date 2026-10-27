# indyzpay mobile

React Native / Expo SDK 58 companion to [indyzai/indyzpay](https://github.com/indyzai/indyzpay). Built for iOS, Android, and web using Expo Router.

## Run with Bun

Use Node 22.13+ (Expo CLI requirement) and Bun 1.4+.

```sh
git submodule update --init --recursive
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

The signed-in account determines the workspace role. There is no role selector or employee-impersonation action. Sign out and use another demo login to explore a different role.

## Architecture and limits

`src/demo/model.ts` contains pure commands and validation. `src/demo/provider.tsx` owns the single in-memory workspace, serializes mutations, and simulates 550 ms API latency and failures. Screens do not maintain copies of financial state. `src/demo/source.ts` preserves the web app's seed data and illustrative salary calculation.

This version is an India / INR demo, not full feature parity with the web application. It does not implement international payroll, tax declarations, statutory filings, POS, production payroll backend connectivity, notifications, or payroll persistence. Expense approvals are tracked separately and are not included in salary payments. All salaries, taxes, payslips, approvals, and transfers are simulations. Sign-in and registration call the real IndyzAI identity API; no bank, government, or HRMS API is called. Restarting the app resets the workspace.

## Checks

```sh
bun run typecheck
bun run lint
bun run test
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

Google Play upload is opt-in through manual dispatch (`publish_to_play: true`, default track `internal`). The app must already be configured in Play Console, with access granted to the service account. No store publishing occurs on ordinary pushes. Checkout initializes the shared submodule recursively. For the private shared repository, configure `INDYZAI_PAT` with read access to both repositories; the workflow falls back to the built-in token when cross-repository access is already available.

Native build numbers use the platform workflow's `github.run_number`; ensure this is greater than any previously uploaded store build before enabling publishing. Numeric versions are written only in the runner checkout; source files and git history are not rewritten.

## Shared auth submodule and payroll theme

The app consumes `@indyzai/pos-auth/ui` directly from the Git submodule at `vendor/pos-ui-shared`, using Bun workspace links like the POS native app. There are no copied auth screens or source-sync snapshots. The submodule is pinned to `8730bfcbf57f0cb5f6c7c4af64a3d8f5bf2b4339` from `indyzai/pos.pos-ui-shared`.

`patches/shared-auth-theme.patch` adds optional, context-scoped branding/theme configuration to that pinned checkout. `bun install` runs `scripts/prepare-shared-auth.ts` to apply it idempotently. The patch changes only payroll's submodule working tree; it does not modify the sibling shared checkout, POS app, or remote repository. Existing shared `configureAuthUi` consumers keep their legacy defaults. The submodule may report local modifications after install because of this tracked patch; the portable source of those changes is the parent repository's patch file. Conflicting upstream changes fail explicitly rather than overwriting edits.

`src/theme/payroll-theme.tsx` and `src/theme/palette.ts` supply one light/dark theme to login, signup, payroll screens, fields, cards, navigation, status bars, and loading states. Switch themes on the auth surface or in Account. Mode is app-local and survives sign-in/sign-out for the running app session. Brand/logo/text overrides live in `src/auth/payroll-auth.tsx`; the shared UI receives them through `AuthUiProvider` instead of a global singleton. Tests check nested configuration isolation and readable text contrast in both palettes.

Clone/setup:

```sh
git clone --recurse-submodules <payroll-repository-url>
# For an existing checkout:
git submodule update --init --recursive
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
```

Update the submodule deliberately, rebase/review the app-local patch against the new shared version, then run the same checks. `bun run shared:prepare` verifies/applies the patch without installing dependencies. Do not edit or copy auth screen implementations into `src/auth`.

Authentication is live; payroll data and financial actions remain simulated. Password sign-in sends credentials to the configured IndyzAI identity API, exchanges a one-time login code when required, then fetches canonical `/users/me` membership data. Registration creates a real account/organization using the API's exact enum values and an explicit organization domain. Real credentials use the identity API; the separate fictional demo namespace below is handled locally.

Native refresh credentials use Expo SecureStore under `com.indyzai.payroll.app.identity.v1`, scoped to this API URL and application ID. Access tokens stay in memory, as do browser refresh credentials (web reload requires sign-in). No POS storage, browser auth cookies, or other app sessions are read or cleared. Passwords are never stored or logged. Startup, foregrounding, and active ten-minute intervals renew the session; invalid credentials clear it, while temporary outages retain a retryable refresh credential. Sign-out clears local credentials and attempts server refresh-token revocation.

Copy `.env.example` to `.env.local` for explicit overrides. Defaults: `https://api.indyzai.com/auth/api/v1`, app ID `payroll-app`, environment `prod`. Native development can point at an explicit HTTP identity endpoint; production builds require HTTPS. These public environment values contain no client secrets. Rebuild native apps after adding SecureStore.

Google and Microsoft buttons use Expo AuthSession with PKCE and strict state validation. Native requests keep a short-lived, app-scoped verification transaction in SecureStore so callbacks can survive process recreation; web uses a named popup and in-memory verifier. `/auth/app/success` exchanges the application code and `/users/me` supplies the canonical profile/memberships. Missing state, expired requests, duplicate/mismatched callbacks, and cancellation are handled without creating a session.

The identity service's public application list currently has no payroll registration. Social buttons are visible and give a configuration error until the identity administrator registers the payroll application and redirects in `config/identity-application.example.json`. Add the actual deployed web origin as well, and allow `http://localhost:6500` in CORS for local web development. No POS application registration is reused or changed. Device unlock remains unconfigured.

Organization names, IDs, and membership roles come from `/users/me`, including the dashboard, directory, header, and Account. Users with multiple returned memberships can select an organization in Account. Selection is checked against the canonical membership list, preserved during refresh while still valid, and resets the in-memory simulated payroll workspace. After an app restart the first active membership is used. No salary records are fetched from the identity service.

Protected Expo Router routes require either a verified identity or an explicit local demo session. Demo users receive their declared role. Live identities resolve access from their selected canonical organization membership: owner/admin → Admin; hr/hr_manager/payroll_manager → HR; all other roles → Employee. Unknown or generic manager roles do not imply payroll privileges. Real payroll APIs must enforce their own authorization and tenant isolation before replacing the demo command model. No production accounts are created by tests: HTTP contract tests inject mock responses.

Metro and web development use port `6500` for `bun start`, `bun run ios`, `bun run android`, and `bun run web`. Use `bun run ios-build` to prebuild iOS with `RCT_METRO_PORT=6500` while preserving the existing native folder. For web sign-in, allow `http://localhost:6500` in the identity service CORS configuration.

## Demo logins

Expand **Demo accounts · Employee, HR & Admin** on the login page. Enter the sample credentials in the shared form or tap a role to enter it directly.

| Role | Email | Password |
| --- | --- | --- |
| Employee | `employee@demo.indyzpay.test` | `DemoPay2026!` |
| HR | `hr@demo.indyzpay.test` | `DemoPay2026!` |
| Admin | `admin@demo.indyzpay.test` | `DemoPay2026!` |

These fictional identities exist only in memory, never call the identity service, and never create or store access/refresh tokens. Wrong passwords or unknown addresses in this reserved namespace fail locally rather than reaching the real service. Employee opens self-service; HR opens team payroll/approvals; Admin opens the administrative demo view with simulation controls. All financial actions remain simulated. Demo users cannot switch roles from inside a workspace; use another demo account to explore a different role. Signing out removes the demo session and workspace; real password and social sign-in remain available.

## Role-specific navigation and actions

| Role | Screens and actions |
| --- | --- |
| Employee | Home, My pay, My requests, Account. Only the signed-in demo employee's salary/profile/requests are exposed. No team directory, approval actions, payroll-cycle controls, or administration. |
| HR | Overview, Payroll, Approvals, People, Account. Can review team requests and advance simulated payroll; no reset, failure-injection, or request-log controls. |
| Admin | HR management screens plus workspace administration, failure injection, reset, and request logs in Account. |

The shared header displays a fixed workspace label instead of editable role buttons. Expo Router protects the People route from employees, including direct navigation. The shared command boundary independently rejects employee attempts to review/advance payroll or submit another employee's request, and the provider projects employee-visible state to their own records. Real payroll APIs must still enforce authorization server-side when replacing these simulations.
