const depthModes = [
  { title: "Casual", subtitle: "Brief & Direct", active: false },
  { title: "Deep", subtitle: "Analytical Rooting", active: true },
  { title: "Exam", subtitle: "Knowledge Audit", active: false },
  { title: "Challenge", subtitle: "Strict Dialectic", active: false },
];

export default function CognitiveSection() {
  return (
    <section className="space-y-6 pt-6" id="cognitive">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          Cognitive Preferences
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Calibrate how the AI interacts with your mental workflow.
        </p>
      </div>
      <div className="space-y-8">
        <div className="space-y-4">
          <label className="text-label-sm uppercase tracking-wider text-outline">
            Default Depth Mode
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {depthModes.map((mode) => (
              <button
                key={mode.title}
                className={
                  mode.active
                    ? "p-4 rounded border border-primary bg-primary/5 text-center"
                    : "p-4 rounded border border-outline-variant hover:border-primary transition-all text-center group"
                }
              >
                <p
                  className={
                    mode.active
                      ? "font-bold text-primary"
                      : "font-bold text-on-surface"
                  }
                >
                  {mode.title}
                </p>
                <p
                  className={
                    mode.active
                      ? "text-xs text-primary/70"
                      : "text-xs text-outline group-hover:text-on-surface-variant"
                  }
                >
                  {mode.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-label-sm uppercase tracking-wider text-outline">
            Preferred AI Personality
          </label>
          <select className="w-full bg-surface-container border border-outline-variant rounded px-4 py-4 appearance-none focus:border-primary focus:outline-none transition-all">
            <option>Soft Socratic - Guiding through questions</option>
            <option>Challenger - Pressure-testing logic</option>
            <option>Analytical Peer - Collaborative data synthesis</option>
          </select>
        </div>
      </div>
    </section>
  );
}