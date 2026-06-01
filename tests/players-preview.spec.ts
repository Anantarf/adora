import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers/auth";

const adminUsername = process.env.E2E_ADMIN_USERNAME;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("Players Admin Preview", () => {
  test.skip(!adminUsername || !adminPassword, "E2E admin credentials belum diisi.");

  test("halaman players admin menampilkan struktur kelompok dan form baru", async ({ page }) => {
    await loginViaApi(page, {
      username: adminUsername!,
      password: adminPassword!,
      callbackUrl: "http://localhost:3000/dashboard/players",
    });

    await page.goto("/dashboard/players", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /Kelompok Latihan/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Kelola data pembagian kelas latihan dan database pemain/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Daftar Kelompok/i })).toBeVisible();

    await page.getByRole("button", { name: /\+ Kelompok/i }).first().click();
    await expect(page.getByText(/Tambah Kelompok Latihan/i)).toBeVisible();
    await expect(page.getByText(/Buat kelompok baru berdasarkan usia atau sekolah/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sekolah/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Kelompok Umur/i })).toBeVisible();
    await page.keyboard.press("Escape");

    // Pilih kelompok latihan pertama di daftar kiri agar detail & tombol "Tambah Pemain" muncul
    const firstGroupButton = page.locator("button:has-text('PEMAIN')").first();
    await expect(firstGroupButton).toBeVisible({ timeout: 10_000 });
    await firstGroupButton.click({ force: true });

    await page.getByRole("button", { name: /Tambah Pemain/i }).click();
    await expect(page.getByText(/Registrasi Pemain Baru/i)).toBeVisible();
    await expect(page.getByText(/Langkah 1 dari 3/i)).toBeVisible();
    await expect(page.getByText(/Data Pribadi/i).first()).toBeVisible();
    await expect(page.getByLabel(/Nama Depan/i)).toBeVisible();
    await expect(page.getByLabel(/Tanggal Lahir/i)).toBeVisible();

    // Isi field wajib Langkah 1
    await page.locator("#field-player-firstName").fill("Budi");
    await page.locator("#field-player-dateOfBirth").fill("15/05/2010");
    await page.locator("#field-player-gender").click();
    await page.getByRole("option", { name: "Laki-laki" }).click();
    await page.locator("#field-player-schoolOrigin").fill("SMP N 1 Depok");

    await page.getByRole("button", { name: /Lanjut/i }).click();
    await expect(page.getByText(/Kontak dan Alamat/i).first()).toBeVisible();
    await expect(page.getByLabel(/Alamat Rumah/i)).toBeVisible();
    await expect(page.getByLabel(/Kota/i)).toBeVisible();

    // Isi field wajib Langkah 2
    await page.locator("#field-player-addressLine1").fill("Jl. Merdeka No. 10");
    await page.locator("#field-player-city").fill("Depok");
    await page.locator("#field-player-province").fill("Jawa Barat");
    await page.locator("#field-player-postalCode").fill("16411");
    await page.locator("#field-player-phoneNumber").fill("081234567890");

    await page.getByRole("button", { name: /Lanjut/i }).click();
    await expect(page.getByText(/Data Pendukung dan Medis/i).first()).toBeVisible();
    await expect(page.getByText(/Riwayat Penyakit Bawaan/i)).toBeVisible();
    await expect(page.getByText(/Pas Foto/i)).toBeVisible();
    await expect(page.getByText(/Tanda Tangan Elektronik/i)).toBeVisible();
  });
});
