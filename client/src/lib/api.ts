import {
  mockAccessGrants,
  mockAccessRequests,
  mockAuditLog,
  mockPatients,
  mockProvider,
  mockRecords,
  mockStaff,
  mockWalletRoles,
} from './mockData';
import type {
  AccessGrant,
  AccessRequest,
  AuditEvent,
  MedicalRecord,
  DashboardStats,
  PageParams,
  PagedResult,
  PatientLookupResult,
  ProviderOrganization,
  RecordCategory,
  StaffMember,
  StaffRole,
} from './types';

/**
 * Mock implementation of the locka-api provider client surface described in
 * the LockA documentation. Every function mirrors a documented endpoint
 * shape (method + path in the comment) so swapping in real `fetch` calls
 * against a live backend later is a drop-in replacement.
 */

const LATENCY_MS = 450;
const DEFAULT_PAGE_SIZE = 10;

let provider: ProviderOrganization = { ...mockProvider };
const staff: StaffMember[] = [...mockStaff];
const accessRequests: AccessRequest[] = [...mockAccessRequests];
const accessGrants: AccessGrant[] = mockAccessGrants.map((grant) => ({ ...grant }));
const records: MedicalRecord[] = [...mockRecords];
const auditLog: AuditEvent[] = [...mockAuditLog];

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function pushAudit(entry: Omit<AuditEvent, 'id' | 'timestamp'>) {
  auditLog.unshift({ ...entry, id: newId('audit'), timestamp: new Date().toISOString() });
}

function paginate<T>(sorted: T[], { page = 1, pageSize = DEFAULT_PAGE_SIZE }: PageParams): PagedResult<T> {
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new ApiError('Page must be a positive integer and page size must be between 1 and 100.');
  }
  const start = (page - 1) * pageSize;
  const items = sorted.slice(start, start + pageSize);
  return { items, page, pageSize, total: sorted.length, hasMore: start + items.length < sorted.length };
}

/**
 * Mock network-failure simulation. Real backend calls fail unpredictably;
 * this in-memory API never does, so tests (and future error-UI work) need an
 * explicit switch to exercise failure/retry paths. A forced failure persists
 * until toggled off, so a test can flip it off right before triggering retry.
 */
export class ApiError extends Error {
  constructor(message = 'Something went wrong. Please try again.') {
    super(message);
    this.name = 'ApiError';
  }
}

export type MockEndpoint =
  | 'getProvider'
  | 'getDashboardStats'
  | 'getCurrentRole'
  | 'registerProvider'
  | 'listStaff'
  | 'addStaffMember'
  | 'removeStaffMember'
  | 'searchPatients'
  | 'listAccessRequests'
  | 'getAccessRequest'
  | 'createAccessRequest'
  | 'listRecords'
  | 'viewRecord'
  | 'uploadRecord'
  | 'listAccessGrants'
  | 'revokeAccessGrant'
  | 'getAuditLog';

const forcedFailures = new Set<MockEndpoint>();

export function setMockFailure(endpoint: MockEndpoint, shouldFail = true): void {
  if (shouldFail) forcedFailures.add(endpoint);
  else forcedFailures.delete(endpoint);
}

export function clearMockFailures(): void {
  forcedFailures.clear();
}

async function maybeFail(endpoint: MockEndpoint): Promise<void> {
  if (forcedFailures.has(endpoint)) {
    await delay(undefined);
    throw new ApiError();
  }
}

// GET /providers/{id}
export async function getProvider(): Promise<ProviderOrganization> {
  await maybeFail('getProvider');
  return delay({ ...provider });
}

// GET /providers/{id}/staff/me — replace the fixture lookup with authenticated backend identity.
export async function getCurrentRole(walletAddress: string): Promise<StaffRole> {
  await maybeFail('getCurrentRole');
  return delay(Object.hasOwn(mockWalletRoles, walletAddress) ? mockWalletRoles[walletAddress] : 'front_desk');
}

// GET /providers/{id}/stats — aggregate counts without transferring every row.
export async function getDashboardStats(): Promise<DashboardStats> {
  await maybeFail('getDashboardStats');
  return delay({
    activeGrants: accessGrants.filter((grant) => grant.status === 'active' || grant.status === 'expiring_soon').length,
    pendingRequests: accessRequests.filter((request) => request.status === 'pending').length,
    recordCount: records.length,
  });
}

export async function registerProvider(input: {
  name: string;
  orgType: ProviderOrganization['orgType'];
  stellarAddress: string;
}): Promise<ProviderOrganization> {
  await maybeFail('registerProvider');
  provider = {
    ...provider,
    name: input.name,
    orgType: input.orgType,
    stellarAddress: input.stellarAddress,
    verificationStatus: 'pending',
  };
  return delay({ ...provider });
}

export async function listStaff(): Promise<StaffMember[]> {
  await maybeFail('listStaff');
  return delay([...staff]);
}

export async function addStaffMember(input: { name: string; email: string; role: StaffMember['role'] }): Promise<StaffMember> {
  await maybeFail('addStaffMember');
  const member: StaffMember = { id: newId('staff'), addedAt: new Date().toISOString(), ...input };
  staff.push(member);
  provider = { ...provider, staffCount: staff.length };
  return delay(member);
}

// DELETE /providers/{id}/staff/{staffId}
export async function removeStaffMember(id: string): Promise<void> {
  await maybeFail('removeStaffMember');
  const index = staff.findIndex((member) => member.id === id);
  if (index < 0) throw new ApiError('Staff member not found.');
  staff.splice(index, 1);
  provider = { ...provider, staffCount: staff.length };
  return delay(undefined);
}

// Patient search by QR code, passport ID, or approved contact method
export async function searchPatients(query: string): Promise<PatientLookupResult[]> {
  await maybeFail('searchPatients');
  const q = query.trim().toLowerCase();
  if (!q) return delay([]);
  const results = mockPatients.filter(
    (p) => p.passportId.toLowerCase().includes(q) || p.displayName.toLowerCase().includes(q),
  );
  return delay(results);
}

// GET /access-requests
export async function listAccessRequests(params: PageParams = {}): Promise<PagedResult<AccessRequest>> {
  await maybeFail('listAccessRequests');
  const sorted = [...accessRequests].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return delay(paginate(sorted, params));
}

// GET /access-requests/{id}
export async function getAccessRequest(id: string): Promise<AccessRequest | undefined> {
  await maybeFail('getAccessRequest');
  return delay(accessRequests.find((r) => r.id === id));
}

// POST /access-requests
export async function createAccessRequest(input: {
  patientPassportId: string;
  patientDisplayName: string;
  requestedCategories: RecordCategory[];
  durationDays: number;
  purpose: string;
}): Promise<AccessRequest> {
  await maybeFail('createAccessRequest');
  const request: AccessRequest = {
    id: newId('req'),
    status: 'pending',
    requestedAt: new Date().toISOString(),
    resolvedAt: null,
    expiresAt: null,
    ...input,
  };
  accessRequests.unshift(request);
  pushAudit({
    type: 'access_requested',
    patientPassportId: input.patientPassportId,
    patientDisplayName: input.patientDisplayName,
    actor: 'You',
    detail: `Requested access to ${input.requestedCategories.length} categories for ${input.durationDays} days`,
  });
  return delay(request);
}

// GET /records
export async function listRecords(params: PageParams = {}): Promise<PagedResult<MedicalRecord>> {
  await maybeFail('listRecords');
  const sorted = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return delay(paginate(sorted, params));
}

export async function viewRecord(id: string): Promise<MedicalRecord | undefined> {
  await maybeFail('viewRecord');
  const record = records.find((r) => r.id === id);
  if (record) {
    pushAudit({
      type: 'record_viewed',
      patientPassportId: record.patientPassportId,
      patientDisplayName: record.patientDisplayName,
      actor: 'You',
      detail: `Viewed ${record.title}`,
    });
  }
  return delay(record);
}

// Mocks the "backend encrypts records before storage; hash submitted to commitment registry" flow:
// derive commitmentHash deterministically from the attached file's bytes instead of at random.
async function hashFileBytes(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return '0x' + Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// POST /records
export async function uploadRecord(input: {
  patientPassportId: string;
  patientDisplayName: string;
  category: RecordCategory;
  title: string;
  notes: string;
  file: File;
}): Promise<MedicalRecord> {
  await maybeFail('uploadRecord');
  const { file, ...rest } = input;
  const record: MedicalRecord = {
    id: newId('rec'),
    issuerProviderId: provider.providerId,
    issuerName: provider.name,
    createdAt: new Date().toISOString(),
    commitmentHash: await hashFileBytes(file),
    attachment: { fileName: file.name, fileType: file.type, fileSize: file.size },
    ...rest,
  };
  records.unshift(record);
  pushAudit({
    type: 'record_uploaded',
    patientPassportId: input.patientPassportId,
    patientDisplayName: input.patientDisplayName,
    actor: 'You',
    detail: `Uploaded ${input.title}`,
  });
  return delay(record);
}

// GET /access-grants
export async function listAccessGrants(params: PageParams = {}): Promise<PagedResult<AccessGrant>> {
  await maybeFail('listAccessGrants');
  const sorted = [...accessGrants].sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
  return delay(paginate(sorted, params));
}

// DELETE /access-grants/{id}
export async function revokeAccessGrant(id: string): Promise<void> {
  await maybeFail('revokeAccessGrant');
  const grant = accessGrants.find((g) => g.id === id);
  if (grant) {
    grant.status = 'revoked';
    pushAudit({
      type: 'access_revoked',
      patientPassportId: grant.patientPassportId,
      patientDisplayName: grant.patientDisplayName,
      actor: 'You',
      detail: `Revoked access to ${grant.categories.length} categories`,
    });
  }
  return delay(undefined);
}

// GET /audit-log
export async function getAuditLog(params: PageParams = {}): Promise<PagedResult<AuditEvent>> {
  await maybeFail('getAuditLog');
  const sorted = [...auditLog].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return delay(paginate(sorted, params));
}
