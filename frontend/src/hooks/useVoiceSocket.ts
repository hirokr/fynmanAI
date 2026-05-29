import { useCallback } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket/socket";
import { startSession } from "@/services/voice.service";
import { useVoiceStore } from "@/store/useVoiceStore";

type TranscriptChunkEvent = {
  chunk?: {
    text?: string;
  };
};

type AnalysisQuestionEvent = {
  evaluation?: {
    question?: string;
    text?: string;
  };
  question?: string;
  text?: string;
};

type LlmResponseEvent = {
  sessionId?: string;
  phase?: "start" | "realtime" | "end";
  content?: string;
};

export const useVoiceSocket = (token: string) => {
  const {
    setSocket,
    setSessionId,
    addTranscript,
    setConnected,
    setSessionReady,
    setAiFeedback,
    resourceIds,
    subject,
    topic,
  } = useVoiceStore();

  const startSessionFlow = useCallback(async (socket: Socket) => {
    setSessionReady(false);

    try {
      const session = await startSession(socket, {
        resourceIds: resourceIds.length ? resourceIds : undefined,
        subject: subject.trim() || undefined,
        topic: topic.trim() || undefined,
      });

      setSessionId(session.id);
      setSessionReady(true);
    } catch (err) {
      console.error("Session start failed:", err);
      setSessionReady(false);
    }
  }, [
    resourceIds,
    setSessionId,
    setSessionReady,
    subject,
    topic,
  ]);

  const wireSocket = useCallback((socket: Socket) => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("transcript:chunk");
    socket.off("analysis:question");
    socket.off("llm:response");

    socket.on("connect", () => {
      setConnected(true);
      console.log("Socket connected", socket.id);
      startSessionFlow(socket);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setSessionReady(false);
    });

    socket.on("transcript:chunk", (data: TranscriptChunkEvent) => {
      if (data?.chunk?.text) {
        addTranscript(data.chunk.text);
      }
    });

    socket.on("analysis:question", (data: AnalysisQuestionEvent) => {
      const evaluation = data?.evaluation;
      setAiFeedback(
        evaluation?.question ??
          evaluation?.text ??
          data?.question ??
          data?.text ??
          JSON.stringify(data)
      );
    });

    socket.on("llm:response", (data: LlmResponseEvent) => {
      if (data?.content) {
        setAiFeedback(data.content);
      }
    });
  }, [
    addTranscript,
    setAiFeedback,
    setConnected,
    setSessionReady,
    startSessionFlow,
  ]);

  const connect = useCallback(() => {
    const existingSocket = useVoiceStore.getState().socket;
    const socket = existingSocket ?? createSocket(token);
    setSocket(socket);
    wireSocket(socket);

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }, [setSocket, token, wireSocket]);

  return { connect };
};
