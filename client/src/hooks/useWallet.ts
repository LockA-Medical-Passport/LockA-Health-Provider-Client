import { useCallback, useEffect, useState } from 'react';
import freighterApi from '@stellar/freighter-api';

export type WalletStatus = 'idle' | 'checking' | 'connecting' | 'connected' | 'unavailable';

export function useWallet() {
  const [status, setStatus] = useState<WalletStatus>('checking');
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { isConnected, error: connErr } = await freighterApi.isConnected();
    if (connErr || !isConnected) {
      setStatus('unavailable');
      return;
    }
    const allowed = await freighterApi.isAllowed();
    if (allowed.isAllowed) {
      const addr = await freighterApi.getAddress();
      if (addr.address) {
        setAddress(addr.address);
        setStatus('connected');
        const net = await freighterApi.getNetwork();
        if (net.network) setNetwork(net.network);
        return;
      }
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    setError(null);
    setStatus('connecting');
    try {
      const access = await freighterApi.requestAccess();
      if (access.error || !access.address) {
        setError(access.error?.message ?? 'Freighter connection was rejected.');
        setStatus('idle');
        return;
      }
      setAddress(access.address);
      const net = await freighterApi.getNetwork();
      if (net.network) setNetwork(net.network);
      setStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Freighter.');
      setStatus('idle');
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setStatus('idle');
  }, []);

  return { status, address, network, error, connect, disconnect, refresh };
}
