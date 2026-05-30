"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SessionStatusBadge from "./SessionStatusBadge";
import AIAvatar from "./AIAvatar";
import TranscriptFeed from "./TranscriptFeed";
import SessionControls from "./SessionControls";

import { useVoiceSocket } from "@/hooks/useVoiceSocket";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVoiceStore } from "@/store/useVoiceStore";
import { destroySocket } from "@/lib/socket/socket";
import { useAuth } from "@/context/auth/AuthContext";
import {
  endUserSession,
  pauseUserSession,
  sendTextInput,
} from "@/services/voice.service";

export default function ActiveSessionCenter() {
  const { accessToken } = useAuth();
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const { connect } = useVoiceSocket(accessToken ?? "");
  const { startRecording, stopRecording } = useVoiceRecorder(setVoiceLevel);

  const {
    sessionReady,
    connected,
    socket,
    sessionId,
    isRecording,
    isProcessing,
    isEndingSession,
    hasAiResponded,
    transcripts,
    finalSummary,
    setIsRecording,
    setIsProcessing,
    setIsEndingSession,
    resetSessionState,
  } = useVoiceStore();

  const buildSessionStateSnapshot = () => {
    const state = useVoiceStore.getState();

    return {
      currentQuestion: state.currentQuestion,
      currentConceptId: state.currentConceptId,
      questionDepth: state.questionDepth,
      failedAttempts: state.failedAttempts,
      detectedGaps: state.detectedGaps,
      masteredConcepts: state.masteredConcepts,
      conversationHistory: state.conversationHistory,
      finalSummary: state.finalSummary,
      showSummaryCard: state.showSummaryCard,
    };
  };
  const pendingTranscriptCountRef = useRef(0);
  const statusLabel = !connected
    ? "Connecting"
    : isRecording
    ? "Listening"
    : "Active";

  const statusState = !connected
    ? "thinking"
    : isRecording
    ? "listening"
    : "speaking";

  const statusDotClass = !connected ? "bg-yellow-500" : "bg-primary";

  useEffect(() => {
    if (!accessToken) return;
    const socket = connect();
    return () => {
      socket?.disconnect();
      destroySocket();
    };
  }, [accessToken, connect]);

  useEffect(() => {
    if (!isProcessing) return;

    if (transcripts.length > pendingTranscriptCountRef.current) {
      setIsProcessing(false);
    }
  }, [isProcessing, transcripts.length]);

  const handleMicClick = useCallback(async () => {
    if (!sessionReady || !hasAiResponded) {
      console.log("Mic blocked: session not ready");
      return;
    }

    if (isProcessing) {
      return;
    }

    setIsRecording(true);
    setIsProcessing(false);
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording", error);
      setIsRecording(false);
    }
  }, [hasAiResponded, sessionReady, startRecording]);

  const handleStopClick = useCallback(async () => {
    setIsRecording(false);
    setIsProcessing(true);
    pendingTranscriptCountRef.current = transcripts.length;

    try {
      await stopRecording();

      if (!socket || !sessionId) {
        return;
      }

      await pauseUserSession(socket, sessionId, buildSessionStateSnapshot());
    } catch (error) {
      console.error("Failed to end user session", error);
      setIsProcessing(false);
    }
  }, [sessionId, socket, stopRecording, transcripts.length]);

  const handleSessionEndClick = useCallback(async () => {
    if (!socket || !sessionId) {
      return;
    }

    try {
      setIsEndingSession(true);
      await endUserSession(socket, sessionId, buildSessionStateSnapshot());
    } catch (error) {
      console.error("Failed to finalize session", error);
      setIsEndingSession(false);
    }
  }, [sessionId, setIsEndingSession, socket]);

  const handleKeyboardClick = useCallback(() => {
    setShowTextInput((prev) => !prev);
  }, []);

  const handleSendText = () => {
    if (!socket || !sessionId || !textInput.trim()) return;

    const text = textInput.trim();
    const learningState = useVoiceStore.getState();
    useVoiceStore.getState().addTranscript(text, { optimistic: true });
    sendTextInput(socket, sessionId, text, {
      currentQuestion: learningState.currentQuestion,
      currentConceptId: learningState.currentConceptId,
      questionDepth: learningState.questionDepth,
      failedAttempts: learningState.failedAttempts,
      detectedGaps: learningState.detectedGaps,
      masteredConcepts: learningState.masteredConcepts,
      conversationHistory: learningState.conversationHistory,
      finalSummary: learningState.finalSummary,
      showSummaryCard: learningState.showSummaryCard,
    });
    setTextInput("");
    setShowTextInput(false);
  };

  useEffect(() => {
    const handleMic = () => {
      void handleMicClick();
    };

    const handleStop = () => {
      void handleStopClick();
    };

    const handleText = () => {
      handleKeyboardClick();
    };

    window.addEventListener("voice:mic", handleMic);
    window.addEventListener("voice:stop", handleStop);
    window.addEventListener("voice:text", handleText);
    return () => {
      window.removeEventListener("voice:mic", handleMic);
      window.removeEventListener("voice:stop", handleStop);
      window.removeEventListener("voice:text", handleText);
    };
  }, [handleMicClick, handleStopClick, handleKeyboardClick]);

  return (
    <section className="flex-1 min-h-0 flex flex-col items-center relative w-full">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <button
          type="button"
          onClick={handleSessionEndClick}
          disabled={!sessionReady || !socket || !sessionId || isEndingSession}
          className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-surface-container-high/80 px-4 py-2 text-body-md text-on-surface shadow-lg backdrop-blur-md transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${isEndingSession ? "animate-spin" : ""}`}>
            {isEndingSession ? "progress_activity" : "power_settings_new"}
          </span>
        </button>
      </div>

      <SessionStatusBadge
        sessionState={statusState}
        statusLabel={statusLabel}
        statusDotClass={statusDotClass}
      />

      <AIAvatar
        isRecording={isRecording}
        isProcessing={isProcessing}
        waveformLevel={voiceLevel}
      />

      {showTextInput && (
        <div className="absolute bottom-24 w-full flex justify-center px-6 z-9">
          <div className="w-full max-w-2xl bg-surface-container-highest/20 backdrop-blur-md rounded-2xl border border-outline-variant p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-body-md text-on-surface-variant">Text Input</span>
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
                onClick={() => setShowTextInput(false)}
                aria-label="Close text input"
              >
                close
              </button>
            </div>
            <textarea
              value={textInput}
              onChange={(event) => setTextInput(event.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full bg-transparent text-on-surface text-body-md outline-none resize-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                className="px-4 py-2 rounded-full bg-primary text-on-primary text-body-md"
                onClick={handleSendText}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <TranscriptFeed
        sessionState={statusState}
      />

      <SessionControls
        onMicClick={handleMicClick}
        onStopClick={handleStopClick}
        onKeyboardClick={handleKeyboardClick}
        isRecording={isRecording}
        micLoading={isProcessing}
        hasAiResponded={hasAiResponded}
        endLoading={isEndingSession}
      />
    </section>
  );
}
