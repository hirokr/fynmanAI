import prisma from '#src/config/database.ts';
import { Prisma } from '#src/generated/client.ts';
import {
  generateChatCompletion,
  type ChatMessage,
} from '#src/services/ai/ai.service.ts';
import {
  retrieveContext,
  type RetrievedContextChunk,
} from '#src/services/retrieval.service.ts';
import {
  getTranscriptWindowText,
  shouldRunAnalysis,
} from '#src/services/transcript-cache.service.ts';
import { env } from '#config/env.ts';
import { getSessionTranscriptText } from '#src/services/session.service.ts';
import {
  analyzeTranscriptQuality,
  trackAnalyticsEvent,
} from '#src/services/analytics.service.ts';
import { appendSessionEvent } from '#src/services/session-cache.service.ts';
import { getDomainRubric } from '#src/services/domain.service.ts';

type FinalEvaluationPayload = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missed_concepts: string[];
  follow_up: string[];
  confidence_score: number;
  topic_drift: boolean;
  cited_evidence: string[];
};

type RealtimeFeedbackPayload = {
  questions: string[];
  clarifications: string[];
  detected_gaps: string[];
  topic_drift: boolean;
  citations: string[];
};

type CitationPayload = {
  citationId: string;
  chunkId: string;
  resourceId?: string;
  resourceTitle?: string;
  score?: number;
  sourceMetadata: {
    sourceUrl?: string;
    storageKey?: string;
    chunkIndex?: number;
    subject?: string;
    topic?: string;
    [key: string]: unknown;
  };
};

type EvaluationRecord = {
  id: string;
  sessionId: string;
  type: 'ROLLING' | 'FINAL';
  content: string;
  summary?: string | null;
  strengths?: unknown;
  weaknesses?: unknown;
  missedConcepts?: unknown;
  followUp?: unknown;
  confidenceScore?: number | null;
  topicDrift?: boolean | null;
  provider?: string | null;
  model?: string | null;
  metadata?: unknown;
  createdAt: Date;
};

const extractJson = (value: string): Record<string, unknown> | null => {
  const first = value.indexOf('{');
  const last = value.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    return null;
  }

  const candidate = value.slice(first, last + 1);
  try {
    return JSON.parse(candidate) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const coerceStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|\r|,|;/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
};

const coerceBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
};

const coerceNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const parseFinalEvaluation = (raw: string): FinalEvaluationPayload | null => {
  const parsed = extractJson(raw);
  if (!parsed) {
    return null;
  }

  const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
  const confidenceScore = coerceNumber(parsed.confidence_score);
  return {
    summary,
    strengths: coerceStringArray(parsed.strengths),
    weaknesses: coerceStringArray(parsed.weaknesses),
    missed_concepts: coerceStringArray(parsed.missed_concepts),
    follow_up: coerceStringArray(parsed.follow_up),
    confidence_score: confidenceScore ?? 0,
    topic_drift: coerceBoolean(parsed.topic_drift),
    cited_evidence: coerceStringArray(parsed.cited_evidence),
  };
};

const parseRealtimeFeedback = (raw: string): RealtimeFeedbackPayload | null => {
  const parsed = extractJson(raw);
  if (!parsed) {
    return null;
  }

  return {
    questions: coerceStringArray(parsed.questions),
    clarifications: coerceStringArray(parsed.clarifications),
    detected_gaps: coerceStringArray(parsed.detected_gaps),
    topic_drift: coerceBoolean(parsed.topic_drift),
    citations: coerceStringArray(parsed.citations),
  };
};

const getContextTexts = (context: RetrievedContextChunk[]): string[] =>
  context.map(chunk => chunk.text);

const getCitations = (context: RetrievedContextChunk[]): CitationPayload[] =>
  context.map(chunk => ({
    citationId: chunk.citationId,
    chunkId: chunk.chunkId,
    resourceId: chunk.resourceId,
    resourceTitle: chunk.resourceTitle,
    score: chunk.score,
    sourceMetadata: {
      sourceUrl: chunk.sourceUrl,
      storageKey: chunk.storageKey,
      chunkIndex: chunk.chunkIndex,
      subject: chunk.subject,
      topic: chunk.topic,
      ...(chunk.sourceMetadata || {}),
    },
  }));

const formatContext = (context: RetrievedContextChunk[]): string => {
  if (!context.length) {
    return 'No retrieved context.';
  }

  return context
    .map(
      chunk =>
        `[${chunk.citationId}] resource=${chunk.resourceTitle || chunk.resourceId || 'unknown'} ` +
        `chunk=${chunk.chunkIndex ?? 'unknown'} score=${chunk.score ?? 'n/a'}\n` +
        chunk.text
    )
    .join('\n---\n');
};

const formatRubric = (rubric: string[]): string =>
  rubric.length
    ? rubric.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : 'No subject-specific rubric available. Use the general Feynman criteria.';

const buildRealtimeMessages = (params: {
  transcript: string;
  context: RetrievedContextChunk[];
  subject?: string;
  topic?: string;
  goal?: string;
  rubric: string[];
}): ChatMessage[] => {
  const contextBlock = formatContext(params.context);
  const scope = [params.subject, params.topic].filter(Boolean).join(' / ');
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content:
        'You are Feynman AI, an examiner that ONLY asks probing questions. ' +
        'Never provide explanations or answers. Ask concise questions that expose gaps. ' +
        'Stay within the given subject/topic. If the transcript drifts, ask to refocus. ' +
        'Return valid JSON only.',
    },
    {
      role: 'user',
      content:
        `Subject/Topic: ${scope || 'unspecified'}\n` +
        goalBlock +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Recent transcript:\n${params.transcript}\n\nRetrieved context:\n${contextBlock}\n\n` +
        `Available citation ids: ${citationIds || 'none'}\n\n` +
        'Return JSON with keys: questions (1-3 strings), clarifications (0-2 strings), ' +
        'detected_gaps (0-4 strings), topic_drift (boolean), citations (citation ids used). ' +
        'Ask questions only. Do not teach, solve, explain, or add text outside JSON.',
    },
  ];
};

const buildFinalMessages = (params: {
  transcript: string;
  context: RetrievedContextChunk[];
  subject?: string;
  topic?: string;
  goal?: string;
  rubric: string[];
}): ChatMessage[] => {
  const contextBlock = formatContext(params.context);
  const scope = [params.subject, params.topic].filter(Boolean).join(' / ');
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content:
        'You are Feynman AI. Provide a final mastery evaluation. ' +
        'Do not teach. Highlight gaps, misconceptions, and missing reasoning. ' +
        'Stay within the given subject/topic and use only retrieved context. ' +
        'Return valid JSON only.',
    },
    {
      role: 'user',
      content:
        `Subject/Topic: ${scope || 'unspecified'}\n` +
        goalBlock +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Full transcript:\n${params.transcript}\n\nRetrieved context:\n${contextBlock}\n\n` +
        `Available citation ids: ${citationIds || 'none'}\n\n` +
        'Return JSON with keys: summary, strengths, weaknesses, missed_concepts, ' +
        'follow_up, confidence_score (0-100), topic_drift (true/false), cited_evidence. ' +
        'cited_evidence must contain citation ids that support the evaluation. ' +
        'Do not include any extra text.',
    },
  ];
};

export const formatEvaluationForClient = <T extends EvaluationRecord>(
  evaluation: T
) => {
  const metadata = asRecord(evaluation.metadata);
  const citations = Array.isArray(metadata.citations)
    ? (metadata.citations as CitationPayload[])
    : [];
  const citedEvidence = coerceStringArray(metadata.citedEvidence);
  const rubric = coerceStringArray(metadata.rubric);

  if (evaluation.type === 'ROLLING') {
    const followUp = asRecord(evaluation.followUp);
    const parsed = parseRealtimeFeedback(evaluation.content);
    const structured: RealtimeFeedbackPayload = parsed || {
      questions: coerceStringArray(followUp.questions),
      clarifications: coerceStringArray(followUp.clarifications),
      detected_gaps: coerceStringArray(evaluation.weaknesses),
      topic_drift: Boolean(evaluation.topicDrift),
      citations: citedEvidence,
    };

    return {
      ...evaluation,
      structured,
      citations,
      citedEvidence,
      rubric,
      analytics: metadata.analytics,
    };
  }

  const parsed = parseFinalEvaluation(evaluation.content);
  const structured: FinalEvaluationPayload = parsed || {
    summary: evaluation.summary || '',
    strengths: coerceStringArray(evaluation.strengths),
    weaknesses: coerceStringArray(evaluation.weaknesses),
    missed_concepts: coerceStringArray(evaluation.missedConcepts),
    follow_up: coerceStringArray(evaluation.followUp),
    confidence_score: evaluation.confidenceScore || 0,
    topic_drift: Boolean(evaluation.topicDrift),
    cited_evidence: citedEvidence,
  };

  return {
    ...evaluation,
    structured,
    citations,
    citedEvidence,
    rubric,
    analytics: metadata.analytics,
  };
};

export const maybeGenerateRealtimeFeedback = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  goal?: string;
}) => {
  if (env.ENABLE_REALTIME_FEEDBACK === false) {
    return null;
  }

  const intervalSeconds = env.LLM_ANALYSIS_INTERVAL || 30;
  const shouldRun = await shouldRunAnalysis(params.sessionId, intervalSeconds);
  if (!shouldRun) {
    return null;
  }

  return generateRealtimeFeedback(params);
};

export const generateRealtimeFeedback = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  transcriptOverride?: string;
  goal?: string;
}) => {
  const transcript = params.transcriptOverride
    ? params.transcriptOverride
    : await getTranscriptWindowText(params.sessionId);

  if (!transcript.trim()) {
    return null;
  }

  const context = await retrieveContext({
    transcript,
    subject: params.subject,
    topic: params.topic,
    resourceIds: params.resourceIds,
    limit: 5,
  });
  const rubric = getDomainRubric(params.subject);

  const completion = await generateChatCompletion(
    buildRealtimeMessages({
      transcript,
      context,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      rubric,
    }),
    { purpose: 'realtime', temperature: 0.4 }
  );
  const parsed = parseRealtimeFeedback(completion.content);
  const contextTexts = getContextTexts(context);
  const citations = getCitations(context);
  const transcriptAnalytics = analyzeTranscriptQuality({
    transcript,
    context: contextTexts,
    subject: params.subject,
    topic: params.topic,
  });

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId: params.sessionId,
      type: 'ROLLING',
      content: parsed ? JSON.stringify(parsed) : completion.content,
      weaknesses: parsed?.detected_gaps || undefined,
      followUp: parsed
        ? {
            questions: parsed.questions,
            clarifications: parsed.clarifications,
          }
        : undefined,
      topicDrift: parsed?.topic_drift ?? transcriptAnalytics.topicDrift,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
        structured: Boolean(parsed),
        rawContent: parsed ? completion.content : undefined,
        citations,
        citedEvidence: parsed?.citations || [],
        rubric,
        analytics: transcriptAnalytics,
      } as Prisma.InputJsonValue,
    },
  });

  await appendSessionEvent(params.sessionId, {
    type: 'evaluation.rolling',
    timestamp: new Date().toISOString(),
    payload: {
      evaluationId: evaluation.id,
      contextCount: context.length,
      citations,
      analytics: transcriptAnalytics,
    },
  });

  await trackAnalyticsEvent({
    event: 'evaluation.rolling',
    sessionId: params.sessionId,
    payload: {
      evaluationId: evaluation.id,
      contextCount: context.length,
      structured: Boolean(parsed),
      citations,
      analytics: transcriptAnalytics,
    },
  });

  return formatEvaluationForClient(evaluation);
};

export const generateFinalEvaluation = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  transcriptOverride?: string;
  goal?: string;
}) => {
  if (env.ENABLE_FINAL_EVALUATION === false) {
    return null;
  }

  const transcript = params.transcriptOverride
    ? params.transcriptOverride
    : await getSessionTranscriptText(params.sessionId);

  if (!transcript.trim()) {
    return null;
  }

  const context = await retrieveContext({
    transcript,
    subject: params.subject,
    topic: params.topic,
    resourceIds: params.resourceIds,
    limit: 8,
  });
  const rubric = getDomainRubric(params.subject);

  const completion = await generateChatCompletion(
    buildFinalMessages({
      transcript,
      context,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      rubric,
    }),
    { purpose: 'final', temperature: 0.3 }
  );

  const parsed = parseFinalEvaluation(completion.content);
  const contextTexts = getContextTexts(context);
  const citations = getCitations(context);
  const transcriptAnalytics = analyzeTranscriptQuality({
    transcript,
    context: contextTexts,
    subject: params.subject,
    topic: params.topic,
  });
  const confidenceScore =
    parsed?.confidence_score ??
    Math.round(
      transcriptAnalytics.conceptCoverage * 0.4 +
        transcriptAnalytics.explanationDepth * 0.3 +
        transcriptAnalytics.semanticConsistency * 0.2 +
        transcriptAnalytics.speakingConfidence * 0.1
    );
  const topicDrift = parsed?.topic_drift ?? transcriptAnalytics.topicDrift;

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId: params.sessionId,
      type: 'FINAL',
      content: completion.content,
      summary: parsed?.summary || null,
      strengths: parsed?.strengths || undefined,
      weaknesses: parsed?.weaknesses || undefined,
      missedConcepts: parsed?.missed_concepts || undefined,
      followUp: parsed?.follow_up || undefined,
      confidenceScore,
      topicDrift,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
        parsed: Boolean(parsed),
        rawContent: parsed ? completion.content : undefined,
        citations,
        citedEvidence: parsed?.cited_evidence || [],
        rubric,
        analytics: transcriptAnalytics,
      } as Prisma.InputJsonValue,
    },
  });

  await appendSessionEvent(params.sessionId, {
    type: 'evaluation.final',
    timestamp: new Date().toISOString(),
    payload: {
      evaluationId: evaluation.id,
      confidenceScore,
      citations,
      analytics: transcriptAnalytics,
    },
  });

  await trackAnalyticsEvent({
    event: 'evaluation.final',
    sessionId: params.sessionId,
    payload: {
      evaluationId: evaluation.id,
      confidenceScore,
      topicDrift,
      citations,
      analytics: transcriptAnalytics,
    },
  });

  return formatEvaluationForClient(evaluation);
};

export const getLatestFinalEvaluation = async (sessionId: string) =>
  prisma.evaluation.findFirst({
    where: { sessionId, type: 'FINAL' },
    orderBy: { createdAt: 'desc' },
  });

export const ensureFinalEvaluation = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  goal?: string;
}) => {
  const existing = await getLatestFinalEvaluation(params.sessionId);
  if (existing) {
    return formatEvaluationForClient(existing);
  }

  return generateFinalEvaluation({
    sessionId: params.sessionId,
    subject: params.subject,
    topic: params.topic,
    resourceIds: params.resourceIds,
    goal: params.goal,
  });
};
