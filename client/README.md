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

`src/lib/api.ts` is a mock implementation of the documented `locka-api` provider endpoints (`GET /providers/{id}`, `POST /access-requests`, `GET /records`, `DELETE /access-grants/{id}`, `GET /audit-log`, etc.), backed by in-memory fixtures in `src/lib/mockData.ts`. Every function's signature mirrors the real endpoint shape, so swapping in real `fetch` calls against a live backend is a drop-in replacement — no component changes needed.

## Structure

```
src/
  components/   shared UI (Navbar, GlassCard, Badge, Toast, Modal, ...)
  hooks/        useWallet (Freighter connect/disconnect)
  lib/          types, mock API client, mock data, formatting helpers
  pages/        Dashboard, PatientSearch, RecordsPage, AccessManagement, AuditLog, ProviderProfile
  test/         shared test setup (jest-dom matchers)
```
