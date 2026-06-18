import { NextResponse, type NextRequest } from "next/server";
import { recordOperationalError, recordOperationalWarning } from "@/lib/observability";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";

export const runtime = "nodejs";

type CspViolationReport = {
  "document-uri"?: string;
  "violated-directive"?: string;
  "effective-directive"?: string;
  "original-policy"?: string;
  "blocked-uri"?: string;
  "source-file"?: string;
  "line-number"?: number;
  "column-number"?: number;
  "sample"?: string;
  "disposition"?: string;
};

type ReportUriPayload = {
  "csp-report"?: CspViolationReport;
};

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

const CSP_ERROR_DIRECTIVES = new Set([
  "script-src",
  "script-src-elem",
  "script-src-attr",
  "default-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-src",
  "frame-ancestors",
]);

function summarizeViolation(ip: string, body: unknown) {
  const directives: string[] = [];
  let sample: string | undefined;

  if (Array.isArray(body)) {
    for (const item of body) {
      if (item && typeof item === "object") {
        const r = item as CspViolationReport;
        if (r["effective-directive"]) directives.push(r["effective-directive"]);
        if (!sample && r["sample"]) sample = r["sample"];
      }
    }
  } else if (body && typeof body === "object") {
    const report = (body as ReportUriPayload)["csp-report"];
    if (report) {
      if (report["effective-directive"]) directives.push(report["effective-directive"]);
      sample = report["sample"];
    }
  }

  const fingerprint = ["csp-report", directives.sort().join(",") || "unknown", sample ?? "no-sample"]
    .join(":")
    .slice(0, 160);

  return { ip, directives, sample, fingerprint };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const policy = RATE_LIMIT_POLICIES.webVitals;
  const rateLimit = await consumeFixedWindowLimit(
    `${policy.namespace}:csp`,
    ip,
    policy.limit,
    policy.windowMs,
  );
  if (!rateLimit.allowed) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  const summary = summarizeViolation(ip, body);

  const escalated = summary.directives.some((d) => CSP_ERROR_DIRECTIVES.has(d));
  const payload = {
    source: "csp-report",
    message: escalated
      ? "CSP violation (critical directive) reported by browser"
      : "CSP violation reported by browser",
    statusCode: 200,
    metadata: {
      ip,
      directives: summary.directives,
      sample: summary.sample,
      escalated,
    },
    fingerprint: summary.fingerprint,
  };

  if (escalated) {
    await recordOperationalError(payload);
  } else {
    await recordOperationalWarning(payload);
  }

  return new NextResponse(null, { status: 204 });
}