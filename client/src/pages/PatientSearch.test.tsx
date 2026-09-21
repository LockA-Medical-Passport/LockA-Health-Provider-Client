import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PatientSearch } from './PatientSearch';
import { ToastProvider } from '../components/Toast';
import { searchPatients, createAccessRequest } from '../lib/api';
import type { AccessRequest, PatientLookupResult } from '../lib/types';

vi.mock('../lib/api', () => ({
  searchPatients: vi.fn(),
  createAccessRequest: vi.fn(),
}));

interface MockScannerProps {
  onScan: (codes: { rawValue: string }[]) => void;
  onError: (error: { kind: string; message: string; cause: unknown }) => void;
}

vi.mock('@yudiel/react-qr-scanner', () => ({
  Scanner: ({ onScan, onError }: MockScannerProps) => (
    <div>
      <button onClick={() => onScan([{ rawValue: 'pp_9c81ff33' }])}>Simulate Successful Scan</button>
      <button onClick={() => onScan([{ rawValue: '{"passportId":"pp_json55aa","name":"QR Patient"}' }])}>
        Simulate JSON Payload Scan
      </button>
      <button onClick={() => onError({ kind: 'permission-denied', message: 'Permission denied', cause: null })}>
        Simulate Camera Denied
      </button>
    </div>
  ),
}));

const mockSearchPatients = vi.mocked(searchPatients);
const mockCreateAccessRequest = vi.mocked(createAccessRequest);

const activePatient: PatientLookupResult = {
  passportId: 'pp_test01',
  displayName: 'Test Patient',
  passportStatus: 'active',
};

const inactivePatient: PatientLookupResult = {
  passportId: 'pp_test02',
  displayName: 'Inactive Patient',
  passportStatus: 'inactive',
};

function fakeAccessRequest(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    id: 'req_test',
    patientPassportId: activePatient.passportId,
    patientDisplayName: activePatient.displayName,
    requestedCategories: ['lab_result'],
    durationDays: 30,
    purpose: 'Follow-up',
    status: 'pending',
    requestedAt: '2026-07-24T10:15:00Z',
    resolvedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ToastProvider>
      <PatientSearch />
    </ToastProvider>,
  );
}

async function runSearch(query: string) {
  fireEvent.change(screen.getByPlaceholderText('Passport ID, name, or contact method…'), {
    target: { value: query },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PatientSearch', () => {
  it('covers the happy path from search input to a success toast, and closes the modal', async () => {
    mockSearchPatients.mockResolvedValue([activePatient]);
    mockCreateAccessRequest.mockResolvedValue(fakeAccessRequest());

    renderPage();

    await runSearch('test patient');
    expect(await screen.findByText('Test Patient')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Request Access' }));
    expect(screen.getByText('Request Access — Test Patient')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lab Result' }));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '14' } });
    fireEvent.change(screen.getByPlaceholderText('Describe why access is needed…'), {
      target: { value: 'Follow-up consultation' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send Access Request' }));

    await waitFor(() =>
      expect(mockCreateAccessRequest).toHaveBeenCalledWith({
        patientPassportId: activePatient.passportId,
        patientDisplayName: activePatient.displayName,
        requestedCategories: ['lab_result'],
        durationDays: 14,
        purpose: 'Follow-up consultation',
      }),
    );

    expect(await screen.findByText('Access request sent to Test Patient')).toBeInTheDocument();
    expect(screen.queryByText('Request Access — Test Patient')).not.toBeInTheDocument();
  });

  it('shows the empty-results state when nothing matches', async () => {
    mockSearchPatients.mockResolvedValue([]);

    renderPage();
    await runSearch('no-such-patient');

    expect(await screen.findByText('No patients matched “no-such-patient”.')).toBeInTheDocument();
  });

  it('disables the Request Access button for a patient with an inactive passport', async () => {
    mockSearchPatients.mockResolvedValue([inactivePatient]);

    renderPage();
    await runSearch('inactive');

    expect(await screen.findByText('Inactive Patient')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request Access' })).toBeDisabled();
  });

  it('explains missing categories and purpose on submit and clears errors as they are corrected', async () => {
    mockSearchPatients.mockResolvedValue([activePatient]);

    renderPage();
    await runSearch('test patient');
    await screen.findByText('Test Patient');
    fireEvent.click(screen.getByRole('button', { name: 'Request Access' }));

    const submitButton = screen.getByRole('button', { name: 'Send Access Request' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(submitButton);
    expect(screen.getByRole('group', { name: 'Record Categories' })).toHaveAccessibleDescription('Select at least one record category');
    expect(screen.getByLabelText('Purpose Statement')).toHaveAccessibleDescription('Purpose statement is required');
    expect(mockCreateAccessRequest).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Lab Result' }));
    expect(screen.queryByText('Select at least one record category')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Describe why access is needed…'), {
      target: { value: '   ' },
    });
    expect(screen.getByLabelText('Purpose Statement')).toHaveAccessibleDescription('Purpose statement is required');

    fireEvent.change(screen.getByPlaceholderText('Describe why access is needed…'), {
      target: { value: 'Follow-up consultation' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Lab Result' }));
    fireEvent.click(submitButton);
    expect(screen.getByRole('group', { name: 'Record Categories' })).toHaveAccessibleDescription('Select at least one record category');
    expect(mockCreateAccessRequest).not.toHaveBeenCalled();
  });

  it('retries a failed search with the original query without showing an empty-results state', async () => {
    mockSearchPatients.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([activePatient]);
    renderPage();
    await runSearch('test patient');
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.queryByText(/No patients matched/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Passport ID, name, or contact method…'), { target: { value: 'edited query' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Test Patient')).toBeInTheDocument();
    expect(mockSearchPatients).toHaveBeenLastCalledWith('test patient');
  });

  it('preserves the access request and shows an error toast when submission fails, then allows retry', async () => {
    mockSearchPatients.mockResolvedValue([activePatient]);
    mockCreateAccessRequest.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(fakeAccessRequest());
    renderPage();
    await runSearch('test patient');
    await screen.findByText('Test Patient');
    fireEvent.click(screen.getByRole('button', { name: 'Request Access' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lab Result' }));
    fireEvent.change(screen.getByLabelText('Purpose Statement'), { target: { value: 'Follow-up' } });
    const submit = screen.getByRole('button', { name: 'Send Access Request' });
    fireEvent.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to send access request');
    expect(screen.getByLabelText('Purpose Statement')).toHaveValue('Follow-up');
    expect(screen.getByRole('button', { name: 'Lab Result' })).toHaveAttribute('aria-pressed', 'true');
    expect(submit).toBeEnabled();
    fireEvent.click(submit);
    expect(await screen.findByText('Access request sent to Test Patient')).toBeInTheDocument();
    expect(mockCreateAccessRequest).toHaveBeenCalledTimes(2);
  });

  describe('QR scanning', () => {
    it('opens a scanner modal when Scan QR is clicked', async () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: 'Scan QR' }));

      expect(screen.getByText('Scan Patient QR Code')).toBeInTheDocument();
      expect(screen.getByText(/Point the camera at a patient's passport QR code/)).toBeInTheDocument();
    });

    it('populates the search field and triggers a lookup when a QR code is decoded', async () => {
      mockSearchPatients.mockResolvedValue([activePatient]);

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Scan QR' }));
      fireEvent.click(screen.getByRole('button', { name: 'Simulate Successful Scan' }));

      expect(screen.queryByText('Scan Patient QR Code')).not.toBeInTheDocument();
      await waitFor(() => expect(mockSearchPatients).toHaveBeenCalledWith('pp_9c81ff33'));
      expect(screen.getByPlaceholderText('Passport ID, name, or contact method…')).toHaveValue('pp_9c81ff33');
      expect(await screen.findByText('Test Patient')).toBeInTheDocument();
    });

    it('extracts the passport ID from a JSON QR payload', async () => {
      mockSearchPatients.mockResolvedValue([]);

      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Scan QR' }));
      fireEvent.click(screen.getByRole('button', { name: 'Simulate JSON Payload Scan' }));

      await waitFor(() => expect(mockSearchPatients).toHaveBeenCalledWith('pp_json55aa'));
    });

    it('shows a graceful fallback message when camera access is denied', async () => {
      renderPage();
      fireEvent.click(screen.getByRole('button', { name: 'Scan QR' }));
      fireEvent.click(screen.getByRole('button', { name: 'Simulate Camera Denied' }));

      expect(screen.getByText(/Camera access was denied/)).toBeInTheDocument();
      expect(mockSearchPatients).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByText('Scan Patient QR Code')).not.toBeInTheDocument();
    });
  });
});
