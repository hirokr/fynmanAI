"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useDashboardData } from "../DashboardDataProvider";

const networkImageUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBWThB59D_DBVFFEmz1ueL-At9mj1RpSmolTKtygoNDNAlv_ldEeUD_lp2NGBPVFsGfJ1wneF65WVKqUXS4RJwZn2RsdpRoKGmdie97gzPTFXbddQF3Eak59YwdnBbzC1yY1bvYYsdICqH_7z7xtT2FLw0oGOTsbC-1asQYTzTty0kOzSF5j3f0LglqiS3w_kjNMkj1FAAKbCiDpxNb_rhJpKtVZX7RB0Pb6mGaE7vI3_EQilqSkx1recfjE8EXMBctYdZdnRBcDMMk";

const suggestedActions = [
  "Re-evaluate Node 42 causal bridge",
  "Synthesize ethics report for Thread B",
  "Update knowledge base from latest upload",
];

export default function DashboardSidebar() {
  const { progress, trends, resources, isLoading } = useDashboardData();

  const consistency = progress?.averages?.confidenceScore ?? 0;
  const topTopic = trends?.byTopic?.[0];
  const suggestedActions = useMemo(() => {
    const missedConcept = trends?.trend?.find((point) => point.missedConcepts.length)
      ?.missedConcepts[0];
    return [
      missedConcept
        ? `Re-evaluate ${missedConcept} across recent sessions`
        : "Re-evaluate the latest session transcript",
      topTopic
        ? `Synthesize follow-up notes for ${topTopic.topic}`
        : "Synthesize the latest resource summary",
      resources.length
        ? `Update knowledge base from ${resources.length} synced resource${resources.length === 1 ? "" : "s"}`
        : "Update knowledge base from the latest upload",
    ];
  }, [resources.length, topTopic, trends?.trend]);

  return (
    <aside className="hidden lg:flex fixed right-0 top-0 h-screen w-80 bg-surface-container-low border-l border-outline-variant flex-col p-6 gap-6 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
          Session Intelligence
        </span>
        <div className="p-4 bg-[#111827] border border-[#273244] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Logical Consistency
            </span>
            <span className="font-label-md text-label-md text-primary">
              {isLoading ? "..." : `${Math.round(consistency)}%`}
            </span>
          </div>
          <div className="w-full h-1 bg-[#1f2a3a]">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.max(0, Math.min(100, consistency))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
          Network Visualization
        </span>
        <div className="aspect-square w-full bg-[#111827] border border-[#273244] relative overflow-hidden">
          <Image
            src={networkImageUrl}
            alt="Data visualization"
            fill
            sizes="(min-width: 1024px) 320px, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#111827] to-transparent pointer-events-none" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-tertiary-container uppercase tracking-widest font-bold">
          Suggested Actions
        </span>
        <div className="flex flex-col gap-1">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`suggested-action-skeleton-${index}`}
                  className="p-2 text-on-surface-variant font-body-md text-body-md border-l border-transparent pl-4 transition-all animate-pulse"
                >
                  <div className="h-4 w-full bg-white/10 rounded" />
                </div>
              ))
            : suggestedActions.map((action) => (
            <div
              key={action}
              className="p-2 text-on-surface-variant font-body-md text-body-md hover:text-on-surface cursor-pointer border-l border-transparent hover:border-primary pl-4 transition-all"
            >
              • {action}
            </div>
            ))}
        </div>
      </div>

      <div className="mt-auto p-4 bg-[#1a2232] border border-[#4f6bff] rounded-lg">
        <p className="font-label-sm text-label-sm text-on-surface italic">
          "The clarity of your logic determines the strength of the system."
        </p>
        <div className="mt-2 text-[10px] text-primary uppercase font-bold">
          — System Core
        </div>
      </div>
    </aside>
  );
}