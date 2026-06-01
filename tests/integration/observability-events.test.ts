import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { DeepMockProxy } from "vitest-mock-extended";
import { prisma as originalPrisma } from "@/lib/prisma";
import { recordOperationalEvent } from "@/lib/observability";
import { dispatchOperationalAlert } from "@/lib/operational-alerts";

vi.mock("@/lib/operational-alerts", () => ({
  dispatchOperationalAlert: vi.fn(),
}));

const prisma = originalPrisma as unknown as DeepMockProxy<PrismaClient>;
const dispatchOperationalAlertMock = vi.mocked(dispatchOperationalAlert);

describe("Operational event persistence", () => {
  beforeEach(() => {
    dispatchOperationalAlertMock.mockReset();
    prisma.operationalEvent.create.mockReset();
  });

  test("tidak menunggu alert webhook untuk menyelesaikan request utama", async () => {
    prisma.operationalEvent.create.mockResolvedValue({
      id: "evt-1",
      severity: "ERROR",
      source: "upload-api",
      message: "Upload failed",
      statusCode: 500,
      durationMs: null,
      fingerprint: "upload-api:Upload failed:500",
      metadata: null,
      createdAt: new Date("2026-06-02T00:00:00.000Z"),
      updatedAt: new Date("2026-06-02T00:00:00.000Z"),
    } as never);

    let resolveAlert: ((value: boolean) => void) | undefined;
    dispatchOperationalAlertMock.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolveAlert = resolve;
      }),
    );

    const result = await Promise.race([
      recordOperationalEvent({
        severity: "ERROR",
        source: "upload-api",
        message: "Upload failed",
        statusCode: 500,
      }).then(() => "resolved"),
      new Promise<string>((resolve) => setTimeout(() => resolve("timeout"), 25)),
    ]);

    expect(result).toBe("resolved");
    await Promise.resolve();
    expect(dispatchOperationalAlertMock).toHaveBeenCalledTimes(1);

    resolveAlert?.(true);
  });
});
