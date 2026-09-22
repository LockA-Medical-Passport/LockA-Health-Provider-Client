import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { mockWallet } from './wallet';

const phase = process.env.QA_CAPTURE_PHASE;

async function inspect(page: Page, name: string, info: TestInfo) {
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    overflowing: Array.from(document.querySelectorAll('main *, nav, [role="dialog"] *'))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1);
      })
      .slice(0, 8).map((element) => ({ tag: element.tagName, text: element.textContent?.slice(0, 80) })),
  }));
  if (phase) {
    const dir = resolve('docs/qa/screenshots', phase);
    await mkdir(dir, { recursive: true });
    const file = `${info.project.name}-${name}`;
    await page.screenshot({ path: `${dir}/${file}.png`, fullPage: true, animations: 'disabled' });
    await writeFile(`${dir}/${file}.json`, JSON.stringify(metrics, null, 2));
  }
  await info.attach(`${name}-layout`, { body: JSON.stringify(metrics), contentType: 'application/json' });
  if (phase !== 'before') {
    expect(metrics.document, `${name} must fit the viewport`).toBeLessThanOrEqual(metrics.viewport);
    expect(metrics.overflowing, `${name} must not have off-screen content`).toEqual([]);
  }
}

test.beforeEach(async ({ page }) => { await mockWallet(page); });

for (const [path, name, ready] of [
  ['/', 'dashboard', 'Recent Activity'],
  ['/search', 'search', 'Patient Search'],
  ['/records', 'records', 'Complete Blood Count Panel'],
  ['/access', 'access', 'Tunde Balogun'],
  ['/audit', 'audit', 'Uploaded Complete Blood Count Panel (Lab Result)'],
  ['/profile', 'profile', 'Staff Accounts'],
]) {
  test(`${name} fits without horizontal scrolling`, async ({ page }, info) => {
    await page.goto(path);
    await expect(page.getByText(ready, { exact: true }).last()).toBeVisible();
    await inspect(page, name, info);
    if (name === 'records') {
      await page.getByRole('button', { name: 'Add Record' }).click();
      await expect(page.getByLabel('Patient Passport ID')).toBeVisible();
      await inspect(page, 'add-record', info);
    }
  });
}

test('access modal adapts its category grid and keeps controls reachable', async ({ page }, info) => {
  await page.goto('/search');
  await page.getByPlaceholder('Passport ID, name, or contact method…').fill('Chidinma');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByRole('button', { name: 'Request Access', exact: true }).click();
  await expect(page.getByText('Request Access — Chidinma Eze')).toBeVisible();
  await inspect(page, 'access-modal', info);
  if (phase !== 'before') {
    const grid = page.getByRole('group', { name: 'Record Categories' }).locator('.grid');
    const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(info.project.use.viewport!.width < 640 ? 1 : 2);
    await page.getByRole('button', { name: 'Send Access Request' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: 'Send Access Request' })).toBeInViewport();
  }
});

test('record detail wraps long hashes and filenames', async ({ page }, info) => {
  await page.goto('/records');
  await page.getByText('Complete Blood Count Panel', { exact: true }).click();
  await expect(page.getByText('Commitment Hash')).toBeVisible();
  await inspect(page, 'record-detail', info);
});

test('mobile menu opens, navigates, and closes using touch', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.getByText('Recent Activity')).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Toggle menu' });
  if (await toggle.isVisible()) {
    if (info.project.use.hasTouch) await toggle.tap();
    else await toggle.click();
    await inspect(page, 'menu', info);
    const link = page.getByRole('link', { name: 'Patient Search', exact: true }).last();
    if (info.project.use.hasTouch) await link.tap();
    else await link.click();
    await expect(page.getByRole('heading', { name: 'Patient Search' })).toBeVisible();
    if (phase !== 'before') await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  } else if (phase !== 'before') {
    throw new Error('Navigation should collapse at these widths.');
  }
});
