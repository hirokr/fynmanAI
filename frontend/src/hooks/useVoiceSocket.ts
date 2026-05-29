import { createSocket } from "@/lib/socket/socket";
import { startSession } from "@/services/voice.service";
import { useVoiceStore } from "@/store/useVoiceStore";

export const useVoiceSocket = (token: string) => {
  const {
    setSocket,
    setSessionId,
    addTranscript,
    setConnected,
    setSessionReady,
    setAiFeedback,
    socket: existingSocket,
    resourceIds,
    subject,
    topic,
  } = useVoiceStore();

  const startSessionFlow = async (socket: any) => {
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
  };

  const wireSocket = (socket: any) => {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("transcript:chunk");
    socket.off("analysis:question");

    socket.on("connect", () => {
      setConnected(true);
      console.log("Socket connected", socket.id);
      startSessionFlow(socket);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setSessionReady(false);
    });

    socket.on("transcript:chunk", (data) => {
      if (data?.chunk?.text) {
        addTranscript(data.chunk.text);
      }
    });

    socket.on("analysis:question", (data) => {
      const evaluation = data?.evaluation;
      setAiFeedback(
        evaluation?.question ??
          evaluation?.text ??
          data?.question ??
          data?.text ??
          JSON.stringify(data)
      );
    });
  };

  const connect = () => {
    const socket = existingSocket ?? createSocket(token);
    setSocket(socket);
    wireSocket(socket);

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  };

  return { connect };
};