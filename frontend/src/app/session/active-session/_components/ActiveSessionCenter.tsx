"use client";

import { useEffect } from "react";
import SessionStatusBadge from "./SessionStatusBadge";
import AIAvatar from "./AIAvatar";
import TranscriptFeed from "./TranscriptFeed";
import SessionControls from "./SessionControls";

import { useVoiceSocket } from "@/hooks/useVoiceSocket";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useVoiceStore } from "@/store/useVoiceStore";
import { destroySocket } from "@/lib/socket/socket";

export default function ActiveSessionCenter() {
  const token = "YOUR_AUTH_TOKEN";

  const { connect } = useVoiceSocket(token);
  const { startRecording, stopRecording } = useVoiceRecorder();

  const {
    sessionReady,
    transcripts,
    aiFeedback,
  } = useVoiceStore();

useEffect(() => {
  const socket = connect();
  return () => {
    socket?.disconnect();
    destroySocket();
  };
}, []);
  const handleMicClick = async () => {
    if (!sessionReady) return;
    await startRecording();
  };

  return (
    <section className="h-[calc(100%-3.5rem)] flex flex-col items-center relative">
      <SessionStatusBadge
        sessionState={sessionReady ? "listening" : "thinking"}
        statusLabel={sessionReady ? "Listening" : "Connecting"}
        statusDotClass={sessionReady ? "bg-primary" : "bg-yellow-500"}
      />

      <AIAvatar waveformOpacity="opacity-100" />

      <TranscriptFeed
        sessionState={sessionReady ? "listening" : "thinking"}
      />

      <SessionControls
        onMicClick={handleMicClick}
        onStopClick={stopRecording}
      />
    </section>
  );
}