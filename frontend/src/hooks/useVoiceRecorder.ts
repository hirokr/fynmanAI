import { useRef } from "react";
import { useVoiceStore } from "@/store/useVoiceStore";
import { sendAudioChunk } from "@/services/voice.service";

const calculateLevel = (data: Uint8Array) => {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) {
    const value = (data[i] - 128) / 128;
    sum += value * value;
  }

  const rms = Math.sqrt(sum / data.length);
  return Math.min(1, Math.max(0, rms * 2.5));
};

export const useVoiceRecorder = (onLevel?: (level: number) => void) => {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopResolveRef = useRef<(() => void) | null>(null);
  const stopRejectRef = useRef<((error: unknown) => void) | null>(null);

  const { socket, sessionId, sessionReady } = useVoiceStore();

  const startRecording = async () => {
    if (!sessionReady || !socket || !sessionId) return;

    if (recorderRef.current?.state === "recording") return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    streamRef.current = stream;
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    if (onLevel) {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        onLevel(calculateLevel(data));
        rafRef.current = requestAnimationFrame(tick);
      };

      tick();
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size === 0) return;
      chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      let stopError: unknown = null;

      try {
        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm",
        });

        const startedAt = startTimeRef.current ?? Date.now();

        if (audioBlob.size > 0) {
          const learningState = useVoiceStore.getState();

          console.log("Sending full audio", {
            sessionId,
            bytes: audioBlob.size,
          });
          const durationMs = Math.max(0, Date.now() - startedAt);
          await sendAudioChunk(socket, sessionId, audioBlob, {
            fileName: `session-${sessionId}-${startedAt}.webm`,
            mimeType: "audio/webm",
            startTimeMs: 0,
            endTimeMs: durationMs,
            endMessage: "user:pause",
            resources: learningState.sessionResources,
            sessionState: {
              currentQuestion: learningState.currentQuestion,
              currentConceptId: learningState.currentConceptId,
              questionDepth: learningState.questionDepth,
              failedAttempts: learningState.failedAttempts,
              detectedGaps: learningState.detectedGaps,
              masteredConcepts: learningState.masteredConcepts,
              conversationHistory: learningState.conversationHistory,
              finalSummary: learningState.finalSummary,
              showSummaryCard: learningState.showSummaryCard,
            },
          });
        }
      } catch (error) {
        stopError = error;
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      chunksRef.current = [];
      startTimeRef.current = null;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      analyserRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (stopError) {
        stopRejectRef.current?.(stopError);
      } else {
        stopResolveRef.current?.();
      }

      stopResolveRef.current = null;
      stopRejectRef.current = null;
    };

    recorder.start();
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      stopResolveRef.current = resolve;
      stopRejectRef.current = reject;

      try {
        recorder.stop();
      } catch (error) {
        stopResolveRef.current = null;
        stopRejectRef.current = null;
        reject(error);
      }
    });
  };

  return {
    startRecording,
    stopRecording,
  };
};
