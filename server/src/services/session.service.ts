import prisma from '#src/config/database.ts';
import { appendTranscriptCache } from '#src/services/transcript-cache.service.ts';
import { attachResourceToSession } from '#src/services/resource.service.ts';

type SessionStatus = 'ACTIVE' | 'ENDED';

export const createSession = async (params: {
  userId: string;
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
}) => {
  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      subject: params.subject,
      topic: params.topic,
      goal: params.goal,
    },
  });

  if (params.resourceIds?.length) {
    await attachResourceToSession(session.id, params.resourceIds);
  }

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

export const getSessionById = async (sessionId: string) =>
  prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      resources: true,
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

  return chunk;
};
