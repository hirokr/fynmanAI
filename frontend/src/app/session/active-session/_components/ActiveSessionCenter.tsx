"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SessionStatusBadge from "./SessionStatusBadge";
import AIAvatar from "./AIAvatar";
import TranscriptFeed from "./TranscriptFeed";
import SessionControls from "./SessionControls";

type SessionState = "listening" | "thinking" | "speaking";

export default function ActiveSessionCenter() {
  const [sessionState, setSessionState] = useState<SessionState>("listening");
  const timerRef = useRef<number | null>(null);

  const statusLabel = useMemo(() => {
    if (sessionState === "thinking") return "Thinking";
    if (sessionState === "speaking") return "Speaking";
    return "Listening";
  }, [sessionState]);

  const statusDotClass = useMemo(() => {
    if (sessionState === "thinking") return "bg-tertiary animate-ping";
    if (sessionState === "speaking") return "bg-error animate-bounce";
    return "bg-primary animate-pulse";
  }, [sessionState]);

  const waveformOpacity =
    sessionState === "thinking" ? "opacity-30" : "opacity-100";

  const handleMicClick = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (sessionState === "listening") {
      setSessionState("thinking");
      timerRef.current = window.setTimeout(() => {
        setSessionState("speaking");
      }, 2000);
      return;
    }

    setSessionState("listening");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <section className="h-[calc(100%-3.5rem)] center-panel panel-transition flex-1 bg-background flex flex-col items-center px-8 relative">
      <SessionStatusBadge
        sessionState={sessionState}
        statusLabel={statusLabel}
        statusDotClass={statusDotClass}
      />
      <AIAvatar waveformOpacity={waveformOpacity} />
      <TranscriptFeed sessionState={sessionState} />
      <SessionControls onMicClick={handleMicClick} />
    </section>
  );
}