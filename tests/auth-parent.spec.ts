import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers/auth";

const parentUsername = process.env.E2E_PARENT_USERNAME;
const parentPassword = process.env.E2E_PARENT_PASSWORD;

test.describe("Parent Authenticated Flow", () => {
  test.skip(!parentUsername || !parentPassword, "E2E parent credentials belum diisi.");

  test("@critical parent seed dapat login dan melihat portal keluarga", async ({ page }) => {
    await loginViaApi(page, {
      username: parentUsername!,
      password: parentPassword!,
      callbackUrl: "http://localhost:3000/parent",
    });

    await page.goto("/parent");
    await expect(page).toHaveURL(/\/parent/);
    await expect(page.getByText(/Pantauan Pemain/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Laporan evaluasi performa individual anak Anda/i)).toBeVisible();
  });
});
