"use client";

import { useEffect, useState } from "react";
import SessionStatusBadge from "./SessionStatusBadge";
import AIAvatar from "./AIAvatar";
import TranscriptFeed from "./TranscriptFeed";
import SessionControls from "./SessionControls";

import { useVoiceSocket } from "@/hooks/useVoiceSocket";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVoiceStore } from "@/store/useVoiceStore";
import { destroySocket } from "@/lib/socket/socket";
import { useAuth } from "@/context/auth/AuthContext";
import { sendTextInput } from "@/services/voice.service";

export default function ActiveSessionCenter() {
  const { accessToken } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState("");

  const { connect } = useVoiceSocket(accessToken ?? "");
  const { startRecording, stopRecording } = useVoiceRecorder(setVoiceLevel);

  const { sessionReady, connected, socket, sessionId } = useVoiceStore();
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
  }, [accessToken]);

  useEffect(() => {
    const handleMic = () => {
      void handleMicClick();
    };

    const handleStop = () => {
      handleStopClick();
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
  }, [sessionReady]);
  const handleMicClick = async () => {
    if (!sessionReady) {
      console.log("Mic blocked: session not ready");
      return;
    }

    setIsRecording(true);
    try {
      await startRecording();
    } catch (error) {
      console.error("Failed to start recording", error);
      setIsRecording(false);
    }
  };

  const handleStopClick = () => {
    stopRecording();
    setIsRecording(false);
    setVoiceLevel(0);
  };

  const handleKeyboardClick = () => {
    setShowTextInput((prev) => !prev);
  };

  const handleSendText = () => {
    if (!socket || !sessionId || !textInput.trim()) return;
    sendTextInput(socket, sessionId, textInput.trim());
    setTextInput("");
    setShowTextInput(false);
  };

  return (
    <section className="h-[calc(100%-3.5rem)] flex flex-col items-center relative">
      <SessionStatusBadge
        sessionState={statusState}
        statusLabel={statusLabel}
        statusDotClass={statusDotClass}
      />

      <AIAvatar
        waveformOpacity={isRecording ? "opacity-100" : "opacity-0"}
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
      />
    </section>
  );
}