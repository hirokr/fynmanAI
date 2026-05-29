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

type PromptModule = {
  startPrompt: string;
  realTimePrompt: string;
  endPrompt: string;
};

const promptModuleUrl = new URL('../../prompts.ts', import.meta.url).href;
let promptModulePromise: Promise<PromptModule> | null = null;

const loadPrompts = async (): Promise<PromptModule> => {
  promptModulePromise =
    promptModulePromise ||
    (import(promptModuleUrl) as Promise<PromptModule>);

  return promptModulePromise;
};

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
  if (!summary.trim() || confidenceScore === null) {
    return null;
  }

  const payload = {
    summary,
    strengths: coerceStringArray(parsed.strengths),
    weaknesses: coerceStringArray(parsed.weaknesses),
    missed_concepts: coerceStringArray(parsed.missed_concepts),
    follow_up: coerceStringArray(parsed.follow_up),
    confidence_score: confidenceScore,
    topic_drift: coerceBoolean(parsed.topic_drift),
    cited_evidence: coerceStringArray(parsed.cited_evidence),
  };

  return payload;
};

const parseRealtimeFeedback = (raw: string): RealtimeFeedbackPayload | null => {
  const parsed = extractJson(raw);
  if (!parsed) {
    return null;
  }

  const payload = {
    questions: coerceStringArray(parsed.questions),
    clarifications: coerceStringArray(parsed.clarifications),
    detected_gaps: coerceStringArray(parsed.detected_gaps),
    topic_drift: coerceBoolean(parsed.topic_drift),
    citations: coerceStringArray(parsed.citations),
  };

  return payload.questions.length ? payload : null;
};

const truncateText = (value: string, maxLength: number): string => {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}...`;
};

const fallbackRealtimeFeedback = (raw: string): RealtimeFeedbackPayload => {
  const question = truncateText(raw, 500);

  return {
    questions: [
      question ||
        'Can you explain the core idea again and connect it to the learning resource?',
    ],
    clarifications: [],
    detected_gaps: [],
    topic_drift: false,
    citations: [],
  };
};

const fallbackFinalEvaluation = (raw: string): FinalEvaluationPayload => ({
  summary:
    truncateText(raw, 700) ||
    'Final evaluation could not be parsed, but the session completed.',
  strengths: [],
  weaknesses: [],
  missed_concepts: [],
  follow_up: [],
  confidence_score: 50,
  topic_drift: false,
  cited_evidence: [],
});

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
  systemPrompt: string;
}): ChatMessage[] => {
  const contextBlock = formatContext(params.context);
  const scope = [params.subject, params.topic].filter(Boolean).join(' / ');
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content: `${params.systemPrompt}\nReturn valid JSON only.`,
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
  systemPrompt: string;
}): ChatMessage[] => {
  const contextBlock = formatContext(params.context);
  const scope = [params.subject, params.topic].filter(Boolean).join(' / ');
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content: `${params.systemPrompt}\nReturn valid JSON only.`,
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

const buildStartMessages = (params: {
  subject?: string;
  topic?: string;
  goal?: string;
  context: RetrievedContextChunk[];
  rubric: string[];
  systemPrompt: string;
}): ChatMessage[] => {
  const scope = [params.subject, params.topic].filter(Boolean).join(' / ');
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const contextBlock = formatContext(params.context);
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content: params.systemPrompt,
    },
    {
      role: 'user',
      content:
        `Subject/Topic: ${scope || 'unspecified'}\n` +
        goalBlock +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Retrieved context:\n${contextBlock}\n\n` +
        `Available citation ids: ${citationIds || 'none'}\n\n` +
        'The learning session is starting now. Return one concise opening probing question only. ' +
        'Ground the question in the retrieved context when context is available.',
    },
  ];
};

export const generateSessionStartResponse = async (params: {
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
}) => {
  const contextQuery = [params.topic, params.subject, params.goal]
    .filter(Boolean)
    .join(' ');
  const context = contextQuery.trim()
    ? await retrieveContext({
        transcript: contextQuery,
        subject: params.subject,
        topic: params.topic,
        resourceIds: params.resourceIds,
        limit: 5,
      })
    : [];
  const { startPrompt } = await loadPrompts();
  const completion = await generateChatCompletion(
    buildStartMessages({
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      context,
      rubric: getDomainRubric(params.subject),
      systemPrompt: startPrompt,
    }),
    { purpose: 'realtime', temperature: 0.3, maxTokens: 180 }
  );

  return {
    content: completion.content,
    provider: completion.provider,
    model: completion.model,
    context,
  };
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
  const rawContent =
    typeof metadata.rawContent === 'string' ? metadata.rawContent : evaluation.content;

  if (evaluation.type === 'ROLLING') {
    const followUp = asRecord(evaluation.followUp);
    const parsed = parseRealtimeFeedback(evaluation.content);
    const persistedFallback: RealtimeFeedbackPayload = {
      questions: coerceStringArray(followUp.questions),
      clarifications: coerceStringArray(followUp.clarifications),
      detected_gaps: coerceStringArray(evaluation.weaknesses),
      topic_drift: Boolean(evaluation.topicDrift),
      citations: citedEvidence,
    };
    const structured: RealtimeFeedbackPayload =
      parsed ||
      (persistedFallback.questions.length
        ? persistedFallback
        : fallbackRealtimeFeedback(evaluation.content));

    return {
      ...evaluation,
      structured,
      citations,
      citedEvidence,
      rubric,
      rawContent,
      analytics: metadata.analytics,
    };
  }

  const parsed = parseFinalEvaluation(evaluation.content);
  const persistedFallback: FinalEvaluationPayload = {
    summary: evaluation.summary || '',
    strengths: coerceStringArray(evaluation.strengths),
    weaknesses: coerceStringArray(evaluation.weaknesses),
    missed_concepts: coerceStringArray(evaluation.missedConcepts),
    follow_up: coerceStringArray(evaluation.followUp),
    confidence_score: evaluation.confidenceScore || 0,
    topic_drift: Boolean(evaluation.topicDrift),
    cited_evidence: citedEvidence,
  };
  const structured: FinalEvaluationPayload =
    parsed ||
    (persistedFallback.summary.trim()
      ? persistedFallback
      : fallbackFinalEvaluation(evaluation.content));

  return {
    ...evaluation,
    structured,
    citations,
    citedEvidence,
    rubric,
    rawContent,
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
  const { realTimePrompt } = await loadPrompts();

  const completion = await generateChatCompletion(
    buildRealtimeMessages({
      transcript,
      context,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      rubric,
      systemPrompt: realTimePrompt,
    }),
    { purpose: 'realtime', temperature: 0.4 }
  );
  const parsed = parseRealtimeFeedback(completion.content);
  const structured = parsed || fallbackRealtimeFeedback(completion.content);
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
      content: JSON.stringify(structured),
      weaknesses: structured.detected_gaps,
      followUp: {
        questions: structured.questions,
        clarifications: structured.clarifications,
      },
      topicDrift: structured.topic_drift,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
        structured: Boolean(parsed),
        rawContent: completion.content,
        citations,
        citedEvidence: structured.citations,
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
  const { endPrompt } = await loadPrompts();

  const completion = await generateChatCompletion(
    buildFinalMessages({
      transcript,
      context,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      rubric,
      systemPrompt: endPrompt,
    }),
    { purpose: 'final', temperature: 0.3 }
  );

  const parsed = parseFinalEvaluation(completion.content);
  const structured = parsed || fallbackFinalEvaluation(completion.content);
  const contextTexts = getContextTexts(context);
  const citations = getCitations(context);
  const transcriptAnalytics = analyzeTranscriptQuality({
    transcript,
    context: contextTexts,
    subject: params.subject,
    topic: params.topic,
  });
  const confidenceScore = structured.confidence_score;
  const topicDrift = structured.topic_drift;

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId: params.sessionId,
      type: 'FINAL',
      content: JSON.stringify(structured),
      summary: structured.summary,
      strengths: structured.strengths,
      weaknesses: structured.weaknesses,
      missedConcepts: structured.missed_concepts,
      followUp: structured.follow_up,
      confidenceScore,
      topicDrift,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
        parsed: Boolean(parsed),
        rawContent: completion.content,
        citations,
        citedEvidence: structured.cited_evidence,
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
