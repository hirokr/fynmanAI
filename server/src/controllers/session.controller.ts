import { Response } from 'express';
import { AuthRequest } from '#src/types/authRequest.js';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';
import {
  appendTranscriptChunk,
  createSession,
  endSession,
  getSessionById,
} from '#src/services/session.service.ts';
import {
  generateFinalEvaluation,
  generateRealtimeFeedback,
} from '#src/services/evaluation.service.ts';

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
    return sendApiError(res, {
      status: 500,
      message: 'Failed to start session',
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
      text,
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
          })
        : await generateFinalEvaluation({
            sessionId,
            subject: session.subject || undefined,
            topic: session.topic || undefined,
            resourceIds: session.resources.map(item => item.resourceId),
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

    return sendApiSuccess(res, {
      message: 'Session ended',
      data: { session: ended },
    });
  } catch (error) {
    return sendApiError(res, {
      status: 500,
      message: 'Failed to end session',
    });
  }
};
