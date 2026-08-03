# LockA Provider Client — Contribution Issues

Tracking issues for building out the LockA Health Provider Client, located in [`client/`](client/). The frontend
(React + TypeScript + Vite + Tailwind) is scaffolded and visually aligned with the
[EVM reference version of LockA](https://locka.remixdapp.eth.limo/), running against a mock API layer described in
the [LockA documentation](https://github.com/LockA-Medical-Passport/LockA-Documentation/blob/main/Documentation.md).
This repo targets the **Stellar/Soroban** implementation with **Freighter** wallet auth.

These issues are scoped for open-source contribution: testing infrastructure, test coverage, feature hardening,
accessibility, and contributor tooling. All work should live under `client/`.

---

## 1. Set up Vitest + React Testing Library test infrastructure

**Labels:** `testing`, `good first issue`

The `client/` project currently has zero test tooling. Add `vitest`, `@testing-library/react`,
`@testing-library/user-event`, and `@testing-library/jest-dom` as dev dependencies, configure `vitest.config.ts`
(or extend `vite.config.ts`) with a `jsdom` environment, and add an `npm test` / `npm run test:watch` script to
`client/package.json`. Include one trivial smoke test (e.g. rendering `<Badge tone="green">OK</Badge>`) to prove
the pipeline works end to end.

**Acceptance criteria**
- [ ] `npm test` runs and passes from `client/`
- [ ] Coverage reporting configured (`--coverage`, using `v8` or `istanbul`)
- [ ] A short "Testing" section added to `client/README.md`

---

## 2. Add CI pipeline (GitHub Actions) for lint, typecheck, and tests

**Labels:** `testing`, `enhancement`

Add `.github/workflows/ci.yml` that runs on every push/PR: `npm ci`, `npm run lint`, `npm run build` (type-check),
and `npm test` (once #1 lands), scoped to the `client/` working directory. Fail the workflow on any non-zero exit.

**Acceptance criteria**
- [ ] Workflow triggers on `push` and `pull_request`
- [ ] All four steps (install, lint, typecheck/build, test) run and are required to pass
- [ ] Node version pinned (match `client/package.json` engines or use the same major version as local dev)

---

## 3. Unit tests for the mock API layer (`client/src/lib/api.ts`)

**Labels:** `testing`

Cover every exported function in `api.ts` (`getProvider`, `registerProvider`, `listStaff`, `addStaffMember`,
`searchPatients`, `listAccessRequests`, `createAccessRequest`, `listRecords`, `uploadRecord`, `listAccessGrants`,
`revokeAccessGrant`, `getAuditLog`) against the in-memory fixtures in `mockData.ts`. Verify state mutations (e.g.
`revokeAccessGrant` flips status and appends an audit event; `uploadRecord` generates a commitment hash and
prepends to the list).

**Acceptance criteria**
- [ ] Each exported function has at least one test
- [ ] Audit-log side effects of mutating calls are asserted
- [ ] Tests don't rely on real timers/delays (mock or fast-forward the artificial latency)

---

## 4. Unit tests for formatting utilities (`client/src/lib/format.ts`)

**Labels:** `testing`, `good first issue`

Test `truncateAddress`, `formatDate`, `formatDateOnly`, and `daysUntil`, including edge cases: empty string input,
addresses shorter than the truncation window, and `daysUntil` with a past date (should return a negative number,
not throw).

**Acceptance criteria**
- [ ] All four functions covered with at least one edge case each
- [ ] Locale-dependent assertions avoided (assert structure/shape, not exact locale-formatted strings)

---

## 5. Unit tests for the `useWallet` hook

**Labels:** `testing`

Mock `@stellar/freighter-api` and test `client/src/hooks/useWallet.ts` across all states: `checking` → `unavailable`
(no extension), `checking` → `idle` (extension present, not previously allowed), `idle` → `connecting` →
`connected` (user approves `requestAccess`), and the rejection path (user denies access, error message surfaced).

**Acceptance criteria**
- [ ] `@stellar/freighter-api` is mocked (no real extension dependency in tests)
- [ ] All five documented `WalletStatus` transitions have a test
- [ ] `disconnect()` resets `address`/`network` and returns to `idle`

---

## 6. Component tests for shared UI primitives

**Labels:** `testing`, `good first issue`

Add rendering/behavior tests for `Badge`, `GlassCard`, `StatCard`, and `Spinner` in `client/src/components/`.
For `Badge`, also test the `statusToBadgeTone` mapping function directly (every known status string plus an
unknown fallback).

**Acceptance criteria**
- [ ] Each component renders with expected text/props reflected in the DOM
- [ ] `statusToBadgeTone` has a table-driven test covering all branches, including the default case

---

## 7. Component tests for the `Toast` provider/queue

**Labels:** `testing`

Test `client/src/components/Toast.tsx`: calling `toast()` renders a toast with the right kind styling, multiple
toasts stack, a toast auto-dismisses after its timeout, and clicking the close button removes it immediately.
Assert `useToast()` throws when called outside a `ToastProvider`.

**Acceptance criteria**
- [ ] Auto-dismiss timing is tested with fake timers, not real waits
- [ ] Manual dismiss via the close button is tested
- [ ] The out-of-provider error case is tested

---

## 8. Component tests for `Modal`

**Labels:** `testing`

Test `client/src/components/Modal.tsx`: clicking the backdrop calls `onClose`, clicking inside the modal body does
not, clicking the close (×) button calls `onClose`, and the title renders correctly. Add keyboard support if
missing (Escape key to close) as part of this issue, with a test for it.

**Acceptance criteria**
- [ ] Backdrop-click-to-close is tested
- [ ] Click-inside-does-not-close is tested (event propagation guard)
- [ ] Escape-to-close is implemented and tested

---

## 9. Component tests for `Navbar`

**Labels:** `testing`

Test `client/src/components/Navbar.tsx` across wallet states (`connected` shows truncated address + disconnect
button; disconnected shows "Connect Wallet"; `unavailable` shows "Install Freighter" and is disabled;
`connecting` shows a spinner), active-route highlighting for each nav item, and the mobile menu toggle
(open/close, closes on nav item click).

**Acceptance criteria**
- [ ] All four `WalletStatus` renderings are covered
- [ ] Active `nav-link` class is asserted per route
- [ ] Mobile menu open/close behavior is covered

---

## 10. Integration test: Patient Search → Access Request flow

**Labels:** `testing`

Test `client/src/pages/PatientSearch.tsx` end to end at the component level: type a query, submit, see results,
click "Request Access", select categories in the modal, fill in duration and purpose, submit, and assert a
success toast fires and the modal closes. Also test the empty-results state and the disabled "Request Access"
button for `inactive` passport status.

**Acceptance criteria**
- [ ] Happy path covered from search input to success toast
- [ ] Empty-results state covered
- [ ] Inactive-passport disabled-button case covered
- [ ] Submit is disabled until at least one category and a non-empty purpose are provided

---

## 11. Integration test: Medical Records upload flow

**Labels:** `testing`

Test `client/src/pages/RecordsPage.tsx`: switching to the "Add Record" tab, filling the form, submitting, and
verifying the new record appears in the "All Records" tab with a generated commitment hash. Also test opening the
detail modal for an existing record and verify it triggers a `record_viewed` audit entry (via the mock API).

**Acceptance criteria**
- [ ] Upload flow covered end to end, including the tab switch back to "All Records"
- [ ] Detail modal open/close is covered
- [ ] Submit is disabled until passport ID and title are provided

---

## 12. Integration test: Access Management revoke flow

**Labels:** `testing`

Test `client/src/pages/AccessManagement.tsx`: the "Active Grants" / "My Access Requests" tab switch, revoking an
active grant (button shows a spinner, grant status updates to `revoked`, revoke button disappears, an info toast
fires), and that `expired`/`revoked` grants never show a revoke button.

**Acceptance criteria**
- [ ] Revoke flow covered including the loading state on the button
- [ ] Tab switching is covered
- [ ] Revoke button visibility is asserted per grant status

---

## 13. Integration test: Provider Profile staff management flow

**Labels:** `testing`

Test `client/src/pages/ProviderProfile.tsx`: organization info renders correctly, the staff list renders each
member with the right role badge, adding a new staff member via the form updates the list and increments the
provider's `staffCount`, and the form resets after a successful submission.

**Acceptance criteria**
- [ ] Add-staff happy path covered
- [ ] Form reset after submit is asserted
- [ ] Submit is disabled until name and email are provided

---

## 14. Set up Playwright E2E test suite

**Labels:** `testing`, `enhancement`

Add Playwright to `client/` (`@playwright/test`) with a config pointing at the Vite dev server, plus an `npm run
test:e2e` script. Include a fixture/mock for `@stellar/freighter-api` (e.g. via `page.addInitScript`) so tests can
exercise the connected-wallet UI without a real browser extension.

**Acceptance criteria**
- [ ] Playwright config auto-starts the dev server for test runs
- [ ] A working Freighter mock/stub fixture is documented and reusable across specs
- [ ] CI (#2) runs the E2E suite on PRs

---

## 15. E2E test: full provider happy-path journey

**Labels:** `testing`

Using the suite from #14, write one end-to-end spec that walks the full journey: land on the wallet gate → connect
(mocked) → search for a patient → send an access request → navigate to Records and upload one → navigate to
Access Management and revoke a grant → navigate to Audit Log and confirm all of the above actions appear.

**Acceptance criteria**
- [ ] Single spec covers the full cross-page journey described above
- [ ] Assertions check the Audit Log reflects every action performed
- [ ] Spec runs headless in CI

---

## 16. Implement real QR code scanning for Patient Search

**Labels:** `enhancement`, `help wanted`

`client/src/pages/PatientSearch.tsx` currently has a "Scan QR" button that does nothing. Wire it up to a real
camera-based QR scanner (e.g. `@yudiel/react-qr-scanner` or `html5-qrcode`) that opens in a modal, decodes a
patient passport QR payload, and feeds the result into the existing search flow.

**Acceptance criteria**
- [ ] Clicking "Scan QR" opens a camera permission-gated scanner modal
- [ ] A successfully decoded QR value populates the search and triggers a lookup
- [ ] Graceful fallback/error state when camera access is denied or unavailable

---

## 17. Add file attachment support to Record Upload

**Labels:** `enhancement`

`client/src/pages/RecordsPage.tsx`'s `AddRecordForm` only accepts free-text notes. Add a file input (PDF/image)
for the actual document, with client-side size/type validation, a preview/filename chip, and a mock "encrypt +
hash" step in `api.ts` (`uploadRecord`) that derives `commitmentHash` from the file content instead of a random
value, matching the doc's "backend encrypts records before storage; hash submitted to commitment registry" flow.

**Acceptance criteria**
- [ ] File input supports at least PDF, PNG, JPG with a size limit and user-facing validation errors
- [ ] `commitmentHash` is derived deterministically from file bytes (e.g. SHA-256) rather than random
- [ ] Existing text-notes field is preserved alongside the attachment

---

## 18. Add client-side form validation with inline error messaging

**Labels:** `enhancement`, `good first issue`

Forms across `PatientSearch` (access request modal), `RecordsPage` (add record), and `ProviderProfile` (add staff)
currently only disable the submit button when required fields are empty — there's no inline feedback explaining
*why*, and no format validation (e.g. email format, passport ID shape). Add a small shared validation helper and
inline error text under each invalid field, shown after first blur/submit attempt.

**Acceptance criteria**
- [ ] Email fields validate format, not just non-empty
- [ ] Passport ID input validates against the expected `pp_...` shape
- [ ] Errors are shown per-field, not just via a disabled button, and are associated via `aria-describedby`

---

## 19. Add error-state handling and retry UX for API failures

**Labels:** `enhancement`

`client/src/lib/api.ts` never fails today, so every page assumes the happy path. Add a way for mock calls to
simulate failure (useful for tests and future real-backend integration), and add error UI to each page: a
"Something went wrong" state with a retry button, plus error toasts for failed mutations (upload, revoke, staff
add, access request).

**Acceptance criteria**
- [ ] Each data-fetching page has a distinct error state, not just infinite/silent loading
- [ ] Failed mutations show an error toast (reuse the existing `useToast` error kind)
- [ ] A retry action re-triggers the failed fetch without a full page reload

---

## 20. Add pagination for Records, Access Management, and Audit Log lists

**Labels:** `enhancement`

`listRecords`, `listAccessGrants`, `listAccessRequests`, and `getAuditLog` return their full arrays with no limit.
Add page-size-based pagination (or "load more") to `RecordsPage`, `AccessManagement`, and `AuditLog`, and extend
the mock API functions to accept `{ page, pageSize }` params so real-backend integration later isn't a breaking
change.

**Acceptance criteria**
- [ ] All three list pages support paging without fetching the entire dataset up front
- [ ] Mock API functions accept and honor pagination params
- [ ] Loading state for "next page" is distinct from initial page load

---

## 21. Add role-based UI permission gating

**Labels:** `enhancement`

`client/src/lib/types.ts` already defines `StaffRole` (`admin` | `clinician` | `front_desk`), but nothing in the UI
uses it — every connected wallet sees every action. Gate sensitive actions (revoking access, uploading records,
adding/removing staff) behind role checks, and reflect the current user's effective role somewhere visible in the
UI (e.g. the Navbar or Provider Profile).

**Acceptance criteria**
- [ ] `front_desk` role cannot upload records or revoke access grants (buttons hidden or disabled with a tooltip)
- [ ] `admin`-only actions (staff management) are gated to `admin` role
- [ ] Current effective role is visibly surfaced somewhere in the UI

---

## 22. Add environment-based API base URL configuration

**Labels:** `enhancement`, `good first issue`

`client/src/lib/api.ts` is entirely in-memory today with no concept of a backend URL. Add `VITE_API_BASE_URL`
support (via `.env` / `.env.example`) and a thin fetch wrapper, so a future PR that replaces the mock functions'
internals with real `fetch` calls has a documented, consistent place to point at `locka-api`.

**Acceptance criteria**
- [ ] `.env.example` added documenting `VITE_API_BASE_URL` and any other needed vars
- [ ] A `client/src/lib/http.ts` fetch wrapper exists (base URL, JSON handling, error normalization) even if unused
      by the mock layer yet
- [ ] `client/README.md` documents how to point the client at a real backend

---

## 23. Add Freighter network validation with switch-network prompt

**Labels:** `enhancement`

The EVM reference site shows a "Switch to `<network>`" prompt when the connected wallet is on the wrong chain.
`client/src/hooks/useWallet.ts` fetches `network` via `freighterApi.getNetwork()` but nothing validates it against
an expected network (e.g. Testnet during development). Add an expected-network constant, a mismatch check, and a
Navbar prompt/button mirroring the reference site's UX, using Freighter's network-switch capability where
available.

**Acceptance criteria**
- [ ] Expected network is a single configurable constant (not hardcoded in multiple places)
- [ ] Navbar shows a distinct warning state when connected to the wrong network
- [ ] A test (per #9) covers the mismatch-warning rendering

---

## 24. Accessibility audit and remediation pass

**Labels:** `enhancement`, `help wanted`

Run an accessibility pass across all six pages plus shared components: keyboard-only navigation through the
Navbar and all forms, focus trapping and return-focus in `Modal`, `aria-label`s on icon-only buttons ("Scan QR",
close buttons, mobile menu toggle), and color-contrast verification for badge/text-on-glass combinations against
WCAG AA.

**Acceptance criteria**
- [ ] All interactive elements are reachable and operable via keyboard alone
- [ ] `Modal` traps focus while open and returns focus to the trigger element on close
- [ ] Icon-only buttons have accessible names
- [ ] Contrast issues found are fixed or filed as follow-up issues with specifics

---

## 25. Responsive/mobile design QA pass

**Labels:** `enhancement`, `good first issue`

Verify and fix layout at common breakpoints (375px, 768px, 1024px) across all pages — particularly the
`AccessRequestModal`'s two-column category grid, `RecordsPage` tab bar, and `Navbar`'s mobile menu — against the
reference site's responsive behavior. Capture before/after screenshots in the PR description.

**Acceptance criteria**
- [ ] No horizontal overflow at any of the three breakpoints on any page
- [ ] Modal category grid degrades to a single column below a defined breakpoint
- [ ] Mobile menu behavior verified with a real touch-sized viewport in the PR's test evidence

---

## 26. Persist wallet session across page reloads

**Labels:** `enhancement`

Currently reloading the page re-runs `useWallet`'s `isConnected`/`isAllowed` check, which works, but there's no
optimistic "restoring session…" state — the wallet gate briefly flashes before resolving. Add a short-lived
loading state distinct from `unavailable`/`idle` that renders while the initial Freighter check is in flight, so
users with an already-approved wallet don't see a false disconnect flash.

**Acceptance criteria**
- [ ] Initial load shows a distinct "restoring session" state, not the full disconnected gate, while `isConnected`/
      `isAllowed` resolve
- [ ] No visible flash of the disconnected state for already-approved wallets on reload
- [ ] Covered by a test added to #5

---

## 27. Add CONTRIBUTING.md and issue/PR templates

**Labels:** `documentation`, `good first issue`

Add `CONTRIBUTING.md` (setup instructions, how to run `client/`, test/lint commands, branch/PR conventions) and
`.github/ISSUE_TEMPLATE/` + `.github/PULL_REQUEST_TEMPLATE.md` to make it easy for new open-source contributors to
pick up issues from this list.

**Acceptance criteria**
- [ ] `CONTRIBUTING.md` covers local setup, testing, and PR expectations
- [ ] Bug report and feature request issue templates added
- [ ] PR template includes a test-plan checklist

---

## 28. Add Storybook for the shared component library

**Labels:** `enhancement`, `help wanted`

Set up Storybook in `client/` and add stories for every component in `client/src/components/` (`Badge`,
`GlassCard`, `StatCard`, `Spinner`, `Toast`, `Modal`, `Navbar`, `LockaLogo`, `Icons`), covering their meaningful
prop/state variants (e.g. every `Badge` tone, every `WalletStatus` for `Navbar`). This gives contributors and
designers a way to review UI changes in isolation against the reference design.

**Acceptance criteria**
- [ ] Storybook runs via `npm run storybook` from `client/`
- [ ] Every component listed above has at least one story
- [ ] Stories for stateful components cover their distinct visual states

---

## Created issues

1. [Set up Vitest + React Testing Library test infrastructure](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/3)
2. [Add CI pipeline (GitHub Actions) for lint, typecheck, and tests](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/4)
3. [Unit tests for the mock API layer (`client/src/lib/api.ts`)](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/5)
4. [Unit tests for formatting utilities (`client/src/lib/format.ts`)](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/6)
5. [Unit tests for the `useWallet` hook](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/7)
6. [Component tests for shared UI primitives](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/8)
7. [Component tests for the `Toast` provider/queue](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/9)
8. [Component tests for `Modal`](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/10)
9. [Component tests for `Navbar`](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/11)
10. [Integration test: Patient Search → Access Request flow](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/12)
11. [Integration test: Medical Records upload flow](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/13)
12. [Integration test: Access Management revoke flow](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/14)
13. [Integration test: Provider Profile staff management flow](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/15)
14. [Set up Playwright E2E test suite](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/16)
15. [E2E test: full provider happy-path journey](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/17)
16. [Implement real QR code scanning for Patient Search](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/18)
17. [Add file attachment support to Record Upload](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/19)
18. [Add client-side form validation with inline error messaging](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/20)
19. [Add error-state handling and retry UX for API failures](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/21)
20. [Add pagination for Records, Access Management, and Audit Log lists](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/22)
21. [Add role-based UI permission gating](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/23)
22. [Add environment-based API base URL configuration](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/24)
23. [Add Freighter network validation with switch-network prompt](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/25)
24. [Accessibility audit and remediation pass](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/26)
25. [Responsive/mobile design QA pass](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/27)
26. [Persist wallet session across page reloads](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/28)
27. [Add CONTRIBUTING.md and issue/PR templates](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/29)
28. [Add Storybook for the shared component library](https://github.com/LockA-Medical-Passport/LockA-Health-Provider-Client/issues/30)
