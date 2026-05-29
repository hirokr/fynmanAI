"use client";

import { useMemo } from "react";

import { useDashboardData } from "../../_components/DashboardDataProvider";

const depthModes = [
  { title: "Casual", subtitle: "Brief & Direct" },
  { title: "Deep", subtitle: "Analytical Rooting" },
  { title: "Exam", subtitle: "Knowledge Audit" },
  { title: "Challenge", subtitle: "Strict Dialectic" },
];

export default function CognitiveSection() {
  const { profile, progress } = useDashboardData();

  const activeMode = useMemo(() => {
    const sessionCount = progress?.totals?.sessions ?? 0;
    if (sessionCount >= 12) return "Exam";
    if (sessionCount >= 6) return "Challenge";
    return profile?.interests?.length ? "Deep" : "Casual";
  }, [profile?.interests?.length, progress?.totals?.sessions]);

  const defaultPersonality = useMemo(() => {
    if ((profile?.interests?.length ?? 0) > 3) {
      return "Analytical Peer - Collaborative data synthesis";
    }

    if ((progress?.totals?.resourcesAttached ?? 0) > 0) {
      return "Soft Socratic - Guiding through questions";
    }

    return "Challenger - Pressure-testing logic";
  }, [profile?.interests?.length, progress?.totals?.resourcesAttached]);

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
            {depthModes.map((mode) => {
              const active = mode.title === activeMode;

              return (
              <button
                key={mode.title}
                className={
                  active
                    ? "p-4 rounded border border-primary bg-primary/5 text-center"
                    : "p-4 rounded border border-outline-variant hover:border-primary transition-all text-center group"
                }
              >
                <p
                  className={
                    active
                      ? "font-bold text-primary"
                      : "font-bold text-on-surface"
                  }
                >
                  {mode.title}
                </p>
                <p
                  className={
                    active
                      ? "text-xs text-primary/70"
                      : "text-xs text-outline group-hover:text-on-surface-variant"
                  }
                >
                  {mode.subtitle}
                </p>
              </button>
              );
            })}
          </div>
          <p className="text-xs text-outline-variant">
            Based on {profile?.interests?.length ?? 0} interest tag{(profile?.interests?.length ?? 0) === 1 ? "" : "s"} and {progress?.totals?.sessions ?? 0} tracked session{(progress?.totals?.sessions ?? 0) === 1 ? "" : "s"}.
          </p>
        </div>

        <div className="space-y-4">
          <label className="text-label-sm uppercase tracking-wider text-outline">
            Preferred AI Personality
          </label>
          <select
            className="w-full bg-surface-container border border-outline-variant rounded px-4 py-4 appearance-none focus:border-primary focus:outline-none transition-all"
            defaultValue={defaultPersonality}
          >
            <option>Soft Socratic - Guiding through questions</option>
            <option>Challenger - Pressure-testing logic</option>
            <option>Analytical Peer - Collaborative data synthesis</option>
          </select>
        </div>
      </div>
    </section>
  );
}