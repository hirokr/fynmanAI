import 'dotenv/config';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());
const optionalNumber = z.preprocess(
  emptyToUndefined,
  z.coerce.number().optional()
);
const optionalBoolean = z.preprocess(
  emptyToUndefined,
  z.coerce.boolean().optional()
);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(8000),
  LOG_LEVEL: optionalString,
  APP_NAME: optionalString,
  APP_URL: optionalString,
  API_URL: optionalString,
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  ARCJET_KEY: optionalString,

  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRES_IN: z.string().default('5m'),
  REFRESH_JWT_SECRET: z.string().min(1, 'REFRESH_JWT_SECRET is required'),
  REFRESH_JWT_EXPIRES_IN: z.string().default('15d'),
  COOKIE_SAME_SITE: optionalString,

  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  GOOGLE_CALLBACK_URL: optionalString,

  EMAIL_HOST: optionalString,
  EMAIL_PORT: optionalNumber,
  EMAIL_SECURE: optionalString,
  EMAIL_USER: optionalString,
  EMAIL_PASS: optionalString,
  EMAIL_FROM: optionalString,
  SUPPORT_EMAIL: optionalString,

  REDIS_URL: optionalString,
  REDIS_HOST: optionalString,
  REDIS_PORT: optionalNumber,
  REDIS_PASSWORD: optionalString,
  REDIS_DB: optionalNumber,
  REDIS_DEFAULT_EXPIRATION: optionalNumber,
  REDIS_PRODUCT_INTENT_EXPIRATION: optionalNumber,
  BULLMQ_PREFIX: optionalString,

  FRONTEND_URL: optionalString,

  OPEN_ROUTER_APIKEY: optionalString,
  OPENROUTER_API_KEY: optionalString,
  OPENROUTER_BASE_URL: optionalString,
  GROQ_API_KEY: optionalString,
  GROQ_BASE_URL: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_BASE_URL: optionalString,
  LLM_PROVIDER: optionalString,
  LLM_MODEL: optionalString,
  LLM_FALLBACK_PROVIDER: optionalString,
  LLM_FALLBACK_MODEL: optionalString,
  REALTIME_MODEL: optionalString,
  FINAL_EVALUATION_MODEL: optionalString,
  HELPER_MODEL: optionalString,
  EMBEDDING_PROVIDER: optionalString,
  EMBEDDING_MODEL: optionalString,
  EMBEDDING_MODEL_ENDPOINT: optionalString,
  EMBEDDING_FALLBACK_PROVIDER: optionalString,
  EMBEDDING_FALLBACK_MODEL: optionalString,

  STT_PROVIDER: optionalString,
  STT_MODEL: optionalString,
  WHISPER_API_KEY: optionalString,
  DEEPGRAM_API_KEY: optionalString,
  ASSEMBLYAI_API_KEY: optionalString,

  AUDIO_CHUNK_DURATION: optionalNumber,
  AUDIO_CHUNKS_PER_MINUTE: optionalNumber,
  LLM_ANALYSIS_INTERVAL: optionalNumber,
  TRANSCRIPT_WINDOW_MINUTES: optionalNumber,

  WS_PATH: optionalString,
  WS_HEARTBEAT_INTERVAL: optionalNumber,

  UPLOAD_DIR: optionalString,
  MAX_FILE_SIZE_MB: optionalNumber,
  URL_MAX_FILE_SIZE_MB: optionalNumber,
  URL_FETCH_TIMEOUT_MS: optionalNumber,
  RESOURCE_CHUNK_TOKENS: optionalNumber,
  RESOURCE_CHUNK_OVERLAP: optionalNumber,
  DOMAIN_ALLOWED_SUBJECTS: optionalString,

  DOC_PARSER_PYTHON_PATH: optionalString,
  DOC_PARSER_SCRIPT_PATH: optionalString,
  DOC_PARSER_TIMEOUT_MS: optionalNumber,
  DOC_PARSER_MAX_FILE_SIZE_MB: optionalNumber,
  DOC_PARSER_MAX_RETRIES: optionalNumber,
  DOC_PARSER_MAX_OUTPUT_MB: optionalNumber,
  DOC_PARSER_ENABLE_PLUGINS: optionalBoolean,
  DOC_PARSER_LLM_MODEL: optionalString,

  OCR_PROVIDER: optionalString,
  TESSERACT_LANG: optionalString,

  VECTOR_DB_PROVIDER: optionalString,
  QDRANT_URL: optionalString,
  QDRANT_API_KEY: optionalString,
  QDRANT_COLLECTION: optionalString,
  CHROMA_URL: optionalString,

  ENABLE_REALTIME_FEEDBACK: optionalBoolean,
  ENABLE_FINAL_EVALUATION: optionalBoolean,
  ENABLE_ANALYTICS: optionalBoolean,
  ENABLE_TOPIC_DRIFT_DETECTION: optionalBoolean,

  SESSION_TIMEOUT_MINUTES: optionalNumber,
  MAX_TRANSCRIPT_CHUNKS: optionalNumber,

  STORAGE_PROVIDER: optionalString,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_ENDPOINT: optionalString,
  S3_SESSION_TOKEN: optionalString,
  S3_FORCE_PATH_STYLE: optionalBoolean,

  UPLOADTHING_TOKEN: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map(issue => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Environment validation failed:\n${issues}`);
}

export const env = parsed.data;

export const {
  NODE_ENV,
  PORT,
  LOG_LEVEL,
  APP_NAME,
  APP_URL,
  API_URL,
  DATABASE_URL,
  ARCJET_KEY,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  REFRESH_JWT_SECRET,
  REFRESH_JWT_EXPIRES_IN,
  COOKIE_SAME_SITE,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_SECURE,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  SUPPORT_EMAIL,
  REDIS_URL,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  REDIS_DB,
  REDIS_DEFAULT_EXPIRATION,
  REDIS_PRODUCT_INTENT_EXPIRATION,
  BULLMQ_PREFIX,
  FRONTEND_URL,
  OPEN_ROUTER_APIKEY,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  GROQ_API_KEY,
  GROQ_BASE_URL,
  OPENAI_API_KEY,
  OPENAI_BASE_URL,
  LLM_PROVIDER,
  LLM_MODEL,
  LLM_FALLBACK_PROVIDER,
  LLM_FALLBACK_MODEL,
  REALTIME_MODEL,
  FINAL_EVALUATION_MODEL,
  HELPER_MODEL,
  EMBEDDING_PROVIDER,
  EMBEDDING_MODEL,
  EMBEDDING_MODEL_ENDPOINT,
  EMBEDDING_FALLBACK_PROVIDER,
  EMBEDDING_FALLBACK_MODEL,
  STT_PROVIDER,
  STT_MODEL,
  WHISPER_API_KEY,
  DEEPGRAM_API_KEY,
  ASSEMBLYAI_API_KEY,
  AUDIO_CHUNK_DURATION,
  AUDIO_CHUNKS_PER_MINUTE,
  LLM_ANALYSIS_INTERVAL,
  TRANSCRIPT_WINDOW_MINUTES,
  WS_PATH,
  WS_HEARTBEAT_INTERVAL,
  UPLOAD_DIR,
  MAX_FILE_SIZE_MB,
  URL_MAX_FILE_SIZE_MB,
  URL_FETCH_TIMEOUT_MS,
  RESOURCE_CHUNK_TOKENS,
  RESOURCE_CHUNK_OVERLAP,
  DOMAIN_ALLOWED_SUBJECTS,
  DOC_PARSER_PYTHON_PATH,
  DOC_PARSER_SCRIPT_PATH,
  DOC_PARSER_TIMEOUT_MS,
  DOC_PARSER_MAX_FILE_SIZE_MB,
  DOC_PARSER_MAX_RETRIES,
  DOC_PARSER_MAX_OUTPUT_MB,
  DOC_PARSER_ENABLE_PLUGINS,
  DOC_PARSER_LLM_MODEL,
  OCR_PROVIDER,
  TESSERACT_LANG,
  VECTOR_DB_PROVIDER,
  QDRANT_URL,
  QDRANT_API_KEY,
  QDRANT_COLLECTION,
  CHROMA_URL,
  ENABLE_REALTIME_FEEDBACK,
  ENABLE_FINAL_EVALUATION,
  ENABLE_ANALYTICS,
  ENABLE_TOPIC_DRIFT_DETECTION,
  SESSION_TIMEOUT_MINUTES,
  MAX_TRANSCRIPT_CHUNKS,
  STORAGE_PROVIDER,
  S3_REGION,
  S3_BUCKET,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT,
  S3_SESSION_TOKEN,
  S3_FORCE_PATH_STYLE,
  UPLOADTHING_TOKEN,
} = env;
