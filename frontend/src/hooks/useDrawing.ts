import { useCallback, useRef, useState } from "react";

const colorOptions = ["#000000", "#2563eb", "#dc2626", "#059669"];

export function useDrawing(isArtcraftOpen: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const [currentColor, setCurrentColor] = useState(colorOptions[0]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = currentColor;
  }, [currentColor]);

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    lastPoint.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    drawing.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPoint.current = { x, y };
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const changeColor = (color: string) => {
    setCurrentColor(color);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.strokeStyle = color;
  };

  return {
    canvasRef,
    currentColor,
    colorOptions,
    resizeCanvas,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    changeColor,
  };
}