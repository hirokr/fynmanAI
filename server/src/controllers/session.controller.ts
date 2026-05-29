import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  appendTranscriptChunk,
  createSession,
  endSession,
  getSessionDetailById,
  getSessionById,
  listSessionsForUser,
} from '#src/services/session.service.ts';
import { preprocessTranscriptText } from '#src/services/transcript-preprocess.service.ts';
import {
  generateFinalEvaluation,
  generateRealtimeFeedback,
  ensureFinalEvaluation,
  formatEvaluationForClient,
  getLatestFinalEvaluation,
} from '#src/services/evaluation.service.ts';

type SessionStatus = 'ACTIVE' | 'ENDED';

const isSessionStatus = (value: unknown): value is SessionStatus =>
  value === 'ACTIVE' || value === 'ENDED';

export const startSessionHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { subject, topic, goal, resourceIds } = req.body as {
      subject?: string;
      topic?: string;
      goal?: string;
      resourceIds?: string[];
    };

    const session = await createSession({
      userId: req.userId,
      subject,
      topic,
      goal,
      resourceIds,
    });

    return sendApiSuccess(res, {
      status: 201,
      message: 'Session started',
      data: { session },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('Unsupported subject') ||
        error.message.startsWith('Invalid session resources'))
    ) {
      return sendApiError(res, {
        status: 400,
        message: error.message,
      });
    }

    return sendApiError(res, {
      status: 500,
      message: 'Failed to start session',
    });
  }
};

export const listSessionsHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const status = isSessionStatus(req.query.status)
      ? req.query.status
      : undefined;
    const sessions = await listSessionsForUser(req.userId, { status });

    return sendApiSuccess(res, {
      data: { sessions },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to list sessions',
    });
  }
};

export const getSessionDetailHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const session = await getSessionDetailById(sessionId);

    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    return sendApiSuccess(res, {
      data: {
        session: {
          ...session,
          evaluations: session.evaluations.map(formatEvaluationForClient),
        },
      },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch session',
    });
  }
};

export const appendTranscriptHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const { text, startTimeMs, endTimeMs } = req.body as {
      text: string;
      startTimeMs?: number;
      endTimeMs?: number;
    };

    const session = await getSessionById(sessionId);
    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    const chunk = await appendTranscriptChunk({
      sessionId,
      text: preprocessTranscriptText(text),
      startTimeMs,
      endTimeMs,
    });

    return sendApiSuccess(res, {
      status: 201,
      message: 'Transcript appended',
      data: { chunk },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to append transcript',
    });
  }
};

export const requestRealtimeFeedbackHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const session = await getSessionById(sessionId);

    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    const evaluation = await generateRealtimeFeedback({
      sessionId,
      subject: session.subject || undefined,
      topic: session.topic || undefined,
      resourceIds: session.resources.map(item => item.resourceId),
      goal: session.goal || undefined,
    });

    return sendApiSuccess(res, {
      data: { evaluation },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to generate feedback',
    });
  }
};

export const requestFinalEvaluationHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const session = await getSessionById(sessionId);

    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    const evaluationType = (req.body?.type || 'FINAL') as 'ROLLING' | 'FINAL';

    const evaluation =
      evaluationType === 'ROLLING'
        ? await generateRealtimeFeedback({
            sessionId,
            subject: session.subject || undefined,
            topic: session.topic || undefined,
            resourceIds: session.resources.map(item => item.resourceId),
            goal: session.goal || undefined,
          })
        : await generateFinalEvaluation({
            sessionId,
            subject: session.subject || undefined,
            topic: session.topic || undefined,
            resourceIds: session.resources.map(item => item.resourceId),
            goal: session.goal || undefined,
          });

    return sendApiSuccess(res, {
      data: { evaluation },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to generate evaluation',
    });
  }
};

export const endSessionHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const session = await getSessionById(sessionId);

    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    const ended = await endSession(sessionId);
    const finalEvaluation = await ensureFinalEvaluation({
      sessionId,
      subject: session.subject || undefined,
      topic: session.topic || undefined,
      resourceIds: session.resources.map(item => item.resourceId),
      goal: session.goal || undefined,
    });

    return sendApiSuccess(res, {
      message: 'Session ended',
      data: { session: ended, evaluation: finalEvaluation },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to end session',
    });
  }
};

export const getSessionReportHandler = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const { sessionId } = req.params as { sessionId: string };
    const session = await getSessionById(sessionId);

    if (!session || session.userId !== req.userId) {
      return sendApiError(res, { status: 404, message: 'Session not found' });
    }

    const evaluation = await getLatestFinalEvaluation(sessionId);
    if (!evaluation) {
      return sendApiError(res, {
        status: 404,
        message: 'Final evaluation not available',
      });
    }

    return sendApiSuccess(res, {
      data: { evaluation },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch session report',
    });
  }
};
