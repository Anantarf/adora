import { prisma } from "@/lib/prisma";
import { recordOperationalError } from "@/lib/observability";
import { buildHealthErrorResponse, buildHealthOkResponse, requireHealthCheckToken } from "../_shared";

export async function GET(req: Request) {
  const unauthorizedResponse = requireHealthCheckToken(req, "db");
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return buildHealthOkResponse("db");
  } catch (error) {
    await recordOperationalError({
      source: "health-db",
      message: "Database health check failed",
      error,
      statusCode: 503,
    });
    return buildHealthErrorResponse("db");
  }
}
