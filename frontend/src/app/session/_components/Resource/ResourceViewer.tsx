"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import TextFileViewer from "./TextViewer";
import ResourceViewerHeader from "./ResourceViewerHeader";

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
      style={{
        background: "rgba(0,0,0,0.94)",
      }}
    >
     <ResourceViewerHeader
      file={file}
      objectUrl={objectUrl}
      isImage={isImage}
      isPdf={isPdf}
      onClose={onClose}
    />

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6">
        {/* Image */}
        {isImage && (
          <img
            src={objectUrl}
            alt={file.name}
            className="max-w-full max-h-[calc(100vh-90px)] object-contain rounded-lg shadow-2xl"
            style={{
              boxShadow: "0 0 60px rgba(128,131,255,0.15)",
            }}
          />
        )}

        {/* PDF */}
        {isPdf && (
          <iframe
            src={objectUrl}
            title={file.name}
            className="w-full h-full rounded-lg"
            style={{
              minHeight: "calc(100vh - 100px)",
              border: "1px solid rgba(70,69,84,0.4)",
            }}
          />
        )}

        {/* Text */}
        {isText && <TextFileViewer file={file} />}

        {/* Unsupported */}
        {!isImage && !isPdf && !isText && (
          <div className="flex flex-col items-center gap-4 opacity-60">
            <span className="material-symbols-outlined text-white text-5xl">
              draft
            </span>

            <p className="text-white text-sm text-center">
              Preview not available for this file type.
            </p>

            <a
              href={objectUrl}
              download={file.name}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                background: "#8083ff",
                color: "#000",
              }}
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

