const PRIVATE_UPLOAD_BUCKET = "uploads";

export function buildPrivateStorageUrl(objectKey: string, bucket = PRIVATE_UPLOAD_BUCKET) {
  const encodedPath = objectKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `/api/storage/${encodeURIComponent(bucket)}/${encodedPath}`;
}

export function getPrivateUploadBucket() {
  return PRIVATE_UPLOAD_BUCKET;
}
