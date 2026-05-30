import { create } from "zustand";
import { Socket } from "socket.io-client";

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
  resourceIds: string[];
  subject: string;
  topic: string;

  setSocket: (s: Socket) => void;
  setSessionId: (id: string) => void;
  addTranscript: (text: string) => void;
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
  resourceIds: [],
  subject: "",
  topic: "",

  setSocket: (socket) => set({ socket }),
  setSessionId: (sessionId) => set({ sessionId }),
  addTranscript: (text) =>
    set((state) => ({
      transcripts: [...state.transcripts, text],
    })),
  setConnected: (connected) => set({ connected }),
  setSessionReady: (sessionReady) => set({ sessionReady }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setHasAiResponded: (hasAiResponded) => set({ hasAiResponded }),
  setAiFeedback: (aiFeedback) => set({ aiFeedback }),
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
      resourceIds: [],
      subject: "",
      topic: "",
    }),
}));