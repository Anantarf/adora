import "dotenv/config";
import { chromium, request as playwrightRequest, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

type AuditIssue = {
  route: string;
  viewport: string;
  severity: "high" | "medium" | "low";
  message: string;
};

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const username = process.env.VISUAL_AUDIT_USERNAME;
const password = process.env.VISUAL_AUDIT_PASSWORD;
const coachUsername = process.env.VISUAL_AUDIT_COACH_USERNAME;
const coachPassword = process.env.VISUAL_AUDIT_COACH_PASSWORD;
const parentUsername = process.env.VISUAL_AUDIT_PARENT_USERNAME;
const parentPassword = process.env.VISUAL_AUDIT_PARENT_PASSWORD;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.join(process.cwd(), "output", "visual-audit", timestamp);

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 720 },
  { name: "mobile", width: 390, height: 844 },
];

const publicRoutes = ["/", "/login", "/register", "/robots.txt", "/.well-known/security.txt"];
const protectedRoutes = [
  "/dashboard",
  "/dashboard/players",
  "/dashboard/statistics",
  "/dashboard/attendances",
  "/dashboard/schedule",
  "/dashboard/certificates",
  "/dashboard/registrations",
  "/dashboard/users",
  "/dashboard/settings",
  "/dashboard/audit",
  "/coach",
  "/coach/dashboard",
  "/coach/players",
  "/coach/statistics",
  "/coach/attendances",
  "/coach/profile",
  "/parent?panel=ringkasan",
  "/parent?panel=dokumen",
  "/parent?panel=riwayat",
];
const adminRoutes = protectedRoutes.filter((route) => route.startsWith("/dashboard"));
const coachRoutes = protectedRoutes.filter((route) => route.startsWith("/coach"));
const parentRoutes = protectedRoutes.filter((route) => route.startsWith("/parent"));

function safeName(value: string) {
  return value.replace(/^\//, "home").replace(/[^\w.-]+/g, "_").slice(0, 90);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page: Page, loginUsername?: string, loginPassword?: string) {
  if (!loginUsername || !loginPassword) {
    return { authenticated: false, message: "set VISUAL_AUDIT_USERNAME and VISUAL_AUDIT_PASSWORD to audit role pages." };
  }

  await page.goto(new URL("/login", baseUrl).toString(), { waitUntil: "networkidle" });
  await page.locator("#field-username").fill(loginUsername);
  await page.locator("#field-password").fill(loginPassword);
  await page.getByRole("button", { name: /masuk|login/i }).click();

  let sessionRole: string | null = null;
  const authenticated = await page
    .waitForFunction(async () => {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const session = await response.json();
      return Boolean(session?.user?.role);
    }, undefined, { timeout: 8_000 })
    .then(() => true)
    .catch(() => false);

  if (authenticated) {
    const session = await page.evaluate(async () => {
      const response = await fetch("/api/auth/session", {
        cache: "no-store",
        credentials: "same-origin",
      });
      return response.json();
    });
    sessionRole = typeof session?.user?.role === "string" ? session.user.role : null;
    await page.waitForLoadState("networkidle");
    return { authenticated: true, message: "authenticated", role: sessionRole };
  }

  const visibleText = await page.locator("body").innerText().catch(() => "");
  const failureHint = visibleText.includes("Username atau password salah")
    ? "username/password rejected or account is locked by rate limit."
    : "login attempt did not produce an authenticated session.";

  return { authenticated: false, message: failureHint, role: null };
}

function routesForRole(role?: string | null) {
  if (role === "ADMIN" || role === "SUPERADMIN") {
    return adminRoutes;
  }
  if (role === "COACH") {
    return coachRoutes;
  }
  if (role === "PARENT") {
    return parentRoutes;
  }
  return [];
}

function routesForCredential(role: string | null | undefined, label: string) {
  const roleRoutes = routesForRole(role);
  if (roleRoutes.length > 0) {
    return roleRoutes;
  }

  if (label === "primary") {
    return adminRoutes;
  }
  if (label === "coach") {
    return coachRoutes;
  }
  if (label === "parent") {
    return parentRoutes;
  }

  return [];
}

async function auditRoute(page: Page, route: string, viewportName: string, issues: AuditIssue[]) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (!text.includes("/api/analytics/web-vitals") && !text.includes("status of 429")) {
        consoleErrors.push(text);
      }
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  const response = await page.goto(new URL(route, baseUrl).toString(), {
    waitUntil: "networkidle",
    timeout: 30_000,
  });

  await page.screenshot({
    path: path.join(outputDir, `${viewportName}-${safeName(route)}.png`),
    fullPage: true,
  });

  const checks = await page.evaluate((isMobileViewport) => {
    const bodyText = document.body.innerText.trim();
    const overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const tinyButtons = isMobileViewport ? [...document.querySelectorAll("button, a")]
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && (box.width < 40 || box.height < 40);
      })
      .slice(0, 5)
      .map((element) => element.textContent?.trim() || element.getAttribute("aria-label") || element.tagName) : [];

    return {
      bodyTextLength: bodyText.length,
      overflowX,
      title: document.title,
      tinyButtons,
    };
  }, viewportName === "mobile");

  if (!response || response.status() >= 400) {
    issues.push({
      route,
      viewport: viewportName,
      severity: response?.status() === 401 || response?.status() === 403 ? "low" : "high",
      message: `HTTP status ${response?.status() ?? "unknown"}`,
    });
  }

  if (checks.overflowX > 4) {
    issues.push({
      route,
      viewport: viewportName,
      severity: "medium",
      message: `Horizontal overflow ${checks.overflowX}px`,
    });
  }

  if (checks.bodyTextLength < 20 && !route.endsWith(".txt")) {
    issues.push({
      route,
      viewport: viewportName,
      severity: "medium",
      message: "Body text terlalu sedikit; cek kemungkinan blank render",
    });
  }

  for (const error of [...new Set([...consoleErrors, ...pageErrors, ...failedResponses])].slice(0, 5)) {
    issues.push({ route, viewport: viewportName, severity: "medium", message: error });
  }

  if (checks.tinyButtons.length > 0) {
    issues.push({
      route,
      viewport: viewportName,
      severity: "low",
      message: `Small tap targets: ${checks.tinyButtons.join(", ")}`,
    });
  }
}

async function auditHeaders(issues: AuditIssue[]) {
  const context = await playwrightRequest.newContext({ baseURL: baseUrl });
  const routes = ["/", "/login", "/robots.txt", "/.well-known/security.txt", "/logo-adora.png"];

  for (const route of routes) {
    const response = await context.get(route);
    const headers = response.headers();
    for (const key of ["content-security-policy", "referrer-policy", "x-content-type-options"]) {
      if (!headers[key]) {
        issues.push({
          route,
          viewport: "headers",
          severity: "medium",
          message: `Missing header: ${key}`,
        });
      }
    }
  }

  await context.dispose();
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const healthContext = await playwrightRequest.newContext({ baseURL: baseUrl });
  try {
    await healthContext.get("/", { timeout: 5_000 });
  } catch {
    console.error(`Visual audit gagal: server tidak merespons di ${baseUrl}. Jalankan npm run build && npm run start dulu, atau set BASE_URL.`);
    process.exitCode = 1;
    return;
  } finally {
    await healthContext.dispose();
  }

  const browser = await chromium.launch();
  const issues: AuditIssue[] = [];

  for (const viewport of viewports) {
    const publicContext = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    await publicContext.route("**/api/analytics/web-vitals", (route) =>
      route.fulfill({ status: 204, body: "" }),
    );
    const publicPage = await publicContext.newPage();

    for (const route of publicRoutes) {
      await auditRoute(publicPage, route, viewport.name, issues);
      await delay(150);
    }

    await publicContext.close();

    const roleCredentials = [
      { label: "primary", username, password },
      { label: "coach", username: coachUsername, password: coachPassword },
      { label: "parent", username: parentUsername, password: parentPassword },
    ].filter((item) => item.username && item.password);

    if (roleCredentials.length === 0) {
      issues.push({
        route: "/login",
        viewport: viewport.name,
        severity: "low",
        message: "Protected routes skipped: set VISUAL_AUDIT_USERNAME and VISUAL_AUDIT_PASSWORD to audit role pages.",
      });
      continue;
    }

    for (const credential of roleCredentials) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      await context.route("**/api/analytics/web-vitals", (route) =>
        route.fulfill({ status: 204, body: "" }),
      );
      const page = await context.newPage();
      const loginResult = await login(page, credential.username, credential.password);
      const routes = routesForCredential(loginResult.role, credential.label);

      if (!loginResult.authenticated || routes.length === 0) {
        issues.push({
          route: "/login",
          viewport: viewport.name,
          severity: "low",
          message: `Protected routes skipped for ${credential.label}: ${loginResult.message}${loginResult.role ? ` (${loginResult.role})` : ""}`,
        });
        await context.close();
        continue;
      }

      for (const route of routes) {
        await auditRoute(page, route, `${viewport.name}/${loginResult.role}`, issues);
        await delay(150);
      }

      await context.close();
    }
  }

  await auditHeaders(issues);
  await browser.close();

  const report = [
    `# ADORA Visual Audit`,
    ``,
    `Base URL: ${baseUrl}`,
    `Screenshots: ${outputDir}`,
    `Authenticated: ${username && password ? "attempted" : "no"}`,
    `Issue count: ${issues.length}`,
    ``,
    ...issues.map((issue) => `- [${issue.severity}] ${issue.viewport} ${issue.route}: ${issue.message}`),
    ``,
  ].join("\n");

  await fs.writeFile(path.join(outputDir, "report.md"), report, "utf8");
  console.log(report);

  const blockingIssue = issues.some((issue) => issue.severity === "high");
  process.exitCode = blockingIssue ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
