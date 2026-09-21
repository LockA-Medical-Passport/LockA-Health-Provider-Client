import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/Toast';
import { RoleProvider } from '../lib/roleContext';
import * as api from '../lib/api';
import { mockAccessGrants, mockAccessRequests, mockAuditLog, mockProvider, mockRecords, mockStaff } from '../lib/mockData';
import type { PageParams, PagedResult, StaffRole } from '../lib/types';
import { deferred, paged } from '../test/fixtures';
import { AccessManagement } from './AccessManagement';
import { AuditLog } from './AuditLog';
import { Dashboard } from './Dashboard';
import { ProviderProfile } from './ProviderProfile';
import { RecordsPage } from './RecordsPage';

vi.mock('../lib/api', () => ({
  getProvider: vi.fn(), getDashboardStats: vi.fn(), listStaff: vi.fn(),
  listRecords: vi.fn(), listAccessGrants: vi.fn(), listAccessRequests: vi.fn(), getAuditLog: vi.fn(),
  uploadRecord: vi.fn(), viewRecord: vi.fn(), revokeAccessGrant: vi.fn(), addStaffMember: vi.fn(), removeStaffMember: vi.fn(),
}));

function tree(page: ReactElement, role: StaffRole | null = 'admin') {
  return <MemoryRouter><ToastProvider><RoleProvider role={role}>{page}</RoleProvider></ToastProvider></MemoryRouter>;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getProvider).mockResolvedValue(mockProvider);
  vi.mocked(api.getDashboardStats).mockResolvedValue({ activeGrants: 22, pendingRequests: 13, recordCount: 47 });
  vi.mocked(api.listStaff).mockResolvedValue(mockStaff);
  vi.mocked(api.listRecords).mockResolvedValue(paged(mockRecords));
  vi.mocked(api.listAccessGrants).mockResolvedValue(paged(mockAccessGrants));
  vi.mocked(api.listAccessRequests).mockResolvedValue(paged(mockAccessRequests));
  vi.mocked(api.getAuditLog).mockResolvedValue(paged(mockAuditLog.slice(0, 5)));
});

describe('fetch failure recovery', () => {
  it.each([
    { name: 'records', page: <RecordsPage />, endpoint: 'listRecords' as const, success: mockRecords[0].title },
    { name: 'grants', page: <AccessManagement />, endpoint: 'listAccessGrants' as const, success: mockAccessGrants[0].patientDisplayName },
    { name: 'requests', page: <AccessManagement />, endpoint: 'listAccessRequests' as const, tab: 'My Access Requests', success: mockAccessRequests[0].purpose },
    { name: 'audit', page: <AuditLog />, endpoint: 'getAuditLog' as const, success: mockAuditLog[0].detail },
    { name: 'dashboard organization', page: <Dashboard />, endpoint: 'getProvider' as const, success: 'Recent Activity' },
    { name: 'dashboard stats', page: <Dashboard />, endpoint: 'getDashboardStats' as const, success: 'Recent Activity' },
    { name: 'dashboard activity', page: <Dashboard />, endpoint: 'getAuditLog' as const, success: 'Recent Activity' },
    { name: 'profile organization', page: <ProviderProfile />, endpoint: 'getProvider' as const, success: mockProvider.name },
    { name: 'profile staff', page: <ProviderProfile />, endpoint: 'listStaff' as const, success: mockStaff[0].name },
  ])('$name exposes a retry that recovers the fetch', async ({ page, endpoint, tab, success }) => {
    vi.mocked(api[endpoint]).mockRejectedValueOnce(new Error('offline'));
    render(tree(page));
    if (tab) fireEvent.click(screen.getByRole('button', { name: tab }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(success)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(api[endpoint]).toHaveBeenCalledTimes(2);
  });

  it('uses full dashboard counts and requests only five recent events', async () => {
    render(tree(<Dashboard />));
    expect(await screen.findByText('47')).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();
    expect(screen.getByText('13')).toBeInTheDocument();
    expect(api.getAuditLog).toHaveBeenCalledWith({ page: 1, pageSize: 5 });
    expect(api.listRecords).not.toHaveBeenCalled();
    expect(api.listAccessGrants).not.toHaveBeenCalled();
    expect(api.listAccessRequests).not.toHaveBeenCalled();
  });
});

function paginationTests<T>(name: string, page: ReactElement, fetch: Mock<(params?: PageParams) => Promise<PagedResult<T>>>, makeRow: (index: number) => T, tab?: string) {
  describe(`${name} pagination`, () => {
    it('fetches one page at a time, keeps rows during loading and failure, and retries the same page', async () => {
      const first = paged(Array.from({ length: 10 }, (_, index) => makeRow(index + 1)), 11);
      const second = paged([makeRow(11)], 11, 2);
      const pending = deferred<PagedResult<T>>();
      fetch.mockResolvedValueOnce(first).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(second).mockResolvedValueOnce(first);
      render(tree(page));
      if (tab) fireEvent.click(screen.getByRole('button', { name: tab }));
      await screen.findByText(`${name} 1`);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenLastCalledWith({ page: 1, pageSize: 10 });
      expect(screen.queryByText(`${name} 11`)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: 'Next' }));
      expect(await screen.findByText('Loading page 2…')).toBeInTheDocument();
      expect(screen.getByText(`${name} 1`)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
      await act(async () => { pending.reject(new Error('offline')); });
      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
      expect(screen.getByText(`${name} 1`)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
      await screen.findByText(`${name} 11`);
      expect(fetch).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 });
      expect(screen.queryByText(`${name} 1`)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
      await screen.findByText(`${name} 1`);
      expect(fetch).toHaveBeenLastCalledWith({ page: 1, pageSize: 10 });
    });
  });
}

paginationTests('Record', <RecordsPage />, vi.mocked(api.listRecords), (index) => ({ ...mockRecords[0], id: `rec_${index}`, title: `Record ${index}` }));
paginationTests('Grant', <AccessManagement />, vi.mocked(api.listAccessGrants), (index) => ({ ...mockAccessGrants[0], id: `grant_${index}`, patientDisplayName: `Grant ${index}` }));
paginationTests('Request', <AccessManagement />, vi.mocked(api.listAccessRequests), (index) => ({ ...mockAccessRequests[0], id: `req_${index}`, patientDisplayName: `Request ${index}` }), 'My Access Requests');
paginationTests('Event', <AuditLog />, vi.mocked(api.getAuditLog), (index) => ({ ...mockAuditLog[0], id: `event_${index}`, detail: `Event ${index}` }));

describe('mutation failure recovery', () => {
  it('preserves the record and attachment after upload failure and allows resubmission', async () => {
    vi.mocked(api.uploadRecord).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(mockRecords[0]);
    render(tree(<RecordsPage />));
    fireEvent.click(screen.getByRole('button', { name: 'Add Record' }));
    fireEvent.change(screen.getByLabelText('Patient Passport ID'), { target: { value: 'pp_12345678' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New record' } });
    const file = new File(['document'], 'report.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Record document attachment'), { target: { files: [file] } });
    const submit = screen.getByRole('button', { name: 'Upload & Commit Hash' });
    fireEvent.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to upload record');
    expect(screen.getByLabelText('Title')).toHaveValue('New record');
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    await screen.findByText('Record uploaded and hash committed on-chain');
    expect(api.uploadRecord).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.uploadRecord).mock.calls[1][0].file).toBe(file);
  });

  it('shows a record-view error and lets the same record be opened again', async () => {
    vi.mocked(api.viewRecord).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(mockRecords[0]);
    render(tree(<RecordsPage />));
    const row = await screen.findByText(mockRecords[0].title);
    fireEvent.click(row);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to open record');
    fireEvent.click(row);
    expect(await screen.findByText('Commitment Hash')).toBeInTheDocument();
  });

  it('does not mark failed revocations successful and restores the revoke button', async () => {
    vi.mocked(api.revokeAccessGrant).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(tree(<AccessManagement />));
    await screen.findByText(mockAccessGrants[0].patientDisplayName);
    fireEvent.click(screen.getAllByRole('button', { name: 'Revoke' })[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to revoke access');
    const retry = screen.getAllByRole('button', { name: 'Revoke' })[0];
    expect(retry).toBeEnabled();
    expect(screen.queryByText(/Access to .* revoked/)).not.toBeInTheDocument();
    fireEvent.click(retry);
    expect(await screen.findByText(`Access to ${mockAccessGrants[0].patientDisplayName} revoked`)).toBeInTheDocument();
  });

  it('preserves staff fields after a failed add and allows resubmission', async () => {
    vi.mocked(api.addStaffMember).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(mockStaff[0]);
    render(tree(<ProviderProfile />));
    await screen.findByText(mockProvider.name);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New Staff' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    const submit = screen.getByRole('button', { name: 'Add Staff' });
    fireEvent.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to add staff member');
    expect(screen.getByLabelText('Full name')).toHaveValue('New Staff');
    expect(screen.getByLabelText('Email')).toHaveValue('new@example.com');
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(await screen.findByText('Staff member added')).toBeInTheDocument();
    expect(api.addStaffMember).toHaveBeenCalledTimes(2);
  });

  it('retries failed staff removal, then refreshes the count and list', async () => {
    vi.mocked(api.removeStaffMember).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(undefined);
    render(tree(<ProviderProfile />));
    await screen.findByText(mockProvider.name);
    const remove = screen.getByRole('button', { name: `Remove ${mockStaff[1].name}` });
    fireEvent.click(remove);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to remove staff member');
    expect(screen.getByText(mockStaff[1].name)).toBeInTheDocument();
    expect(remove).toBeEnabled();
    vi.mocked(api.listStaff).mockResolvedValue(mockStaff.filter((member) => member.id !== mockStaff[1].id));
    vi.mocked(api.getProvider).mockResolvedValue({ ...mockProvider, staffCount: 3 });
    fireEvent.click(remove);
    expect(await screen.findByText('Staff member removed')).toBeInTheDocument();
    expect(await screen.findByText('3 members')).toBeInTheDocument();
    expect(screen.queryByText(mockStaff[1].name)).not.toBeInTheDocument();
  });
});

describe('role permission gates', () => {
  it.each<StaffRole | null>(['admin', 'clinician', 'front_desk', null])('%s sees only permitted upload, revoke, and staff actions', async (role) => {
    render(tree(<><RecordsPage /><AccessManagement /><ProviderProfile /></>, role));
    await screen.findByText(mockProvider.name);
    const clinical = role === 'admin' || role === 'clinician';
    expect(!!screen.queryByRole('button', { name: 'Add Record' })).toBe(clinical);
    expect(screen.queryAllByRole('button', { name: 'Revoke' }).length > 0).toBe(clinical);
    expect(!!screen.queryByRole('button', { name: 'Add Staff' })).toBe(role === 'admin');
    expect(screen.queryAllByRole('button', { name: /^Remove / }).length > 0).toBe(role === 'admin');
  });

  it('closes an open upload form immediately if the effective role loses upload permission', async () => {
    const view = render(tree(<RecordsPage />, 'admin'));
    fireEvent.click(screen.getByRole('button', { name: 'Add Record' }));
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    view.rerender(tree(<RecordsPage />, 'front_desk'));
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(mockRecords[0].title)).toBeInTheDocument());
    expect(api.uploadRecord).not.toHaveBeenCalled();
  });
});
