import type { Page } from '@playwright/test';

/** Replace only the browser's Freighter module; no test bypass is shipped in the app. */
export async function mockWallet(page: Page, options: { connected?: boolean; network?: string; delayMs?: number } = {}) {
  // Keep screenshots deterministic and independent of third-party font servers.
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  const { connected = true, network = 'TESTNET', delayMs = 0 } = options;
  await page.route(/\/node_modules\/.*freighter-api.*\.js(?:\?.*)?$/, (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `
      const delay = () => new Promise(resolve => setTimeout(resolve, ${delayMs}));
      const address = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37';
      export const isConnected = async () => { await delay(); return { isConnected: true }; };
      export const isAllowed = async () => { await delay(); return { isAllowed: ${connected} }; };
      export const getAddress = async () => { await delay(); return { address }; };
      export const requestAccess = async () => ({ address });
      export const getNetwork = async () => ({ network: ${JSON.stringify(network)}, networkPassphrase: 'Test SDF Network ; September 2015' });
      export default { isConnected, isAllowed, getAddress, requestAccess, getNetwork };
    `,
  }));
}
