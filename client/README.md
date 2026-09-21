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

## Testing

Tests run on [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react), with `jsdom` as the DOM environment.

```bash
npm test             # run the full suite once
npm run test:watch   # watch mode for local development
npm run test:coverage  # run with a v8 coverage report (text + html + lcov)
```

Test files live next to the code they cover (`*.test.ts` / `*.test.tsx`). Shared setup (currently just `@testing-library/jest-dom` matchers) lives in `src/test/setup.ts` and is wired in via `vite.config.ts`'s `test.setupFiles`.

## Data layer

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
```
