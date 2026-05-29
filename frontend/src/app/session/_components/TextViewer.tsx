import { useEffect, useState } from "react";

export default function TextFileViewer({ file }: { file: File }) {
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    file.text().then(setContent);
  }, [file]);

  return (
    <div
      className="w-full max-w-4xl rounded-xl p-4 sm:p-6 overflow-auto font-mono text-sm leading-relaxed"
      style={{
        background: "#0f0d14",
        border: "1px solid rgba(70,69,84,0.4)",
        color: "#c0c1ff",
        maxHeight: "calc(100vh - 140px)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {content || "Loading…"}
    </div>
  );
}