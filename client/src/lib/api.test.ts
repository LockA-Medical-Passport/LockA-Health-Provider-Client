import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as Api from './api';
import type { PagedResult } from './types';

/**
 * api.ts holds its fixtures in module-level mutable state, so each test
 * resets the module registry and re-imports it fresh to avoid cross-test
 * pollution. Every call goes through an artificial ~450ms `delay()`; fake
 * timers + advanceTimersByTimeAsync flush that deterministically instead of
 * waiting on real time.
 */

let api: typeof Api;

async function flush<T>(promise: Promise<T>): Promise<T> {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  const settled = await result;
  if (!settled.ok) throw settled.error;
  return settled.value;
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  api = await import('./api');
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getProvider', () => {
  it('returns the seeded provider', async () => {
    const provider = await flush(api.getProvider());
    expect(provider.providerId).toBe('prov_8f2a1c4e9b');
    expect(provider.verificationStatus).toBe('verified');
  });
});

describe('registerProvider', () => {
  it('updates org fields and resets verification status to pending', async () => {
    const updated = await flush(
      api.registerProvider({ name: 'New Clinic', orgType: 'clinic', stellarAddress: 'GNEWADDRESS' }),
    );
    expect(updated).toMatchObject({
      name: 'New Clinic',
      orgType: 'clinic',
      stellarAddress: 'GNEWADDRESS',
      verificationStatus: 'pending',
    });

    const fetched = await flush(api.getProvider());
    expect(fetched.name).toBe('New Clinic');
  });
});

describe('listStaff / addStaffMember', () => {
  it('listStaff returns the seeded staff list', async () => {
    const staff = await flush(api.listStaff());
    expect(staff).toHaveLength(4);
    expect(staff.map((s) => s.id)).toContain('staff_1');
  });

  it('addStaffMember appends a member and increments provider.staffCount', async () => {
    const before = await flush(api.listStaff());
    const providerBefore = await flush(api.getProvider());

    const member = await flush(
      api.addStaffMember({ name: 'Jane Doe', email: 'jane@example.com', role: 'clinician' }),
    );
    expect(member).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', role: 'clinician' });
    expect(member.id).toMatch(/^staff_/);

    const after = await flush(api.listStaff());
    expect(after).toHaveLength(before.length + 1);

    const providerAfter = await flush(api.getProvider());
    expect(providerAfter.staffCount).toBe(providerBefore.staffCount + 1);
  });
});

describe('searchPatients', () => {
  it('matches by display name, case-insensitively', async () => {
    const results = await flush(api.searchPatients('chidinma'));
    expect(results).toHaveLength(1);
    expect(results[0].displayName).toBe('Chidinma Eze');
  });

  it('matches by passport id, case-insensitively', async () => {
    const results = await flush(api.searchPatients('PP_7B2CD415'));
    expect(results).toHaveLength(1);
    expect(results[0].passportId).toBe('pp_7b2cd415');
  });

  it('returns an empty array for a blank query without matching every patient', async () => {
    const results = await flush(api.searchPatients('   '));
    expect(results).toEqual([]);
  });

  it('returns an empty array when nothing matches', async () => {
    const results = await flush(api.searchPatients('no-such-patient'));
    expect(results).toEqual([]);
  });
});

describe('access requests', () => {
  it('listAccessRequests returns requests sorted newest-first', async () => {
    const { items } = await flush(api.listAccessRequests());
    const timestamps = items.map((r) => r.requestedAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it('listAccessRequests honors page/pageSize and reports total/hasMore', async () => {
    const all = await flush(api.listAccessRequests({ pageSize: 100 }));
    expect(all.hasMore).toBe(false);

    const firstPage = await flush(api.listAccessRequests({ page: 1, pageSize: 2 }));
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(all.total);
    expect(firstPage.hasMore).toBe(all.total > 2);

    const secondPage = await flush(api.listAccessRequests({ page: 2, pageSize: 2 }));
    expect(secondPage.items).toEqual(all.items.slice(2, 4));
  });

  it('getAccessRequest finds a request by id and returns undefined for an unknown id', async () => {
    const found = await flush(api.getAccessRequest('req_1001'));
    expect(found?.patientDisplayName).toBe('Chidinma Eze');

    const missing = await flush(api.getAccessRequest('does-not-exist'));
    expect(missing).toBeUndefined();
  });

  it('createAccessRequest adds a pending request and logs an access_requested audit event', async () => {
    const before = await flush(api.listAccessRequests({ pageSize: 100 }));

    const created = await flush(
      api.createAccessRequest({
        patientPassportId: 'pp_test',
        patientDisplayName: 'Test Patient',
        requestedCategories: ['lab_result'],
        durationDays: 14,
        purpose: 'Testing',
      }),
    );
    expect(created.status).toBe('pending');
    expect(created.resolvedAt).toBeNull();
    expect(created.expiresAt).toBeNull();

    const after = await flush(api.listAccessRequests({ pageSize: 100 }));
    expect(after.items).toHaveLength(before.items.length + 1);
    expect(after.items[0].id).toBe(created.id);

    const audit = await flush(api.getAuditLog());
    expect(audit.items[0]).toMatchObject({
      type: 'access_requested',
      patientDisplayName: 'Test Patient',
    });
  });
});

describe('records', () => {
  it('listRecords returns records sorted newest-first', async () => {
    const { items } = await flush(api.listRecords());
    const timestamps = items.map((r) => r.createdAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it('listRecords honors page/pageSize and reports total/hasMore', async () => {
    const firstPage = await flush(api.listRecords({ page: 1, pageSize: 2 }));
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.page).toBe(1);
    expect(firstPage.pageSize).toBe(2);
    expect(firstPage.total).toBe(3);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = await flush(api.listRecords({ page: 2, pageSize: 2 }));
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.hasMore).toBe(false);
  });

  it('viewRecord returns the record and logs a record_viewed audit event', async () => {
    const viewed = await flush(api.viewRecord('rec_3001'));
    expect(viewed?.title).toBe('Complete Blood Count Panel');

    const audit = await flush(api.getAuditLog());
    expect(audit.items[0]).toMatchObject({
      type: 'record_viewed',
      patientPassportId: 'pp_3a91ee02',
      detail: 'Viewed Complete Blood Count Panel',
    });
  });

  it('viewRecord on an unknown id returns undefined and logs nothing', async () => {
    const auditBefore = await flush(api.getAuditLog());
    const viewed = await flush(api.viewRecord('does-not-exist'));
    expect(viewed).toBeUndefined();

    const auditAfter = await flush(api.getAuditLog());
    expect(auditAfter.items).toHaveLength(auditBefore.items.length);
  });

  // jsdom's File/Blob.arrayBuffer() relies on a real timer captured before fake
  // timers are installed, so it never resolves under vi.useFakeTimers() — these
  // two tests opt back into real timers instead of the flush() helper.
  it('uploadRecord derives a deterministic commitment hash from the file, prepends the record, and logs an audit event', async () => {
    vi.useRealTimers();
    const before = await api.listRecords({ pageSize: 100 });

    const file = new File(['test file content'], 'report.pdf', { type: 'application/pdf' });
    const uploaded = await api.uploadRecord({
      patientPassportId: 'pp_test',
      patientDisplayName: 'Test Patient',
      category: 'diagnosis',
      title: 'Test Diagnosis',
      notes: 'Some notes',
      file,
    });
    expect(uploaded.commitmentHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(uploaded.attachment).toEqual({ fileName: 'report.pdf', fileType: 'application/pdf', fileSize: file.size });
    expect(uploaded.issuerProviderId).toBe('prov_8f2a1c4e9b');
    expect(uploaded.issuerName).toBe('St. Aventine General Hospital');

    const after = await api.listRecords({ pageSize: 100 });
    expect(after.items).toHaveLength(before.items.length + 1);
    expect(after.items[0].id).toBe(uploaded.id);

    const audit = await api.getAuditLog();
    expect(audit.items[0]).toMatchObject({ type: 'record_uploaded', detail: 'Uploaded Test Diagnosis' });
  }, 10000);

  it('uploadRecord derives the same commitment hash for identical file bytes, and a different one for different bytes', async () => {
    vi.useRealTimers();
    const uploadedA = await api.uploadRecord({
      patientPassportId: 'pp_test',
      patientDisplayName: 'Test Patient',
      category: 'diagnosis',
      title: 'Diagnosis A',
      notes: '',
      file: new File(['identical bytes'], 'a.pdf', { type: 'application/pdf' }),
    });
    const uploadedB = await api.uploadRecord({
      patientPassportId: 'pp_test',
      patientDisplayName: 'Test Patient',
      category: 'diagnosis',
      title: 'Diagnosis B',
      notes: '',
      file: new File(['identical bytes'], 'b.pdf', { type: 'application/pdf' }),
    });
    const uploadedC = await api.uploadRecord({
      patientPassportId: 'pp_test',
      patientDisplayName: 'Test Patient',
      category: 'diagnosis',
      title: 'Diagnosis C',
      notes: '',
      file: new File(['different bytes'], 'c.pdf', { type: 'application/pdf' }),
    });

    expect(uploadedB.commitmentHash).toBe(uploadedA.commitmentHash);
    expect(uploadedC.commitmentHash).not.toBe(uploadedA.commitmentHash);
  }, 10000);
});

describe('access grants', () => {
  it('listAccessGrants returns grants sorted newest-first', async () => {
    const { items } = await flush(api.listAccessGrants());
    const timestamps = items.map((g) => g.grantedAt);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it('listAccessGrants honors page/pageSize and reports total/hasMore', async () => {
    const firstPage = await flush(api.listAccessGrants({ page: 1, pageSize: 2 }));
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(3);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = await flush(api.listAccessGrants({ page: 2, pageSize: 2 }));
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.hasMore).toBe(false);
  });

  it('revokeAccessGrant flips status to revoked and logs an access_revoked audit event', async () => {
    const grants = await flush(api.listAccessGrants({ pageSize: 100 }));
    const target = grants.items.find((g) => g.id === 'grant_2002')!;
    expect(target.status).toBe('active');

    await flush(api.revokeAccessGrant(target.id));

    const after = await flush(api.listAccessGrants({ pageSize: 100 }));
    const updated = after.items.find((g) => g.id === target.id);
    expect(updated?.status).toBe('revoked');

    const audit = await flush(api.getAuditLog());
    expect(audit.items[0]).toMatchObject({
      type: 'access_revoked',
      patientPassportId: target.patientPassportId,
      detail: `Revoked access to ${target.categories.length} categories`,
    });
  });

  it('revokeAccessGrant on an unknown id resolves without throwing and logs nothing', async () => {
    const auditBefore = await flush(api.getAuditLog());

    await expect(flush(api.revokeAccessGrant('does-not-exist'))).resolves.toBeUndefined();

    const auditAfter = await flush(api.getAuditLog());
    expect(auditAfter.items).toHaveLength(auditBefore.items.length);
  });
});

describe('getAuditLog', () => {
  it('returns events sorted newest-first', async () => {
    const { items } = await flush(api.getAuditLog());
    const timestamps = items.map((a) => a.timestamp);
    expect(timestamps).toEqual([...timestamps].sort().reverse());
  });

  it('honors page/pageSize and reports total/hasMore', async () => {
    const firstPage = await flush(api.getAuditLog({ page: 1, pageSize: 3 }));
    expect(firstPage.items).toHaveLength(3);
    expect(firstPage.total).toBe(6);
    expect(firstPage.hasMore).toBe(true);

    const secondPage = await flush(api.getAuditLog({ page: 2, pageSize: 3 }));
    expect(secondPage.items).toHaveLength(3);
    expect(secondPage.hasMore).toBe(false);
  });
});

describe('mock failure simulation', () => {
  it('setMockFailure makes the targeted endpoint reject with an ApiError until cleared', async () => {
    api.setMockFailure('listRecords');

    await expect(flush(api.listRecords())).rejects.toBeInstanceOf(api.ApiError);
    // Other endpoints are unaffected.
    await expect(flush(api.getProvider())).resolves.toBeDefined();

    api.setMockFailure('listRecords', false);
    await expect(flush(api.listRecords())).resolves.toBeDefined();
  });

  it('clearMockFailures resets every forced failure at once', async () => {
    api.setMockFailure('listRecords');
    api.setMockFailure('getAuditLog');

    api.clearMockFailures();

    await expect(flush(api.listRecords())).resolves.toBeDefined();
    await expect(flush(api.getAuditLog())).resolves.toBeDefined();
  });

  it('failed mutations do not change data or create audit events', async () => {
    const before = await flush(api.getDashboardStats());
    const staff = await flush(api.listStaff());
    const audit = await flush(api.getAuditLog());
    const grants = await flush(api.listAccessGrants());
    for (const endpoint of ['uploadRecord', 'createAccessRequest', 'revokeAccessGrant', 'addStaffMember', 'removeStaffMember'] as const) {
      api.setMockFailure(endpoint);
    }
    const calls = [
      api.uploadRecord({ patientPassportId: 'pp_12345678', patientDisplayName: 'Patient', category: 'lab_result', title: 'Test', notes: '', file: new File(['test'], 'test.pdf') }),
      api.createAccessRequest({ patientPassportId: 'pp_12345678', patientDisplayName: 'Patient', requestedCategories: ['lab_result'], durationDays: 7, purpose: 'Test' }),
      api.revokeAccessGrant(grants.items[0].id),
      api.addStaffMember({ name: 'Test', email: 'test@example.com', role: 'admin' }),
      api.removeStaffMember(staff[0].id),
    ];
    const outcomes = await flush(Promise.allSettled(calls));
    expect(outcomes.every((result) => result.status === 'rejected')).toBe(true);
    expect(await flush(api.getDashboardStats())).toEqual(before);
    expect(await flush(api.listStaff())).toEqual(staff);
    expect(await flush(api.getAuditLog())).toEqual(audit);
    expect(await flush(api.listAccessGrants())).toEqual(grants);
  });
});

describe('pagination bounds', () => {
  it.each(['listRecords', 'listAccessGrants', 'listAccessRequests', 'getAuditLog'] as const)('%s rejects invalid pages and returns an empty out-of-range page', async (endpoint) => {
    for (const params of [{ page: 0 }, { page: -1 }, { page: 1.5 }, { pageSize: 0 }, { pageSize: 101 }, { pageSize: Infinity }]) {
      await expect(flush<PagedResult<unknown>>(api[endpoint](params))).rejects.toBeInstanceOf(api.ApiError);
    }
    const result = await flush<PagedResult<unknown>>(api[endpoint]({ page: 50, pageSize: 10 }));
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBeGreaterThan(0);
  });
});

describe('dashboard stats', () => {
  it('counts all records and pending requests beyond the default page size', async () => {
    vi.useRealTimers(); // File.arrayBuffer() needs real timers in jsdom.
    const before = await api.getDashboardStats();
    await Promise.all(Array.from({ length: 11 }, () => Promise.all([
      api.createAccessRequest({ patientPassportId: 'pp_12345678', patientDisplayName: 'Patient', requestedCategories: ['lab_result'], durationDays: 7, purpose: 'Test' }),
      api.uploadRecord({ patientPassportId: 'pp_12345678', patientDisplayName: 'Patient', category: 'lab_result', title: 'Test', notes: '', file: new File(['test'], 'test.pdf') }),
    ])));
    const [records, requests, stats] = await Promise.all([api.listRecords(), api.listAccessRequests(), api.getDashboardStats()]);
    expect(records.items).toHaveLength(10);
    expect(requests.items).toHaveLength(10);
    expect(stats).toEqual({ ...before, pendingRequests: before.pendingRequests + 11, recordCount: before.recordCount + 11 });
  }, 10000);
});

describe('staff identity and removal', () => {
  it('resolves the configured wallet role and defaults unlisted wallets to front desk', async () => {
    const { mockWalletRoles, mockProvider } = await import('./mockData');
    expect(await flush(api.getCurrentRole(mockProvider.stellarAddress!))).toBe('admin');
    mockWalletRoles.GTESTCLINICIAN = 'clinician';
    expect(await flush(api.getCurrentRole('GTESTCLINICIAN'))).toBe('clinician');
    expect(await flush(api.getCurrentRole('unknown-wallet'))).toBe('front_desk');
  });

  it('removes staff and updates the organization count', async () => {
    await flush(api.removeStaffMember('staff_2'));
    expect((await flush(api.listStaff())).map((member) => member.id)).not.toContain('staff_2');
    expect((await flush(api.getProvider())).staffCount).toBe(3);
  });
});
