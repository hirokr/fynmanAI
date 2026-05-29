"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void | Promise<void>;
  uploadLoading?: boolean;
  uploadError?: string | null;
  uploadSuccess?: boolean;
};

export default function UploadModal({
  open,
  onClose,
  onUpload,
  uploadLoading = false,
  uploadError,
  uploadSuccess,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const effectiveUploading = uploading || uploadLoading;
  const effectiveError = localError ?? uploadError ?? null;

  if (!open || typeof document === "undefined") return null;

  const resetModal = () => {
    setFiles([]);
    setLocalError(null);
  };

  const handleClose = () => {
    if (effectiveUploading) return;

    resetModal();
    onClose();
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setLocalError(null);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !existingNames.has(f.name))];
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setLocalError(null);
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      return [...prev, ...dropped.filter((f) => !existingNames.has(f.name))];
    });
  };

  const removeFile = (name: string) => {
    setLocalError(null);
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return;

    setUploading(true);
    setLocalError(null);

    try {
      await onUpload(files);
      resetModal();
      onClose();
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to upload documents"
      );
    } finally {
      setUploading(false);
    }
  };

  const getIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "picture_as_pdf";
    if (name.endsWith(".md")) return "article";
    if (name.endsWith(".docx") || name.endsWith(".pptx")) return "article";
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
    return "draft";
  };

  const modal = (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) handleClose();
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
            onClick={handleClose}
            disabled={effectiveUploading}
            className="text-[#c7c4d7] hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="rounded-lg p-8 text-center flex flex-col items-center gap-3 transition-colors"
          style={{
            border: isDragging
              ? "2px dashed rgba(128,131,255,0.8)"
              : "2px dashed rgba(70,69,84,0.6)",
          }}
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
                accept=".pdf,.docx,.pptx,.md,.markdown,.txt,.png,.jpg,.jpeg"
                disabled={effectiveUploading}
              />
            </label>
          </p>
          <p className="text-xs text-[#c7c4d7] opacity-50">
            PDF, DOCX, PPTX, Markdown, text, and images supported
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
                  <span className="text-sm text-[#c0c1ff] truncate max-w-75">
                    {f.name}
                  </span>
                  <span className="text-xs text-[#c7c4d7] opacity-40">
                    {(f.size / 1024).toFixed(1)}kb
                  </span>
                </div>
                <button
                  onClick={() => removeFile(f.name)}
                  disabled={effectiveUploading}
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

        {effectiveError && (
          <p className="rounded-lg px-3 py-2 text-sm text-[#ffb4b4] bg-[#3a1f2a]">
            {effectiveError}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={handleClose}
            disabled={effectiveUploading}
            className="px-4 py-2 text-[#c7c4d7] hover:text-white transition-colors text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || effectiveUploading}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background:
                files.length === 0 || effectiveUploading
                  ? "rgba(128,131,255,0.3)"
                  : "#8083ff",
              color:
                files.length === 0 || effectiveUploading
                  ? "rgba(255,255,255,0.4)"
                  : "#000",
              cursor:
                files.length === 0 || effectiveUploading
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {effectiveUploading
              ? "Uploading..."
              : `Upload ${files.length > 0 ? `(${files.length})` : ""}`}
          </button>
        </div>
        {uploadSuccess && !uploadLoading && (
          <p className="text-sm text-[#c7c4d7] text-right">
            Upload complete.
          </p>
        )}
      </div>
    </div>
  );

  // Portal to document.body — escapes ALL overflow:hidden parents
  return createPortal(modal, document.body);
}
