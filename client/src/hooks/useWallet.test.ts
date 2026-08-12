import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWallet } from './useWallet';

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
  vi.clearAllMocks();
});

describe('useWallet', () => {
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
});
