import prisma from '#src/config/database.ts';
import { appendTranscriptCache } from '#src/services/transcript-cache.service.ts';
import { attachResourceToSession } from '#src/services/resource.service.ts';
import {
  appendSessionEvent,
  setSessionMetadata,
  type SessionResourceMetadata,
} from '#src/services/session-cache.service.ts';
import { normalizeDomainScope } from '#src/services/domain.service.ts';
import { trackAnalyticsEvent } from '#src/services/analytics.service.ts';

type SessionStatus = 'ACTIVE' | 'ENDED';

const normalizeScopeValue = (value?: string | null): string | undefined => {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
};

const validateSessionResources = async (params: {
  userId: string;
  resourceIds?: string[];
  resources?: SessionResourceMetadata[];
  subject?: string;
  topic?: string;
}) => {
  const idsFromPayload = (params.resources || []).map(resource => resource.id);
  const uniqueResourceIds = Array.from(
    new Set([...(params.resourceIds || []), ...idsFromPayload])
  );
  if (!uniqueResourceIds.length) {
    return;
  }

  const parsedTextById = new Map(
    (params.resources || [])
      .filter(resource => resource.parsedText?.trim())
      .map(resource => [resource.id, resource.parsedText!.trim()])
  );

  const resources = await prisma.resource.findMany({
    where: { id: { in: uniqueResourceIds } },
    select: {
      id: true,
      userId: true,
      status: true,
      subject: true,
      topic: true,
    },
  });
  const resourcesById = new Map(resources.map(resource => [resource.id, resource]));
  const missing = uniqueResourceIds.filter(id => !resourcesById.has(id));
  const foreign = resources.filter(resource => resource.userId !== params.userId);
  const notReady = resources.filter(
    resource => resource.status !== 'READY' && !parsedTextById.has(resource.id)
  );
  const subject = normalizeScopeValue(params.subject);
  const topic = normalizeScopeValue(params.topic);
  const subjectMismatches = subject
    ? resources.filter(
        resource =>
          normalizeScopeValue(resource.subject) &&
          normalizeScopeValue(resource.subject) !== subject
      )
    : [];
  const topicMismatches = topic
    ? resources.filter(
        resource =>
          normalizeScopeValue(resource.topic) &&
          normalizeScopeValue(resource.topic) !== topic
      )
    : [];

  const problems: string[] = [];
  if (missing.length) {
    problems.push(`missing: ${missing.join(', ')}`);
  }
  if (foreign.length) {
    problems.push(`not owned by user: ${foreign.map(item => item.id).join(', ')}`);
  }
  if (notReady.length) {
    problems.push(
      `not ready: ${notReady.map(item => `${item.id}(${item.status})`).join(', ')}`
    );
  }
  if (subjectMismatches.length) {
    problems.push(
      `subject mismatch: ${subjectMismatches.map(item => item.id).join(', ')}`
    );
  }
  if (topicMismatches.length) {
    problems.push(
      `topic mismatch: ${topicMismatches.map(item => item.id).join(', ')}`
    );
  }

  if (problems.length) {
    throw new Error(`Invalid session resources: ${problems.join('; ')}`);
  }
};

export const createSession = async (params: {
  userId: string;
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
  resources?: SessionResourceMetadata[];
}) => {
  const resourceIds = Array.from(
    new Set([
      ...(params.resourceIds || []),
      ...(params.resources || []).map(resource => resource.id),
    ])
  );

  await validateSessionResources({
    userId: params.userId,
    resourceIds,
    resources: params.resources,
    subject: params.subject,
    topic: params.topic,
  });

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
    },
  });

  if (resourceIds.length) {
    await attachResourceToSession(session.id, resourceIds);
  }

  const sessionResources = (params.resources || []).map(resource => ({
    id: resource.id,
    title: resource.title,
    parsedText: resource.parsedText?.trim() || undefined,
  }));

  await setSessionMetadata(session.id, {
    userId: params.userId,
    subject: params.subject,
    topic: params.topic,
    goal: params.goal,
    resourceIds,
    resources: sessionResources.length ? sessionResources : undefined,
    createdAt: new Date().toISOString(),
  });

  await appendSessionEvent(session.id, {
    type: 'session.created',
    timestamp: new Date().toISOString(),
    payload: {
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
      resourceIds,
      resourceCount: sessionResources.length,
    },
  });

  await trackAnalyticsEvent({
    event: 'session.created',
    userId: params.userId,
    sessionId: session.id,
    payload: {
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
    },
  });

  return session;
};

export const endSession = async (sessionId: string) =>
  prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'ENDED' as SessionStatus,
      endedAt: new Date(),
    },
  });

export const listSessionsForUser = async (
  userId: string,
  filters: { status?: SessionStatus } = {}
) =>
  prisma.session.findMany({
    where: {
      userId,
      status: filters.status,
    },
    orderBy: { startedAt: 'desc' },
    include: {
      _count: {
        select: {
          transcriptChunks: true,
          evaluations: true,
          resources: true,
        },
      },
      evaluations: {
        where: { type: 'FINAL' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

export const getSessionById = async (sessionId: string) =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      resources: true,
    },
  });

export const getSessionDetailById = async (sessionId: string) =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      transcriptChunks: {
        orderBy: { sequence: 'asc' },
      },
      evaluations: {
        orderBy: { createdAt: 'asc' },
      },
      resources: {
        include: {
          resource: {
            include: {
              _count: {
                select: { chunks: true },
              },
            },
          },
        },
      },
    },
  });

export const appendTranscriptChunk = async (params: {
  sessionId: string;
  text: string;
  startTimeMs?: number;
  endTimeMs?: number;
}) => {
  const count = await prisma.transcriptChunk.count({
    where: { sessionId: params.sessionId },
  });

  const chunk = await prisma.transcriptChunk.create({
    data: {
      sessionId: params.sessionId,
      sequence: count + 1,
      text: params.text,
      startTimeMs: params.startTimeMs,
      endTimeMs: params.endTimeMs,
    },
  });

  await appendTranscriptCache(params.sessionId, {
    text: params.text,
    startTimeMs: params.startTimeMs,
    endTimeMs: params.endTimeMs,
  });

  await appendSessionEvent(params.sessionId, {
    type: 'transcript.appended',
    timestamp: new Date().toISOString(),
    payload: {
      startTimeMs: params.startTimeMs,
      endTimeMs: params.endTimeMs,
      length: params.text.length,
    },
  });

  return chunk;
};

export const getSessionTranscriptText = async (
  sessionId: string
): Promise<string> => {
  const chunks = await prisma.transcriptChunk.findMany({
    where: { sessionId },
    orderBy: { sequence: 'asc' },
  });

  return chunks.map(chunk => chunk.text).join('\n');
};
