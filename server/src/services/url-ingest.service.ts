import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import fetch, { type Response as FetchResponse } from 'node-fetch';
import { env } from '#config/env.ts';
import logger from '#config/logger.ts';
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

const fetchWithTimeout = async (url: string) => {
  const controller = new AbortController();
  const timeoutMs = env.URL_FETCH_TIMEOUT_MS || DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'FeynmanAI/1.0 (+https://example.com)',
      },
    });
  } finally {
    clearTimeout(timeoutId);
  }
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

  try {
    const resource = await getResourceById(params.resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

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

    return ingest;
  } catch (error) {
    await updateResourceStatus(params.resourceId, 'FAILED');
    logger.error('[URL Ingest] Failed to ingest URL', {
      resourceId: params.resourceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};
