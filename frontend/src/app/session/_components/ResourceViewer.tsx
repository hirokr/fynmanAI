"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  file: File | null;
  onClose: () => void;
};

export default function ResourceViewer({ file, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!mounted || !file || !objectUrl) return null;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isText =
    file.type === "text/plain" ||
    file.name.endsWith(".md") ||
    file.name.endsWith(".json") ||
    file.name.endsWith(".txt");

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-6 py-3 border-b shrink-0"
        style={{
          background: "#15121b",
          borderColor: "rgba(70,69,84,0.4)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#8083ff]"
            style={{ fontSize: 20 }}
          >
            {isImage ? "image" : isPdf ? "picture_as_pdf" : "article"}
          </span>
          <span className="text-white text-sm font-medium truncate max-w-[60vw]">
            {file.name}
          </span>
          <span className="text-xs opacity-40 text-white">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Download */}
          <a
            href={objectUrl}
            download={file.name}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: "rgba(128,131,255,0.15)",
              color: "#8083ff",
              border: "1px solid rgba(128,131,255,0.3)",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              download
            </span>
            Download
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        {isImage && (
          <img
            src={objectUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ boxShadow: "0 0 60px rgba(128,131,255,0.15)" }}
          />
        )}

        {isPdf && (
          <iframe
            src={objectUrl}
            title={file.name}
            className="w-full h-full rounded-lg"
            style={{
              minHeight: "calc(100vh - 120px)",
              border: "1px solid rgba(70,69,84,0.4)",
            }}
          />
        )}

        {isText && <TextFileViewer file={file} />}

        {!isImage && !isPdf && !isText && (
          <div className="flex flex-col items-center gap-4 opacity-60">
            <span className="material-symbols-outlined text-white text-5xl">
              draft
            </span>
            <p className="text-white text-sm">
              Preview not available for this file type.
            </p>
            <a
              href={objectUrl}
              download={file.name}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: "#8083ff", color: "#000" }}
            >
              Download to view
            </a>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// Inline text/markdown/json viewer
function TextFileViewer({ file }: { file: File }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    file.text().then(setContent);
  }, [file]);

  return (
    <div
      className="w-full max-w-4xl rounded-xl p-6 overflow-auto font-mono text-sm leading-relaxed"
      style={{
        background: "#0f0d14",
        border: "1px solid rgba(70,69,84,0.4)",
        color: "#c0c1ff",
        maxHeight: "calc(100vh - 160px)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {content || "Loading…"}
    </div>
  );
}