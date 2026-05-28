import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';
import {
  OCR_CAPABLE_EXTENSIONS,
  isSupportedFile,
  normalizeExtension,
} from '#src/services/document-parser.constants.ts';
import {
  ParserAdapter,
  ParserErrorCode,
  ParserHealth,
  ParserResult,
  ParserRunOptions,
  ParserSuccess,
} from '#src/services/document-parser.types.ts';
import { isPathInside } from '#src/utils/file-system.ts';

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_FILE_SIZE_MB = 25;
const DEFAULT_MAX_OUTPUT_MB = 25;
const DEFAULT_MAX_RETRIES = 1;

const resolveScriptPath = (): string =>
  path.resolve(
    env.DOC_PARSER_SCRIPT_PATH || 'src/services/python/parse_document.py'
  );

type DocumentParserConfig = {
  pythonPath: string;
  scriptPath: string;
  timeoutMs: number;
  maxFileSizeBytes: number;
  maxOutputBytes: number;
  maxRetries: number;
  enablePlugins: boolean;
  llmModel?: string;
};

export class DocumentParserError extends Error {
  code: ParserErrorCode;
  status: number;
  retryable: boolean;
  details?: string;

  constructor(params: {
    code: ParserErrorCode;
    message: string;
    status?: number;
    retryable?: boolean;
    details?: string;
  }) {
    super(params.message);
    this.code = params.code;
    this.status = params.status ?? 500;
    this.retryable = params.retryable ?? false;
    this.details = params.details;
  }
}

const getParserConfig = (): DocumentParserConfig => {
  const maxFileSizeMb =
    env.DOC_PARSER_MAX_FILE_SIZE_MB ||
    env.MAX_FILE_SIZE_MB ||
    DEFAULT_MAX_FILE_SIZE_MB;
  const maxOutputMb = env.DOC_PARSER_MAX_OUTPUT_MB || DEFAULT_MAX_OUTPUT_MB;

  return {
    pythonPath: env.DOC_PARSER_PYTHON_PATH || 'python3',
    scriptPath: resolveScriptPath(),
    timeoutMs: env.DOC_PARSER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS,
    maxFileSizeBytes: Math.max(1, maxFileSizeMb) * 1024 * 1024,
    maxOutputBytes: Math.max(1, maxOutputMb) * 1024 * 1024,
    maxRetries: Math.max(0, env.DOC_PARSER_MAX_RETRIES ?? DEFAULT_MAX_RETRIES),
    enablePlugins: env.DOC_PARSER_ENABLE_PLUGINS ?? true,
    llmModel: env.DOC_PARSER_LLM_MODEL || env.LLM_MODEL || undefined,
  };
};

const buildPythonEnv = (config: DocumentParserConfig): NodeJS.ProcessEnv => ({
  ...process.env,
  PYTHONIOENCODING: 'utf-8',
  DOC_PARSER_ENABLE_PLUGINS: String(config.enablePlugins),
  DOC_PARSER_LLM_MODEL: config.llmModel || '',
});

const mapErrorStatus = (code: ParserErrorCode, retryable: boolean): number => {
  switch (code) {
    case 'PYTHON_NOT_FOUND':
    case 'SCRIPT_NOT_FOUND':
    case 'MISSING_DEPENDENCY':
      return 503;
    case 'PARSE_TIMEOUT':
      return 504;
    case 'INVALID_FILE_TYPE':
    case 'INVALID_INPUT':
    case 'UNSAFE_PATH':
      return 400;
    case 'FILE_TOO_LARGE':
      return 413;
    default:
      return retryable ? 503 : 500;
  }
};

type PythonProcessResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  outputExceeded: boolean;
};

class PythonDocumentParser implements ParserAdapter {
  private config: DocumentParserConfig;

  constructor(config: DocumentParserConfig) {
    this.config = config;
  }

  async parse(options: ParserRunOptions): Promise<ParserResult> {
    const scriptExists = await this.ensureScriptExists();
    if (!scriptExists) {
      return {
        success: false,
        error: {
          code: 'SCRIPT_NOT_FOUND',
          message: 'Parser script not found',
          retryable: false,
        },
      };
    }

    try {
      const result = await this.runPython([options.filePath]);

      if (result.outputExceeded) {
        return {
          success: false,
          error: {
            code: 'PARSE_FAILED',
            message: 'Parser output exceeded configured limit',
            retryable: false,
          },
        };
      }

      if (result.timedOut) {
        return {
          success: false,
          error: {
            code: 'PARSE_TIMEOUT',
            message: 'Parser timed out',
            retryable: true,
          },
        };
      }

      const trimmedStdout = result.stdout.trim();
      if (!trimmedStdout) {
        return {
          success: false,
          error: {
            code: 'EMPTY_OUTPUT',
            message: 'Parser returned empty output',
            retryable: result.exitCode === 0,
            details: result.stderr.trim() || undefined,
          },
        };
      }

      let parsed: ParserResult | null = null;
      try {
        parsed = JSON.parse(trimmedStdout) as ParserResult;
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'OUTPUT_PARSE_ERROR',
            message: 'Failed to parse parser output',
            retryable: true,
            details: result.stderr.trim() || String(error),
          },
        };
      }

      if (parsed.success === false) {
        return {
          success: false,
          error: {
            code: parsed.error.code || 'PARSE_FAILED',
            message: parsed.error.message || 'Parser failed',
            retryable: parsed.error.retryable ?? false,
            details: parsed.error.details || result.stderr.trim() || undefined,
          },
          metadata: parsed.metadata,
        };
      }

      return parsed;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return {
          success: false,
          error: {
            code: 'PYTHON_NOT_FOUND',
            message: 'Python runtime not available',
            retryable: false,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'PARSE_FAILED',
          message: 'Parser execution failed',
          retryable: true,
          details: err.message,
        },
      };
    }
  }

  async healthCheck(): Promise<ParserHealth> {
    const scriptExists = await this.ensureScriptExists();
    if (!scriptExists) {
      return {
        available: false,
        pythonOk: false,
        markitdownOk: false,
        ocrPluginOk: false,
        details: 'Parser script missing',
      };
    }

    try {
      const result = await this.runPython(['--health-check']);
      const trimmedStdout = result.stdout.trim();
      if (!trimmedStdout) {
        return {
          available: false,
          pythonOk: false,
          markitdownOk: false,
          ocrPluginOk: false,
          details: result.stderr.trim() || 'Health check returned no output',
        };
      }

      const parsed = JSON.parse(trimmedStdout) as {
        success: boolean;
        health?: ParserHealth;
        error?: { message?: string };
      };

      if (!parsed.success || !parsed.health) {
        return {
          available: false,
          pythonOk: false,
          markitdownOk: false,
          ocrPluginOk: false,
          details: parsed.error?.message || 'Health check failed',
        };
      }

      return parsed.health;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      return {
        available: false,
        pythonOk: false,
        markitdownOk: false,
        ocrPluginOk: false,
        details: err.message,
      };
    }
  }

  private async ensureScriptExists(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.config.scriptPath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  private runPython(args: string[]): Promise<PythonProcessResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        this.config.pythonPath,
        [this.config.scriptPath, ...args],
        {
          env: buildPythonEnv(this.config),
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        }
      );

      let stdoutChunks: Buffer[] = [];
      let stderrChunks: Buffer[] = [];
      let stdoutBytes = 0;
      let stderrBytes = 0;
      let timedOut = false;
      let outputExceeded = false;

      const timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 2_000);
      }, this.config.timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > this.config.maxOutputBytes) {
          outputExceeded = true;
          child.kill('SIGTERM');
          return;
        }
        stdoutChunks.push(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBytes += chunk.length;
        if (stderrBytes <= this.config.maxOutputBytes) {
          stderrChunks.push(chunk);
        }
      });

      child.on('error', error => {
        clearTimeout(timeoutId);
        reject(error);
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timeoutId);

        const stdout = Buffer.concat(stdoutChunks).toString('utf-8');
        const stderr = Buffer.concat(stderrChunks).toString('utf-8');

        resolve({
          stdout,
          stderr,
          exitCode,
          signal,
          timedOut,
          outputExceeded,
        });
      });
    });
  }
}

export class DocumentParserService {
  private adapter: ParserAdapter;
  private config: DocumentParserConfig;

  constructor(adapter?: ParserAdapter) {
    this.config = getParserConfig();
    this.adapter = adapter || new PythonDocumentParser(this.config);
  }

  async parseDocument(options: ParserRunOptions): Promise<ParserSuccess> {
    if (
      !isSupportedFile({
        fileName: options.originalName,
        mimeType: options.mimeType,
      })
    ) {
      throw new DocumentParserError({
        code: 'INVALID_FILE_TYPE',
        message: 'Unsupported file type',
        status: 400,
      });
    }

    if (
      options.allowedDir &&
      !isPathInside(options.allowedDir, options.filePath)
    ) {
      throw new DocumentParserError({
        code: 'UNSAFE_PATH',
        message: 'Unsafe file path',
        status: 400,
      });
    }

    let stats: Awaited<ReturnType<typeof fs.stat>>;
    try {
      stats = await fs.stat(options.filePath);
    } catch (error) {
      throw new DocumentParserError({
        code: 'INVALID_INPUT',
        message: 'File not found',
        status: 400,
        details: error instanceof Error ? error.message : String(error),
      });
    }
    const fileSize = options.fileSizeBytes ?? stats.size;

    if (fileSize > this.config.maxFileSizeBytes) {
      throw new DocumentParserError({
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds configured limit',
        status: 413,
      });
    }

    let attempt = 0;
    let lastError: DocumentParserError | null = null;

    while (attempt <= this.config.maxRetries) {
      attempt += 1;
      const start = Date.now();

      const result = await this.adapter.parse(options);
      const duration = Date.now() - start;

      if (result.success === true) {
        logger.info('Document parsed successfully', {
          durationMs: duration,
          attempts: attempt,
          fileType: result.metadata.fileType,
          hasOCR: result.metadata.hasOCR,
        });
        return result;
      }

      const retryable = result.error.retryable ?? false;
      lastError = new DocumentParserError({
        code: result.error.code,
        message: result.error.message,
        status: mapErrorStatus(result.error.code, retryable),
        retryable,
        details: result.error.details,
      });

      logger.warn('Document parse failed', {
        attempt,
        durationMs: duration,
        code: result.error.code,
        retryable,
        details: result.error.details,
      });

      if (!retryable || attempt > this.config.maxRetries) {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 200 * attempt));
    }

    if (lastError) {
      throw lastError;
    }

    throw new DocumentParserError({
      code: 'INTERNAL_ERROR',
      message: 'Unexpected parser failure',
    });
  }

  async checkHealth(): Promise<ParserHealth> {
    return this.adapter.healthCheck();
  }

  buildMetadata(fileName: string): { fileType: string; hasOCR: boolean } {
    const extension = normalizeExtension(fileName);
    return {
      fileType: extension || 'unknown',
      hasOCR: OCR_CAPABLE_EXTENSIONS.has(extension),
    };
  }
}

export const documentParserService = new DocumentParserService();
