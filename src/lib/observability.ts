import { Prisma, operational_severity } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchOperationalAlert } from "@/lib/operational-alerts";

const MAX_SOURCE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 255;
const MAX_FINGERPRINT_LENGTH = 160;

export type OperationalSeverity = keyof typeof operational_severity;

type RecordOperationalEventInput = {
  severity: OperationalSeverity;
  source: string;
  message: string;
  statusCode?: number;
  durationMs?: number;
  fingerprint?: string;
  metadata?: Prisma.InputJsonValue;
};

type RecordOperationalErrorInput = Omit<RecordOperationalEventInput, "severity"> & {
  error?: unknown;
};

function clampText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function sanitizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    message: typeof error === "string" ? error : "Unknown error",
  };
}

function buildFingerprint(source: string, message: string, statusCode?: number) {
  return clampText(`${source}:${message}:${statusCode ?? "none"}`, MAX_FINGERPRINT_LENGTH);
}

function dispatchOperationalAlertInBackground(input: Parameters<typeof dispatchOperationalAlert>[0]) {
  void Promise.resolve()
    .then(() => dispatchOperationalAlert(input))
    .catch((error) => {
      console.error("[OBSERVABILITY_ALERT_DISPATCH_ERROR]", {
        source: input.source,
        message: input.message,
        error,
      });
    });
}

export async function recordOperationalEvent(input: RecordOperationalEventInput) {
  try {
    const event = await prisma.operationalEvent.create({
      data: {
        severity: input.severity,
        source: clampText(input.source, MAX_SOURCE_LENGTH),
        message: clampText(input.message, MAX_MESSAGE_LENGTH),
        statusCode: input.statusCode,
        durationMs: input.durationMs,
        fingerprint: clampText(
          input.fingerprint || buildFingerprint(input.source, input.message, input.statusCode),
          MAX_FINGERPRINT_LENGTH,
        ),
        metadata: input.metadata ?? Prisma.JsonNull,
      },
    });

    dispatchOperationalAlertInBackground({
      severity: event.severity,
      source: event.source,
      message: event.message,
      statusCode: event.statusCode ?? undefined,
      durationMs: event.durationMs ?? undefined,
      fingerprint: event.fingerprint,
      metadata: event.metadata,
      createdAt: event.createdAt,
    });
  } catch (persistError) {
    console.error("[OBSERVABILITY_PERSIST_ERROR]", {
      source: input.source,
      message: input.message,
      persistError,
    });
  }
}

export function recordOperationalWarning(input: Omit<RecordOperationalEventInput, "severity">) {
  return recordOperationalEvent({
    ...input,
    severity: "WARN",
  });
}

export function recordOperationalInfo(input: Omit<RecordOperationalEventInput, "severity">) {
  return recordOperationalEvent({
    ...input,
    severity: "INFO",
  });
}

export function recordOperationalError(input: RecordOperationalErrorInput) {
  const errorDetails = input.error ? sanitizeError(input.error) : null;
  const metadata =
    errorDetails == null
      ? input.metadata
      : {
          ...(typeof input.metadata === "object" && input.metadata && !Array.isArray(input.metadata)
            ? input.metadata
            : {}),
          error: errorDetails,
        };

  return recordOperationalEvent({
    ...input,
    severity: "ERROR",
    metadata,
  });
}

export function getObservationWindowStart(windowHours: number) {
  return new Date(Date.now() - windowHours * 60 * 60 * 1000);
}
