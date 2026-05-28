import prisma from '#src/config/database.ts';
import {
  generateChatCompletion,
  type ChatMessage,
} from '#src/services/ai/ai.service.ts';
import { retrieveContext } from '#src/services/retrieval.service.ts';
import {
  getTranscriptWindowText,
  shouldRunAnalysis,
} from '#src/services/transcript-cache.service.ts';
import { env } from '#config/env.ts';

const buildRealtimeMessages = (params: {
  transcript: string;
  context: string[];
}): ChatMessage[] => {
  const contextBlock = params.context.length
    ? params.context.join('\n---\n')
    : 'No retrieved context.';

  return [
    {
      role: 'system',
      content:
        'You are Feynman AI, an examiner that ONLY asks probing questions. ' +
        'Never provide explanations or answers. Ask concise questions that expose gaps.',
    },
    {
      role: 'user',
      content: `Recent transcript:\n${params.transcript}\n\nRetrieved context:\n${contextBlock}\n\nRespond with 1-3 probing questions only.`,
    },
  ];
};

const buildFinalMessages = (params: {
  transcript: string;
  context: string[];
}): ChatMessage[] => {
  const contextBlock = params.context.length
    ? params.context.join('\n---\n')
    : 'No retrieved context.';

  return [
    {
      role: 'system',
      content:
        'You are Feynman AI. Provide a final mastery evaluation. ' +
        'Do not teach. Highlight gaps, misconceptions, and missing reasoning.',
    },
    {
      role: 'user',
      content: `Full transcript:\n${params.transcript}\n\nRetrieved context:\n${contextBlock}\n\nReturn a concise evaluation with: (1) strengths, (2) gaps, (3) follow-up focus.`,
    },
  ];
};

export const maybeGenerateRealtimeFeedback = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
}) => {
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

  const completion = await generateChatCompletion(
    buildRealtimeMessages({ transcript, context }),
    { purpose: 'realtime', temperature: 0.4 }
  );

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId: params.sessionId,
      type: 'ROLLING',
      content: completion.content,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
      },
    },
  });

  return evaluation;
};

export const generateFinalEvaluation = async (params: {
  sessionId: string;
  subject?: string;
  topic?: string;
  resourceIds?: string[];
  transcriptOverride?: string;
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
    limit: 8,
  });

  const completion = await generateChatCompletion(
    buildFinalMessages({ transcript, context }),
    { purpose: 'final', temperature: 0.3 }
  );

  const evaluation = await prisma.evaluation.create({
    data: {
      sessionId: params.sessionId,
      type: 'FINAL',
      content: completion.content,
      provider: completion.provider,
      model: completion.model,
      metadata: {
        contextCount: context.length,
      },
    },
  });

  return evaluation;
};
