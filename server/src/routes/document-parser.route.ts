import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { env } from '#config/env.ts';
import { sendApiError } from '#src/utils/api-response.ts';
import { resolveTempDir } from '#src/utils/file-system.ts';
import { isSupportedFile } from '#src/services/document-parser.constants.ts';
import { cleanupTempFiles } from '#src/middlewares/cleanup.middleware.ts';
import { authMiddleware } from '#src/middlewares/authenticate.middleware.ts';
import {
  parseDocumentUploadHandler,
  parserHealthHandler,
} from '#src/controllers/document-parser.controller.ts';

const router = Router();

const tempDir = resolveTempDir(
  env.UPLOAD_DIR ? path.join(env.UPLOAD_DIR, 'temp') : undefined
);
const maxFileSizeMb =
  env.DOC_PARSER_MAX_FILE_SIZE_MB || env.MAX_FILE_SIZE_MB || 25;
const maxFileSizeBytes = Math.max(1, maxFileSizeMb) * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(tempDir, { recursive: true }, err => {
      cb(err || null, tempDir);
    });
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: (req, file, cb) => {
    if (
      !isSupportedFile({ fileName: file.originalname, mimeType: file.mimetype })
    ) {
      cb(new Error('Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

const uploadSingle = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, err => {
    if (!err) {
      next();
      return;
    }

    const message =
      err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds size limit'
        : err instanceof Error
          ? err.message
          : 'Upload failed';

    sendApiError(res, {
      status: 400,
      message,
      errors: err,
    });
  });
};

router.get('/health', parserHealthHandler);

router.use(authMiddleware);

router.post(
  '/parse',
  uploadSingle,
  cleanupTempFiles,
  parseDocumentUploadHandler
);

export default router;
