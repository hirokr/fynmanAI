import fs from 'node:fs/promises';
import path from 'node:path';

export const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const isPathInside = (baseDir: string, targetPath: string): boolean => {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(targetPath);
  const relative = path.relative(resolvedBase, resolvedTarget);
  return !relative.startsWith('..') && !path.isAbsolute(relative);
};

export const deleteFileIfExists = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
};

export const deleteFiles = async (filePaths: string[]): Promise<void> => {
  await Promise.all(
    filePaths.map(async filePath => {
      try {
        await deleteFileIfExists(filePath);
      } catch {
        // Best-effort cleanup to avoid blocking responses.
      }
    })
  );
};

export const resolveUploadDir = (override?: string): string =>
  path.resolve(override || path.join(process.cwd(), 'src', 'uploads'));

export const resolveTempDir = (override?: string): string =>
  path.resolve(override || path.join(process.cwd(), 'src', 'temp'));
