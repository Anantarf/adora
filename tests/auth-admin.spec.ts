import { expect, test } from "@playwright/test";
import { loginViaApi } from "./helpers/auth";

const adminUsername = process.env.E2E_ADMIN_USERNAME;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

test.describe("Admin Authenticated Flow", () => {
  test.skip(!adminUsername || !adminPassword, "E2E admin credentials belum diisi.");

  test("@critical admin seed dapat login dan melihat dashboard", async ({ page }) => {
    await loginViaApi(page, {
      username: adminUsername!,
      password: adminPassword!,
      callbackUrl: "http://localhost:3000/dashboard",
    });

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/Selamat Datang/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Pantau kondisi klub secara menyeluruh/i)).toBeVisible();
  });
});
