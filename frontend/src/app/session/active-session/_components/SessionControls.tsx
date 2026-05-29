interface SessionControlsProps {
  onMicClick: () => void;
  onStopClick: () => void;
  onKeyboardClick: () => void;
}

export default function SessionControls({
  onMicClick,
  onStopClick,
  onKeyboardClick,
}: SessionControlsProps) {
  return (
    <div className="absolute -bottom-15 w-full hidden md:flex justify-center">
      <div className="flex items-center gap-8 bg-surface-container-highest/50 backdrop-blur-md px-8 py-4 rounded-full border border-outline-varian">
        <button
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
          onClick={onKeyboardClick}
        >
          keyboard
        </button>

        <button
          className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-lg active:scale-90 transition-transform"
          onClick={onMicClick}
        >
          <span className="material-symbols-outlined">mic</span>
        </button>

        <button
          className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors"
          onClick={onStopClick}
        >
          stop_circle
        </button>
      </div>
    </div>
  );
}


