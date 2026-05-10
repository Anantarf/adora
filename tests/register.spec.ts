import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test('user bisa mengisi form pendaftaran sampai sukses', async ({ page }) => {
    await page.goto('/register');
    
    // 1. Tunggu Homebase load dan pilih homebase pertama yang muncul
    const firstHomebaseBtn = page.locator('button').filter({ has: page.locator('h3') }).first();
    await expect(firstHomebaseBtn).toBeVisible({ timeout: 10000 });
    await firstHomebaseBtn.click();

    // 2. Isi form data diri
    // Berdasarkan config di page.tsx, labelnya adalah:
    await page.fill('input[placeholder="Contoh: Muhammad Arya Putra"]', 'Test Player E2E');
    await page.fill('input[placeholder="Contoh: 08123456789"]', '081299998888');
    await page.fill('input[placeholder="Contoh: orang.tua@email.com"]', 'test@playwright.com');

    // 3. Pilih program usia (contoh: UNDER 10)
    // Mencari button yang mengandung text UNDER 10
    const rookieBtn = page.locator('button', { hasText: 'UNDER 10' }).first();
    await expect(rookieBtn).toBeVisible();
    await rookieBtn.click();

    // 4. Submit form
    // Button submit memiliki text KIRIM PENDAFTARAN
    const submitBtn = page.locator('button', { hasText: 'KIRIM PENDAFTARAN' });
    await submitBtn.click();

    // 5. Pastikan muncul layar sukses
    // Mencari pesan "PENDAFTARAN SUKSES!"
    const successMsg = page.getByText('PENDAFTARAN SUKSES!');
    await expect(successMsg).toBeVisible({ timeout: 15000 });
  });
});
