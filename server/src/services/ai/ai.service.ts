import fetch, { Response } from 'node-fetch';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';

export type ProviderId = 'openrouter' | 'groq' | 'openai';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatPurpose = 'realtime' | 'final' | 'helper' | 'default';

export type ChatCompletionOptions = {
  model?: string;
  purpose?: ChatPurpose;
  temperature?: number;
  maxTokens?: number;
};

export type EmbeddingOptions = {
  model?: string;
};

type ProviderCapabilities = {
  chat: boolean;
  embeddings: boolean;
};

const DEFAULT_BASE_URLS: Record<ProviderId, string> = {
  openrouter: 'https://openrouter.ai/api/v1',
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
};

const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
  openrouter: { chat: true, embeddings: true },
  groq: { chat: true, embeddings: false },
  openai: { chat: true, embeddings: true },
};

const DEFAULT_CHAT_MAX_TOKENS: Record<ChatPurpose, number> = {
  realtime: 700,
  final: 1800,
  helper: 1000,
  default: 1200,
};

const normalizeBaseUrl = (value: string): string =>
  value.trim().replace(/\/+$/, '');

const normalizeUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const normalizeProvider = (
  value: string | undefined,
  fallback?: ProviderId
): ProviderId | undefined => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'openrouter') return 'openrouter';
  if (normalized === 'groq') return 'groq';
  if (normalized === 'openai') return 'openai';

  throw new Error(`Unsupported provider: ${value}`);
};

const getProviderApiKey = (provider: ProviderId): string => {
  const apiKey =
    provider === 'openrouter'
      ? env.OPENROUTER_API_KEY || env.OPEN_ROUTER_APIKEY
      : provider === 'groq'
        ? env.GROQ_API_KEY
        : env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(`Missing API key for ${provider}`);
  }

  return apiKey;
};

const resolveEmbeddingProvider = (): ProviderId | undefined => {
  if (env.EMBEDDING_PROVIDER) {
    return normalizeProvider(env.EMBEDDING_PROVIDER);
  }

  if (env.OPENROUTER_API_KEY || env.OPEN_ROUTER_APIKEY) {
    return 'openrouter';
  }

  if (env.OPENAI_API_KEY) {
    return 'openai';
  }

  return undefined;
};

const getProviderBaseUrl = (provider: ProviderId): string => {
  if (provider === 'openrouter') {
    return normalizeBaseUrl(
      env.OPENROUTER_BASE_URL || DEFAULT_BASE_URLS.openrouter
    );
  }

  if (provider === 'openai') {
    return normalizeBaseUrl(env.OPENAI_BASE_URL || DEFAULT_BASE_URLS.openai);
  }

  return normalizeBaseUrl(env.GROQ_BASE_URL || DEFAULT_BASE_URLS.groq);
};

const buildRequestUrl = (
  provider: ProviderId,
  path: string,
  endpointOverride?: string
): string => {
  const override = normalizeUrl(endpointOverride);
  if (override) {
    if (override.startsWith('http://') || override.startsWith('https://')) {
      return override;
    }

    const baseUrl = getProviderBaseUrl(provider);
    const normalizedPath = override.startsWith('/') ? override : `/${override}`;
    return `${baseUrl}${normalizedPath}`;
  }

  return `${getProviderBaseUrl(provider)}${path}`;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  const text = await response.text();
  if (!text) {
    return `${response.status} ${response.statusText}`;
  }

  try {
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return parsed?.error?.message || text;
  } catch {
    return text;
  }
};

const requestOpenAiCompatible = async <T>(
  provider: ProviderId,
  path: string,
  payload: Record<string, unknown>,
  endpointOverride?: string
): Promise<T> => {
  const requestUrl = buildRequestUrl(provider, path, endpointOverride);
  const apiKey = getProviderApiKey(provider);

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(
      `${provider} request failed (${response.status}): ${errorMessage}`
    );
  }

  return (await response.json()) as T;
};

const withFallback = async <T>(
  kind: 'chat' | 'embeddings',
  primary: ProviderId,
  fallback: ProviderId | undefined,
  runner: (provider: ProviderId, isFallback: boolean) => Promise<T>
): Promise<T> => {
  try {
    return await runner(primary, false);
  } catch (error) {
    if (!fallback || fallback === primary) {
      throw error;
    }

    if (!PROVIDER_CAPABILITIES[fallback][kind]) {
      logger.warn(
        `[AI] ${kind} fallback skipped: ${fallback} does not support ${kind}.`
      );
      throw error;
    }

    logger.warn(`[AI] ${kind} primary provider failed, retrying fallback.`, {
      primary,
      fallback,
      error: error instanceof Error ? error.message : String(error),
    });

    return runner(fallback, true);
  }
};

const resolveModel = (
  kind: 'embeddings',
  isFallback: boolean,
  override: string | undefined
): string => {
  if (override) {
    return override;
  }

  const model = isFallback ? env.EMBEDDING_FALLBACK_MODEL : env.EMBEDDING_MODEL;

  if (!model) {
    throw new Error(
      `Missing embedding model${isFallback ? ' (fallback)' : ''} in env.`
    );
  }

  return model;
};

const resolveChatModel = (
  purpose: ChatPurpose | undefined,
  isFallback: boolean,
  override: string | undefined
): string => {
  if (override) {
    return override;
  }

  if (isFallback && env.LLM_FALLBACK_MODEL) {
    return env.LLM_FALLBACK_MODEL;
  }

  const primaryModel =
    purpose === 'realtime'
      ? env.REALTIME_MODEL || env.LLM_MODEL || env.FINAL_EVALUATION_MODEL
      : purpose === 'final'
        ? env.FINAL_EVALUATION_MODEL || env.LLM_MODEL || env.REALTIME_MODEL
        : purpose === 'helper'
          ? env.HELPER_MODEL || env.LLM_MODEL || env.FINAL_EVALUATION_MODEL
          : env.LLM_MODEL || env.FINAL_EVALUATION_MODEL || env.REALTIME_MODEL;

  if (!primaryModel) {
    throw new Error('Missing chat model in env.');
  }

  return primaryModel;
};

const resolveChatMaxTokens = (
  purpose: ChatPurpose | undefined,
  override: number | undefined
): number => {
  if (override && Number.isFinite(override) && override > 0) {
    return Math.floor(override);
  }

  return DEFAULT_CHAT_MAX_TOKENS[purpose || 'default'];
};

export const generateChatCompletion = async (
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<{
  content: string;
  provider: ProviderId;
  model: string;
  raw: unknown;
}> => {
  const primaryProvider = normalizeProvider(env.LLM_PROVIDER, 'openrouter');
  const fallbackProvider = normalizeProvider(env.LLM_FALLBACK_PROVIDER);

  if (!primaryProvider) {
    throw new Error('LLM_PROVIDER is required.');
  }

  return withFallback(
    'chat',
    primaryProvider,
    fallbackProvider,
    async (provider, isFallback) => {
      const model = resolveChatModel(
        options.purpose,
        isFallback,
        options.model
      );
      const payload = {
        model,
        messages,
        temperature: options.temperature,
        max_tokens: resolveChatMaxTokens(options.purpose, options.maxTokens),
      };

      const data = await requestOpenAiCompatible<{
        choices?: Array<{ message?: { content?: string } }>;
      }>(provider, '/chat/completions', payload);

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error(`${provider} chat response missing content.`);
      }

      return { content, provider, model, raw: data };
    }
  );
};

export const generateEmbedding = async (
  input: string | string[],
  options: EmbeddingOptions = {}
): Promise<{
  embedding: number[];
  provider: ProviderId;
  model: string;
  raw: unknown;
}> => {
  const primaryProvider = resolveEmbeddingProvider();
  const fallbackProvider = normalizeProvider(env.EMBEDDING_FALLBACK_PROVIDER);

  if (!primaryProvider) {
    throw new Error(
      'Embedding provider is not configured. Set EMBEDDING_PROVIDER or configure an API key.'
    );
  }

  if (!PROVIDER_CAPABILITIES[primaryProvider].embeddings) {
    throw new Error(
      `${primaryProvider} does not support embeddings. Update EMBEDDING_PROVIDER.`
    );
  }

  return withFallback(
    'embeddings',
    primaryProvider,
    fallbackProvider,
    async (provider, isFallback) => {
      const model = resolveModel('embeddings', isFallback, options.model);
      const payload = {
        model,
        input,
      };

      const endpointOverride =
        provider === 'openrouter' ? env.EMBEDDING_MODEL_ENDPOINT : undefined;

      const data = await requestOpenAiCompatible<{
        data?: Array<{ embedding?: number[] }>;
      }>(provider, '/embeddings', payload, endpointOverride);

      const embedding = data.data?.[0]?.embedding;
      if (!embedding) {
        throw new Error(`${provider} embedding response missing data.`);
      }

      return { embedding, provider, model, raw: data };
    }
  );
};
