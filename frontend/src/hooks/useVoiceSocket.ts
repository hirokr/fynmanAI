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
  } = useVoiceStore();

  const startSessionFlow = async (socket: any) => {
    setSessionReady(false);

    try {
      const session = await startSession(socket);

      setSessionId(session.id);
      setSessionReady(true);
    } catch (err) {
      console.error("Session start failed:", err);
      setSessionReady(false);
    }
  };

  const connect = () => {
    const socket = createSocket(token);

    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
      startSessionFlow(socket);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setSessionReady(false);
    });

    socket.on("transcript:chunk", (data) => {
      addTranscript(data.chunk.text);
    });

    socket.on("analysis:question", (data) => {
      setAiFeedback(
        data.question ?? data.text ?? JSON.stringify(data)
      );
    });

    return socket;
  };

  return { connect };
};