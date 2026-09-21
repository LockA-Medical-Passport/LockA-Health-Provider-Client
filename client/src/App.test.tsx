import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { useWallet } from './hooks/useWallet';
import { getCurrentRole, listRecords } from './lib/api';
import type { StaffRole } from './lib/types';
import { deferred, paged } from './test/fixtures';

vi.mock('./hooks/useWallet', () => ({ useWallet: vi.fn() }));
vi.mock('./lib/api', () => ({ getCurrentRole: vi.fn(), listRecords: vi.fn() }));

const wallet = {
  status: 'connected' as const,
  address: 'GADMIN', network: 'TESTNET', error: null,
  connect: vi.fn(), disconnect: vi.fn(), refresh: vi.fn(),
};

function app() {
  return <MemoryRouter initialEntries={['/records']}><ToastProvider><App /></ToastProvider></MemoryRouter>;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(useWallet).mockReturnValue(wallet);
  vi.mocked(listRecords).mockResolvedValue(paged([]));
});

it('holds privileged pages while role resolution is pending or failed, then supports retry', async () => {
  const pending = deferred<StaffRole>();
  vi.mocked(getCurrentRole).mockReturnValueOnce(pending.promise).mockResolvedValueOnce('admin');
  render(app());
  expect(screen.getByText('Loading staff permissions…')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Record' })).not.toBeInTheDocument();
  expect(listRecords).not.toHaveBeenCalled();
  await act(async () => { pending.reject(new Error('offline')); });
  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  expect(listRecords).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('button', { name: 'Add Record' })).toBeInTheDocument();
  expect(screen.getByLabelText('Current role: Admin')).toBeInTheDocument();
  expect(getCurrentRole).toHaveBeenNthCalledWith(2, 'GADMIN');
});

it('drops the previous wallet role and form when the connected identity changes', async () => {
  vi.mocked(getCurrentRole).mockResolvedValueOnce('admin');
  const view = render(app());
  fireEvent.click(await screen.findByRole('button', { name: 'Add Record' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Private draft' } });
  const nextRole = deferred<StaffRole>();
  vi.mocked(getCurrentRole).mockReturnValueOnce(nextRole.promise);
  vi.mocked(useWallet).mockReturnValue({ ...wallet, address: 'GFRONTDESK' });
  view.rerender(app());
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Current role: Admin')).not.toBeInTheDocument();
  await act(async () => { nextRole.resolve('front_desk'); });
  expect(await screen.findByLabelText('Current role: Front Desk')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Add Record' })).not.toBeInTheDocument();

  vi.mocked(useWallet).mockReturnValue({ ...wallet, status: 'idle', address: null });
  view.rerender(app());
  expect(screen.getByText('Connect Wallet to Access Provider Portal')).toBeInTheDocument();
  expect(screen.queryByLabelText('Current role: Front Desk')).not.toBeInTheDocument();
});
