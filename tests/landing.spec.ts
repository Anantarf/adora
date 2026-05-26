import { test, expect } from '@playwright/test';

test.describe('Landing Flow', () => {
  test('@critical landing page mengarahkan user ke alur publik utama', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText(/ADORA BBC/i).first()).toBeVisible();

    const registerLink = page.getByRole('link', { name: /DAFTAR SEKARANG/i }).first();
    await expect(registerLink).toBeVisible();
    await registerLink.click({ force: true });
    await expect(page).toHaveURL(/\/register/);

    await page.goto('/');

    const loginLink = page.getByRole('link', { name: /PORTAL LOGIN|Login Portal/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click({ force: true });
    await expect(page).toHaveURL(/\/login/);
  });
});
