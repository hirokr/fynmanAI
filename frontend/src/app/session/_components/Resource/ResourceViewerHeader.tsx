type ResourceViewerHeaderProps = {
  file: File;
  objectUrl: string;
  isImage: boolean;
  isPdf: boolean;
  onClose: () => void;
};

export default function ResourceViewerHeader({
  file,
  objectUrl,
  isImage,
  isPdf,
  onClose,
}: ResourceViewerHeaderProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 sm:px-6 py-3 border-b shrink-0"
      style={{
        background: "#15121b",
        borderColor: "rgba(70,69,84,0.4)",
      }}
    >
      {/* Left Side */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span
          className="material-symbols-outlined text-[#8083ff] shrink-0"
          style={{ fontSize: 20 }}
        >
          {isImage ? "image" : isPdf ? "picture_as_pdf" : "article"}
        </span>

        <span className="text-white text-sm font-medium truncate">
          {file.name}
        </span>

        <span className="hidden sm:block text-xs opacity-40 text-white shrink-0">
          {(file.size / 1024).toFixed(1)} KB
        </span>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 shrink-0">
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
        </a>

        {/* Close */}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            color: "white",
          }}
        >
          <span className="material-symbols-outlined text-[20px]">
            close
          </span>
        </button>
      </div>
    </div>
  );
}