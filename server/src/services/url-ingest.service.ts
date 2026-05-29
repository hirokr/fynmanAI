import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fetch, { type Response as FetchResponse } from 'node-fetch';
import { env } from '#config/env.ts';
import logger from '#config/logger.ts';
import { trackAnalyticsEvent } from '#src/services/analytics.service.ts';
import {
  resolveTempDir,
  ensureDirectory,
  deleteFileIfExists,
} from '#src/utils/file-system.ts';
import {
  DocumentParserError,
  documentParserService,
} from '#src/services/document-parser.service.ts';
import {
  getResourceById,
  updateResourceFields,
  updateResourceStatus,
} from '#src/services/resource.service.ts';
import { ingestResourceText } from '#src/services/resource-ingest.service.ts';
import {
  buildResourceStorageKey,
  uploadBufferToS3,
} from '#src/services/storage.service.ts';
import { normalizeWhitespace } from '#src/transcript/utils/text.ts';
import { isSupportedFile } from '#src/services/document-parser.constants.ts';

const DEFAULT_MAX_URL_MB = 10;
const DEFAULT_TIMEOUT_MS = 15_000;

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^0\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^::1$/,
  /^::$/,
  /^fe80:/i,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
];

const normalizeAddress = (address: string): string[] => {
  const ipv4Mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  return ipv4Mapped ? [address, ipv4Mapped[1]] : [address];
};

const isPrivateAddress = (address: string): boolean =>
  normalizeAddress(address).some(a =>
    PRIVATE_IP_PATTERNS.some(re => re.test(a))
  );

const validateUrlSafety = async (urlString: string): Promise<void> => {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS URLs are supported');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (['localhost', '0.0.0.0', '::1'].includes(hostname)) {
    throw new Error('URL points to a blocked host');
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const { address } of addresses) {
      if (isPrivateAddress(address)) {
        throw new Error(
          `URL resolves to a blocked private address: ${address}`
        );
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('blocked')) {
      throw err;
    }
  }
};

const decodeEntities = (text: string): string =>
  text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

const stripHtml = (html: string): string => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ');
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, ' ');
  return normalizeWhitespace(decodeEntities(withoutTags));
};

const getFileNameFromUrl = (sourceUrl: string): string => {
  try {
    const url = new URL(sourceUrl);
    const name = path.basename(url.pathname || '').trim();
    return name || `resource-${crypto.randomUUID()}`;
  } catch {
    return `resource-${crypto.randomUUID()}`;
  }
};

const getMaxBytes = (): number =>
  Math.max(1, env.URL_MAX_FILE_SIZE_MB || DEFAULT_MAX_URL_MB) * 1024 * 1024;

const MAX_REDIRECTS = 5;

const fetchWithTimeout = async (url: string): Promise<FetchResponse> => {
  let currentUrl = url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timeoutMs = env.URL_FETCH_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let response: FetchResponse;
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'FeynmanAI/1.0 (+https://example.com)' },
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    try {
      currentUrl = new URL(location, currentUrl).toString();
    } catch {
      throw new Error('Invalid redirect location');
    }

    await validateUrlSafety(currentUrl);
  }

  throw new Error('Too many redirects');
};

const readBufferWithLimit = async (
  response: FetchResponse
): Promise<Buffer> => {
  const contentLength = response.headers.get('content-length');
  const maxBytes = getMaxBytes();

  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error('URL payload exceeds size limit');
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > maxBytes) {
    throw new Error('URL payload exceeds size limit');
  }

  return Buffer.from(arrayBuffer);
};

const shouldUseStorage = (): boolean =>
  Boolean(env.S3_BUCKET && (env.STORAGE_PROVIDER || 's3') === 's3');

const persistToStorage = async (params: {
  userId: string;
  resourceId: string;
  fileName: string;
  buffer: Buffer;
  contentType?: string | null;
}): Promise<string | null> => {
  if (!shouldUseStorage()) {
    return null;
  }

  const key = buildResourceStorageKey(
    params.userId,
    params.resourceId,
    params.fileName
  );
  await uploadBufferToS3({
    key,
    body: params.buffer,
    contentType: params.contentType || undefined,
  });
  return key;
};

const parseDocumentBuffer = async (params: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string | null;
}): Promise<string> => {
  const tempDir = resolveTempDir(
    env.UPLOAD_DIR ? path.join(env.UPLOAD_DIR, 'temp') : undefined
  );
  await ensureDirectory(tempDir);
  const tempPath = path.join(
    tempDir,
    `${crypto.randomUUID()}-${params.fileName}`
  );

  await fs.writeFile(tempPath, params.buffer);
  try {
    const parsed = await documentParserService.parseDocument({
      filePath: tempPath,
      originalName: params.fileName,
      mimeType: params.mimeType || undefined,
      fileSizeBytes: params.buffer.byteLength,
      allowedDir: tempDir,
    });
    return parsed.text;
  } finally {
    await deleteFileIfExists(tempPath);
  }
};

export const ingestResourceFromUrl = async (params: {
  resourceId: string;
  sourceUrl: string;
}): Promise<{ chunkCount: number }> => {
  await updateResourceStatus(params.resourceId, 'PROCESSING');

  let resource: Awaited<ReturnType<typeof getResourceById>> | undefined;

  try {
    resource = await getResourceById(params.resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    await trackAnalyticsEvent({
      event: 'resource.ingestion.started',
      userId: resource.userId,
      payload: { resourceId: params.resourceId, sourceType: 'URL' },
    });

    await validateUrlSafety(params.sourceUrl);

    const response = await fetchWithTimeout(params.sourceUrl);
    if (!response.ok) {
      throw new Error(`URL fetch failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    const buffer = await readBufferWithLimit(response);
    const fileName = getFileNameFromUrl(params.sourceUrl);

    const storageKey = await persistToStorage({
      userId: resource.userId,
      resourceId: params.resourceId,
      fileName,
      buffer,
      contentType,
    });

    await updateResourceFields({
      resourceId: params.resourceId,
      storageKey: storageKey || resource.storageKey || null,
      filePath: storageKey || resource.filePath || null,
    });

    let text: string;
    const mimeType = contentType?.split(';')[0]?.trim();

    if (mimeType?.startsWith('text/html')) {
      text = stripHtml(buffer.toString('utf-8'));
    } else if (mimeType?.startsWith('text/')) {
      text = normalizeWhitespace(buffer.toString('utf-8'));
    } else {
      const extension = path.extname(fileName || '').replace('.', '');
      const shouldParse = isSupportedFile({
        fileName,
        mimeType: mimeType || undefined,
      });

      if (!shouldParse) {
        throw new DocumentParserError({
          code: 'INVALID_FILE_TYPE',
          message: 'Unsupported URL file type',
          status: 400,
        });
      }

      text = await parseDocumentBuffer({
        buffer,
        fileName: fileName || `resource-${crypto.randomUUID()}`,
        mimeType,
      });
    }

    const ingest = await ingestResourceText({
      resourceId: params.resourceId,
      text,
      subject: resource.subject || undefined,
      topic: resource.topic || undefined,
    });

    await trackAnalyticsEvent({
      event: 'resource.ingestion.completed',
      userId: resource.userId,
      payload: {
        resourceId: params.resourceId,
        sourceType: 'URL',
        chunkCount: ingest.chunkCount,
      },
    });

    return ingest;
  } catch (error) {
    await updateResourceStatus(params.resourceId, 'FAILED');

    await trackAnalyticsEvent({
      event: 'resource.ingestion.failed',
      userId: resource?.userId,
      payload: {
        resourceId: params.resourceId,
        sourceType: 'URL',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    logger.error('[URL Ingest] Failed to ingest URL', {
      resourceId: params.resourceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
