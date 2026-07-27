# LockA Health Provider Client

Hospital/clinic/lab/pharmacy dashboard for the [LockA Medical Passport](https://github.com/LockA-Medical-Passport/LockA-Documentation) platform — request patient-consented access, view approved records, and upload visit notes, prescriptions, and lab results.

LockA is a decentralized healthcare platform giving patients control over their medical records across providers. This client is the **provider-facing** application: it lets registered hospitals, clinics, labs, pharmacies, and insurers request access to a patient's records, act within the scope of what the patient has approved, and issue new records back into the patient's passport.

See the [full LockA documentation](https://github.com/LockA-Medical-Passport/LockA-Documentation/blob/main/Documentation.md) for the complete architecture, smart contract reference, and data model.

## How it fits together

- **Blockchain (Stellar/Soroban)** manages identity, consent, permissions, and audit events. No raw medical data ever touches the chain.
- **Off-chain encrypted storage** holds the actual medical records; only commitment hashes are anchored on-chain.
- **Backend API** (`locka-api`, developed separately) handles authentication, encryption, indexing, and notifications between this client and the blockchain.
- **This client** authenticates providers via a Stellar wallet ([Freighter](https://www.freighter.app/) for the MVP) and talks to the backend API for everything else.

## Requirements

- Node.js 18+
- npm
- [Freighter wallet extension](https://www.freighter.app/) (for connecting a Stellar identity)

## Getting started

```bash
cd client
npm install
npm run dev
```

The dev server starts on `http://localhost:5173`. Open it in a browser with the Freighter extension installed to connect a wallet and access the provider portal.

Other commands, run from `client/`:

```bash
npm run build     # type-check and produce a production build
npm run preview   # serve the production build locally
npm run lint      # run oxlint
```

## Current status

The client currently runs against an in-memory mock API layer (`client/src/lib/api.ts`) that mirrors the endpoint shapes described in the LockA documentation (`GET /providers/{id}`, `POST /access-requests`, `GET /records`, `DELETE /access-grants/{id}`, `GET /audit-log`, etc.). Wiring it up to a live `locka-api` backend is a matter of replacing those functions' internals — no component changes required.

## Provider workflows

- **Patient Search** — look up a patient by passport ID, name, or QR code
- **Access Requests** — request specific record categories for a bounded duration with a stated purpose
- **Access Management** — track active grants and revoke access
- **Medical Records** — view approved records and upload treatment notes, prescriptions, lab results, and referrals
- **Audit Log** — timestamped history of every access request, approval, denial, revocation, and record view
- **Provider Profile** — organization details, verification status, and staff account management

## Related repositories

- [`locka-patient-client`](https://github.com/LockA-Medical-Passport) — patient-side approvals and passport management
- [`locka-api`](https://github.com/LockA-Medical-Passport) — backend services
- [`locka-contracts`](https://github.com/LockA-Medical-Passport) — Stellar/Soroban smart contracts
