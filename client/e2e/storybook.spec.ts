import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

async function openStory(page: Page, id: string) {
  await page.goto(`/iframe.html?id=components-${id}&viewMode=story`);
  // Storybook loads each component module after the iframe document loads.
  // Visual-only components (such as Spinner) legitimately have no text content.
  await expect(page.locator('#storybook-root > *').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
}

test('indexes all shared components', async ({ request }) => {
  const index = await (await request.get('/index.json')).json();
  const titles = new Set(Object.values(index.entries).map((entry) => (entry as { title: string }).title));
  for (const name of ['Badge', 'GlassCard', 'StatCard', 'Spinner', 'Toast', 'Modal', 'Navbar', 'LockaLogo', 'Icons', 'ErrorState', 'FieldError', 'Pagination']) {
    expect(titles.has(`Components/${name}`), `Missing stories for ${name}`).toBe(true);
  }
});

for (const id of ['badge--green', 'glasscard--bright', 'statcard--status', 'spinner--large', 'lockalogo--default', 'icons--gallery', 'errorstate--default', 'fielderror--invalid', 'pagination--failed']) {
  test(`renders ${id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openStory(page, id);
    expect(errors).toEqual([]);
  });
}

test('modal opens and closes', async ({ page }) => {
  await openStory(page, 'modal--closed');
  await page.getByRole('button', { name: 'Open modal' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('toast queue supports dismissal', async ({ page }) => {
  await openStory(page, 'toast--interactive');
  await page.getByRole('button', { name: 'Queue three notifications' }).click();
  await expect(page.getByRole('button', { name: 'Dismiss notification' })).toHaveCount(3);
  await page.getByRole('button', { name: 'Dismiss notification' }).first().click();
  await expect(page.getByRole('button', { name: 'Dismiss notification' })).toHaveCount(2);
});

test('mobile network prompt and menu are interactive', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await openStory(page, 'navbar--wrong-network');
  await expect(page.getByRole('alert')).toContainText('Wrong network');
  await page.getByRole('button', { name: /^Switch to/ }).click();
  await expect(page.getByRole('button', { name: 'Check network' })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await expect(page.getByRole('link', { name: 'Patient Search', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
