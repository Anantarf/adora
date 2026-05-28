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
    await expect(page.getByText(/Kelola data pemain dan kelompok latihan/i)).toBeVisible();

    await page.getByRole("button", { name: /Tambah Kelompok/i }).first().click();
    await expect(page.getByText(/Tambah Kelompok Latihan/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Sekolah/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Kelompok Umur/i })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: /Tambah Pemain/i }).click();
    await expect(page.getByText(/Registrasi Pemain Baru/i)).toBeVisible();
    await expect(page.getByLabel(/Nama Depan/i)).toBeVisible();
    await expect(page.getByLabel(/Tanggal Lahir/i)).toBeVisible();

    await page.getByRole("button", { name: "2" }).click();
    await expect(page.getByLabel(/Address Line 1/i)).toBeVisible();
    await expect(page.getByLabel(/Kota/i)).toBeVisible();

    await page.getByRole("button", { name: "3" }).click();
    await expect(page.getByText(/Riwayat Penyakit Bawaan/i)).toBeVisible();
    await expect(page.getByText(/Pas Foto/i)).toBeVisible();
    await expect(page.getByText(/Tanda Tangan Elektronik/i)).toBeVisible();
  });
});
