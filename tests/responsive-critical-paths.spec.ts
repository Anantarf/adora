// Responsive sanity check for critical public + authenticated paths.
// Run only via: npx playwright test tests/responsive-critical-paths.spec.ts
import { test, expect, type Page } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

const adminUsername = process.env.E2E_ADMIN_USERNAME;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const parentUsername = process.env.E2E_PARENT_USERNAME;
const parentPassword = process.env.E2E_PARENT_PASSWORD;
const coachUsername = process.env.E2E_COACH_USERNAME;
const coachPassword = process.env.E2E_COACH_PASSWORD;

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'ipad-landscape', width: 1024, height: 768 },
] as const;

async function expectNoHorizontalOverflow(page: Page, label: string, maxOverflow = 4) {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `${label} overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(maxOverflow);
}

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`@responsive landing tidak overflow horizontal di ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/MEMBANGUN/i).first()).toBeVisible();
      const cta = page.getByRole('link', { name: /DAFTAR SEKARANG/i }).first();
      await expect(cta).toBeVisible();
      await expectNoHorizontalOverflow(page, 'landing', 2);
    });

    test(`@responsive login form terlihat & tidak overflow di ${viewport.name}`, async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      const submit = page.locator('button[type="submit"]');
      await expect(submit).toBeVisible();
      const box = await submit.boundingBox();
      expect(box, 'submit button has no bounding box').not.toBeNull();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
      }
      await expectNoHorizontalOverflow(page, 'login', 2);
    });

    test(`@responsive register flow tidak overflow di ${viewport.name}`, async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByText(/FORM PENDAFTARAN/i).first()).toBeVisible();
      await page.getByRole('button', { name: /ADORA Gandul/i }).click();
      const firstInput = page.locator('input').first();
      await expect(firstInput).toBeVisible();
      const box = await firstInput.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      }
      await expectNoHorizontalOverflow(page, 'register', 4);
    });

    test(`@responsive admin dashboard tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!adminUsername || !adminPassword, 'E2E admin credentials belum diisi.');
      await loginViaApi(page, {
        username: adminUsername!,
        password: adminPassword!,
        callbackUrl: 'http://localhost:3000/dashboard',
      });

      await page.goto('/dashboard');
      await expect(page.getByText(/Ringkasan Operasional Hari Ini/i)).toBeVisible({ timeout: 15_000 });

      await expectNoHorizontalOverflow(page, 'admin dashboard');
    });

    test(`@responsive admin players tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!adminUsername || !adminPassword, 'E2E admin credentials belum diisi.');
      await loginViaApi(page, {
        username: adminUsername!,
        password: adminPassword!,
        callbackUrl: 'http://localhost:3000/dashboard/players',
      });

      await page.goto('/dashboard/players');
      await expect(page.getByText(/Pilih kelompok/i).first()).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page, 'admin players');
    });

    test(`@responsive admin settings tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!adminUsername || !adminPassword, 'E2E admin credentials belum diisi.');
      await loginViaApi(page, {
        username: adminUsername!,
        password: adminPassword!,
        callbackUrl: 'http://localhost:3000/dashboard/settings',
      });

      await page.goto('/dashboard/settings');
      await expect(page.getByText(/Aset dan Tanda Tangan Rapor/i)).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page, 'admin settings');
    });

    test(`@responsive parent dashboard tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!parentUsername || !parentPassword, 'E2E parent credentials belum diisi.');
      await loginViaApi(page, {
        username: parentUsername!,
        password: parentPassword!,
        callbackUrl: 'http://localhost:3000/parent',
      });

      await page.goto('/parent');
      await expect(page.getByText(/Pantauan Pemain/i)).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page, 'parent dashboard');
    });

    test(`@responsive coach dashboard tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!coachUsername || !coachPassword, 'E2E coach credentials belum diisi.');
      await loginViaApi(page, {
        username: coachUsername!,
        password: coachPassword!,
        callbackUrl: 'http://localhost:3000/coach/dashboard',
      });

      await page.goto('/coach/dashboard');
      await expect(page.getByText(/Ringkasan Kelompok dan Pemain/i)).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page, 'coach dashboard');
    });

    test(`@responsive coach statistics tidak overflow di ${viewport.name}`, async ({ page }) => {
      test.skip(!coachUsername || !coachPassword, 'E2E coach credentials belum diisi.');
      await loginViaApi(page, {
        username: coachUsername!,
        password: coachPassword!,
        callbackUrl: 'http://localhost:3000/coach/statistics',
      });

      await page.goto('/coach/statistics');
      await expect(page.getByText(/Input Nilai Pemain/i)).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page, 'coach statistics');
    });
  });
}
