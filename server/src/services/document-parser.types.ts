export type ParserMetadata = {
  fileType: string;
  hasOCR: boolean;
  warnings?: string[];
};

export type ParserErrorCode =
  | 'PYTHON_NOT_FOUND'
  | 'SCRIPT_NOT_FOUND'
  | 'INVALID_FILE_TYPE'
  | 'INVALID_INPUT'
  | 'FILE_TOO_LARGE'
  | 'PARSE_TIMEOUT'
  | 'PARSE_FAILED'
  | 'OUTPUT_PARSE_ERROR'
  | 'MISSING_DEPENDENCY'
  | 'UNSAFE_PATH'
  | 'EMPTY_OUTPUT'
  | 'INTERNAL_ERROR';

export type ParserFailure = {
  success: false;
  error: {
    code: ParserErrorCode;
    message: string;
    retryable?: boolean;
    details?: string;
  };
  metadata?: ParserMetadata;
};

export type ParserSuccess = {
  success: true;
  text: string;
  metadata: ParserMetadata;
};

export type ParserResult = ParserSuccess | ParserFailure;

export type ParserHealth = {
  available: boolean;
  pythonOk: boolean;
  markitdownOk: boolean;
  ocrPluginOk: boolean;
  details?: string;
};

export type ParserRunOptions = {
  filePath: string;
  originalName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  allowedDir?: string;
};

export type ParserAdapter = {
  parse: (options: ParserRunOptions) => Promise<ParserResult>;
  healthCheck: () => Promise<ParserHealth>;
};
