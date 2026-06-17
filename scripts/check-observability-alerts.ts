import "dotenv/config";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";
import { dispatchOperationalAlert } from "@/lib/operational-alerts";
import { resolveAlertThreshold } from "@/lib/constants/alert-thresholds";

async function main() {
  const snapshot = await getObservabilitySnapshot(1); // last 1 hour
  const env = process.env;

  const badWebVitals = resolveAlertThreshold("badWebVitals", env);
  const errorEvents = resolveAlertThreshold("errorEvents", env);
  const warnEvents = resolveAlertThreshold("warnEvents", env);

  if (snapshot.totals.badWebVitals >= badWebVitals) {
    await dispatchOperationalAlert({
      severity: "WARN",
      source: "observability-check",
      message: `High bad web-vitals count: ${snapshot.totals.badWebVitals} in last ${snapshot.windowHours}h`,
      fingerprint: `bad-webvitals:${new Date().toISOString().slice(0, 13)}`,
      metadata: { snapshot },
    });
  }

  if (snapshot.totals.errorEvents >= errorEvents) {
    await dispatchOperationalAlert({
      severity: "ERROR",
      source: "observability-check",
      message: `High error events: ${snapshot.totals.errorEvents} in last ${snapshot.windowHours}h`,
      fingerprint: `error-events:${new Date().toISOString().slice(0, 13)}`,
      metadata: { snapshot },
    });
  }

  if (snapshot.totals.warnEvents >= warnEvents) {
    await dispatchOperationalAlert({
      severity: "WARN",
      source: "observability-check",
      message: `High warn events: ${snapshot.totals.warnEvents} in last ${snapshot.windowHours}h`,
      fingerprint: `warn-events:${new Date().toISOString().slice(0, 13)}`,
      metadata: { snapshot },
    });
  }

  console.log("Observability check completed.");
}

void main();
