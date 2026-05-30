interface SessionControlsProps {
  onMicClick: () => void;
  onStopClick: () => void;
  onKeyboardClick: () => void;
  isRecording: boolean;
  micLoading: boolean;
  hasAiResponded: boolean;
  endLoading: boolean;
}

export default function SessionControls({
  onMicClick,
  onStopClick,
  onKeyboardClick,
  isRecording,
  micLoading,
  hasAiResponded,
  endLoading,
}: SessionControlsProps) {
  const controlsDisabled = !hasAiResponded;
  const micDisabled = controlsDisabled || micLoading;
  const stopDisabled = controlsDisabled || !isRecording;

  return (
    <div className="absolute bottom-6 w-full hidden md:flex justify-center">
      <div className="flex items-center gap-8 bg-surface-container-highest/50 backdrop-blur-md px-8 py-4 rounded-full border border-outline-varian">
        <button
          className={`material-symbols-outlined transition-colors ${
            controlsDisabled
              ? "text-on-surface-variant/40 opacity-40 cursor-not-allowed pointer-events-none"
              : "text-on-surface-variant hover:text-primary"
          }`}
          onClick={controlsDisabled ? undefined : onKeyboardClick}
          disabled={controlsDisabled}
        >
          keyboard
        </button>

        <button
          className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg active:scale-90 transition-all ${
            micDisabled
              ? "bg-neutral-500/40 text-neutral-300 opacity-40 cursor-not-allowed pointer-events-none"
              : "bg-primary text-on-primary"
          }`}
          onClick={micDisabled ? undefined : onMicClick}
          aria-busy={micLoading}
          disabled={micDisabled}
        >
          <span className={`material-symbols-outlined ${micLoading ? "animate-spin" : ""}`}>
            {micLoading ? "progress_activity" : "mic"}
          </span>
        </button>

        <button
          className={`material-symbols-outlined transition-colors ${
            stopDisabled
              ? "text-on-surface-variant/40 opacity-40 cursor-not-allowed pointer-events-none"
              : isRecording
                ? "text-on-surface-variant hover:text-primary"
                : "text-on-surface-variant/70 cursor-default"
          }`}
          onClick={stopDisabled ? undefined : onStopClick}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          disabled={stopDisabled}
        >
          {isRecording ? "stop_circle" : "play_circle"}
        </button>
      </div>
    </div>
  );
}


