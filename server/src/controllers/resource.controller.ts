import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  createResource,
  getResourceById,
} from '#src/services/resource.service.ts';
import { ingestResourceText } from '#src/services/resource-ingest.service.ts';

export const createResourceHandler = async (
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

    const {
      title,
      sourceType,
      text,
      mimeType,
      sourceUrl,
      storageKey,
      subject,
      topic,
      metadata,
    } = req.body as {
      title: string;
      sourceType: 'TEXT' | 'UPLOAD' | 'URL';
      text?: string;
      mimeType?: string;
      sourceUrl?: string;
      storageKey?: string;
      subject?: string;
      topic?: string;
      metadata?: Record<string, unknown> | null;
    };

    const resource = await createResource({
      userId: req.userId,
      title,
      sourceType,
      mimeType,
      sourceUrl,
      storageKey,
      subject,
      topic,
      metadata: metadata || undefined,
    });

    if (sourceType === 'TEXT') {
      const ingest = await ingestResourceText({
        resourceId: resource.id,
        text: text || '',
        subject,
        topic,
      });

      return sendApiSuccess(res, {
        status: 201,
        message: 'Resource ingested',
        data: { resource, ingest },
      });
    }

    return sendApiSuccess(res, {
      status: 202,
      message: 'Resource created. Ingestion pending.',
      data: { resource },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to create resource',
      errors: error instanceof Error ? error.message : error,
    });
  }
};

export const getResourceHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { resourceId } = req.params as { resourceId: string };
    const resource = await getResourceById(resourceId);

    if (!resource || resource.userId !== req.userId) {
      return sendApiError(res, {
        status: 404,
        message: 'Resource not found',
      });
    }

    return sendApiSuccess(res, { data: { resource } });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch resource',
    });
  }
};
