type FinalSummary = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missed_concepts: string[];
  follow_up: string[];
  confidence_score: number;
  topic_drift: boolean;
  cited_evidence: string[];
};

type SessionSummaryCardProps = {
  summary: FinalSummary;
};

const Section = ({
  title,
  items,
}: {
  title: string;
  items: string[];
}) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-high px-4 py-3">
      <h3 className="mb-2 text-label-md uppercase tracking-widest text-on-surface-variant">
        {title}
      </h3>
      <ul className="space-y-2 text-body-md text-on-surface">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function SessionSummaryCard({ summary }: SessionSummaryCardProps) {
  return (
    <div className="w-full rounded-3xl border border-outline-variant bg-surface-container-low p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-display-sm text-on-surface">
            Final Session Summary
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            End-of-session evaluation based on the full learning history.
          </p>
        </div>

        <div className="rounded-full border border-outline-variant/70 bg-surface-container-high px-3 py-1 text-body-md text-on-surface">
          Confidence: {summary.confidence_score}
        </div>
      </div>

      {summary.summary && (
        <div className="mb-4 rounded-2xl border border-outline-variant/70 bg-surface-container-high px-4 py-3">
          <h3 className="mb-2 text-label-md uppercase tracking-widest text-on-surface-variant">
            Overall Summary
          </h3>
          <p className="text-body-md leading-relaxed text-on-surface">
            {summary.summary}
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Section title="Strengths" items={summary.strengths} />
        <Section title="Weaknesses" items={summary.weaknesses} />
        <Section title="Missed Concepts" items={summary.missed_concepts} />
        <Section title="Recommended Next Focus Areas" items={summary.follow_up} />
        <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-high px-4 py-3">
          <h3 className="mb-2 text-label-md uppercase tracking-widest text-on-surface-variant">
            Topic Drift
          </h3>
          <p className="text-body-md text-on-surface">
            {summary.topic_drift ? "Detected" : "Not detected"}
          </p>
        </div>
        {summary.cited_evidence.length > 0 && (
          <Section title="Cited Evidence" items={summary.cited_evidence} />
        )}
      </div>
    </div>
  );
}