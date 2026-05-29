import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import {
  createSession,
  endSession,
  getSessionById,
} from '#src/services/session.service.ts';
import { handleTextInput } from '#src/services/text-input.service.ts';
import { transcribeAudioBuffer } from '#src/services/stt.service.ts';
import { maybeGenerateRealtimeFeedback } from '#src/services/evaluation.service.ts';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';
import { audioProcessingQueue } from '#src/queues/audio-processing.queue.ts';
import {
  processAudioChunk,
  type AudioChunkProcessResult,
} from '#src/services/audio-processing.service.ts';
import {
  applyRateLimit,
  rateLimitPresets,
} from '#src/middlewares/rate-limit.middleware.ts';

type AudioPayloadValidation =
  | { ok: true; sequence?: number; startTimeMs?: number; endTimeMs?: number }
  | { ok: false; error: string };

const getTokenFromSocket = (socket: Socket): string | null => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === 'string' && authToken.length) {
    return authToken;
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.split(' ')[1];
  }

  return null;
};

const getOwnedSession = async (sessionId: string, userId: string) => {
  const session = await getSessionById(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }

  return session;
};

const registerSocketEventAliases = (
  socket: Socket,
  aliases: string[],
  handler: (payload: any, cb?: (response: unknown) => void) => Promise<void>
) => {
  aliases.forEach(eventName => {
    socket.on(eventName, (payload, cb) => {
      void handler(payload, cb);
    });
  });
};

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const validateAudioPayload = (
  socket: Socket,
  sessionId: string,
  payload: any
): AudioPayloadValidation => {
  const startTimeMs = asFiniteNumber(payload?.startTimeMs);
  const endTimeMs = asFiniteNumber(payload?.endTimeMs);
  const durationMs =
    asFiniteNumber(payload?.durationMs) ??
    (startTimeMs !== undefined && endTimeMs !== undefined
      ? endTimeMs - startTimeMs
      : undefined);

  const minDurationMs = env.AUDIO_MIN_CHUNK_DURATION_MS || 250;
  const maxDurationMs =
    env.AUDIO_MAX_CHUNK_DURATION_MS ||
    Math.max(1, env.AUDIO_CHUNK_DURATION || 5) * 1000;

  if (durationMs !== undefined) {
    if (durationMs < minDurationMs) {
      return { ok: false, error: 'Audio chunk duration is too short' };
    }

    if (durationMs > maxDurationMs) {
      return { ok: false, error: 'Audio chunk duration is too long' };
    }
  }

  if (
    startTimeMs !== undefined &&
    endTimeMs !== undefined &&
    endTimeMs <= startTimeMs
  ) {
    return {
      ok: false,
      error: 'Audio chunk endTimeMs must be after startTimeMs',
    };
  }

  const sequence = asFiniteNumber(payload?.sequence ?? payload?.chunkIndex);
  if (sequence !== undefined) {
    const sequenceMap =
      (socket.data.lastAudioSequenceBySession as Record<string, number>) || {};
    const previousSequence = sequenceMap[sessionId];

    if (previousSequence !== undefined && sequence <= previousSequence) {
      return { ok: false, error: 'Audio chunk sequence is out of order' };
    }

    socket.data.lastAudioSequenceBySession = {
      ...sequenceMap,
      [sessionId]: sequence,
    };
  }

  const silenceThreshold = env.AUDIO_SILENCE_THRESHOLD;
  const audioLevel = asFiniteNumber(payload?.audioLevel ?? payload?.rms);
  if (
    silenceThreshold !== undefined &&
    audioLevel !== undefined &&
    audioLevel <= silenceThreshold
  ) {
    return { ok: false, error: 'Audio chunk skipped because it is silent' };
  }

  return { ok: true, sequence, startTimeMs, endTimeMs };
};

const enforceSocketRateLimit = async (params: {
  socket: Socket;
  sessionId?: string;
  eventName: string;
  audio?: boolean;
}): Promise<{ ok: true } | { ok: false; error: string }> => {
  const identity = [
    params.socket.data.userId || 'anonymous',
    params.sessionId || params.socket.id,
    params.eventName,
  ].join(':');
  const result = await applyRateLimit(
    identity,
    params.audio ? rateLimitPresets.audio : rateLimitPresets.websocket
  );

  if (result.allowed) {
    return { ok: true };
  }

  return {
    ok: false,
    error: `Rate limit exceeded. Retry after ${Math.max(
      1,
      Math.ceil((result.resetAt - Date.now()) / 1000)
    )} seconds.`,
  };
};

const emitAudioProcessingResult = (
  io: Server,
  result: AudioChunkProcessResult
) => {
  if (result.chunk) {
    io.to(result.sessionId).emit('transcript:chunk', {
      sessionId: result.sessionId,
      chunk: result.chunk,
    });
    io.to(result.sessionId).emit('transcript_update', {
      sessionId: result.sessionId,
      chunk: result.chunk,
    });
  }

  if (result.evaluation) {
    io.to(result.sessionId).emit('analysis:question', {
      sessionId: result.sessionId,
      evaluation: result.evaluation,
    });
    io.to(result.sessionId).emit('probing_question', {
      sessionId: result.sessionId,
      evaluation: result.evaluation,
    });
  }
};

export const registerRealtimeSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocket(socket);
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = await verifyAccessToken(token);
      if (!payload?.userId) {
        return next(new Error('Unauthorized'));
      }

      socket.data.userId = payload.userId;
      socket.data.sessionId = payload.sessionId;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', socket => {
    const handleSessionStart = async (payload: any, cb?: any) => {
      try {
        const rateLimit = await enforceSocketRateLimit({
          socket,
          eventName: 'session:start',
        });
        if (rateLimit.ok === false) {
          cb?.({ ok: false, error: rateLimit.error });
          return;
        }

        const session = await createSession({
          userId: socket.data.userId,
          subject: payload?.subject,
          topic: payload?.topic,
          goal: payload?.goal,
          resourceIds: payload?.resourceIds,
        });

        socket.join(session.id);
        cb?.({ ok: true, session });
      } catch (error) {
        cb?.({ ok: false, error: 'Failed to start session' });
      }
    };

    const handleSessionEnd = async (payload: any, cb?: any) => {
      try {
        if (!payload?.sessionId) {
          cb?.({ ok: false, error: 'sessionId is required' });
          return;
        }

        const session = await getOwnedSession(
          payload.sessionId,
          socket.data.userId
        );
        if (!session) {
          cb?.({ ok: false, error: 'Session not found' });
          return;
        }

        const rateLimit = await enforceSocketRateLimit({
          socket,
          sessionId: payload.sessionId,
          eventName: 'session:end',
        });
        if (rateLimit.ok === false) {
          cb?.({ ok: false, error: rateLimit.error });
          return;
        }

        await endSession(payload.sessionId);
        const finalEvaluation = await ensureFinalEvaluation({
          sessionId: payload.sessionId,
          subject: session.subject || undefined,
          topic: session.topic || undefined,
          resourceIds: session.resources.map(item => item.resourceId),
          goal: session.goal || undefined,
        });

        if (finalEvaluation) {
          io.to(payload.sessionId).emit('session:summary', {
            sessionId: payload.sessionId,
            evaluation: finalEvaluation,
          });
          io.to(payload.sessionId).emit('session_summary', {
            sessionId: payload.sessionId,
            evaluation: finalEvaluation,
          });
        }

        cb?.({ ok: true, evaluation: finalEvaluation });
      } catch (error) {
        cb?.({ ok: false, error: 'Failed to end session' });
      }
    };

    const handleAudioChunk = async (payload: any, cb?: any) => {
      try {
        const sessionId = payload?.sessionId;
        const audioBase64 = payload?.audioBase64 || payload?.audio_chunk;
        if (!sessionId || !audioBase64) {
          cb?.({ ok: false, error: 'sessionId and audioBase64 are required' });
          return;
        }

        const session = await getOwnedSession(sessionId, socket.data.userId);
        if (!session) {
          cb?.({ ok: false, error: 'Session not found' });
          return;
        }
        socket.join(sessionId);

        const rateLimit = await enforceSocketRateLimit({
          socket,
          sessionId,
          eventName: 'audio:chunk',
          audio: true,
        });
        if (rateLimit.ok === false) {
          cb?.({ ok: false, error: rateLimit.error });
          return;
        }

        const buffer = Buffer.from(audioBase64, 'base64');
        const maxBytes = env.AUDIO_MAX_CHUNK_BYTES || 2 * 1024 * 1024;
        if (!buffer.length) {
          cb?.({ ok: false, error: 'Audio chunk is empty' });
          return;
        }

        if (buffer.length > maxBytes) {
          cb?.({ ok: false, error: 'Audio chunk is too large' });
          return;
        }

        const validation = validateAudioPayload(socket, sessionId, payload);
        if (validation.ok === false) {
          cb?.({ ok: false, error: validation.error });
          return;
        }

        const speakerLabel =
          payload?.speakerLabel || payload?.speaker || payload?.role || 'User';
        const audioJob = {
          sessionId,
          userId: socket.data.userId,
          audioBase64,
          fileName: payload?.fileName || `chunk-${Date.now()}.webm`,
          mimeType: payload?.mimeType,
        });

        const chunk = await appendTranscriptChunk({
          sessionId,
          text: transcript.text,
          startTimeMs: payload?.startTimeMs,
          endTimeMs: payload?.endTimeMs,
        });

        io.to(sessionId).emit('transcript:chunk', {
          sessionId,
          chunk,
        });

        const session = await getSessionById(sessionId);
        if (session) {
          const evaluation = await maybeGenerateRealtimeFeedback({
            sessionId,
            error: error instanceof Error ? error.message : String(error),
          });
          cb?.({ ok: true, queued: true, jobId: job.id });
        }
      } catch (error) {
        logger.error(`Realtime audio chunk failed: ${String(error)}`);
        cb?.({ ok: false, error: 'Failed to process audio chunk' });
      }
    });

    socket.on('text:input', async (payload, cb) => {
      try {
        const sessionId = payload?.sessionId;
        const text = payload?.text;

        if (!sessionId || !text) {
          cb?.({ ok: false, error: 'sessionId and text are required' });
          return;
        }

        await handleTextInput({
          sessionId,
          userId: socket.data.userId,
          text,
        });

        cb?.({ ok: true });
      } catch (error) {
        logger.error(`Realtime text input failed: ${String(error)}`);
        cb?.({ ok: false, error: 'Failed to process text input' });
      }
    });
  });
};
