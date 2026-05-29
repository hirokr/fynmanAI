import prisma from '#src/config/database.ts';
import { Prisma } from '#src/generated/client.ts';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';

type AnalyticsEventInput = {
  event: string;
  userId?: string;
  sessionId?: string;
  payload?: Record<string, unknown> | null;
};

export type TranscriptAnalytics = {
  speakingConfidence: number;
  hesitationRate: number;
  explanationDepth: number;
  conceptCoverage: number;
  semanticConsistency: number;
  topicDrift: boolean;
};

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const countMatches = (text: string, pattern: RegExp): number =>
  text.match(pattern)?.length || 0;

export const analyzeTranscriptQuality = (params: {
  transcript: string;
  context?: string[];
  subject?: string;
  topic?: string;
}): TranscriptAnalytics => {
  const normalized = params.transcript.toLowerCase();
  const words = normalized.match(/\b[\w'-]+\b/g) || [];
  const uniqueWords = new Set(words);
  const fillerCount = countMatches(
    normalized,
    /\b(um|uh|er|ah|like|basically|actually|you know|sort of|kind of)\b/g
  );
  const reasoningCount = countMatches(
    normalized,
    /\b(because|therefore|so|since|if|then|means|implies|causes|depends|example)\b/g
  );

  const scopeTerms = [params.subject, params.topic]
    .filter(Boolean)
    .flatMap(
      value =>
        String(value)
          .toLowerCase()
          .match(/\b[\w'-]+\b/g) || []
    )
    .filter(term => term.length > 2);
  const contextTerms = (params.context || [])
    .join(' ')
    .toLowerCase()
    .match(/\b[\w'-]+\b/g);
  const importantContextTerms = Array.from(new Set(contextTerms || []))
    .filter(term => term.length > 5)
    .slice(0, 80);
  const coveredContextTerms = importantContextTerms.filter(term =>
    uniqueWords.has(term)
  ).length;
  const coveredScopeTerms = scopeTerms.filter(term => uniqueWords.has(term));

  const hesitationPenalty = words.length
    ? Math.min(45, (fillerCount / words.length) * 500)
    : 35;
  const lexicalVariety = words.length
    ? (uniqueWords.size / words.length) * 100
    : 0;
  const reasoningDensity = words.length
    ? Math.min(100, (reasoningCount / words.length) * 900)
    : 0;
  const contextCoverage = importantContextTerms.length
    ? (coveredContextTerms / importantContextTerms.length) * 100
    : coveredScopeTerms.length
      ? 70
      : 0;
  const topicDrift =
    Boolean(scopeTerms.length) &&
    words.length >= 40 &&
    coveredScopeTerms.length === 0;

  return {
    speakingConfidence: clampScore(
      70 + lexicalVariety * 0.2 - hesitationPenalty
    ),
    hesitationRate: Number(
      (words.length ? fillerCount / words.length : 0).toFixed(4)
    ),
    explanationDepth: clampScore(reasoningDensity * 0.7 + lexicalVariety * 0.3),
    conceptCoverage: clampScore(contextCoverage),
    semanticConsistency: clampScore(
      topicDrift ? 35 : 70 + contextCoverage * 0.3
    ),
    topicDrift,
  };
};

export const trackAnalyticsEvent = async (
  input: AnalyticsEventInput
): Promise<void> => {
  if (!env.ENABLE_ANALYTICS) {
    return;
  }

  try {
    await prisma.analyticsEvent.create({
      data: {
        event: input.event,
        userId: input.userId,
        sessionId: input.sessionId,
        payload: input.payload as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.warn('[Analytics] Failed to persist event', {
      event: input.event,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
