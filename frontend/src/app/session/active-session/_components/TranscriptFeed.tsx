type SessionState = "listening" | "thinking" | "speaking";

const transcriptBlocks = [
  {
    tone: "muted",
    text: "To understand the core of the problem, we must first define the boundary of the system. What happens if we remove the primary assumption here?",
  },
  {
    tone: "normal",
    text: "If we remove the assumption of constant velocity, the energy balance shifts towards a dynamic state where acceleration becomes the primary driver of entropy.",
  },
  {
    tone: "muted",
    text: "Exactly. And how does that dynamic shift affect the local observer's perception of time?",
  },
];

interface TranscriptFeedProps {
  sessionState: SessionState;
}

export default function TranscriptFeed({ sessionState }: TranscriptFeedProps) {
  return (
    <div className="flex-1 w-full max-w-2xl mt-8 overflow-y-auto custom-scrollbar-transparent pb-32">
      <div className="space-y-6">
        {transcriptBlocks.map((block, index) => (
          <div
            key={`transcript-${index}`}
            className={
              block.tone === "muted"
                ? "font-body-lg text-body-lg text-on-surface-variant leading-relaxed opacity-60"
                : "font-body-lg text-body-lg text-on-surface leading-relaxed"
            }
          >
            {block.text}
          </div>
        ))}
        {sessionState === "thinking" && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                key={`dot-${index}`}
                className="w-1 h-1 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${index * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}