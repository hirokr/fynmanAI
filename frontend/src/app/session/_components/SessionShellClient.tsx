"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import TopNav from "@/components/landing/TopNav";
import MobileNav from "@/components/ui/MobileNav";
import UploadModal from "@/app/session/new-session/_components/UploadModal";
import ResourceViewer from "@/app/session/_components/ResourceViewer";
import { useSessionResources } from "./SessionResourcesContext";

const depthModes = [
  { label: "Casual", active: false },
  { label: "Deep", active: true },
  { label: "Exam", active: false },
  { label: "Challenge", active: false },
];

const colorOptions = ["#000000", "#2563eb", "#dc2626", "#059669"];

type SessionShellClientProps = {
  children: React.ReactNode;
};

export default function SessionShellClient({
  children,
}: SessionShellClientProps) {
  const pathname = usePathname();
  const isActiveSession = pathname.includes("/session/active-session");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isArtcraftOpen, setIsArtcraftOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(colorOptions[0]);

  // 🔥 Shared resources from context (same state as NewSessionCenter)
  const { resources, addFiles, removeFile } = useSessionResources();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  const handleFilesUploaded = addFiles;

  const getIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "picture_as_pdf";
    if (name.endsWith(".md")) return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
    if (name.endsWith(".txt")) return "sticky_note_2";
    return "draft";
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  const headerTitle = useMemo(
    () => (isActiveSession ? "Sessions" : "New Session"),
    [isActiveSession]
  );

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

  useEffect(() => {
    if (!isArtcraftOpen) return;
    resizeCanvas();
  }, [isArtcraftOpen, resizeCanvas]);

  useEffect(() => {
    const shouldLock = isLeftSidebarOpen || isRightSidebarOpen;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLeftSidebarOpen, isRightSidebarOpen]);

  const openLeftSidebar = () => {
    setIsLeftSidebarOpen(true);
    setIsRightSidebarOpen(false);
  };

  const openRightSidebar = () => {
    setIsRightSidebarOpen(true);
    setIsLeftSidebarOpen(false);
  };

  const closeSidebars = () => {
    setIsLeftSidebarOpen(false);
    setIsRightSidebarOpen(false);
  };

  const leftSidebarContent = (
    <div className="pt-14 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Resources
        </h2>
        <span className="material-symbols-outlined text-on-surface-variant text-sm">
          folder_open
        </span>
      </div>

      <div className="space-y-1 custom-scrollbar-transparent overflow-y-auto flex-1">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 opacity-40">
            <span className="material-symbols-outlined text-on-surface-variant text-3xl">
              folder_open
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant text-center text-sm">
              No resources yet.
              <br />
              Upload files to get started.
            </p>
          </div>
        ) : (
          resources.map((item) => (
            <div
              key={item.name}
              onClick={() => setViewingFile(item)}
              className="flex items-center gap-2 py-1 px-2 hover:bg-surface-container-high transition-all cursor-pointer rounded-lg border-b border-on-secondary-container/5 group"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary transition-colors">
                {getIcon(item.name)}
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface truncate flex-1">
                {item.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(item.name);
                }}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
              >
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                  close
                </span>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-outline-variant">
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center justify-center gap-1 w-full py-2 bg-secondary-container text-on-secondary-container rounded-xl font-label-md text-label-md hover:bg-surface-container-high transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Upload Context
        </button>
      </div>
    </div>
  );

  const rightSidebarContent = (
    <div className="pt-14 p-6 flex flex-col gap-8 h-full custom-scrollbar-transparent overflow-y-auto">
      <div className="p-4 bg-surface-container border border-outline-variant rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              psychology
            </span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface font-bold">
              FymenAI Partner
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Active Intelligence
            </p>
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant italic">
          "Guides reasoning through structured questioning"
        </p>
        <button className="mt-1 text-primary font-label-md text-label-md text-left hover:underline">
          Edit Partner
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
          Depth Mode
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {depthModes.map((mode) => (
            <button
              key={mode.label}
              className={
                mode.active
                  ? "px-2 py-1 text-left font-label-md text-label-md rounded-lg bg-primary text-on-primary border border-primary"
                  : "px-2 py-1 text-left font-label-md text-label-md rounded-lg bg-surface-container-high border border-outline-variant text-on-surface"
              }
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {isActiveSession && (
        <div className="flex flex-col gap-4">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
            Artcraft
          </h3>
          <button
            className="flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all group"
            onClick={() => setIsArtcraftOpen(true)}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                draw
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                Visual Sketchpad
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
          Voice
        </h3>
        <div className="relative">
          <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 font-body-md text-body-md text-on-surface appearance-none focus:border-primary outline-none">
            <option>Atlas (Deep Warm)</option>
            <option>Nova (Clear Direct)</option>
            <option>Ember (Soft Academic)</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      <div className="mt-auto pt-8">
        <div className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Session Duration
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              42:15
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Reasoning Cycles
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              12
            </span>
          </div>
        </div>
      </div>
    </div>
  );

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

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden text-[#e5e7eb] ${
        isActiveSession ? "bg-[#0b1220]" : "bg-surface-container-lowest"
      } ${isFocusMode ? "focus-mode-active" : ""}`}
    >
      <div className="pt-14">
        <TopNav />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="side-panel panel-transition w-70 bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col">
          {leftSidebarContent}
        </aside>

        <main
          className={
            isActiveSession
              ? "flex-1 flex flex-col h-[calc(100%-3.5rem)] relative"
              : "flex-1 flex flex-col h-[calc(100%-3.5rem)] relative bg-surface-container-lowest"
          }
        >
          {children}
        </main>

        <aside className="side-panel panel-transition w-80 bg-surface-container-low border-l border-outline-variant hidden md:flex flex-col">
          {rightSidebarContent}
        </aside>
      </div>

      <MobileNav
        leftItems={[
          { icon: "folder_open", label: "Resources", onPress: openLeftSidebar },
          { icon: "keyboard", label: "Type", href: "#" },
        ]}
        centerButton={{ icon: "mic", href: "/session/active-session" }}
        rightItems={[
          { icon: "stop_circle", label: "Stop", href: "/session/new-session" },
          { icon: "tune", label: "Settings", onPress: openRightSidebar },
        ]}
      />

      {/* Mobile sidebars */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity ${
          isLeftSidebarOpen || isRightSidebarOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={closeSidebars}
        />
        <aside
          className={`absolute left-0 top-14 h-[calc(100%-3.5rem)] w-70 bg-surface-container-low border-r border-outline-variant panel-transition ${
            isLeftSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Session resources"
        >
          {leftSidebarContent}
        </aside>
        <aside
          className={`absolute right-0 top-14 h-[calc(100%-3.5rem)] w-80 bg-surface-container-low border-l border-outline-variant panel-transition ${
            isRightSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Session settings"
        >
          {rightSidebarContent}
        </aside>
      </div>

      {/* Artcraft sketchpad */}
      {isArtcraftOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-8 bg-background/80 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsArtcraftOpen(false);
            }
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
                onClick={() => setIsArtcraftOpen(false)}
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
                  <span className="material-symbols-outlined text-sm">
                    delete
                  </span>
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
                      onClick={() => {
                        setCurrentColor(color);
                        const ctx = canvasRef.current?.getContext("2d");
                        if (ctx) ctx.strokeStyle = color;
                      }}
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
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleFilesUploaded}
      />
      {/* Resource viewer — full screen overlay */}
      <ResourceViewer
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}