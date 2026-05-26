import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('@critical halaman login me-render form dengan benar', async ({ page }) => {
    await page.goto('/login');
    
    // Pastikan form input ada
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    // Pastikan tombol login ada
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('MASUK');
  });

  test('@critical menampilkan error jika kredensial salah', async ({ page }) => {
    await page.goto('/login');
    
    // Isi form dengan data salah
    await page.fill('input[name="username"]', 'admin_salah');
    await page.fill('input[name="password"]', 'passwordsalah123');
    
    // Submit form
    await page.click('button[type="submit"]');

    await expect(page.getByText('Autentikasi Gagal')).toBeVisible({ timeout: 15000 });
  });
});
