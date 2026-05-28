import { describe, expect, test } from "vitest";
import {
  getOperationalAlertConfig,
  normalizeWebhookUrl,
  parseAlertCooldownMs,
  parseOperationalSeverity,
  shouldDispatchOperationalAlert,
} from "@/lib/operational-alerts";

describe("Operational alert helpers", () => {
  test("menormalkan severity dan cooldown dari env", () => {
    expect(parseOperationalSeverity("WARN")).toBe("WARN");
    expect(parseOperationalSeverity("invalid")).toBe("ERROR");
    expect(parseAlertCooldownMs("90000")).toBe(90_000);
    expect(parseAlertCooldownMs("-1")).toBe(300_000);
  });

  test("menentukan apakah severity layak dikirim ke alert channel", () => {
    expect(shouldDispatchOperationalAlert("ERROR", "WARN")).toBe(true);
    expect(shouldDispatchOperationalAlert("WARN", "ERROR")).toBe(false);
    expect(shouldDispatchOperationalAlert("INFO", "INFO")).toBe(true);
  });

  test("membaca konfigurasi alert dari env dan menolak URL invalid", () => {
    expect(normalizeWebhookUrl("https://hooks.example.com/adora")).toBe("https://hooks.example.com/adora");
    expect(normalizeWebhookUrl("not-a-url")).toBeNull();

    const config = getOperationalAlertConfig({
      ALERT_WEBHOOK_URL: "https://hooks.example.com/adora",
      ALERT_MIN_SEVERITY: "WARN",
      ALERT_COOLDOWN_MS: "120000",
      NODE_ENV: "development",
    });

    expect(config).toEqual({
      webhookUrl: "https://hooks.example.com/adora",
      minSeverity: "WARN",
      cooldownMs: 120_000,
    });
  });
});
