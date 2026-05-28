"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
};

export default function UploadModal({ open, onClose, onUpload }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [mounted, setMounted] = useState(false);

  // Portal needs document to exist (Next.js SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset files when modal closes
  useEffect(() => {
    if (!open) setFiles([]);
  }, [open]);

  if (!mounted || !open) return null;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !existingNames.has(f.name))];
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...dropped.filter((f) => !existingNames.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = () => {
    onUpload(files);
    onClose();
  };

  const getIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "picture_as_pdf";
    if (name.endsWith(".md")) return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
    return "draft";
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-xl rounded-xl p-6 flex flex-col gap-4"
        style={{
          background: "#15121b",
          border: "1px solid rgba(70,69,84,0.4)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-bold">Upload Resources</h2>
          <button
            onClick={onClose}
            className="text-[#c7c4d7] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="rounded-lg p-8 text-center flex flex-col items-center gap-3 transition-colors"
          style={{ border: "2px dashed rgba(70,69,84,0.6)" }}
        >
          <span className="material-symbols-outlined text-[#8083ff] text-4xl">
            upload_file
          </span>
          <p className="text-[#c7c4d7] text-sm">
            Drag & drop files here, or{" "}
            <label className="text-[#8083ff] cursor-pointer underline">
              browse
              <input
                type="file"
                multiple
                onChange={handleFiles}
                className="hidden"
                accept=".pdf,.md,.json,.txt,.png,.jpg,.jpeg"
              />
            </label>
          </p>
          <p className="text-xs text-[#c7c4d7] opacity-50">
            PDF, Markdown, JSON, Images supported
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: "rgba(70,69,84,0.2)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8083ff] text-[18px]">
                    {getIcon(f.name)}
                  </span>
                  <span className="text-sm text-[#c0c1ff] truncate max-w-[300px]">
                    {f.name}
                  </span>
                  <span className="text-xs text-[#c7c4d7] opacity-40">
                    {(f.size / 1024).toFixed(1)}kb
                  </span>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  className="text-[#c7c4d7] opacity-50 hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[#c7c4d7] hover:text-white transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: files.length === 0 ? "rgba(128,131,255,0.3)" : "#8083ff",
              color: files.length === 0 ? "rgba(255,255,255,0.4)" : "#000",
              cursor: files.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to document.body — escapes ALL overflow:hidden parents
  return createPortal(modal, document.body);
}