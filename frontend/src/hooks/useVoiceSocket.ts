import { useCallback } from "react";
// import type { Socket } from "socket.io-client";
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

type RealtimeResponse = {
  question?: unknown;
  detected_gaps?: unknown;
  clarifications?: unknown;
  topic_drift?: unknown;
  citations?: unknown;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

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

const extractQuestionText = (content: string) => {
  const directParsed = parseJsonContent(content);
  if (directParsed && typeof directParsed.question === "string" && directParsed.question.trim()) {
    return directParsed.question.trim();
  }

  const extractedJson = extractJsonContent(content);
  if (extractedJson) {
    const parsed = parseJsonContent(extractedJson);
    if (parsed && typeof parsed.question === "string" && parsed.question.trim()) {
      return parsed.question.trim();
    }
  }

  const questionMatch = content.match(/"question"\s*:\s*"([^"]+)"/i);
  if (questionMatch?.[1]?.trim()) {
    return questionMatch[1].trim();
  }

  return "";
};

const buildConceptId = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || null;

export const useVoiceSocket = (token: string) => {
  const {
    setSocket,
    setSessionId,
    addTranscript,
    setConnected,
    setSessionReady,
    setHasAiResponded,
    setAiFeedback,
    setFinalSummary,
    setIsEndingSession,
    setShowSummaryCard,
    setCurrentQuestion,
    setCurrentConceptId,
    setQuestionDepth,
    incrementFailedAttempts,
    resetFailedAttempts,
    mergeDetectedGaps,
    addMasteredConcept,
    addConversationEntry,
    socket: existingSocket,
    resourceIds,
    sessionResources,
    subject,
    topic,
  } = useVoiceStore();

  const syncLearningState = useCallback((response: Record<string, unknown>, phase?: string) => {
    const learningState = useVoiceStore.getState();

    if (phase === "end") {
      return;
    }

    const question = typeof response.question === "string" ? response.question.trim() : "";
    if (question) {
      const isNewConcept = question !== learningState.currentQuestion;
      const conceptId = buildConceptId(question);

      if (phase === "start") {
        setQuestionDepth(1);
        setCurrentConceptId(conceptId);
        setCurrentQuestion(question);
      } else {
        setCurrentQuestion(question);

        const gaps = isStringArray(response.detected_gaps) ? response.detected_gaps : [];
        if (gaps.length > 0) {
          mergeDetectedGaps(gaps);
          incrementFailedAttempts();
        } else {
          if (learningState.currentConceptId) {
            addMasteredConcept(learningState.currentConceptId);
          }

          resetFailedAttempts();
          if (isNewConcept) {
            setQuestionDepth(learningState.questionDepth + 1);
            setCurrentConceptId(conceptId);
          }
        }
      }

      return;
    }

    if (phase === "realtime") {
      const fallbackQuestion = extractQuestionText(JSON.stringify(response));
      if (fallbackQuestion) {
        addConversationEntry({ role: "assistant", content: fallbackQuestion });
      }
    }
  }, [
    addConversationEntry,
    addMasteredConcept,
    incrementFailedAttempts,
    mergeDetectedGaps,
    resetFailedAttempts,
    setCurrentConceptId,
    setCurrentQuestion,
    setQuestionDepth,
  ]);

  const startSessionFlow = useCallback(async (socket: any) => {
    setSessionReady(false);

    try {
      const sessionSnapshot = useVoiceStore.getState();
      const session = await startSession(socket, {
        resourceIds: resourceIds.length ? resourceIds : undefined,
        resources: sessionResources.length ? sessionResources : undefined,
        subject: subject.trim() || undefined,
        topic: topic.trim() || undefined,
        sessionState: {
          currentQuestion: sessionSnapshot.currentQuestion,
          currentConceptId: sessionSnapshot.currentConceptId,
          questionDepth: sessionSnapshot.questionDepth,
          failedAttempts: sessionSnapshot.failedAttempts,
          detectedGaps: sessionSnapshot.detectedGaps,
          masteredConcepts: sessionSnapshot.masteredConcepts,
          conversationHistory: sessionSnapshot.conversationHistory,
          finalSummary: sessionSnapshot.finalSummary,
          showSummaryCard: sessionSnapshot.showSummaryCard,
        },
      });

      setSessionId(session.id);
      setSessionReady(true);
    } catch (err) {
      console.error("Session start failed:", err);
      setSessionReady(false);
    }
  }, [
    resourceIds,
    sessionResources,
    setSessionId,
    setSessionReady,
    subject,
    topic,
  ]);


  const wireSocket = useCallback((socket: any) => {
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
      setHasAiResponded(true);
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
        setHasAiResponded(true);

        if (data.phase === "end") {
          try {
            const extractedJson = extractJsonContent(data.content);
            const parsed = extractedJson ? parseJsonContent(extractedJson) : parseJsonContent(data.content);
            if (!parsed) {
              setIsEndingSession(false);
              return;
            }

            const finalSummary = {
              summary: typeof parsed.summary === "string" ? parsed.summary : "",
              strengths: isStringArray(parsed.strengths) ? parsed.strengths : [],
              weaknesses: isStringArray(parsed.weaknesses) ? parsed.weaknesses : [],
              missed_concepts: isStringArray(parsed.missed_concepts) ? parsed.missed_concepts : [],
              follow_up: isStringArray(parsed.follow_up) ? parsed.follow_up : [],
              confidence_score: typeof parsed.confidence_score === "number" ? parsed.confidence_score : Number(parsed.confidence_score ?? 0),
              topic_drift: Boolean(parsed.topic_drift),
              cited_evidence: isStringArray(parsed.cited_evidence) ? parsed.cited_evidence : [],
            } satisfies FinalSummary;

            if (!finalSummary.summary.trim()) {
              setFinalSummary(null);
              setShowSummaryCard(false);
              setIsEndingSession(false);
              return;
            }

            setFinalSummary(finalSummary);
            setShowSummaryCard(true);
            setIsEndingSession(false);
            addConversationEntry({ role: "assistant", content: finalSummary.summary });
          } catch {
            setFinalSummary(null);
            setShowSummaryCard(false);
            setIsEndingSession(false);
          }
          return;
        }

        const parsed = parseJsonContent(data.content);
        const displayText = extractQuestionText(data.content);
        if (displayText) {
          setAiFeedback(displayText);
        }

        if (parsed) {
          syncLearningState(parsed, data.phase);
        } else {
          const extractedJson = extractJsonContent(data.content);
          if (extractedJson) {
            const extractedParsed = parseJsonContent(extractedJson);
            if (extractedParsed) {
              syncLearningState(extractedParsed, data.phase);
            }
          }
        }
      }
    });
  }, [
    addTranscript,
    addConversationEntry,
    setAiFeedback,
    setConnected,
    setHasAiResponded,
    setFinalSummary,
    setIsEndingSession,
    setShowSummaryCard,
    setSessionReady,
    startSessionFlow,
    syncLearningState,
  ]);


  const connect = useCallback(() => {
    const socket = existingSocket ?? createSocket(token);
    setSocket(socket);
    wireSocket(socket);

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }, [existingSocket, setSocket, token, wireSocket]);

  return { connect };
};
