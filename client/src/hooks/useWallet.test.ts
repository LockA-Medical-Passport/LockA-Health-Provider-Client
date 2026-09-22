import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWallet } from './useWallet';
import { deferred } from '../test/fixtures';

vi.mock('@stellar/freighter-api', () => ({
  default: {
    isConnected: vi.fn(),
    isAllowed: vi.fn(),
    getAddress: vi.fn(),
    getNetwork: vi.fn(),
    requestAccess: vi.fn(),
  },
}));

const freighterApi = (await import('@stellar/freighter-api')).default as unknown as {
  isConnected: ReturnType<typeof vi.fn>;
  isAllowed: ReturnType<typeof vi.fn>;
  getAddress: ReturnType<typeof vi.fn>;
  getNetwork: ReturnType<typeof vi.fn>;
  requestAccess: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useWallet', () => {
  it('stays in checking through all session checks and never falls back to idle for an approved wallet', async () => {
    const installed = deferred<{ isConnected: boolean }>();
    const allowed = deferred<{ isAllowed: boolean }>();
    const account = deferred<{ address: string }>();
    freighterApi.isConnected.mockReturnValue(installed.promise);
    freighterApi.isAllowed.mockReturnValue(allowed.promise);
    freighterApi.getAddress.mockReturnValue(account.promise);
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET' });
    const statuses: string[] = [];
    const { result } = renderHook(() => { const wallet = useWallet(); statuses.push(wallet.status); return wallet; });
    await act(async () => { installed.resolve({ isConnected: true }); });
    expect(result.current.status).toBe('checking');
    await act(async () => { allowed.resolve({ isAllowed: true }); });
    expect(result.current.status).toBe('checking');
    await act(async () => { account.resolve({ address: 'GRESTORED' }); });
    expect(result.current.status).toBe('connected');
    expect(statuses).not.toContain('idle');
    expect(freighterApi.requestAccess).not.toHaveBeenCalled();
  });

  it('settles restoration errors and ignores late responses after disconnect', async () => {
    freighterApi.isConnected.mockRejectedValueOnce(new Error('Extension unavailable'));
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.error).toBe('Extension unavailable'));
    expect(result.current.status).toBe('idle');
    const pending = deferred<{ address: string }>();
    freighterApi.requestAccess.mockReturnValue(pending.promise);
    let connecting!: Promise<void>;
    act(() => { connecting = result.current.connect(); });
    act(() => { result.current.disconnect(); });
    await act(async () => { pending.resolve({ address: 'GLATE' }); await connecting; });
    expect(result.current.status).toBe('idle');
    expect(result.current.address).toBeNull();
  });

  it('starts in checking status', () => {
    freighterApi.isConnected.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useWallet());

    expect(result.current.status).toBe('checking');
  });

  it('transitions checking -> unavailable when the extension is not installed', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: false });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe('unavailable'));
    expect(freighterApi.isAllowed).not.toHaveBeenCalled();
  });

  it('transitions checking -> idle when the extension is present but access was not previously granted', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: false });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.address).toBeNull();
    expect(freighterApi.getAddress).not.toHaveBeenCalled();
  });

  it('transitions checking -> connected when the extension already allowed this app', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: true });
    freighterApi.getAddress.mockResolvedValue({ address: 'GADDRESS123' });
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: 'Test SDF Network' });

    const { result } = renderHook(() => useWallet());

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(result.current.address).toBe('GADDRESS123');
    expect(result.current.network).toBe('TESTNET');
  });

  it('transitions idle -> connecting -> connected when the user approves requestAccess', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: false });
    freighterApi.requestAccess.mockResolvedValue({ address: 'GADDRESS123' });
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: 'Test SDF Network' });

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe('idle'));

    let connectPromise!: Promise<void>;
    act(() => {
      connectPromise = result.current.connect();
    });
    expect(result.current.status).toBe('connecting');

    await act(async () => {
      await connectPromise;
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.address).toBe('GADDRESS123');
    expect(result.current.network).toBe('TESTNET');
    expect(result.current.error).toBeNull();
  });

  it('surfaces the error message and returns to idle when the user rejects access', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: false });
    freighterApi.requestAccess.mockResolvedValue({
      address: '',
      error: { code: -4, message: 'User declined access' },
    });

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe('idle'));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe('User declined access');
    expect(result.current.address).toBeNull();
    expect(freighterApi.getNetwork).not.toHaveBeenCalled();
  });

  it('falls back to a default error message when rejection has no message', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: false });
    freighterApi.requestAccess.mockResolvedValue({ address: '', error: undefined });

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe('idle'));

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBe('Freighter connection was rejected.');
  });

  it('disconnect resets address/network and returns to idle', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: true });
    freighterApi.getAddress.mockResolvedValue({ address: 'GADDRESS123' });
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET', networkPassphrase: 'Test SDF Network' });

    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.status).toBe('connected'));

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.address).toBeNull();
    expect(result.current.network).toBeNull();
  });

  it('detects a mismatch and rechecks the network without requesting wallet access again', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: true });
    freighterApi.getAddress.mockResolvedValue({ address: 'GADDRESS123' });
    freighterApi.getNetwork.mockResolvedValue({ network: 'PUBLIC' });
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.networkMismatch).toBe(true));
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET' });
    await act(async () => { await result.current.refreshNetwork(); });
    expect(result.current.networkMismatch).toBe(false);
    expect(result.current.network).toBe('TESTNET');
    expect(freighterApi.requestAccess).not.toHaveBeenCalled();
  });

  it('recovers a failed network lookup when the window regains focus', async () => {
    freighterApi.isConnected.mockResolvedValue({ isConnected: true });
    freighterApi.isAllowed.mockResolvedValue({ isAllowed: true });
    freighterApi.getAddress.mockResolvedValue({ address: 'GADDRESS123' });
    freighterApi.getNetwork.mockRejectedValueOnce(new Error('Wallet unavailable'));
    const { result } = renderHook(() => useWallet());
    await waitFor(() => expect(result.current.networkError).toBe('Wallet unavailable'));
    freighterApi.getNetwork.mockResolvedValue({ network: 'TESTNET' });
    act(() => { window.dispatchEvent(new Event('focus')); });
    await waitFor(() => expect(result.current.network).toBe('TESTNET'));
    expect(result.current.networkError).toBeNull();
  });
});
