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

export default function ActiveSessionCenter() {
  const { accessToken } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const { connect } = useVoiceSocket(accessToken ?? "");
  const { startRecording, stopRecording } = useVoiceRecorder(setVoiceLevel);

  const { sessionReady, connected } = useVoiceStore();
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

      <TranscriptFeed
        sessionState={statusState}
      />

      <SessionControls
        onMicClick={handleMicClick}
        onStopClick={handleStopClick}
      />
    </section>
  );
}