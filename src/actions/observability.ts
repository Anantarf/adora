"use server";

import { requireAdmin } from "@/lib/server-auth";
import { getObservabilitySnapshot } from "@/lib/observability-snapshot";

export async function getObservabilitySnapshotAction(options?: { windowHours?: number }) {
  await requireAdmin();

  const requestedWindow = options?.windowHours ?? 24;
  const windowHours = Math.max(1, Math.min(requestedWindow, 168));

  return getObservabilitySnapshot(windowHours);
}
