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

  const bucketPrefix = `/api/storage/${encodeURIComponent(getPrivateUploadBucket())}/`;
  if (!trimmed.startsWith(bucketPrefix)) {
    return null;
  }

  const parsed = new URL(trimmed, "http://local.invalid");
  if (
    parsed.origin !== "http://local.invalid" ||
    parsed.search ||
    parsed.hash ||
    !parsed.pathname.startsWith(bucketPrefix)
  ) {
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

export function isValidDocumentUrl(url: string | null | undefined): boolean {
  if (!url?.trim()) {
    return false;
  }

  const trimmed = url.trim();

  // Allow internal private storage URLs
  if (getPrivateUploadObjectKey(trimmed) !== null) {
    return true;
  }

  // Allow explicit HTTPS URLs only
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function normalizeDocumentUrl(
  url: string | null | undefined,
  fieldLabel: string,
): string {
  if (!url?.trim()) {
    throw new Error(`${fieldLabel} tidak boleh kosong.`);
  }

  const trimmed = url.trim();
  if (!isValidDocumentUrl(trimmed)) {
    throw new Error(`${fieldLabel} tidak valid. Gunakan URL internal storage (/api/storage/uploads/...) atau URL HTTPS yang sah.`);
  }

  return trimmed;
}
