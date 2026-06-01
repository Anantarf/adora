import { prisma } from "@/lib/prisma";
import { recordOperationalError } from "@/lib/observability";
import { getCachedObservabilitySnapshot } from "@/lib/observability-snapshot";
import { buildHealthErrorResponse, buildHealthOkResponse, requireHealthCheckToken } from "../_shared";

export async function GET(req: Request) {
  const unauthorizedResponse = requireHealthCheckToken(req, "observability");
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const summary = await getCachedObservabilitySnapshot(24);

    return buildHealthOkResponse("observability", {
      summary,
    });
  } catch (error) {
    await recordOperationalError({
      source: "health-observability",
      message: "Observability health check failed",
      error,
      statusCode: 503,
    });

    return buildHealthErrorResponse("observability");
  }
}
