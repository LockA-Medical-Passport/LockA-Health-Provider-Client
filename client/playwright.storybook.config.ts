import { defineConfig } from '@playwright/test';

const externalBaseURL = process.env.STORYBOOK_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  testMatch: 'storybook.spec.ts',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  outputDir: 'test-results/storybook',
  use: {
    baseURL: externalBaseURL || 'http://127.0.0.1:6006',
    viewport: { width: 1024, height: 768 },
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : undefined,
  },
  webServer: externalBaseURL ? undefined : {
    command: 'npm run storybook -- --ci --host 127.0.0.1 --exact-port',
    url: 'http://127.0.0.1:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
