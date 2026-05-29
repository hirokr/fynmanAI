import { useRef } from "react";
import { useVoiceStore } from "@/store/useVoiceStore";
import { sendAudioChunk } from "@/services/voice.service";

export const useVoiceRecorder = () => {
  const recorderRef = useRef<MediaRecorder | null>(null);

  const { socket, sessionId, sessionReady } = useVoiceStore();

  const startRecording = async () => {
    if (!sessionReady || !socket || !sessionId) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorderRef.current = recorder;

    recorder.ondataavailable = async (event) => {
      if (event.data.size === 0) return;

      await sendAudioChunk(socket, sessionId, event.data);
    };

    recorder.start(250);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return {
    startRecording,
    stopRecording,
  };
};