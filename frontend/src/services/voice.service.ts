import type { Socket } from "socket.io-client";

import type { SessionResourceContext } from "@/types/session-resource";

type SessionStartPayload = {
  subject?: string;
  topic?: string;
  goal?: string;
  resourceIds?: string[];
  resources?: SessionResourceContext[];
  sessionState?: Record<string, unknown>;
};

type SessionStartResponse = {
  ok?: boolean;
  session?: {
    id: string;
  };
  error?: string;
};

type SocketAck = {
  ok?: boolean;
  error?: string;
};

type LearningSessionPayload = {
  currentQuestion?: string | null;
  currentConceptId?: string | null;
  questionDepth?: number;
  failedAttempts?: number;
  detectedGaps?: string[];
  masteredConcepts?: string[];
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
  finalSummary?: Record<string, unknown> | null;
  showSummaryCard?: boolean;
};

export const startSession = (
  socket: Socket,
  payload: SessionStartPayload = {}
) =>
  new Promise<{ id: string }>((resolve, reject) => {
    socket.emit("session:start", payload, (res: SessionStartResponse) => {
      if (res.ok && res.session) {
        resolve(res.session);
        return;
      }

      reject(res.error || "Failed to start session");
    });
  });

export const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });

type AudioChunkOptions = {
  fileName?: string;
  mimeType?: string;
  startTimeMs?: number;
  endTimeMs?: number;
  endMessage?: string;
  sessionState?: LearningSessionPayload;
  resources?: SessionResourceContext[];
};

export const sendAudioChunk = async (
  socket: Socket,
  sessionId: string,
  blob: Blob,
  options: AudioChunkOptions = {}
) => {
  const base64 = await blobToBase64(blob);

  return new Promise<void>((resolve, reject) => {
    socket.emit("audio:chunk", {
      sessionId,
      audioBase64: base64,
      fileName: options.fileName || `chunk-${Date.now()}.webm`,
      mimeType: options.mimeType || blob.type || "audio/webm",
      startTimeMs: options.startTimeMs,
      endTimeMs: options.endTimeMs,
      endMessage: options.endMessage,
      sessionState: options.sessionState,
      resources: options.resources,
    }, (res: SocketAck) => {
      if (res?.ok) {
        resolve();
        return;
      }

      reject(new Error(res?.error || "Failed to send audio chunk"));
    });
  });
};

export const pauseUserSession = (
  socket: Socket,
  sessionId: string,
  sessionState?: LearningSessionPayload
) =>
  new Promise<void>((resolve, reject) => {
    socket.emit(
      "user:pause",
      { sessionId, sessionState },
      (res: SocketAck) => {
      if (res?.ok) {
        resolve();
        return;
      }

      reject(new Error(res?.error || "Failed to pause user session"));
      }
    );
  });

export const sendTextInput = (
  socket: Socket,
  sessionId: string,
  text: string,
  sessionState?: LearningSessionPayload,
  resources?: SessionResourceContext[]
) => {
  socket.emit("text:input", {
    sessionId,
    text,
    sessionState,
    resources,
  });
};

export const endUserSession = (
  socket: Socket,
  sessionId: string,
  sessionState?: LearningSessionPayload
) =>
  new Promise<void>((resolve, reject) => {
    socket.emit(
      "user:end",
      { sessionId, sessionState },
      (res: SocketAck) => {
      if (res?.ok) {
        resolve();
        return;
      }

      reject(new Error(res?.error || "Failed to end user session"));
      }
    );
  });
