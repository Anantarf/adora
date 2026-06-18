// Visual regression baseline for /coach/profile.
// Requires E2E_COACH_USERNAME and E2E_COACH_PASSWORD env vars (seeded by prisma seed).
// Skipped if env not set — baseline can only be generated against a live DB with seed data.
// Run with env:
//   $env:E2E_COACH_USERNAME="coach.danuri"; $env:E2E_COACH_PASSWORD="password"
//   npx playwright test tests/visual-regression/coach-profile.spec.ts --update-snapshots

import { test, expect } from "@playwright/test";
import { loginViaApi } from "../helpers/auth";
import { VISUAL_VIEWPORTS, stubWebVitals } from "../helpers/visual";

const coachUsername = process.env.E2E_COACH_USERNAME;
const coachPassword = process.env.E2E_COACH_PASSWORD;
const hasEnv = Boolean(coachUsername && coachPassword);

for (const viewport of VISUAL_VIEWPORTS) {
  test.describe(`Coach profile @ ${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test.skip(!hasEnv, "E2E_COACH_USERNAME / E2E_COACH_PASSWORD not set.");

    test.beforeEach(async ({ page }) => {
      await loginViaApi(page, {
        username: coachUsername!,
        password: coachPassword!,
        callbackUrl: "http://localhost:3000/coach/profile",
      });
      await page.goto("/coach/profile");
      await stubWebVitals(page);
      // Profile form is the root content; wait for a stable heading.
      await page.getByRole("heading", { level: 1 }).waitFor({ state: "visible", timeout: 15_000 });
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
