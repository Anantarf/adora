import { normalizeBaseUrl } from "@/lib/release-safety";

type CheckResult = {
  label: string;
  ok: boolean;
  status: number | null;
  detail: string;
};

async function runCheck(label: string, input: RequestInfo | URL, init?: RequestInit): Promise<CheckResult> {
  try {
    const response = await fetch(input, init);
    const detail = response.ok ? "ok" : await response.text().catch(() => response.statusText);
    return {
      label,
      ok: response.ok,
      status: response.status,
      detail: detail.slice(0, 200),
    };
  } catch (error) {
    return {
      label,
      ok: false,
      status: null,
      detail: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.env.SMOKE_BASE_URL || process.env.NEXTAUTH_URL);
  const healthToken = process.env.HEALTH_CHECK_TOKEN?.trim();

  if (!baseUrl) {
    console.error("Smoke check failed. Set SMOKE_BASE_URL or NEXTAUTH_URL to a valid absolute URL.");
    process.exit(1);
  }

  if (!healthToken) {
    console.error("Smoke check failed. HEALTH_CHECK_TOKEN is required.");
    process.exit(1);
  }

  const checks = await Promise.all([
    runCheck("homepage", `${baseUrl}/`),
    runCheck("login-page", `${baseUrl}/login`),
    runCheck("register-page", `${baseUrl}/register`),
    runCheck("health-db", `${baseUrl}/api/health/db`, {
      headers: { "x-health-token": healthToken },
    }),
    runCheck("health-observability", `${baseUrl}/api/health/observability`, {
      headers: { "x-health-token": healthToken },
    }),
  ]);

  const failed = checks.filter((check) => !check.ok);

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} ${check.label} ${check.status ?? "-"} ${check.detail}`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

void main();
