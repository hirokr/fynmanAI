import { useEffect } from "react";
import { useDrawing } from "../../../../hooks/useDrawing";

interface ArtcraftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArtcraftModal({ isOpen, onClose }: ArtcraftModalProps) {
  const {
    canvasRef,
    currentColor,
    colorOptions,
    resizeCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    changeColor,
  } = useDrawing(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    resizeCanvas();
  }, [isOpen, resizeCanvas]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-8 bg-background/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-4xl h-150 flex flex-col shadow-2xl">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              palette
            </span>
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Artcraft Sketchpad
            </h2>
          </div>
          <button
            className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
            onClick={onClose}
          >
            close
          </button>
        </div>

        <div className="flex-1 relative bg-white m-4 rounded-xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full drawing-canvas"
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
          />
        </div>

        <div className="p-4 border-t border-outline-variant flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-1 px-4 py-2 bg-surface-container-high rounded-lg text-on-surface hover:bg-surface-container-highest transition-all"
              onClick={clearCanvas}
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span className="font-label-md text-label-md">Clear</span>
            </button>
            <div className="h-6 w-px bg-outline-variant mx-2" />
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className={
                    color === currentColor
                      ? "w-6 h-6 rounded-full border-2 border-primary"
                      : "w-6 h-6 rounded-full"
                  }
                  style={{ backgroundColor: color }}
                  onClick={() => changeColor(color)}
                />
              ))}
            </div>
          </div>
          <button className="px-6 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all">
            Save to Session
          </button>
        </div>
      </div>
    </div>
  );
}