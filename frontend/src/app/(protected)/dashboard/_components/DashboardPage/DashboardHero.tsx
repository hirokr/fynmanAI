"use client";

import { useMemo } from "react";
import { useDashboardData } from "../DashboardDataProvider";

export default function DashboardHero() {
  const { profile, progress, sessions, resources, isLoading } = useDashboardData();

  const heroText = useMemo(() => {
    const totalSessions = progress?.totals?.sessions ?? sessions.length;
    const activeSessions = progress?.totals?.activeSessions ??
      sessions.filter((session) => session.status === "ACTIVE").length;
    const attachedResources = progress?.totals?.resourcesAttached ?? resources.length;
    const topTopic = progress?.topics?.[0]?.value ?? sessions[0]?.topic ?? "your current work";

    return `Your cognitive system has processed ${totalSessions} sessions and ${attachedResources} resources, with ${activeSessions} active thread${activeSessions === 1 ? "" : "s"} still requiring validation in "${topTopic}".`;
  }, [progress, resources.length, sessions]);

  return (
    <section className="flex flex-col gap-2 py-8 inner-divider">
      <h1 className="font-display text-display text-on-surface">
        {isLoading ? "Loading dashboard..." : `Welcome Back, ${profile?.name || "Investigator"}.`}
      </h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
        {isLoading ? "Synchronizing your latest sessions, resources, and analytics." : heroText}
      </p>
    </section>
  );
}