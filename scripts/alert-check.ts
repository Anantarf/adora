import "dotenv/config";
import { dispatchOperationalAlert } from "@/lib/operational-alerts";

async function main() {
  if (!process.env.ALERT_WEBHOOK_URL?.trim()) {
    console.error("Alert check failed. Set ALERT_WEBHOOK_URL to a real webhook endpoint first.");
    process.exit(1);
  }

  const sent = await dispatchOperationalAlert({
    severity: "ERROR",
    source: "ops-alert-check",
    message: "Synthetic ADORA BBC alert check",
    fingerprint: `ops-alert-check:${Date.now()}`,
    metadata: {
      purpose: "Verify external alert delivery",
      triggeredBy: "npm run ops:alert-check",
    },
  });

  if (!sent) {
    console.error("Alert check failed. Webhook was not accepted or was skipped by alert config.");
    process.exit(1);
  }

  console.log("Alert check passed. External webhook accepted the synthetic alert.");
}

void main();
