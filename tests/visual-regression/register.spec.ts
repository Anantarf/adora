// Visual regression baseline for /register.
// Captures the empty form on 3 viewports. No auth required.
// Run: npx playwright test tests/visual-regression/register.spec.ts --update-snapshots (first time)

import { test, expect } from "@playwright/test";
import { VISUAL_VIEWPORTS, stubWebVitals } from "../helpers/visual";

for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`Register @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.beforeEach(async ({ page }) => {
      await page.goto("/register");
      await stubWebVitals(page);
      // Wait for hero copy that always renders above the fold.
      await page.getByText(/Halo Adora Basketball Club/i).waitFor({ state: "visible" });
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
