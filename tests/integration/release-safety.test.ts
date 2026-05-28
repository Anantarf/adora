import { describe, expect, test } from "vitest";
import { getRequiredProductionEnvStatus, normalizeBaseUrl } from "@/lib/release-safety";

describe("Phase 5 Release Safety Helpers", () => {
  test("mendeteksi env production yang wajib tetapi belum diisi", () => {
    const result = getRequiredProductionEnvStatus({
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://direct-example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://adora.example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      NODE_ENV: "development",
    });

    expect(result.present).toEqual([
      "DATABASE_URL",
      "DIRECT_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
    expect(result.missingRequired).toEqual([]);
    expect(result.missingRecommended).toEqual([
      "DEFAULT_RESET_PASSWORD",
      "HEALTH_CHECK_TOKEN",
      "PRISMA_SLOW_QUERY_THRESHOLD_MS",
      "SMOKE_BASE_URL",
      "ALERT_WEBHOOK_URL",
      "ALERT_MIN_SEVERITY",
      "ALERT_COOLDOWN_MS",
      "RESTORE_REHEARSAL_DATABASE_URL",
      "RESTORE_REHEARSAL_CONFIRM",
    ]);
  });

  test("menormalkan base URL dan menolak input yang tidak valid", () => {
    expect(normalizeBaseUrl("https://adora.example.com///")).toBe("https://adora.example.com");
    expect(normalizeBaseUrl("not-a-url")).toBeNull();
    expect(normalizeBaseUrl("   ")).toBeNull();
  });

  test("memberi warning jika NEXTAUTH_URL production masih localhost", () => {
    const result = getRequiredProductionEnvStatus({
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://direct-example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "http://localhost:3000",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      NODE_ENV: "production",
    });

    expect(result.warnings).toContain(
      "NEXTAUTH_URL masih mengarah ke localhost padahal NODE_ENV=production.",
    );
  });

  test("memberi warning jika ALERT_WEBHOOK_URL bukan URL absolute", () => {
    const result = getRequiredProductionEnvStatus({
      DATABASE_URL: "postgresql://example",
      DIRECT_URL: "postgresql://direct-example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://adora.example.com",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
      ALERT_WEBHOOK_URL: "invalid-url",
      NODE_ENV: "development",
    });

    expect(result.warnings).toContain(
      "ALERT_WEBHOOK_URL ada tetapi bukan absolute URL yang valid.",
    );
  });
});
