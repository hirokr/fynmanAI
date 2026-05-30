import { redisClient } from '#src/app.ts';
import { env } from '#config/env.ts';

const SESSION_TIMEOUT_SECONDS = (env.SESSION_TIMEOUT_MINUTES || 60) * 60;
const MAX_SESSION_EVENTS = env.MAX_TRANSCRIPT_CHUNKS || 100;

export type SessionResourceMetadata = {
  id: string;
  title?: string;
  parsedText?: string;
};

export type SessionMetadata = {
  userId: string;
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
  resources?: SessionResourceMetadata[];
  createdAt: string;
};

export type SessionEvent = {
  type: string;
  timestamp: string;
  payload?: Record<string, unknown> | null;
};

const getMetadataKey = (sessionId: string) => `session-meta:${sessionId}`;
const getEventsKey = (sessionId: string) => `session-events:${sessionId}`;

export const setSessionMetadata = async (
  sessionId: string,
  metadata: SessionMetadata
): Promise<void> => {
  const key = getMetadataKey(sessionId);
  await redisClient.set(key, JSON.stringify(metadata), {
    EX: SESSION_TIMEOUT_SECONDS,
  });
};

export const mergeSessionResources = async (
  sessionId: string,
  resources?: SessionResourceMetadata[]
): Promise<void> => {
  if (!resources?.length) {
    return;
  }

  const existing = await getSessionMetadata(sessionId);
  if (!existing) {
    return;
  }

  await setSessionMetadata(sessionId, {
    ...existing,
    resources,
    resourceIds: Array.from(new Set(resources.map(resource => resource.id))),
  });
};

export const getSessionMetadata = async (
  sessionId: string
): Promise<SessionMetadata | null> => {
  const key = getMetadataKey(sessionId);
  const value = await redisClient.get(key);
  if (!value) {
    return null;
  }

  try {
    const json = Buffer.isBuffer(value) ? value.toString('utf-8') : value;
    return JSON.parse(json) as SessionMetadata;
  } catch {
    return null;
  }
};

export const appendSessionEvent = async (
  sessionId: string,
  event: SessionEvent
): Promise<void> => {
  const key = getEventsKey(sessionId);
  await redisClient.rPush(key, JSON.stringify(event));
  await redisClient.lTrim(key, -MAX_SESSION_EVENTS, -1);
  await redisClient.expire(key, SESSION_TIMEOUT_SECONDS);
};
