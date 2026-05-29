type SessionState = "listening" | "thinking" | "speaking";

interface SessionStatusBadgeProps {
  sessionState: SessionState;
  statusLabel: string;
  statusDotClass: string;
}

export default function SessionStatusBadge({
  statusLabel,
  statusDotClass,
}: SessionStatusBadgeProps) {
  return (
    <div className="absolute top-2 flex items-center gap-4 py-1 px-4 rounded-full bg-surface-container-lowest border border-outline-variant">
      <div className={`w-2 h-2 rounded-full ${statusDotClass}`} />
      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
        {statusLabel}
      </span>
    </div>
  );
}