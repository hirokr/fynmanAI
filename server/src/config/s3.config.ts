import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.ts';

let s3Client: S3Client | undefined;

const requireValue = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`[S3] ${name} is required`);
  }
  return value;
};

export const getS3Client = (): S3Client => {
  if (s3Client) return s3Client;

  const endpoint = requireValue(env.S3_ENDPOINT, 'S3_ENDPOINT');
  const region = requireValue(env.S3_REGION, 'S3_REGION');
  const accessKeyId = requireValue(env.S3_ACCESS_KEY_ID, 'S3_ACCESS_KEY_ID');
  const secretAccessKey = requireValue(
    env.S3_SECRET_ACCESS_KEY,
    'S3_SECRET_ACCESS_KEY'
  );
  const forcePathStyle = env.S3_FORCE_PATH_STYLE ?? true;

  s3Client = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    credentials: {
      accessKeyId,
      secretAccessKey,
      ...(env.S3_SESSION_TOKEN ? { sessionToken: env.S3_SESSION_TOKEN } : {}),
    },
  });

  return s3Client;
};

export const S3_BUCKET = env.S3_BUCKET;
