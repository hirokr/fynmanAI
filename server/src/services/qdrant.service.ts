import fetch from 'node-fetch';
import { env } from '#config/env.ts';
import logger from '#config/logger.ts';

export type QdrantPoint = {
  id: string;
  vector: number[];
  payload?: Record<string, unknown>;
};

type QdrantFilter = {
  must?: Array<Record<string, unknown>>;
  should?: Array<Record<string, unknown>>;
  must_not?: Array<Record<string, unknown>>;
};

const FILTER_PAYLOAD_INDEXES = ['resourceId', 'subject', 'topic'] as const;

const requireQdrantUrl = (): string => {
  if (!env.QDRANT_URL) {
    throw new Error('[Qdrant] QDRANT_URL is required');
  }
  return env.QDRANT_URL.replace(/\/+$/g, '');
};

export const getQdrantCollection = (): string =>
  env.QDRANT_COLLECTION || 'feynman_resources';

const qdrantHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (env.QDRANT_API_KEY) {
    headers['api-key'] = env.QDRANT_API_KEY;
  }

  return headers;
};

const requestQdrant = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> => {
  const baseUrl = requireQdrantUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: qdrantHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
};

const ensurePayloadIndexes = async (collectionName: string): Promise<void> => {
  await Promise.all(
    FILTER_PAYLOAD_INDEXES.map(fieldName =>
      requestQdrant(`/collections/${collectionName}/index?wait=true`, {
        method: 'PUT',
        body: {
          field_name: fieldName,
          field_schema: 'keyword',
        },
      })
    )
  );
};

export const ensureCollection = async (
  collectionName: string,
  vectorSize: number
): Promise<void> => {
  try {
    await requestQdrant(`/collections/${collectionName}`);
  } catch (error) {
    logger.info(`[Qdrant] Creating collection ${collectionName}`);
    await requestQdrant(`/collections/${collectionName}`, {
      method: 'PUT',
      body: {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      },
    });
  }

  await ensurePayloadIndexes(collectionName);
};

export const checkQdrantHealth = async (): Promise<{
  collectionName: string;
  available: boolean;
}> => {
  const collectionName = getQdrantCollection();
  await requestQdrant(`/collections/${collectionName}`);

  return {
    collectionName,
    available: true,
  };
};

export const upsertPoints = async (
  collectionName: string,
  points: QdrantPoint[]
): Promise<void> => {
  await requestQdrant(`/collections/${collectionName}/points?wait=true`, {
    method: 'PUT',
    body: { points },
  });
};

export const deletePoints = async (
  collectionName: string,
  pointIds: Array<string | number>
): Promise<void> => {
  if (!pointIds.length) {
    return;
  }

  await requestQdrant(
    `/collections/${collectionName}/points/delete?wait=true`,
    {
      method: 'POST',
      body: {
        points: pointIds,
      },
    }
  );
};

export const searchPoints = async (params: {
  collectionName: string;
  vector: number[];
  limit?: number;
  filter?: QdrantFilter;
}): Promise<
  Array<{
    id: string | number;
    payload?: Record<string, unknown>;
    score?: number;
  }>
> => {
  const runSearch = () =>
    requestQdrant<{
      result?: Array<{
        id: string | number;
        payload?: Record<string, unknown>;
        score?: number;
      }>;
    }>(`/collections/${params.collectionName}/points/search`, {
      method: 'POST',
      body: {
        vector: params.vector,
        limit: params.limit || 5,
        filter: params.filter,
        with_payload: true,
      },
    });

  let response: Awaited<ReturnType<typeof runSearch>>;
  try {
    response = await runSearch();
  } catch (error) {
    if (!String(error).includes('Index required but not found')) {
      throw error;
    }

    logger.warn(
      `[Qdrant] Missing payload index on ${params.collectionName}; creating filter indexes and retrying search`
    );
    await ensurePayloadIndexes(params.collectionName);
    response = await runSearch();
  }

  return response.result || [];
};

export const buildResourceFilter = (filters: {
  resourceIds?: string[];
  subject?: string;
  topic?: string;
}): QdrantFilter | undefined => {
  const must: Array<Record<string, unknown>> = [];

  if (filters.resourceIds?.length) {
    must.push({
      key: 'resourceId',
      match: { any: filters.resourceIds },
    });
  }

  if (filters.subject) {
    must.push({
      key: 'subject',
      match: { value: filters.subject },
    });
  }

  if (filters.topic) {
    must.push({
      key: 'topic',
      match: { value: filters.topic },
    });
  }

  if (!must.length) {
    return undefined;
  }

  return { must };
};
