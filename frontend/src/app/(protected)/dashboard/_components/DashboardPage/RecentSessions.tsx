"use client";

import { useMemo } from "react";
import { useDashboardData } from "../DashboardDataProvider";

const formatSessionTime = (value?: string | null) => {
  if (!value) return "Recently active";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently active";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

export default function RecentSessions() {
  const { sessions, isLoading } = useDashboardData();

  const visibleSessions = useMemo(
    () => sessions.slice(0, 2),
    [sessions]
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface">
          Recent Sessions
        </h2>
        <button className="text-primary font-label-md text-label-md hover:underline">
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <div
                key={`session-skeleton-${index}`}
                className="bg-[#111827] border border-[#273244] p-4 flex flex-col gap-4 animate-pulse"
              >
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-6 w-3/4 bg-white/10 rounded" />
                <div className="h-4 w-40 bg-white/10 rounded mt-auto" />
                <div className="h-10 w-full bg-white/10 rounded" />
              </div>
            ))
          : visibleSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#111827] border border-[#273244] p-4 flex flex-col gap-4 hover:border-[#4f6bff] transition-all cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-tighter mb-1">
                      {session.subject || "General Session"}
                    </span>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {session.topic || session.goal || "Untitled Session"}
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    more_vert
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                    schedule
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {session.status === "ACTIVE"
                      ? `Started ${formatSessionTime(session.startedAt)}`
                      : `Ended ${formatSessionTime(session.endedAt || session.startedAt)}`}
                  </span>
                </div>
                <button className="w-full bg-[#1a2232] border border-[#273244] py-2 text-on-surface font-label-md text-label-md group-hover:bg-[#4f6bff] group-hover:border-transparent transition-all">
                  Resume Session
                </button>
              </div>
            ))}
      </div>
    </section>
  );
}