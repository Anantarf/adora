// Visual regression baseline for landing page.
// First run: generates snapshot PNGs under ./landing.spec.ts-snapshots/.
// Later runs: fails if pixel diff exceeds `maxDiffPixelRatio`.
// Run: npx playwright test tests/visual-regression/landing.spec.ts --update-snapshots (first time)
//      npx playwright test tests/visual-regression/landing.spec.ts (subsequent runs)

import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

const SECTIONS = [
  { name: 'hero', selector: '#home' },
  { name: 'programs', selector: '#program' },
  { name: 'homebase', selector: '#homebase' },
  { name: 'turnamen', selector: '#turnamen' },
  { name: 'galeri', selector: '#galeri' },
  { name: 'cta', selector: '#daftar' },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`Landing @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.route('**/api/analytics/web-vitals', (route) => route.fulfill({ status: 204, body: '' }));
      await page.locator('#home img').first().waitFor({ state: 'visible', timeout: 10_000 });
    });

    for (const section of SECTIONS) {
      test(`@visual ${section.name} section`, async ({ page }) => {
        const target = page.locator(section.selector);
        await target.scrollIntoViewIfNeeded();
        await expect(target).toBeVisible();
        await expect(target).toHaveScreenshot(`${viewport.name}-${section.name}.png`, {
          maxDiffPixelRatio: 0.02,
          animations: 'disabled',
        });
      });
    }

    test(`@visual full landing page`, async ({ page }) => {
      test.skip(viewport.name === 'tablet', 'tablet full-page skipped due to carousel/year text variance');
      await expect(page).toHaveScreenshot(`${viewport.name}-full-page.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
      });
    });
  });
}