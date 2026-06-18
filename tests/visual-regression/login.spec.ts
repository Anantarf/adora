// Visual regression baseline for /login.
// Captures the empty form on 3 viewports. No auth required.
// Run: npx playwright test tests/visual-regression/login.spec.ts --update-snapshots (first time)

import { test, expect } from "@playwright/test";
import { VISUAL_VIEWPORTS, stubWebVitals } from "../helpers/visual";

for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`Login @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
      await stubWebVitals(page);
      await page.locator('input[name="username"]').waitFor({ state: "visible" });
    });

    test("@visual full page", async ({ page }) => {
      await expect(page).toHaveScreenshot(`${viewport.name}-full-page.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        animations: "disabled",
      });
    });
  });
}
