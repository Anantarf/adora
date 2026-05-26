import { describe, expect, test } from "vitest";
import { getRequiredProductionEnvStatus, normalizeBaseUrl } from "@/lib/release-safety";

describe("Phase 5 Release Safety Helpers", () => {
  test("mendeteksi env production yang wajib tetapi belum diisi", () => {
    const result = getRequiredProductionEnvStatus({
      DATABASE_URL: "postgresql://example",
      NEXTAUTH_SECRET: "secret",
      NEXTAUTH_URL: "https://adora.example.com",
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role",
    });

    expect(result.present).toEqual([
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ]);
    expect(result.missing).toEqual(["DIRECT_URL", "HEALTH_CHECK_TOKEN"]);
  });

  test("menormalkan base URL dan menolak input yang tidak valid", () => {
    expect(normalizeBaseUrl("https://adora.example.com///")).toBe("https://adora.example.com");
    expect(normalizeBaseUrl("not-a-url")).toBeNull();
    expect(normalizeBaseUrl("   ")).toBeNull();
  });
});
