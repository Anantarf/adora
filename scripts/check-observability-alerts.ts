import "dotenv/config";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";
import { dispatchOperationalAlert } from "@/lib/operational-alerts";

async function main() {
  const snapshot = await getObservabilitySnapshot(1); // last 1 hour

  // thresholds can be tuned via env
  const badWebVitalsThreshold = Number(process.env.ALERT_BAD_WEBVITALS_THRESHOLD ?? "50");
  const errorEventsThreshold = Number(process.env.ALERT_ERROR_EVENTS_THRESHOLD ?? "10");
  const warnEventsThreshold = Number(process.env.ALERT_WARN_EVENTS_THRESHOLD ?? "25");

  if (snapshot.totals.badWebVitals >= badWebVitalsThreshold) {
    await dispatchOperationalAlert({
      severity: "WARN",
      source: "observability-check",
      message: `High bad web-vitals count: ${snapshot.totals.badWebVitals} in last ${snapshot.windowHours}h`,
      fingerprint: `bad-webvitals:${new Date().toISOString().slice(0, 13)}`,
      metadata: { snapshot },
    });
  }

  if (snapshot.totals.errorEvents >= errorEventsThreshold) {
    await dispatchOperationalAlert({
      severity: "ERROR",
      source: "observability-check",
      message: `High error events: ${snapshot.totals.errorEvents} in last ${snapshot.windowHours}h`,
      fingerprint: `error-events:${new Date().toISOString().slice(0, 13)}`,
      metadata: { snapshot },
    });
  }

  if (snapshot.totals.warnEvents >= warnEventsThreshold) {
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
