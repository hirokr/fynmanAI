import { create } from "zustand";
import { Socket } from "socket.io-client";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
};

type State = {
  socket: Socket | null;
  sessionId: string | null;
  connected: boolean;
  sessionReady: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  hasAiResponded: boolean;
  transcripts: string[];
  aiFeedback: string | null;
  messages: ChatMessage[];
  resourceIds: string[];
  subject: string;
  topic: string;

  setSocket: (s: Socket) => void;
  setSessionId: (id: string) => void;
  addTranscript: (text: string, options?: { optimistic?: boolean }) => void;
  setConnected: (v: boolean) => void;
  setSessionReady: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  setHasAiResponded: (v: boolean) => void;
  setAiFeedback: (text: string) => void;
  addResourceId: (id: string) => void;
  setResourceIds: (ids: string[]) => void;
  setSubject: (value: string) => void;
  setTopic: (value: string) => void;
  resetSessionState: () => void;
};

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  content,
  timestamp: Date.now(),
});

export const useVoiceStore = create<State>((set) => ({
  socket: null,
  sessionId: null,
  connected: false,
  sessionReady: false,
  isRecording: false,
  isProcessing: false,
  hasAiResponded: false,
  transcripts: [],
  aiFeedback: null,
  messages: [],
  resourceIds: [],
  subject: "",
  topic: "",

  setSocket: (socket) => set({ socket }),
  setSessionId: (sessionId) => set({ sessionId }),
  addTranscript: (text, options) => {
    const content = text.trim();

    if (!content) {
      return;
    }

    set((state) => {
      const isOptimistic = options?.optimistic === true;
      const latestMessage = state.messages.at(-1);
      const isDuplicateEcho =
        !isOptimistic &&
        latestMessage?.role === "user" &&
        latestMessage.content === content &&
        state.transcripts.at(-1) === content;

      return {
        transcripts: [...state.transcripts, content],
        messages:
          isOptimistic || !isDuplicateEcho
            ? [...state.messages, createMessage("user", content)]
            : state.messages,
      };
    });
  },
  setConnected: (connected) => set({ connected }),
  setSessionReady: (sessionReady) => set({ sessionReady }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setHasAiResponded: (hasAiResponded) => set({ hasAiResponded }),
  setAiFeedback: (aiFeedback) =>
    set((state) => ({
      aiFeedback,
      messages: [...state.messages, createMessage("ai", aiFeedback)],
    })),
  addResourceId: (id) =>
    set((state) =>
      state.resourceIds.includes(id)
        ? state
        : { resourceIds: [...state.resourceIds, id] }
    ),
  setResourceIds: (resourceIds) => set({ resourceIds }),
  setSubject: (subject) => set({ subject }),
  setTopic: (topic) => set({ topic }),
  resetSessionState: () =>
    set({
      sessionId: null,
      connected: false,
      sessionReady: false,
      isRecording: false,
      isProcessing: false,
      hasAiResponded: false,
      transcripts: [],
      aiFeedback: null,
      messages: [],
      resourceIds: [],
      subject: "",
      topic: "",
    }),
}));