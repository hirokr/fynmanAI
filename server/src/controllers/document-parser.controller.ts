import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import logger from '#config/logger.ts';
import {
  DocumentParserError,
  documentParserService,
} from '#src/services/document-parser.service.ts';
import {
  createResource,
  getResourceById,
} from '#src/services/resource.service.ts';
import { ingestResourceText } from '#src/services/resource-ingest.service.ts';

export const parseDocumentUploadHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const file = req.file;
    if (!file) {
      return sendApiError(res, {
        status: 400,
        message: 'Upload a document file to parse',
      });
    }

    if (!req.tempFiles) {
      req.tempFiles = [];
    }
    req.tempFiles.push(file.path);

    const subject =
      typeof req.body?.subject === 'string' ? req.body.subject : undefined;
    const topic =
      typeof req.body?.topic === 'string' ? req.body.topic : undefined;
    const title =
      typeof req.body?.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : file.originalname;

    const parsed = await documentParserService.parseDocument({
      filePath: file.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      allowedDir: file.destination,
    });

    const resource = await createResource({
      userId: req.userId,
      title,
      sourceType: 'UPLOAD',
      mimeType: file.mimetype,
      subject,
      topic,
      metadata: {
        parser: parsed.metadata,
        fileName: file.originalname,
        fileSize: file.size,
      },
    });

    let ingest: { chunkCount: number } | null = null;
    let ingestError: string | undefined;

    try {
      ingest = await ingestResourceText({
        resourceId: resource.id,
        text: parsed.text,
        subject,
        topic,
      });
    } catch (error) {
      ingestError =
        error instanceof Error ? error.message : 'Failed to ingest document';

      logger.error('Document parsed but ingestion failed', {
        resourceId: resource.id,
        error: ingestError,
      });
    }

    const latestResource = await getResourceById(resource.id);
    const resourceWithParsedText = {
      ...(latestResource || resource),
      parsedText: latestResource?.parsedText || parsed.text,
    };

    return sendApiSuccess(res, {
      status: ingest ? 201 : 202,
      message: ingest
        ? 'Document parsed and ingested'
        : 'Document parsed, but ingestion failed',
      data: {
        resource: resourceWithParsedText,
        parsedText: parsed.text,
        ingest,
        ingestError,
        parser: {
          metadata: parsed.metadata,
        },
      },
    });
  } catch (error) {
    if (error instanceof DocumentParserError) {
      logger.warn('Document parser error', {
        code: error.code,
        details: error.details,
      });

      return sendApiError(res, {
        status: error.status,
        message: error.message,
        errors: error.details,
      });
    }

    logger.error('Failed to parse document', {
      error: error instanceof Error ? error.message : error,
    });

    return sendApiError(res, {
      status: 500,
      message: 'Failed to parse document',
    });
  }
};

export const parserHealthHandler = async (req: AuthRequest, res: Response) => {
  try {
    const health = await documentParserService.checkHealth();
    if (!health.available) {
      return sendApiError(res, {
        status: 503,
        message: 'Document parser is unavailable',
        errors: health.details,
      });
    }

    return sendApiSuccess(res, {
      data: {
        health,
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to check parser health',
    });
  }
};
