import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { getPrivateUploadBucket } from "@/lib/supabase-storage";
import { authorizePrivateStorageAccess } from "@/lib/storage-acl";
import { consumeFixedWindowLimit } from "@/lib/shared-rate-limit";
import { RATE_LIMIT_POLICIES } from "@/lib/constants/rate-limits";
import { getClientIp } from "@/lib/client-ip";

const SIGNED_URL_TTL_SECONDS = 60;
const SIGNED_URL_CACHE_TTL_MS = 30_000;

type CachedSignedUrl = {
  expiresAt: number;
  url: string;
};

// Best-effort micro-cache for short bursts on a single instance.
// Correctness must never depend on this because Vercel instances are ephemeral.
const signedUrlCache = new Map<string, CachedSignedUrl>();

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("STORAGE_PROXY_NOT_CONFIGURED");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildInternalFileUrl(bucket: string, objectPath: string[]) {
  const encodedPath = objectPath.map((segment) => segment.split("/").filter(Boolean).map(encodeURIComponent).join("/")).join("/");

  return `/api/storage/${encodeURIComponent(bucket)}/${encodedPath}`;
}

function getSignedUrlCacheKey(bucket: string, objectKey: string) {
  return `${bucket}:${objectKey}`;
}

function getCachedSignedUrl(bucket: string, objectKey: string) {
  const cached = signedUrlCache.get(getSignedUrlCacheKey(bucket, objectKey));
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    signedUrlCache.delete(getSignedUrlCacheKey(bucket, objectKey));
    return null;
  }

  return cached.url;
}

function setCachedSignedUrl(bucket: string, objectKey: string, url: string) {
  signedUrlCache.set(getSignedUrlCacheKey(bucket, objectKey), {
    expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS,
    url,
  });
}

function buildSignedUrlRedirect(url: string, cacheStatus: "HIT" | "MISS") {
  return NextResponse.redirect(url, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
      "X-Storage-Proxy-Cache": cacheStatus,
    },
  });
}

export async function GET(req: Request, context: { params: Promise<{ bucket: string; objectPath: string[] }> }) {
  const ip = getClientIp(req);
  const proxyPolicy = RATE_LIMIT_POLICIES.storageProxy;
  const proxyLimit = await consumeFixedWindowLimit(
    proxyPolicy.namespace,
    ip,
    proxyPolicy.limit,
    proxyPolicy.windowMs,
  );
  if (!proxyLimit.allowed) {
    return apiError("RATE_LIMITED", "Terlalu banyak permintaan. Coba lagi nanti.", 429);
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHORIZED", "Tidak diizinkan.", 401);
  }

  try {
    const params = await context.params;
    if (decodePathSegment(params.bucket) !== getPrivateUploadBucket()) {
      return apiError("BAD_REQUEST", "Bucket tidak didukung.", 400);
    }

    const objectKey = params.objectPath.map(decodePathSegment).join("/");
    if (!objectKey) {
      return apiError("NOT_FOUND", "File tidak ditemukan.", 404);
    }

    const fileUrl = buildInternalFileUrl(params.bucket, params.objectPath);
    if (session.user.role !== "ADMIN") {
      const decision = await authorizePrivateStorageAccess({
        role: session.user.role,
        userId: session.user.id,
        fileUrl,
        lookup: {
          findCoachAsset: (value) =>
            prisma.coachProfile.findFirst({
              where: {
                OR: [{ licenseUrl: value }, { photoUrl: value }, { signatureUrl: value }],
                isDeleted: false,
              },
              select: {
                id: true,
                userId: true,
                licenseUrl: true,
              },
            }).then((profile) =>
              profile
                ? {
                    id: profile.id,
                    userId: profile.userId,
                    isLicense: profile.licenseUrl === value,
                  }
                : null,
            ),
          findPlayerAsset: (value) =>
            prisma.player.findFirst({
              where: {
                OR: [{ photoUrl: value }, { signatureUrl: value }],
                isDeleted: false,
              },
              select: { id: true },
            }),
          findCertificate: (value) =>
            prisma.certificate.findFirst({
              where: { fileUrl: value },
              select: { id: true, playerId: true },
            }),
          findReportArchive: (value) =>
            prisma.reportArchive.findFirst({
              where: { fileUrl: value },
              select: { id: true, playerId: true },
            }),
          isCoachVisibleToParent: async (coachProfileId, parentId) => {
            const player = await prisma.player.findFirst({
              where: {
                parentId,
                isDeleted: false,
                group: {
                  coachAssignment: {
                    coachProfileId,
                  },
                },
              },
              select: { id: true },
            });

            return Boolean(player);
          },
          isPlayerOwnedByParent: async (playerId, parentId) => {
            const player = await prisma.player.findFirst({
              where: {
                id: playerId,
                parentId,
                isDeleted: false,
              },
              select: { id: true },
            });

            return Boolean(player);
          },
        },
      });

      if (!decision.allowed) {
        return NextResponse.json({ error: decision.message }, { status: decision.statusCode });
      }
    }

    const cachedUrl = getCachedSignedUrl(getPrivateUploadBucket(), objectKey);
    if (cachedUrl) {
      return buildSignedUrlRedirect(cachedUrl, "HIT");
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage.from(getPrivateUploadBucket()).createSignedUrl(objectKey, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      return apiError("NOT_FOUND", "File tidak tersedia.", 404);
    }

    setCachedSignedUrl(getPrivateUploadBucket(), objectKey, data.signedUrl);
    return buildSignedUrlRedirect(data.signedUrl, "MISS");
  } catch (error) {
    if (error instanceof Error && error.message === "STORAGE_PROXY_NOT_CONFIGURED") {
      return apiError("SERVICE_UNAVAILABLE", "Storage proxy belum dikonfigurasi.", 503);
    }

    return apiError("INTERNAL_ERROR", "Gagal membuka file.", 500);
  }
}

