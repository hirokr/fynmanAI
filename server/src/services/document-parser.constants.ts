import path from 'node:path';

export const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
]);

export const SUPPORTED_EXTENSIONS = new Set([
  'pdf',
  'docx',
  'pptx',
  'txt',
  'md',
  'markdown',
  'png',
  'jpg',
  'jpeg',
]);

export const OCR_CAPABLE_EXTENSIONS = new Set(['pdf', 'docx', 'pptx']);

export const normalizeExtension = (fileName: string): string =>
  path
    .extname(fileName || '')
    .replace('.', '')
    .toLowerCase();

export const isSupportedFile = (params: {
  fileName: string;
  mimeType?: string;
}): boolean => {
  const extension = normalizeExtension(params.fileName);
  const mimeType = params.mimeType?.toLowerCase();

  if (extension && SUPPORTED_EXTENSIONS.has(extension)) {
    return true;
  }

  if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return false;
};
