import { useCallback, useEffect, useRef, useState } from 'react';
import freighterApi from '@stellar/freighter-api';
import { isExpectedNetwork } from '../lib/network';

export type WalletStatus = 'idle' | 'checking' | 'connecting' | 'connected' | 'unavailable';

interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: string | null;
  error: string | null;
  networkChecking: boolean;
  networkError: string | null;
}

const INITIAL_STATE: WalletState = {
  status: 'checking', address: null, network: null, error: null,
  networkChecking: false, networkError: null,
};

async function readNetwork() {
  try {
    const result = await freighterApi.getNetwork();
    if (result.error || !result.network) throw new Error(result.error?.message || 'Unable to verify the wallet network.');
    return { network: result.network, networkError: null };
  } catch (error) {
    return { network: null, networkError: error instanceof Error ? error.message : 'Unable to verify the wallet network.' };
  }
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(INITIAL_STATE);
  const operation = useRef(0);
  const networkRequest = useRef(0);
  const invalidatePending = useCallback(() => {
    ++operation.current;
    ++networkRequest.current;
  }, []);

  const refresh = useCallback(async () => {
    const attempt = ++operation.current;
    ++networkRequest.current;
    setState(INITIAL_STATE);
    try {
      const installed = await freighterApi.isConnected();
      if (attempt !== operation.current) return;
      if (installed.error || !installed.isConnected) {
        setState({ ...INITIAL_STATE, status: 'unavailable' });
        return;
      }
      const allowed = await freighterApi.isAllowed();
      if (attempt !== operation.current) return;
      if (allowed.error) throw new Error(allowed.error.message);
      if (!allowed.isAllowed) {
        setState({ ...INITIAL_STATE, status: 'idle' });
        return;
      }
      const account = await freighterApi.getAddress();
      if (attempt !== operation.current) return;
      if (account.error) throw new Error(account.error.message);
      if (!account.address) {
        setState({ ...INITIAL_STATE, status: 'idle' });
        return;
      }
      const network = await readNetwork();
      if (attempt !== operation.current) return;
      setState({ ...INITIAL_STATE, status: 'connected', address: account.address, ...network });
    } catch (error) {
      if (attempt === operation.current) {
        setState({ ...INITIAL_STATE, status: 'idle', error: error instanceof Error ? error.message : 'Unable to restore the wallet session.' });
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    return invalidatePending;
  }, [refresh, invalidatePending]);

  const refreshNetwork = useCallback(async () => {
    const attempt = ++networkRequest.current;
    const session = operation.current;
    setState((current) => current.status === 'connected' ? { ...current, networkChecking: true, networkError: null } : current);
    const network = await readNetwork();
    if (attempt !== networkRequest.current || session !== operation.current) return;
    setState((current) => current.status === 'connected' ? { ...current, ...network, networkChecking: false } : current);
  }, []);

  useEffect(() => {
    if (state.status !== 'connected') return;
    const onFocus = () => { void refreshNetwork(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [state.status, refreshNetwork]);

  const connect = useCallback(async () => {
    const attempt = ++operation.current;
    ++networkRequest.current;
    setState({ ...INITIAL_STATE, status: 'connecting' });
    try {
      const access = await freighterApi.requestAccess();
      if (attempt !== operation.current) return;
      if (access.error || !access.address) throw new Error(access.error?.message || 'Freighter connection was rejected.');
      const network = await readNetwork();
      if (attempt !== operation.current) return;
      setState({ ...INITIAL_STATE, status: 'connected', address: access.address, ...network });
    } catch (error) {
      if (attempt === operation.current) {
        setState({ ...INITIAL_STATE, status: 'idle', error: error instanceof Error ? error.message : 'Failed to connect to Freighter.' });
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    invalidatePending();
    setState({ ...INITIAL_STATE, status: 'idle' });
  }, [invalidatePending]);

  const networkMismatch = state.status === 'connected' && state.network !== null && !isExpectedNetwork(state.network);
  return { ...state, connect, disconnect, refresh, refreshNetwork, networkMismatch };
}
