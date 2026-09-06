import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = process.env.S3_BUCKET ?? "";

/** Whether this backend has a bucket and credentials to work with. */
export function isConfigured(): boolean {
  return Boolean(bucket && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export const s3Client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: Boolean(process.env.S3_ENDPOINT),
  credentials: process.env.S3_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      }
    : undefined,
});

/** Signed PUT URL so the browser uploads directly to the bucket; the raw key never reaches the client except as this one-time URL. */
export async function getUploadUrl(key: string, contentType: string, expiresInSeconds = 300) {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function getDownloadUrl(key: string, expiresInSeconds = 900, filename?: string) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: filename ? `attachment; filename="${filename}"` : undefined,
  });
  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await s3Client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  );
  return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const result = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stream = result.Body as unknown as AsyncIterable<Uint8Array>;
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteObject(key: string) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
