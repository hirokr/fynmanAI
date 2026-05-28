import { NextFunction, Request, Response } from 'express';
import { deleteFiles } from '#src/utils/file-system.ts';
import logger from '#config/logger.ts';

export const cleanupTempFiles = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.tempFiles) {
    req.tempFiles = [];
  }

  const cleanup = async () => {
    if (!req.tempFiles?.length) {
      return;
    }

    const files = [...req.tempFiles];
    req.tempFiles = [];

    try {
      await deleteFiles(files);
      logger.info('Temporary files cleaned', { count: files.length });
    } catch (error) {
      logger.warn('Failed to clean temporary files', {
        count: files.length,
        error: error instanceof Error ? error.message : error,
      });
    }
  };

  res.on('finish', () => {
    void cleanup();
  });

  res.on('close', () => {
    void cleanup();
  });

  next();
};
