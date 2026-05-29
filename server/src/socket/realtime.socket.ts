import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import {
  appendTranscriptChunk,
  createSession,
  endSession,
  getSessionById,
} from '#src/services/session.service.ts';
import { transcribeAudioBuffer } from '#src/services/stt.service.ts';
import { preprocessTranscript } from '#src/services/transcript-preprocess.service.ts';
import {
  ensureFinalEvaluation,
  maybeGenerateRealtimeFeedback,
} from '#src/services/evaluation.service.ts';
import logger from '#config/logger.ts';
import { env } from '#config/env.ts';

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

        const now = Date.now();
        const windowMs = 60_000;
        const maxChunks = env.AUDIO_CHUNKS_PER_MINUTE || 60;
        const windowStart = socket.data.audioWindowStart || now;
        const elapsed = now - windowStart;
        const resetWindow = elapsed >= windowMs;

        if (!socket.data.audioWindowStart || resetWindow) {
          socket.data.audioWindowStart = now;
          socket.data.audioChunkCount = 0;
        }

        const nextCount = (socket.data.audioChunkCount || 0) + 1;
        socket.data.audioChunkCount = nextCount;

        if (nextCount > maxChunks) {
          cb?.({ ok: false, error: 'Audio chunk rate limit exceeded' });
          return;
        }

        const buffer = Buffer.from(audioBase64, 'base64');
        const transcript = await transcribeAudioBuffer({
          buffer,
          fileName: payload?.fileName || `chunk-${Date.now()}.webm`,
          mimeType: payload?.mimeType,
        });

        const speakerLabel =
          payload?.speakerLabel || payload?.speaker || payload?.role || 'User';
        const processedTranscript = preprocessTranscript(
          {
            raw: transcript.text,
            speaker: speakerLabel,
          },
          {
            speakerLabel,
          }
        );
        const cleanedText = processedTranscript.cleanedText;

        const chunk = await appendTranscriptChunk({
          sessionId,
          text: cleanedText,
          startTimeMs: payload?.startTimeMs,
          endTimeMs: payload?.endTimeMs,
        });

        socket.to(sessionId).emit('transcript:chunk', {
          sessionId,
          chunk,
        });

        const evaluation = await maybeGenerateRealtimeFeedback({
          sessionId,
          subject: session.subject || undefined,
          topic: session.topic || undefined,
          resourceIds: session.resources.map(item => item.resourceId),
          goal: session.goal || undefined,
        });

        if (evaluation) {
          io.to(sessionId).emit('analysis:question', {
            sessionId,
            evaluation,
          });
        }

        cb?.({ ok: true, chunk });
      } catch (error) {
        logger.error(`Realtime audio chunk failed: ${String(error)}`);
        cb?.({ ok: false, error: 'Failed to process audio chunk' });
      }
    };

    registerSocketEventAliases(
      socket,
      ['session:start', 'session_start'],
      handleSessionStart
    );
    registerSocketEventAliases(
      socket,
      ['session:end', 'session_end'],
      handleSessionEnd
    );
    registerSocketEventAliases(
      socket,
      ['audio:chunk', 'audio_chunk'],
      handleAudioChunk
    );
  });
};
