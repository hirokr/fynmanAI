import {
  retrieveContext,
  type RetrievedContextChunk,
} from '#src/services/retrieval.service.ts';
import { env } from '#config/env.ts';
import logger from '#config/logger.ts';

export type SessionResourceContext = {
  id: string;
  title?: string;
  parsedText?: string;
};

const MAX_PARSED_CHARS_PER_RESOURCE = 12_000;
const MAX_TOTAL_PARSED_CHARS = 36_000;

const truncateText = (text: string, maxChars: number): string => {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}\n...[truncated]`;
};

export type SessionScopeAvailability = {
  hasParsedData: boolean;
  hasSubject: boolean;
  hasTopic: boolean;
};

export const getSessionScopeAvailability = (params: {
  sessionResources?: SessionResourceContext[];
  subject?: string;
  topic?: string;
}): SessionScopeAvailability => ({
  hasParsedData: Boolean(
    params.sessionResources?.some(resource => resource.parsedText?.trim())
  ),
  hasSubject: Boolean(params.subject?.trim()),
  hasTopic: Boolean(params.topic?.trim()),
});

export const formatSessionScopeInstructions = (
  scope: SessionScopeAvailability
): string => {
  const lines = [
    'QUESTION SCOPE (ask using only what is provided):',
    scope.hasParsedData && scope.hasSubject && scope.hasTopic
      ? '- Uploaded file content + subject + topic are all provided: ask questions that connect all three.'
      : null,
    scope.hasParsedData && scope.hasSubject && !scope.hasTopic
      ? '- Uploaded file content + subject provided: ask questions using the file and subject.'
      : null,
    scope.hasParsedData && !scope.hasSubject && scope.hasTopic
      ? '- Uploaded file content + topic provided: ask questions using the file and topic.'
      : null,
    scope.hasParsedData && !scope.hasSubject && !scope.hasTopic
      ? '- Only uploaded file content is provided: ask questions grounded ONLY in that content.'
      : null,
    !scope.hasParsedData && scope.hasSubject && scope.hasTopic
      ? '- No file content. Subject and topic provided: ask questions from subject and topic only.'
      : null,
    !scope.hasParsedData && scope.hasSubject && !scope.hasTopic
      ? '- No file content. Only subject provided: ask questions within that subject.'
      : null,
    !scope.hasParsedData && !scope.hasSubject && scope.hasTopic
      ? '- No file content. Only topic provided: ask questions within that topic.'
      : null,
    !scope.hasParsedData && !scope.hasSubject && !scope.hasTopic
      ? '- No file, subject, or topic provided: ask a short general diagnostic question.'
      : null,
    '',
    'EVALUATION SCOPE (judging the user answer):',
    '- Judge using your own general knowledge plus uploaded file content when it is provided.',
    '- Do NOT invent facts that contradict the uploaded file content.',
    '- Subject/topic guide what to ask about; they are not automatic proof the answer is wrong unless the question was explicitly about them.',
    scope.hasParsedData
      ? '- When file content exists, prefer it over assumptions when checking factual claims.'
      : '- When no file content exists, evaluate within the subject/topic scope used for your question.',
  ];

  return lines.filter(Boolean).join('\n');
};

export const buildContextFromParsedResources = (
  resources: SessionResourceContext[]
): RetrievedContextChunk[] => {
  let remaining = MAX_TOTAL_PARSED_CHARS;

  return resources
    .map((resource, index) => {
      const text = resource.parsedText?.trim();
      if (!text || remaining <= 0) {
        return null;
      }

      const budget = Math.min(MAX_PARSED_CHARS_PER_RESOURCE, remaining);
      const chunkText = truncateText(text, budget);
      remaining -= chunkText.length;

      return {
        citationId: `R${index + 1}`,
        chunkId: resource.id,
        resourceId: resource.id,
        resourceTitle: resource.title,
        text: chunkText,
        sourceMetadata: { source: 'parsedText' },
      } satisfies RetrievedContextChunk;
    })
    .filter((chunk): chunk is RetrievedContextChunk => Boolean(chunk));
};

const mergeContext = (
  primary: RetrievedContextChunk[],
  supplemental: RetrievedContextChunk[]
): RetrievedContextChunk[] => {
  const seen = new Set(primary.map(chunk => chunk.text.trim()));
  const merged = [...primary];

  for (const chunk of supplemental) {
    const key = chunk.text.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push({
      ...chunk,
      citationId: `Q${merged.length + 1}`,
    });
  }

  return merged.slice(0, 10);
};

/** Primary context from client/DB parsed text; optional Qdrant semantic hits (no resourceId filter). */
export const resolveAiContext = async (params: {
  transcript?: string;
  subject?: string;
  topic?: string;
  sessionResources?: SessionResourceContext[];
  qdrantLimit?: number;
}): Promise<RetrievedContextChunk[]> => {
  const fromParsed = buildContextFromParsedResources(params.sessionResources || []);

  const query = params.transcript?.trim();
  const canQueryQdrant = Boolean(query && env.QDRANT_URL);

  if (!canQueryQdrant) {
    return fromParsed;
  }

  try {
    const fromQdrant = await retrieveContext({
      transcript: query!,
      limit: params.qdrantLimit ?? 3,
    });
    return mergeContext(fromParsed, fromQdrant);
  } catch (error) {
    logger.warn('Qdrant context lookup skipped', {
      error: error instanceof Error ? error.message : String(error),
    });
    return fromParsed;
  }
};
