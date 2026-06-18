// Visual regression baseline for /parent.
// Requires E2E_PARENT_USERNAME and E2E_PARENT_PASSWORD env vars (seeded by prisma seed).
// Skipped if env not set — baseline can only be generated against a live DB with seed data.
// Run with env:
//   $env:E2E_PARENT_USERNAME="parent.arya"; $env:E2E_PARENT_PASSWORD="password"
//   npx playwright test tests/visual-regression/parent.spec.ts --update-snapshots

import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { VISUAL_VIEWPORTS, stubWebVitals } from "../helpers/visual";

const parentUsername = process.env.E2E_PARENT_USERNAME;
const parentPassword = process.env.E2E_PARENT_PASSWORD;
const hasEnv = Boolean(parentUsername && parentPassword);

for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`Parent @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.skip(!hasEnv, "E2E_PARENT_USERNAME / E2E_PARENT_PASSWORD not set.");

    test.beforeEach(async ({ page }) => {
      await loginViaApi(page, {
        username: parentUsername!,
        password: parentPassword!,
        callbackUrl: "http://localhost:3000/parent",
      });
      await page.goto("/parent");
      await stubWebVitals(page);
      // Hero card always renders once family data resolves.
      await page.getByText(/Pantauan Pemain/i).waitFor({ state: "visible", timeout: 15_000 });
    });

    test("@visual full page", async ({ page }) => {
      await expect(page).toHaveScreenshot(`${viewport.name}-full-page.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
      });
    });
  });
}
