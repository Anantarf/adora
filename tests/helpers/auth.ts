import { expect, type Page } from "@playwright/test";

export async function loginViaUi(
  page: Page,
  credentials: { username: string; password: string },
) {
  await page.goto("/login");
  await page.fill('input[name="username"]', credentials.username);
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button[type="submit"]');
}

export async function loginViaApi(
  page: Page,
  credentials: { username: string; password: string; callbackUrl: string },
) {
  const csrfResponse = await page.request.get("/api/auth/csrf");
  expect(csrfResponse.ok()).toBeTruthy();

  const csrfJson = await csrfResponse.json() as { csrfToken?: string };
  const csrfToken = csrfJson.csrfToken;
  expect(csrfToken).toBeTruthy();

  const body = new URLSearchParams({
    csrfToken: csrfToken!,
    username: credentials.username,
    password: credentials.password,
    callbackUrl: credentials.callbackUrl,
    json: "true",
  });

  const response = await page.request.post("/api/auth/callback/credentials?json=true", {
    form: Object.fromEntries(body.entries()),
  });

  expect(response.ok()).toBeTruthy();
}
