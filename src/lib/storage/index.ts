import { randomUUID } from "crypto";
import * as blob from "@/lib/storage/blob";
import * as s3 from "@/lib/storage/s3";

/**
 * Object storage, over whichever backend the deployment has.
 *
 * Vercel Blob wins when its token is present because that integration injects
 * BLOB_READ_WRITE_TOKEN on its own — if someone attached a Blob store, that is
 * the one they meant. S3 (or any S3-compatible service, R2 and B2 included)
 * stays supported for deployments that configure it explicitly.
 *
 * Both store objects privately and hand out short-lived presigned URLs, so the
 * choice of backend does not change who can reach a report.
 */
const backend = blob.isConfigured() ? blob : s3.isConfigured() ? s3 : null;

/** Which backend is active, for logs and diagnostics. Never a credential. */
export function storageBackendName(): "vercel-blob" | "s3" | null {
  if (backend === blob) return "vercel-blob";
  if (backend === s3) return "s3";
  return null;
}

/**
 * Whether uploads can work at all. Callers check this and say so, rather than
 * letting an SDK fail and surfacing as "please try again" on something that
 * retrying will never fix.
 */
export function isStorageConfigured(): boolean {
  return backend !== null;
}

function require_(): typeof blob | typeof s3 {
  if (!backend) {
    throw new Error(
      "No object storage is configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) " +
        "or S3_BUCKET with S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY."
    );
  }
  return backend;
}

/** Unique, path-safe key. Backend-agnostic: both treat it as an opaque path. */
export function buildObjectKey(prefix: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${randomUUID()}-${safeName}`;
}

export function getUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  return require_().getUploadUrl(key, contentType, expiresInSeconds);
}

export function getDownloadUrl(key: string, expiresInSeconds = 900, filename?: string) {
  return require_().getDownloadUrl(key, expiresInSeconds, filename);
}

export function putObject(key: string, body: Buffer, contentType: string) {
  return require_().putObject(key, body, contentType);
}

export function getObjectBuffer(key: string): Promise<Buffer> {
  return require_().getObjectBuffer(key);
}

export function deleteObject(key: string) {
  return require_().deleteObject(key);
}
