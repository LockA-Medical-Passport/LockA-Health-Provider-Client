# LockA Provider Client

Provider-facing dashboard for the [LockA Medical Passport](https://github.com/LockA-Medical-Passport/LockA-Documentation) platform. Lets hospitals, clinics, labs, pharmacies, and insurers request patient-consented access, view approved medical records, and upload treatment notes, prescriptions, and lab results.

## Stack

- React + TypeScript (Vite, no SSR)
- Tailwind CSS v4
- React Router
- `@stellar/freighter-api` for Stellar wallet auth

## Getting started

```bash
npm install
npm run dev
```

Requires the [Freighter](https://www.freighter.app/) browser extension to connect a Stellar wallet.

### Expected wallet network

Set `VITE_STELLAR_NETWORK` in `.env.local` to Freighter's network name (`TESTNET` by default, or `PUBLIC`, `FUTURENET`, or a custom name). `src/lib/network.ts` is the single source for network comparison and display labels. Restart Vite after configuration changes.

The navbar warns when the connected wallet is on another network. **Switch to Testnet** (or the configured network) explains how to select it in Freighter; **Check network** refreshes the connection's network without requesting access again. Returning focus to the app also rechecks it. The installed Freighter API v6 exposes network reads but no network-switch method, so this flow uses Freighter's own network selector. Network lookup failures show a retry action.

On reload, the app displays **Restoring wallet session…** while Freighter checks installation, existing approval, the account, and its network. An already-approved wallet goes directly to the portal without a disconnected-screen flash or another access prompt. Rejected checks settle into a recoverable state; disconnecting invalidates any pending restoration or network responses. This relies on Freighter's existing approval rather than persisting wallet credentials in browser storage.

## Testing

Tests run on [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react), with `jsdom` as the DOM environment.

```bash
npm test             # run the full suite once
npm run test:watch   # watch mode for local development
npm run test:coverage  # run with a v8 coverage report (text + html + lcov)
```

Test files live next to the code they cover (`*.test.ts` / `*.test.tsx`). Shared setup (currently just `@testing-library/jest-dom` matchers) lives in `src/test/setup.ts` and is wired in via `vite.config.ts`'s `test.setupFiles`.

### Responsive browser checks

```bash
npx playwright install chromium
npm run test:responsive
```

Playwright starts the Vite server and verifies all six pages, upload and detail views, access-request modal layout, and menu navigation at 375, 768, and 1024 pixels. The 375px project emulates a touch-capable mobile browser; menu interactions use taps. Freighter is replaced only through browser request routing in `e2e/wallet.ts`, so no extension or production test bypass is required.

Use `QA_CAPTURE_PHASE=after npm run test:responsive` to update screenshots and layout measurements under `docs/qa/screenshots/after/`. Set `RESPONSIVE_BASE_URL` to test an already-running server, or `PLAYWRIGHT_EXECUTABLE_PATH` to use an installed Chromium-compatible browser. See the [PR description and before/after evidence](docs/qa/PR-description.md).

## Component workshop

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # static output in storybook-static/
npm run test:storybook   # browser smoke checks and component interactions
```

Stories live alongside shared components in `src/components/*.stories.tsx`, using the app's Tailwind theme. All shared components are covered, including all badge tones, count/status cards, spinner/logo sizes, the icon gallery, validation and fetch errors, and pagination states. Navbar stories cover every wallet status, all staff roles, network warnings and retry instructions, and the expanded mobile menu. Modal stories can be opened and dismissed; toast stories demonstrate success/error/info messages, queueing, dismissal, and normal expiry. Use the viewport toolbar for 375px, 768px, and 1024px previews.

The workshop supplies router, role, and toast providers where needed. It does not require Freighter or a backend. Browser checks start their own server on port 6006; set `STORYBOOK_BASE_URL` to test an already-running workshop on another port. `PLAYWRIGHT_EXECUTABLE_PATH` is supported here too.

## Data layer

### Backend configuration

Copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the backend origin and API prefix, for example `http://localhost:3000/api`. Restart Vite after changing environment settings; production values are embedded at build time. `VITE_*` variables are public client configuration and must not contain secrets.

`src/lib/http.ts` exports `http<T>(path, options)` for JSON requests. It keeps the configured prefix when joining paths, serializes `body`, accepts standard fetch options (including headers, credentials, and abort signals), and returns parsed JSON. Use `http<void>` for endpoints with empty responses. Failures become `HttpError` with a user-facing message, HTTP `status` (or `null` for transport failures), and optional parsed `details`.

```ts
import { http } from './http';
import type { MedicalRecord, PagedResult } from './types';

const records = await http<PagedResult<MedicalRecord>>('/records?page=1&pageSize=10');
```

The default prefix is `/api` on the current origin. A separately hosted backend must allow the frontend origin through CORS. Setting the URL does **not** switch the application out of mock mode: migrate each function in `api.ts` to `http` when the real backend is ready, preserving its return shape. No real backend requests are made by the existing mock layer.

`src/lib/api.ts` implements the provider API surface using in-memory fixtures in `src/lib/mockData.ts`. Backend integration should preserve these client contracts, including pagination, aggregate statistics, and the current staff role lookup.

### Pagination

`listRecords`, `listAccessGrants`, `listAccessRequests`, and `getAuditLog` accept `{ page, pageSize }` and return `{ items, page, pageSize, total, hasMore }`. Pages start at 1; defaults are page 1 and 10 items. Page size must be an integer between 1 and 100. Invalid parameters reject with `ApiError`; pages beyond the end return an empty `items` array and `hasMore: false`.

The list pages request 10 rows at a time, keep the current rows visible while the next page loads, and retry a failed page without losing the current list. Grants and requests have separate paging state. Uploading a record refreshes the first page; revocation refreshes the current grants page. The dashboard uses `getDashboardStats()` for full counts and requests only five recent audit events.

### Exercising API failures

Call `setMockFailure(endpoint)` to make an endpoint reject with `ApiError`. It remains failed until `setMockFailure(endpoint, false)` or `clearMockFailures()` is called. Failed mutations leave the mock data and audit log unchanged. For example, in the browser console with the Vite development server running:

```js
const api = await import('/src/lib/api.ts');
api.setMockFailure('listRecords');
// Navigate to Medical Records to see its error state.
api.setMockFailure('listRecords', false);
// Click Retry to recover without reloading the browser.
```

Mutation endpoints such as `uploadRecord`, `createAccessRequest`, `revokeAccessGrant`, `addStaffMember`, and `removeStaffMember` can be tested the same way. Forms retain entered values after failure so the user can submit again. This switch is also available to unit tests; it does not introduce random failures.

### Staff roles

`getCurrentRole(walletAddress)` resolves the connected wallet against `mockWalletRoles` in `src/lib/mockData.ts`. The seeded provider wallet is an admin; unlisted wallets receive `front_desk`. Add your development wallet address to that map with `admin`, `clinician`, or `front_desk` to exercise the different roles, then reconnect or reload.

The navbar displays the effective role. Admins and clinicians can upload records and revoke grants; only admins can add or remove staff. Privileged pages wait for role resolution and offer retry on failure. Changing or disconnecting the wallet clears the previous identity's role and page state.

These are UI permission checks in a mock client. A real backend must derive the role from the authenticated session and enforce the same permissions on its mutation endpoints.

## Structure

```
src/
  components/   shared UI (Navbar, GlassCard, Badge, Toast, Modal, ...)
  hooks/        useWallet (Freighter connect/disconnect)
  lib/          types, mock API client, mock data, formatting helpers
  pages/        Dashboard, PatientSearch, RecordsPage, AccessManagement, AuditLog, ProviderProfile
  test/         shared test setup (jest-dom matchers)
e2e/            Playwright end-to-end specs + fixtures (Freighter mock)
```
