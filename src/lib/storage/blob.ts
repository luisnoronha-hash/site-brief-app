import { del, get, issueSignedToken, presignUrl, put } from "@vercel/blob";

/**
 * Vercel Blob backend.
 *
 * Everything is stored with access: "private", so objects are never reachable
 * by URL alone — the same posture as the S3 backend's private bucket. Reads and
 * browser uploads go through short-lived presigned URLs.
 */
const ACCESS = "private" as const;

/** The Blob integration injects this; its presence is what selects this backend. */
export function isConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Presigning is two calls: a delegation token scoped to one pathname and
 * operation, then a URL signed within that delegation. Scoping the token to the
 * single object means a leaked URL cannot be replayed against the whole store.
 */
async function presign(
  pathname: string,
  operation: "get" | "put",
  expiresInSeconds: number,
  contentType?: string
): Promise<string> {
  const validUntil = Date.now() + expiresInSeconds * 1000;
  const signedToken = await issueSignedToken({
    pathname,
    operations: [operation],
    validUntil,
    ...(contentType ? { allowedContentTypes: [contentType] } : {}),
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    access: ACCESS,
    pathname,
    validUntil,
    ...(operation === "put"
      ? {
          operation: "put" as const,
          // The caller already generated a unique key, so a random suffix would
          // only make the stored pathname disagree with the one in the database.
          addRandomSuffix: false,
          allowOverwrite: true,
          ...(contentType ? { allowedContentTypes: [contentType] } : {}),
        }
      : { operation: "get" as const }),
  });

  return presignedUrl;
}

export async function getUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  return presign(key, "put", expiresInSeconds, contentType);
}

/**
 * `filename` is accepted for parity with the S3 backend but not applied: Blob's
 * presigned GET has no content-disposition parameter, so a report opens in the
 * browser's viewer rather than downloading straight away.
 */
export async function getDownloadUrl(key: string, expiresInSeconds = 900, _filename?: string) {
  return presign(key, "get", expiresInSeconds);
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await put(key, body, {
    access: ACCESS,
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const result = await get(key, { access: ACCESS });
  if (!result || result.statusCode !== 200) {
    throw new Error(`Blob not found: ${key}`);
  }
  const chunks: Uint8Array[] = [];
  const reader = result.stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function deleteObject(key: string) {
  await del(key);
}
