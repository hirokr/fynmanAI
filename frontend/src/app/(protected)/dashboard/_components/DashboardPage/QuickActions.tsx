"use client";

import { useMemo } from "react";
import { useDashboardData } from "../DashboardDataProvider";

export default function QuickActions() {
  const { resources, sessions, progress, isLoading } = useDashboardData();

  const quickActions = useMemo(
    () => [
      {
        icon: "upload_file",
        title: "Upload Data",
        description: `${resources.length} resources synced from the backend.`,
        tone: "text-primary",
      },
      {
        icon: "bookmarks",
        title: "Bookmarks",
        description: `${resources.filter((resource) => resource.status === "READY").length} ready resources available for review.`,
        tone: "text-tertiary",
      },
      {
        icon: "history",
        title: "Recent Logs",
        description: `${progress?.totals?.transcriptChunks ?? sessions.reduce((total, session) => total + (session._count?.transcriptChunks ?? 0), 0)} transcript chunks recorded.`,
        tone: "text-on-secondary-container",
      },
    ],
    [progress?.totals?.transcriptChunks, resources, sessions]
  );

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {isLoading
        ? Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`quick-action-skeleton-${index}`}
              className="bg-[#0e1626] border border-[#273244] p-4 flex flex-col gap-2 animate-pulse"
            >
              <div className="h-6 w-6 bg-white/10 rounded" />
              <div className="h-5 w-32 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
            </div>
          ))
        : quickActions.map((action) => (
            <div
              key={action.title}
              className="bg-[#0e1626] border border-[#273244] p-4 flex flex-col gap-2 hover:bg-[#111827] transition-all cursor-pointer"
            >
              <span className={`material-symbols-outlined ${action.tone}`}>
                {action.icon}
              </span>
              <h4 className="font-headline-md text-headline-md text-on-surface">
                {action.title}
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {action.description}
              </p>
            </div>
          ))}
    </section>
  );
}