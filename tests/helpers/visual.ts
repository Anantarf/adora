
// Shared viewport config for visual regression specs.
// Keep these in sync with tests/visual-regression/landing.spec.ts.
export const VISUAL_VIEWPORTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

export type VisualViewport = (typeof VISUAL_VIEWPORTS)[number];

/**
 * Stubs the web-vitals analytics endpoint. The page still mounts normally
 * (Next.js client component), but the fetch resolves to 204 so no extra
 * network noise pollutes the screenshot baseline.
 */
export async function stubWebVitals(page: import("@playwright/test").Page) {
  await page.route("**/api/analytics/web-vitals", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
}
