# LockA Health Provider Client

Hospital/clinic/lab/pharmacy dashboard for the [LockA Medical Passport](https://github.com/LockA-Medical-Passport/LockA-Documentation) platform — request patient-consented access, view approved records, and upload visit notes, prescriptions, and lab results.

LockA is a decentralized healthcare platform giving patients control over their medical records across providers. This client is the **provider-facing** application: it lets registered hospitals, clinics, labs, pharmacies, and insurers request access to a patient's records, act within the scope of what the patient has approved, and issue new records back into the patient's passport.

See the [full LockA documentation](https://github.com/LockA-Medical-Passport/LockA-Documentation/blob/main/Documentation.md) for the complete architecture, smart contract reference, and data model.

## How it fits together

- **Blockchain (Stellar/Soroban)** manages identity, consent, permissions, and audit events. No raw medical data ever touches the chain.
- **Off-chain encrypted storage** holds the actual medical records; only commitment hashes are anchored on-chain.
- **Backend API** (`locka-api`, developed separately) handles authentication, encryption, indexing, and notifications between this client and the blockchain.
- **This client** authenticates providers via a Stellar wallet ([Freighter](https://www.freighter.app/) for the MVP) and talks to the backend API for everything else.

## Design reference vs. blockchain implementation

This UI's visual design (dark navy/cyan glassmorphism theme, layout, and component patterns) is modeled after an existing **EVM/Solidity** implementation of LockA:

- Live app: [locka.remixdapp.eth.limo](https://locka.remixdapp.eth.limo/)
- Source: [Dannyswiss1/LockA-Medical-Passport-Monorepo](https://github.com/Dannyswiss1/LockA-Medical-Passport-Monorepo)

That version runs on Base (an EVM Layer 2) with Solidity contracts and MetaMask for wallet auth. **This repository is a different implementation track** — it follows the [official LockA documentation](https://github.com/LockA-Medical-Passport/LockA-Documentation/blob/main/Documentation.md)'s **Stellar/Soroban** architecture instead:

| | EVM reference (design source) | This repo (target implementation) |
|---|---|---|
| Chain | Base (EVM L2) | Stellar (Soroban smart contracts) |
| Wallet | MetaMask | [Freighter](https://www.freighter.app/) |
| Native asset | ETH | XLM (Stellar Lumens) |
| Contract language | Solidity | Rust (Soroban) |

Smart contracts referenced in the two docs map conceptually as follows:

| EVM reference contract | Soroban equivalent (this repo targets) |
|---|---|
| `PatientPassportRegistry` | `PatientIdentityRegistry` |
| `ProviderRegistry` | `ProviderRegistry` |
| `MedicalRecordRegistry` | `RecordCommitmentRegistry` |
| `ConsentAccessManager` | `ConsentAccessControl` |
| `LockAOrchestrator` / audit trail | `AuditEventEmitter` |

Only the UI/UX is being reused from the EVM version — all wallet connection, identity, and consent logic in this client targets Stellar/Soroban via Freighter, not EVM tooling.

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

- [`LockA-Medical-Passport-Monorepo`](https://github.com/Dannyswiss1/LockA-Medical-Passport-Monorepo) — EVM/Solidity reference implementation this client's design is based on
- [`LockA-Documentation`](https://github.com/LockA-Medical-Passport/LockA-Documentation) — architecture, data model, and API reference for the Stellar/Soroban version
- `locka-patient-client` — patient-side approvals and passport management (Stellar/Soroban, sibling repo per the documentation)
- `locka-api` — backend services (Stellar/Soroban, sibling repo per the documentation)
- `locka-contracts` — Soroban smart contracts (sibling repo per the documentation)
