import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '#config/env.ts';
import { getS3Client, S3_BUCKET } from '#config/s3.config.ts';

const sanitizeFileName = (name: string): string =>
  name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');

const requireBucket = (): string => {
  if (!S3_BUCKET) {
    throw new Error('[S3] S3_BUCKET is required');
  }
  return S3_BUCKET;
};

export const buildResourceStorageKey = (
  userId: string,
  resourceId: string,
  fileName: string
): string => {
  const safeName = sanitizeFileName(fileName || 'resource');
  return `resources/${userId}/${resourceId}/${safeName}`;
};

export const uploadBufferToS3 = async (params: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<{ key: string; bucket: string }> => {
  const bucket = requireBucket();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );

  return { key: params.key, bucket };
};

export const getResourcePublicUrl = (key: string): string | null => {
  if (!env.S3_ENDPOINT) {
    return null;
  }

  try {
    const base = new URL(env.S3_ENDPOINT);
    const bucket = requireBucket();
    const normalizedPath = `${bucket}/${key}`.replace(/\/+/g, '/');
    return new URL(normalizedPath, base).toString();
  } catch {
    return null;
  }
};
