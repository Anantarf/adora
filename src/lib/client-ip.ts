import type { NextRequest } from "next/server";

type HeaderMap = Record<string, string | string[] | undefined>;

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getClientIpFromValues(values: {
  runtimeIp?: string;
  vercelForwardedFor?: string | null;
  cfConnectingIp?: string | null;
  realIp?: string | null;
  forwardedFor?: string | null;
}) {
  if (values.runtimeIp?.trim()) {
    return values.runtimeIp.trim();
  }

  const vercelIp = values.vercelForwardedFor?.trim();
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) return first;
  }

  const cfIp = values.cfConnectingIp?.trim();
  if (cfIp) return cfIp;

  const realIp = values.realIp?.trim();
  if (realIp) return realIp;

  const forwarded = values.forwardedFor;
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      // In reverse proxy environments that append headers, the rightmost IP
      // appended by the trusted proxy layer is the client IP.
      return ips[ips.length - 1];
    }
  }

  return "127.0.0.1";
}

/**
 * Extracts a client IP address safely from requests or headers,
 * prioritizing trusted proxy/platform headers to prevent header spoofing.
 */
export function getClientIp(req: NextRequest | Request | Headers): string {
  let headers: Headers;
  let reqIp: string | undefined;

  if ("headers" in req && typeof req.headers.get === "function") {
    headers = req.headers;
    const maybeIp = (req as { ip?: string }).ip;
    if (typeof maybeIp === "string" && maybeIp.trim()) {
      reqIp = maybeIp.trim();
    }
  } else {
    headers = req as Headers;
  }

  return getClientIpFromValues({
    runtimeIp: reqIp,
    vercelForwardedFor: headers.get("x-vercel-forwarded-for"),
    cfConnectingIp: headers.get("cf-connecting-ip"),
    realIp: headers.get("x-real-ip"),
    forwardedFor: headers.get("x-forwarded-for"),
  });
}

export function getClientIpFromHeaderMap(headers: HeaderMap | undefined): string {
  if (!headers) {
    return "127.0.0.1";
  }

  return getClientIpFromValues({
    vercelForwardedFor: firstHeaderValue(headers["x-vercel-forwarded-for"]),
    cfConnectingIp: firstHeaderValue(headers["cf-connecting-ip"]),
    realIp: firstHeaderValue(headers["x-real-ip"]),
    forwardedFor: firstHeaderValue(headers["x-forwarded-for"]),
  });
}