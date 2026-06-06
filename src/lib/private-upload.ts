import { getPrivateUploadBucket } from "@/lib/supabase-storage";

type UploadUrlExpectation = {
  allowedExtensions: string[];
  allowedPrefixes: string[];
};

function decodePathSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getPrivateUploadObjectKey(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new URL(trimmed, "http://local.invalid");
  const bucketPrefix = `/api/storage/${encodeURIComponent(getPrivateUploadBucket())}/`;
  if (!parsed.pathname.startsWith(bucketPrefix)) {
    return null;
  }

  const encodedPath = parsed.pathname.slice(bucketPrefix.length);
  if (!encodedPath) {
    return null;
  }

  return encodedPath
    .split("/")
    .filter(Boolean)
    .map(decodePathSegment)
    .join("/");
}

export function isExpectedPrivateUploadUrl(
  url: string | null | undefined,
  expectation: UploadUrlExpectation,
) {
  if (!url?.trim()) {
    return false;
  }

  const objectKey = getPrivateUploadObjectKey(url);
  if (!objectKey) {
    return false;
  }

  const extension = objectKey.slice(objectKey.lastIndexOf(".")).toLowerCase();
  if (!expectation.allowedExtensions.includes(extension)) {
    return false;
  }

  return expectation.allowedPrefixes.some((prefix) => objectKey.startsWith(prefix));
}

export function normalizeExpectedPrivateUploadUrl(
  url: string | null | undefined,
  expectation: UploadUrlExpectation,
  fieldLabel: string,
) {
  if (!url?.trim()) {
    return null;
  }

  const trimmed = url.trim();
  if (!isExpectedPrivateUploadUrl(trimmed, expectation)) {
    throw new Error(`${fieldLabel} tidak valid atau tidak berasal dari unggahan privat yang diizinkan.`);
  }

  return trimmed;
}
