import prisma from '#src/config/database.ts';
import { Prisma } from '#src/generated/client.ts';
import {
  generateChatCompletion,
  type ChatMessage,
} from '#src/services/ai/ai.service.ts';
import type { RetrievedContextChunk } from '#src/services/retrieval.service.ts';
import {
  resolveAiContext,
  formatSessionScopeInstructions,
  getSessionScopeAvailability,
  type SessionResourceContext,
} from '#src/services/session-context.service.ts';
import { getSessionMetadata } from '#src/services/session-cache.service.ts';
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
import logger from '#config/logger.ts';

type PromptModule = {
  startPrompt: string;
  realTimePrompt: string;
  endPrompt: string;
};

const promptModuleUrl = new URL('../../modifiedprompt.ts', import.meta.url).href;
let promptModulePromise: Promise<PromptModule> | null = null;

const loadSessionResources = async (
  sessionId?: string,
  provided?: SessionResourceContext[]
): Promise<SessionResourceContext[]> => {
  if (provided?.length) {
    return provided;
  }

  if (!sessionId) {
    return [];
  }

  const metadata = await getSessionMetadata(sessionId);
  return metadata?.resources || [];
};

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
  question: string;
  clarifications: string[];
  detected_gaps: string[];
  topic_drift: boolean;
  citations: string[];
};

type LearningConversationEntry = {
  role: 'user' | 'assistant';
  content: string;
};

type LearningSessionState = {
  currentQuestion?: string | null;
  currentConceptId?: string | null;
  questionDepth?: number;
  failedAttempts?: number;
  detectedGaps?: string[];
  masteredConcepts?: string[];
  conversationHistory?: LearningConversationEntry[];
  finalSummary?: unknown;
  showSummaryCard?: boolean;
  triggerMasteryFallback?: boolean;
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
  try {
    return JSON.parse(value) as Record<string, unknown>;
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

const normalizeSessionState = (state?: LearningSessionState) => ({
  currentQuestion: state?.currentQuestion ?? null,
  currentConceptId: state?.currentConceptId ?? null,
  questionDepth: state?.questionDepth ?? 0,
  failedAttempts: state?.failedAttempts ?? 0,
  detectedGaps: coerceStringArray(state?.detectedGaps),
  masteredConcepts: coerceStringArray(state?.masteredConcepts),
  conversationHistory: Array.isArray(state?.conversationHistory)
    ? state!.conversationHistory!
        .filter(
          entry =>
            entry &&
            (entry.role === 'user' || entry.role === 'assistant') &&
            typeof entry.content === 'string'
        )
        .slice(-12)
    : [],
  finalSummary: state?.finalSummary ?? null,
  showSummaryCard: Boolean(state?.showSummaryCard),
  triggerMasteryFallback: Boolean(state?.triggerMasteryFallback),
});

const formatSessionState = (state?: LearningSessionState): string =>
  JSON.stringify(normalizeSessionState(state), null, 2);

const getLatestUserMessage = (state?: LearningSessionState): string => {
  const history = normalizeSessionState(state).conversationHistory;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];
    if (entry.role === 'user' && entry.content.trim()) {
      return entry.content.trim();
    }
  }

  return '';
};

const buildConceptAttemptsSummary = (state?: LearningSessionState): string => {
  const normalized = normalizeSessionState(state);
  return JSON.stringify(
    {
      currentQuestion: normalized.currentQuestion,
      currentConceptId: normalized.currentConceptId,
      questionDepth: normalized.questionDepth,
      failedAttempts: normalized.failedAttempts,
      detectedGaps: normalized.detectedGaps,
      masteredConcepts: normalized.masteredConcepts,
      conversationTurns: normalized.conversationHistory.length,
      triggerMasteryFallback: normalized.triggerMasteryFallback,
    },
    null,
    2
  );
};

const parseRealtimeFeedback = (raw: string): RealtimeFeedbackPayload | null => {
  const parsed = extractJson(raw);
  if (!parsed) {
    return null;
  }

  const questionFromArray = coerceStringArray(parsed.questions)[0] || '';
  const question =
    typeof parsed.question === 'string' ? parsed.question.trim() : questionFromArray.trim();
  if (!question) {
    return null;
  }

  if (Array.isArray(parsed.question)) {
    return null;
  }

  const payload = {
    question,
    clarifications: coerceStringArray(parsed.clarifications),
    detected_gaps: coerceStringArray(parsed.detected_gaps),
    topic_drift: coerceBoolean(parsed.topic_drift),
    citations: coerceStringArray(parsed.citations),
  };

  return payload;
};

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

const truncateText = (value: string, maxLength: number): string => {
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}...`;
};

const fallbackRealtimeFeedback = (raw: string): RealtimeFeedbackPayload => {
  return {
    question:
      truncateText(raw, 500) ||
      'Can you explain the core idea again and connect it to the learning resource?',
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

const formatChunkBlock = (chunks: RetrievedContextChunk[]): string => {
  if (!chunks.length) {
    return 'None provided.';
  }

  return chunks
    .map(
      chunk =>
        `[${chunk.citationId}] resource=${chunk.resourceTitle || chunk.resourceId || 'unknown'} ` +
        `chunk=${chunk.chunkIndex ?? 'n/a'} score=${chunk.score ?? 'n/a'}\n` +
        chunk.text
    )
    .join('\n---\n');
};

const formatContext = (context: RetrievedContextChunk[]): string => {
  if (!context.length) {
    return 'No learning materials provided.';
  }

  const parsedChunks = context.filter(
    chunk => chunk.sourceMetadata?.source === 'parsedText'
  );
  const supplementalChunks = context.filter(
    chunk => chunk.sourceMetadata?.source !== 'parsedText'
  );

  if (!supplementalChunks.length) {
    return `Uploaded file content (parsed data):\n${formatChunkBlock(parsedChunks)}`;
  }

  return (
    `Uploaded file content (parsed data):\n${formatChunkBlock(parsedChunks)}\n\n` +
    `Supplemental retrieval (optional):\n${formatChunkBlock(supplementalChunks)}`
  );
};

const buildScopeBlock = (params: {
  sessionResources?: SessionResourceContext[];
  subject?: string;
  topic?: string;
}): string => {
  const availability = getSessionScopeAvailability({
    sessionResources: params.sessionResources,
    subject: params.subject,
    topic: params.topic,
  });

  const subjectLine = params.subject?.trim()
    ? `Subject: ${params.subject.trim()}`
    : 'Subject: (not provided)';
  const topicLine = params.topic?.trim()
    ? `Topic: ${params.topic.trim()}`
    : 'Topic: (not provided)';
  const fileLine = availability.hasParsedData
    ? `Uploaded file content: provided (${params.sessionResources?.length || 0} resource(s))`
    : 'Uploaded file content: (not provided)';

  return `${subjectLine}\n${topicLine}\n${fileLine}\n\n${formatSessionScopeInstructions(availability)}`;
};

const formatRubric = (rubric: string[]): string =>
  rubric.length
    ? rubric.map((item, index) => `${index + 1}. ${item}`).join('\n')
    : 'No subject-specific rubric available. Use the general Feynman criteria.';

const logLlmRequest = (params: {
  purpose: 'start' | 'realtime' | 'final';
  sessionId?: string;
  messages: ChatMessage[];
  contextCount: number;
  sessionState?: LearningSessionState;
}) => {
  logger.info('LLM request payload', {
    purpose: params.purpose,
    sessionId: params.sessionId,
    contextCount: params.contextCount,
    messages: params.messages,
    currentQuestion: params.sessionState?.currentQuestion ?? null,
    questionDepth: params.sessionState?.questionDepth ?? 0,
    failedAttempts: params.sessionState?.failedAttempts ?? 0,
    detectedGapsCount: params.sessionState?.detectedGaps?.length ?? 0,
    masteredConceptsCount: params.sessionState?.masteredConcepts?.length ?? 0,
    historyLength: params.sessionState?.conversationHistory?.length ?? 0,
  });
};

const buildRealtimeMessages = (params: {
  context: RetrievedContextChunk[];
  sessionResources?: SessionResourceContext[];
  subject?: string;
  topic?: string;
  goal?: string;
  rubric: string[];
  systemPrompt: string;
  sessionState?: LearningSessionState;
}): ChatMessage[] => {
  const contextBlock = formatContext(params.context);
  const scopeBlock = buildScopeBlock({
    sessionResources: params.sessionResources,
    subject: params.subject,
    topic: params.topic,
  });
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');
  const sessionStateBlock = formatSessionState({
    ...params.sessionState,
    triggerMasteryFallback:
      (params.sessionState?.failedAttempts ?? 0) >= 5 ||
      Boolean(params.sessionState?.triggerMasteryFallback),
  });
  const latestUserMessage = getLatestUserMessage(params.sessionState);

  return [
    {
      role: 'system',
      content:
        `${params.systemPrompt}\n` +
        'Return valid JSON only.\n' +
        'Response schema: {"question": string, "clarifications": string[], "detected_gaps": string[], "topic_drift": boolean, "citations": string[] }.\n' +
        'Never return arrays of questions. Merge internal options into one best question.',
    },
    {
      role: 'user',
      content:
        `${scopeBlock}\n\n` +
        goalBlock +
        `Current user message: ${latestUserMessage || 'none'}\n` +
        `Session memory:\n${sessionStateBlock}\n\n` +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Learning materials:\n${contextBlock}\n\n` +
        `Available citation ids: ${citationIds || 'none'}\n\n` +
        'Return JSON with keys: question (single string), clarifications (0-2 strings), ' +
        'detected_gaps (0-4 strings), topic_drift (boolean), citations (citation ids used). ' +
        'Ask exactly one question only using the question scope rules. ' +
        'Evaluate the user answer using evaluation scope rules. ' +
        'Do not teach, solve, explain, or add text outside JSON. ' +
        'If failedAttempts is 5 or more, trigger mastery fallback behavior in the answer.',
    },
  ];
};

const buildFinalMessages = (params: {
  context: RetrievedContextChunk[];
  sessionResources?: SessionResourceContext[];
  subject?: string;
  topic?: string;
  goal?: string;
  rubric: string[];
  systemPrompt: string;
  sessionState?: LearningSessionState;
}): ChatMessage[] => {
  const scopeBlock = buildScopeBlock({
    sessionResources: params.sessionResources,
    subject: params.subject,
    topic: params.topic,
  });
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const sessionStateBlock = formatSessionState(params.sessionState);
  const conceptAttemptsSummary = buildConceptAttemptsSummary(params.sessionState);
  const contextBlock = formatContext(params.context);
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');

  return [
    {
      role: 'system',
      content:
        `${params.systemPrompt}\n` +
        'Return valid JSON only.\n' +
        'Do not use markdown. Do not include code fences. Do not include transcript text.',
    },
    {
      role: 'user',
      content:
        `${scopeBlock}\n\n` +
        goalBlock +
        `Session memory:\n${sessionStateBlock}\n\n` +
        `Concept attempts summary:\n${conceptAttemptsSummary}\n\n` +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Learning materials:\n${contextBlock}\n\n` +
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
  sessionResources?: SessionResourceContext[];
  rubric: string[];
  systemPrompt: string;
  sessionState?: LearningSessionState;
}): ChatMessage[] => {
  const scopeBlock = buildScopeBlock({
    sessionResources: params.sessionResources,
    subject: params.subject,
    topic: params.topic,
  });
  const goalBlock = params.goal ? `Learning goal: ${params.goal}\n` : '';
  const contextBlock = formatContext(params.context);
  const citationIds = params.context.map(chunk => chunk.citationId).join(', ');
  const sessionStateBlock = formatSessionState(params.sessionState);

  return [
    {
      role: 'system',
      content:
        `${params.systemPrompt}\n` +
        'Return valid JSON only.\n' +
        'Response schema: {"question": string, "clarifications": string[], "detected_gaps": string[], "topic_drift": boolean, "citations": string[] }.\n' +
        'Never return questions arrays.',
    },
    {
      role: 'user',
      content:
        `${scopeBlock}\n\n` +
        goalBlock +
        `Session memory:\n${sessionStateBlock}\n\n` +
        `Rubric:\n${formatRubric(params.rubric)}\n\n` +
        `Learning materials:\n${contextBlock}\n\n` +
        `Available citation ids: ${citationIds || 'none'}\n\n` +
        'The learning session is starting now. Return one concise opening probing question only. ' +
        'Follow the question scope rules for what to ask.',
    },
  ];
};

export const generateSessionStartResponse = async (params: {
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
  sessionResources?: SessionResourceContext[];
  sessionState?: LearningSessionState;
}) => {
  const contextQuery = [params.topic, params.subject, params.goal]
    .filter(Boolean)
    .join(' ');
  const sessionResources = params.sessionResources || [];
  const context = await resolveAiContext({
    transcript: contextQuery,
    subject: params.subject,
    topic: params.topic,
    sessionResources,
    qdrantLimit: 2,
  });
  const { startPrompt } = await loadPrompts();
  const messages = buildStartMessages({
    subject: params.subject,
    topic: params.topic,
    goal: params.goal,
    context,
    sessionResources,
    rubric: getDomainRubric(params.subject),
    systemPrompt: startPrompt,
    sessionState: params.sessionState,
  });

  logLlmRequest({
    purpose: 'start',
    messages,
    contextCount: context.length,
    sessionState: params.sessionState,
  });

  const completion = await generateChatCompletion(
    messages,
    { purpose: 'default', temperature: 0.3, maxTokens: 180 }
  );

  const parsed = parseRealtimeFeedback(completion.content);
  const structured = parsed || fallbackRealtimeFeedback(completion.content);

  return {
    content: JSON.stringify({ question: structured.question }),
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

  if (evaluation.type === 'ROLLING') {
    const followUp = asRecord(evaluation.followUp);
    const parsed = parseRealtimeFeedback(evaluation.content);
    const persistedFallback: RealtimeFeedbackPayload = {
      question:
        typeof followUp.question === 'string'
          ? followUp.question
          : coerceStringArray(followUp.questions)[0] ||
            'Can you explain the core idea again and connect it to the learning resource?',
      clarifications: coerceStringArray(followUp.clarifications),
      detected_gaps: coerceStringArray(evaluation.weaknesses),
      topic_drift: Boolean(evaluation.topicDrift),
      citations: citedEvidence,
    };
    const structured: RealtimeFeedbackPayload =
      parsed ||
      (persistedFallback.question.trim()
        ? persistedFallback
        : fallbackRealtimeFeedback(evaluation.content));

    return {
      ...evaluation,
      structured,
      citations,
      citedEvidence,
      rubric,
      rawContent: JSON.stringify(structured),
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
    rawContent: JSON.stringify(structured),
    analytics: metadata.analytics,
  };
};

export const maybeGenerateRealtimeFeedback = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  sessionResources?: SessionResourceContext[];
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
  sessionResources?: SessionResourceContext[];
  transcriptOverride?: string;
  goal?: string;
  sessionState?: LearningSessionState;
}) => {
  const latestUserMessage = getLatestUserMessage(params.sessionState);
  const userMessage =
    latestUserMessage || params.transcriptOverride || (await getTranscriptWindowText(params.sessionId));

  if (!userMessage.trim() && !params.sessionState?.conversationHistory?.length) {
    return null;
  }

  const sessionResources = await loadSessionResources(
    params.sessionId,
    params.sessionResources
  );
  const context = await resolveAiContext({
    transcript: userMessage,
    subject: params.subject,
    topic: params.topic,
    sessionResources,
    qdrantLimit: 3,
  });
  const rubric = getDomainRubric(params.subject);
  const { realTimePrompt } = await loadPrompts();
  const messages = buildRealtimeMessages({
    context,
    sessionResources,
    subject: params.subject,
    topic: params.topic,
    goal: params.goal,
    rubric,
    systemPrompt: realTimePrompt,
    sessionState: params.sessionState,
  });

  logLlmRequest({
    purpose: 'realtime',
    sessionId: params.sessionId,
    messages,
    contextCount: context.length,
    sessionState: params.sessionState,
  });

  const completion = await generateChatCompletion(
    messages,
    { purpose: 'realtime', temperature: 0.4 }
  );
  const parsed = parseRealtimeFeedback(completion.content);
  const structured = parsed || fallbackRealtimeFeedback(completion.content);
  const contextTexts = getContextTexts(context);
  const citations = getCitations(context);
  const transcriptAnalytics = analyzeTranscriptQuality({
    transcript: userMessage,
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
        question: structured.question,
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
  sessionResources?: SessionResourceContext[];
  transcriptOverride?: string;
  goal?: string;
  sessionState?: LearningSessionState;
}) => {
  if (env.ENABLE_FINAL_EVALUATION === false) {
    return null;
  }

  const sessionMemory = normalizeSessionState(params.sessionState);
  if (!sessionMemory.conversationHistory.length && !sessionMemory.currentQuestion) {
    return null;
  }

  const sessionResources = await loadSessionResources(
    params.sessionId,
    params.sessionResources
  );
  const context = await resolveAiContext({
    transcript: [
      sessionMemory.currentQuestion,
      ...sessionMemory.conversationHistory.map(entry => entry.content),
    ]
      .filter(Boolean)
      .slice(-12)
      .join(' \n'),
    subject: params.subject,
    topic: params.topic,
    sessionResources,
    qdrantLimit: 3,
  });
  const rubric = getDomainRubric(params.subject);
  const { endPrompt } = await loadPrompts();
  const messages = buildFinalMessages({
    context,
    sessionResources,
    subject: params.subject,
    topic: params.topic,
    goal: params.goal,
    rubric,
    systemPrompt: endPrompt,
    sessionState: params.sessionState,
  });

  logger.info('Final evaluation session memory snapshot', {
    sessionId: params.sessionId,
    historyLength: params.sessionState?.conversationHistory?.length ?? 0,
    masteredConceptsCount: params.sessionState?.masteredConcepts?.length ?? 0,
    detectedGapsCount: params.sessionState?.detectedGaps?.length ?? 0,
    failedAttempts: params.sessionState?.failedAttempts ?? 0,
    questionDepth: params.sessionState?.questionDepth ?? 0,
  });

  logLlmRequest({
    purpose: 'final',
    sessionId: params.sessionId,
    messages,
    contextCount: context.length,
    sessionState: params.sessionState,
  });

  const completion = await generateChatCompletion(
    messages,
    { purpose: 'final', temperature: 0.2, maxTokens: 750 }
  );

  const parsed = parseFinalEvaluation(completion.content);
  const structured = parsed || fallbackFinalEvaluation(completion.content);
  const contextTexts = getContextTexts(context);
  const citations = getCitations(context);
  const transcriptAnalytics = analyzeTranscriptQuality({
    transcript: sessionMemory.conversationHistory.map(entry => entry.content).join(' '),
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

  return {
    ...formatEvaluationForClient(evaluation),
    rawContent: JSON.stringify(structured),
  };
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
  sessionResources?: SessionResourceContext[];
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
    sessionResources: params.sessionResources,
    goal: params.goal,
  });
};
