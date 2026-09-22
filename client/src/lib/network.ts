/** Freighter network names: PUBLIC, TESTNET, FUTURENET, or a custom network name. */
export const EXPECTED_NETWORK = (import.meta.env.VITE_STELLAR_NETWORK?.trim() || 'TESTNET').toUpperCase();

const NETWORK_LABELS: Record<string, string> = { PUBLIC: 'Mainnet', TESTNET: 'Testnet', FUTURENET: 'Futurenet' };
export const EXPECTED_NETWORK_LABEL = NETWORK_LABELS[EXPECTED_NETWORK] ?? EXPECTED_NETWORK;

export function isExpectedNetwork(network: string | null): boolean {
  return network?.trim().toUpperCase() === EXPECTED_NETWORK;
}
