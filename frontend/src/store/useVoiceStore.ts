import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Socket } from "socket.io-client";
import type { SessionResourceContext } from "@/types/session-resource";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
};

type FinalSummary = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missed_concepts: string[];
  follow_up: string[];
  confidence_score: number;
  topic_drift: boolean;
  cited_evidence: string[];
};

type LearningConversationEntry = {
  role: "user" | "assistant";
  content: string;
};

type LearningSessionState = {
  currentQuestion: string | null;
  currentConceptId: string | null;
  questionDepth: number;
  failedAttempts: number;
  detectedGaps: string[];
  masteredConcepts: string[];
  conversationHistory: LearningConversationEntry[];
  finalSummary: FinalSummary | null;
  showSummaryCard: boolean;
};

type State = {
  socket: Socket | null;
  sessionId: string | null;
  connected: boolean;
  sessionReady: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  isEndingSession: boolean;
  hasAiResponded: boolean;
  transcripts: string[];
  aiFeedback: string | null;
  finalSummary: FinalSummary | null;
  showSummaryCard: boolean;
} & LearningSessionState & {
  messages: ChatMessage[];
  resourceIds: string[];
  sessionResources: SessionResourceContext[];
  subject: string;
  topic: string;

  setSocket: (s: Socket) => void;
  setSessionId: (id: string) => void;
  addTranscript: (text: string, options?: { optimistic?: boolean }) => void;
  setConnected: (v: boolean) => void;
  setSessionReady: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setIsProcessing: (v: boolean) => void;
  setIsEndingSession: (v: boolean) => void;
  setHasAiResponded: (v: boolean) => void;
  setAiFeedback: (text: string) => void;
  setFinalSummary: (summary: FinalSummary | null) => void;
  setShowSummaryCard: (show: boolean) => void;
  setCurrentQuestion: (question: string | null) => void;
  setCurrentConceptId: (conceptId: string | null) => void;
  setQuestionDepth: (depth: number) => void;
  incrementFailedAttempts: () => void;
  resetFailedAttempts: () => void;
  mergeDetectedGaps: (gaps: string[]) => void;
  setMasteredConcepts: (concepts: string[]) => void;
  addMasteredConcept: (conceptId: string | null) => void;
  addConversationEntry: (entry: LearningConversationEntry) => void;
  setConversationHistory: (history: LearningConversationEntry[]) => void;
  resetLearningSessionState: () => void;
  addResourceId: (id: string) => void;
  setResourceIds: (ids: string[]) => void;
  setSessionResources: (resources: SessionResourceContext[]) => void;
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

const uniqueStrings = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const parseJsonContent = (content: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const extractJsonContent = (content: string) => {
  const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectMatch = content.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) {
    return objectMatch[0].trim();
  }

  return null;
};

const extractAssistantText = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  const directParsed = parseJsonContent(trimmed);
  if (directParsed && typeof directParsed.question === "string" && directParsed.question.trim()) {
    return directParsed.question.trim();
  }

  const extractedJson = extractJsonContent(trimmed);
  if (extractedJson) {
    const parsed = parseJsonContent(extractedJson);
    if (parsed && typeof parsed.question === "string" && parsed.question.trim()) {
      return parsed.question.trim();
    }
  }

  const questionMatch = trimmed.match(/"question"\s*:\s*"([^"]+)"/i);
  if (questionMatch?.[1]?.trim()) {
    return questionMatch[1].trim();
  }

  return trimmed;
};

const createInitialLearningState = (): LearningSessionState => ({
  currentQuestion: null,
  currentConceptId: null,
  questionDepth: 0,
  failedAttempts: 0,
  detectedGaps: [],
  masteredConcepts: [],
  conversationHistory: [],
  finalSummary: null,
  showSummaryCard: false,
});

const normalizeEntryContent = (content: string) => extractAssistantText(content);

export const useVoiceStore = create<State>()(
  persist(
    (set, get) => ({
  socket: null,
  sessionId: null,
  connected: false,
  sessionReady: false,
  isRecording: false,
  isProcessing: false,
  isEndingSession: false,
  hasAiResponded: false,
  transcripts: [],
  aiFeedback: null,
  ...createInitialLearningState(),
  messages: [],
  resourceIds: [],
  sessionResources: [],
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

      if (isDuplicateEcho) {
        return state;
      }

      return {
        transcripts: [...state.transcripts, content],
        messages:
          [...state.messages, createMessage("user", content)],
        conversationHistory: [
          ...state.conversationHistory,
          { role: "user", content },
        ],
      };
    });
  },
  setConnected: (connected) => set({ connected }),
  setSessionReady: (sessionReady) => set({ sessionReady }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setIsEndingSession: (isEndingSession) => set({ isEndingSession }),
  setHasAiResponded: (hasAiResponded) => set({ hasAiResponded }),
  setAiFeedback: (aiFeedback) =>
    set((state) => {
      const normalized = normalizeEntryContent(aiFeedback);

      if (!normalized) {
        return state;
      }

      return {
        aiFeedback: normalized,
        messages: [...state.messages, createMessage("ai", normalized)],
        conversationHistory: [
          ...state.conversationHistory,
          { role: "assistant", content: normalized },
        ],
      };
    }),
  setFinalSummary: (finalSummary) => set({ finalSummary }),
  setShowSummaryCard: (showSummaryCard) => set({ showSummaryCard }),
  setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
  setCurrentConceptId: (currentConceptId) => set({ currentConceptId }),
  setQuestionDepth: (questionDepth) => set({ questionDepth }),
  incrementFailedAttempts: () =>
    set((state) => ({ failedAttempts: state.failedAttempts + 1 })),
  resetFailedAttempts: () => set({ failedAttempts: 0 }),
  mergeDetectedGaps: (gaps) =>
    set((state) => ({
      detectedGaps: uniqueStrings([...state.detectedGaps, ...gaps]),
    })),
  setMasteredConcepts: (masteredConcepts) =>
    set({ masteredConcepts: uniqueStrings(masteredConcepts) }),
  addMasteredConcept: (conceptId) =>
    set((state) => {
      if (!conceptId || state.masteredConcepts.includes(conceptId)) {
        return state;
      }

      return {
        masteredConcepts: [...state.masteredConcepts, conceptId],
      };
    }),
  addConversationEntry: (entry) =>
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: entry.role,
          content: normalizeEntryContent(entry.content),
        },
      ],
    })),
  setConversationHistory: (conversationHistory) =>
    set({ conversationHistory }),
  resetLearningSessionState: () =>
    set({
      sessionId: null,
      connected: false,
      sessionReady: false,
      isRecording: false,
      isProcessing: false,
      isEndingSession: false,
      hasAiResponded: false,
      ...createInitialLearningState(),
      transcripts: [],
      aiFeedback: null,
      messages: [],
    }),
  addResourceId: (id) =>
    set((state) =>
      state.resourceIds.includes(id)
        ? state
        : { resourceIds: [...state.resourceIds, id] }
    ),
  setResourceIds: (resourceIds) => set({ resourceIds }),
  setSessionResources: (sessionResources) => set({ sessionResources }),
  setSubject: (subject) => set({ subject }),
  setTopic: (topic) => set({ topic }),
  resetSessionState: () =>
    set({
      sessionId: null,
      connected: false,
      sessionReady: false,
      isRecording: false,
      isProcessing: false,
      isEndingSession: false,
      hasAiResponded: false,
      transcripts: [],
      aiFeedback: null,
      ...createInitialLearningState(),
      messages: [],
      resourceIds: [],
      sessionResources: [],
      subject: "",
      topic: "",
    }),
    }),
    {
      name: "fymen-learning-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        sessionReady: state.sessionReady,
        isRecording: state.isRecording,
        isProcessing: state.isProcessing,
        isEndingSession: state.isEndingSession,
        hasAiResponded: state.hasAiResponded,
        transcripts: state.transcripts,
        aiFeedback: state.aiFeedback,
        finalSummary: state.finalSummary,
        showSummaryCard: state.showSummaryCard,
        currentQuestion: state.currentQuestion,
        currentConceptId: state.currentConceptId,
        questionDepth: state.questionDepth,
        failedAttempts: state.failedAttempts,
        detectedGaps: state.detectedGaps,
        masteredConcepts: state.masteredConcepts,
        conversationHistory: state.conversationHistory,
        messages: state.messages,
        resourceIds: state.resourceIds,
        sessionResources: state.sessionResources,
        subject: state.subject,
        topic: state.topic,
      }),
    }
  )
);