import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import type { OperationalSeverity } from "@/lib/observability";

const ALERT_NAMESPACE = "operational-alerts";
const DEFAULT_ALERT_COOLDOWN_MS = 5 * 60 * 1000;
const ALERT_TIMEOUT_MS = 1_500;

const SEVERITY_RANK: Record<OperationalSeverity, number> = {
  INFO: 0,
  WARN: 1,
  ERROR: 2,
};

type OperationalAlertInput = {
  severity: OperationalSeverity;
  source: string;
  message: string;
  statusCode?: number;
  durationMs?: number;
  fingerprint?: string | null;
  metadata?: unknown;
  createdAt?: Date;
};

export type OperationalAlertConfig = {
  webhookUrl: string | null;
  minSeverity: OperationalSeverity;
  cooldownMs: number;
};

export function parseOperationalSeverity(value: string | undefined): OperationalSeverity {
  if (value === "INFO" || value === "WARN" || value === "ERROR") {
    return value;
  }

  return "ERROR";
}

export function parseAlertCooldownMs(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ALERT_COOLDOWN_MS;
  }

  return parsed;
}

export function normalizeWebhookUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).toString();
  } catch {
    return null;
  }
}

export function getOperationalAlertConfig(env: NodeJS.ProcessEnv = process.env): OperationalAlertConfig {
  return {
    webhookUrl: normalizeWebhookUrl(env.ALERT_WEBHOOK_URL),
    minSeverity: parseOperationalSeverity(env.ALERT_MIN_SEVERITY),
    cooldownMs: parseAlertCooldownMs(env.ALERT_COOLDOWN_MS),
  };
}

export function shouldDispatchOperationalAlert(
  severity: OperationalSeverity,
  minSeverity: OperationalSeverity,
): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[minSeverity];
}

function buildAlertKey(input: OperationalAlertInput) {
  return `${input.severity}:${input.fingerprint ?? `${input.source}:${input.message}:${input.statusCode ?? "none"}`}`;
}

function buildAlertPayload(input: OperationalAlertInput) {
  return {
    app: "ADORA BBC",
    env: process.env.NODE_ENV ?? "unknown",
    occurredAt: (input.createdAt ?? new Date()).toISOString(),
    severity: input.severity,
    source: input.source,
    message: input.message,
    statusCode: input.statusCode ?? null,
    durationMs: input.durationMs ?? null,
    fingerprint: input.fingerprint ?? null,
    metadata: input.metadata ?? null,
    appUrl: process.env.NEXTAUTH_URL ?? process.env.SMOKE_BASE_URL ?? null,
  };
}

export async function dispatchOperationalAlert(input: OperationalAlertInput) {
  const config = getOperationalAlertConfig();

  if (!config.webhookUrl || !shouldDispatchOperationalAlert(input.severity, config.minSeverity)) {
    return false;
  }

  try {
    const alertKey = buildAlertKey(input);
    const alertWindow = await consumeFixedWindowLimit(ALERT_NAMESPACE, alertKey, 1, config.cooldownMs);
    if (!alertWindow.allowed) {
      return false;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ALERT_TIMEOUT_MS);

    try {
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(buildAlertPayload(input)),
        signal: controller.signal,
      });

      if (!response.ok) {
        console.error("[OBSERVABILITY_ALERT_ERROR]", {
          status: response.status,
          source: input.source,
          message: input.message,
        });
        return false;
      }

      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("[OBSERVABILITY_ALERT_ERROR]", {
      source: input.source,
      message: input.message,
      error,
    });
    return false;
  }
}
