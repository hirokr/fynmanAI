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
