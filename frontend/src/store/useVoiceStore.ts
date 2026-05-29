import { create } from "zustand";
import { Socket } from "socket.io-client";

type State = {
  socket: Socket | null;
  sessionId: string | null;
  connected: boolean;
  sessionReady: boolean;
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
  setAiFeedback: (text: string) => void;
  addResourceId: (id: string) => void;
  setResourceIds: (ids: string[]) => void;
  setSubject: (value: string) => void;
  setTopic: (value: string) => void;
};

export const useVoiceStore = create<State>((set) => ({
  socket: null,
  sessionId: null,
  connected: false,
  sessionReady: false,
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
}));