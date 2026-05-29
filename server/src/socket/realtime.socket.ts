import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '#src/utils/jwt/tokens.ts';
import {
  appendTranscriptChunk,
  createSession,
  endSession,
  getSessionById,
} from '#src/services/session.service.ts';
import { handleTextInput } from '#src/services/text-input.service.ts';
import { transcribeAudioBuffer } from '#src/services/stt.service.ts';
import { maybeGenerateRealtimeFeedback } from '#src/services/evaluation.service.ts';
import logger from '#config/logger.ts';

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
    socket.on('session:start', async (payload, cb) => {
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
    });

    socket.on('session:end', async (payload, cb) => {
      try {
        if (!payload?.sessionId) {
          cb?.({ ok: false, error: 'sessionId is required' });
          return;
        }

        await endSession(payload.sessionId);
        cb?.({ ok: true });
      } catch (error) {
        cb?.({ ok: false, error: 'Failed to end session' });
      }
    });

    socket.on('audio:chunk', async (payload, cb) => {
      try {
        const sessionId = payload?.sessionId;
        const audioBase64 = payload?.audioBase64;
        if (!sessionId || !audioBase64) {
          cb?.({ ok: false, error: 'sessionId and audioBase64 are required' });
          return;
        }

        const buffer = Buffer.from(audioBase64, 'base64');
        const transcript = await transcribeAudioBuffer({
          buffer,
          fileName: payload?.fileName || `chunk-${Date.now()}.webm`,
          mimeType: payload?.mimeType,
        });

        const chunk = await appendTranscriptChunk({
          sessionId,
          text: transcript.text,
          startTimeMs: payload?.startTimeMs,
          endTimeMs: payload?.endTimeMs,
        });

        socket.to(sessionId).emit('transcript:chunk', {
          sessionId,
          chunk,
        });

        const session = await getSessionById(sessionId);
        if (session) {
          const evaluation = await maybeGenerateRealtimeFeedback({
            sessionId,
            subject: session.subject || undefined,
            topic: session.topic || undefined,
            resourceIds: session.resources.map(item => item.resourceId),
          });

          if (evaluation) {
            io.to(sessionId).emit('analysis:question', {
              sessionId,
              evaluation,
            });
          }
        }

        cb?.({ ok: true, chunk });
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
