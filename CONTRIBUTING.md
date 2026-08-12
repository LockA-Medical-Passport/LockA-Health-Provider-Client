# Contributing to LockA Health Provider Client

Thanks for contributing! This guide covers local setup, how to run and
check the app, and what we expect from pull requests. It's aimed at new
open-source contributors, so nothing here assumes deep familiarity with
the project.

## Table of contents

- [What this project is](#what-this-project-is)
- [Development setup](#development-setup)
- [Running the app](#running-the-app)
- [Codebase layout](#codebase-layout)
- [Testing and linting](#testing-and-linting)
- [CI](#ci)
- [Submitting a pull request](#submitting-a-pull-request)
- [Code style](#code-style)
- [Code of conduct](#code-of-conduct)

## What this project is

This is the provider-facing web client for the [LockA Medical
Passport](https://github.com/LockA-Medical-Passport/LockA-Documentation)
platform. It's a React + TypeScript single-page app (Vite, no SSR) where
hospitals, clinics, labs, pharmacies, and insurers request
patient-consented access, review approved records, and upload notes,
prescriptions, and lab results.

It currently talks to an **in-memory mock API** (`client/src/lib/api.ts`)
that mirrors the documented `locka-api` endpoints. No blockchain backend
is required to run it; a Stellar wallet (the
[Freighter](https://www.freighter.app/) extension) is only needed to
connect an identity in the UI.

## Development setup

### Prerequisites

- **Node.js 18+**
- **npm**
- A modern browser with the
  [Freighter wallet extension](https://www.freighter.app/) installed (for
  wallet connection in the UI). Not required to build or lint.

### Clone and install

```bash
git clone https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client.git
cd LockA-Health-Provider-Client
cd client
npm install
```

Everything beyond the README lives under `client/`, so always run npm
commands from that directory.

## Running the client

```bash
npm run dev       # start the dev server on http://localhost:5173
npm run build     # type-check (tsc -b) then produce a production build
npm run preview   # serve the production build locally
```

Open `http://localhost:5173` with the Freighter extension enabled to
connect a wallet and use the provider portal.

## Testing and linting

The project uses [Vitest](https://vitest.dev) with React Testing
Library. Test files live next to the code as `*.test.ts(x)` (e.g.
`client/src/lib/api.test.ts`). Run the full suite from `client/`:

```bash
npm test               # run tests once (vitest run)
npm run test:watch     # re-run on file changes
npm run test:coverage  # run with coverage report
```

Before pushing, make sure the same checks CI runs are green:

```bash
npm run lint      # oxlint (React hooks + typeScript rules)
npm run build     # TypeScript type-check + production build
npm test          # Vitest suite
```

New features and bug fixes should include tests in `client/src/**/*.test.ts(x)`. If your change touches data shapes, also update the mock fixtures in `client/src/lib/mockData.ts`.

## CI

CI (`.github/workflows/ci.yml`) runs lint, build, and tests on every push to `main` and on every pull request. Don't merge a PR that leaves CI red.

## Codebase layout

```
client/
  src/
    components/   shared UI (Navbar, GlassCard, Badge, Toast, Modal, ...)
    hooks/         useWallet (Freighter connect/disconnect)
    lib/           types, mock API client, mock data, formatting helpers
    pages/         Dashboard, PatientSearch, RecordsPage,
                   AccessManagement, AuditLog, ProviderProfile
```

The data layer is a mock client: every `api.ts` function's signature
mirrors the real `locka-api` endpoint, so replacing it with real
`fetch` calls later should not require component changes.

## Submitting a pull request

1. **Pick an issue.** Browse the [issues
   list](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues).
   If an issue isn't assigned, comment on it to signal you're picking it
   up. If you see a spec or acceptance criteria in the issue, follow it.
2. **Branch from `main`.** Name the branch `feat/<slug>`, `fix/<slug>`,
   or `docs/<slug>` to match what the PR changes (e.g. `feat/add-search`,
   `docs/contributing-guide`).
3. **Make focused commits.** One logical change per commit. Don't fold
   unrelated edits (formatting churn, renames) into a functional change.
4. **Write tests.** Until CI is green, don't submit. See [Testing and
   linting](#testing-and-linting).
5. **Open the PR.** Use the
   [pull request template](.github/PULL_REQUEST_TEMPLATE.md) and link the
   issue you're closing (e.g. `Closes #12`).
6. **Expect a review.** Keep the PR scoped; reviewers may ask for
   changes. Push amendments rather than force-pushing over reviewed work.

### Keeping a branch in sync

If `main` moves while you work, rebase rather than merge to keep history
linear:

```bash
git checkout main && git pull
git checkout your-branch
git rebase main
```

Force-pushing to your own branch is fine; never force-push to `main`.

## Branch and PR conventions

- **Branch names:** `feat/`, `fix/`, `docs/` prefixes with a short
  kebab-case slug.
- **Base branch:** always `main`.
- **Commit messages:** concise and imperative ("Add search filters to the
  patient list", "Fix the access-grant delete payload"). Reference the
  issue number where useful.
- **PR description:** use the template, link the issue, and summarize
  how you tested the change.

## Code style

There's no auto-formatter configured. Match the surrounding code: two-space
indent, single quotes, semicolons, `import type` for type-only imports (so
`verbatimModuleSyntax` type-checks clean). Let oxlint and `tsc` in
`npm run build` be your guide; if they pass, the style is fine.

## Code of conduct

Be respectful and constructive in issue threads and reviews. This is a
healthcare-adjacent open-source project, so handle patient-record related
code and discussions with extra care around privacy and consent.