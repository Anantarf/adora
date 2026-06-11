// Responsive sanity check for critical public + authenticated paths.
// Run only via: npx playwright test tests/responsive-critical-paths.spec.ts
import { test, expect } from '@playwright/test';

const adminUsername = process.env.E2E_ADMIN_USERNAME;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

const VIEWPORTS = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'ipad', width: 768, height: 1024 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`Responsive @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`@responsive landing tidak overflow horizontal di ${viewport.name}`, async ({ page }) => {
      await page.goto('/');
      await expect(page.getByText(/MEMBANGUN/i).first()).toBeVisible();
      const cta = page.getByRole('link', { name: /DAFTAR SEKARANG/i }).first();
      await expect(cta).toBeVisible();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `landing overflows horizontally by ${overflow}px`).toBeLessThanOrEqual(2);
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
    });

    test(`@responsive register flow tidak overflow di ${viewport.name}`, async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByText(/FORM PENDAFTARAN/i).first()).toBeVisible();
      const firstInput = page.locator('input').first();
      await expect(firstInput).toBeVisible();
      const box = await firstInput.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
      }
    });

    test.skip(!adminUsername || !adminPassword, 'E2E admin credentials belum diisi.');

    test(`@responsive admin dashboard tidak overflow di ${viewport.name}`, async ({ page, request }) => {
      const csrf = await request.get('/api/auth/csrf');
      const { csrfToken } = (await csrf.json()) as { csrfToken: string };
      const body = new URLSearchParams({
        csrfToken,
        username: adminUsername!,
        password: adminPassword!,
        callbackUrl: 'http://localhost:3000/dashboard',
        json: 'true',
      });
      const login = await request.post('/api/auth/callback/credentials?json=true', {
        form: Object.fromEntries(body.entries()),
      });
      expect(login.ok(), `admin login failed: ${login.status()}`).toBeTruthy();

      await page.goto('/dashboard');
      await expect(page.getByText(/Pantau kondisi klub secara menyeluruh/i)).toBeVisible({ timeout: 15_000 });

      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `dashboard overflows by ${overflow}px`).toBeLessThanOrEqual(4);
    });
  });
}
