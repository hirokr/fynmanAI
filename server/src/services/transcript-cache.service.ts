import { redisClient } from '#src/app.ts';
import { env } from '#config/env.ts';

const SESSION_TIMEOUT_SECONDS = (env.SESSION_TIMEOUT_MINUTES || 60) * 60;
const MAX_CHUNKS = env.MAX_TRANSCRIPT_CHUNKS || 100;

export type TranscriptCacheItem = {
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
  createdAt: string;
};

const getTranscriptKey = (sessionId: string) =>
  `session-transcript:${sessionId}`;

const getAnalysisKey = (sessionId: string) => `session-analysis:${sessionId}`;

export const appendTranscriptCache = async (
  sessionId: string,
  item: Omit<TranscriptCacheItem, 'createdAt'>
): Promise<void> => {
  const key = getTranscriptKey(sessionId);
  const payload: TranscriptCacheItem = {
    ...item,
    createdAt: new Date().toISOString(),
  };

  await redisClient.rPush(key, JSON.stringify(payload));
  await redisClient.lTrim(key, -MAX_CHUNKS, -1);
  await redisClient.expire(key, SESSION_TIMEOUT_SECONDS);
};

export const getTranscriptWindow = async (
  sessionId: string
): Promise<TranscriptCacheItem[]> => {
  const key = getTranscriptKey(sessionId);
  const entries = await redisClient.lRange(key, 0, -1);

  return entries
    .map(entry => {
      try {
        return JSON.parse(entry) as TranscriptCacheItem;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is TranscriptCacheItem => Boolean(entry));
};

export const getTranscriptWindowText = async (
  sessionId: string
): Promise<string> => {
  const entries = await getTranscriptWindow(sessionId);
  return entries.map(entry => entry.text).join('\n');
};

export const shouldRunAnalysis = async (
  sessionId: string,
  intervalSeconds: number
): Promise<boolean> => {
  const key = getAnalysisKey(sessionId);
  const last = await redisClient.get(key);
  const now = Date.now();

  if (!last) {
    await redisClient.set(key, String(now), { EX: SESSION_TIMEOUT_SECONDS });
    return true;
  }

  const lastMs = Number(last);
  if (!Number.isFinite(lastMs)) {
    await redisClient.set(key, String(now), { EX: SESSION_TIMEOUT_SECONDS });
    return true;
  }

  if (now - lastMs >= intervalSeconds * 1000) {
    await redisClient.set(key, String(now), { EX: SESSION_TIMEOUT_SECONDS });
    return true;
  }

  return false;
};
