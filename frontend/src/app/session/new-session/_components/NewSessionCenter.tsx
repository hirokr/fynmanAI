"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import AuthGuardAction from "@/components/auth/AuthActionButton";
import UploadModal from "./UploadModal";
import { useSessionResources } from "../../_components/SessionResourcesContext";

type Step = "upload" | "processing" | "brief";

const stages = [
  "Analyzing vectors...",
  "Structuring concepts...",
  "Extracting semantics...",
  "Building knowledge graph...",
  "Finalizing brief...",
];

export default function NewSessionCenter() {
  const [step, setStep] = useState<Step>("upload");
  const [stageIndex, setStageIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);

  // 🔥 Shared resources from context (also visible in sidebar)
  const { resources, addFiles, removeFile } = useSessionResources();

  useEffect(() => {
    if (step !== "processing") return undefined;

    setStageIndex(0);
    const interval = window.setInterval(() => {
      setStageIndex((current) => {
        const next = current + 1;
        if (next >= stages.length) {
          window.clearInterval(interval);
          setStep("brief");
          return current;
        }
        return next;
      });
    }, 1200);

    return () => window.clearInterval(interval);
  }, [step]);

  const processingText = useMemo(
    () => stages[Math.min(stageIndex, stages.length - 1)],
    [stageIndex]
  );

  const getIcon = (name: string) => {
    if (name.endsWith(".pdf")) return "picture_as_pdf";
    if (name.endsWith(".md")) return "article";
    if (name.endsWith(".json")) return "data_object";
    if (name.match(/\.(png|jpg|jpeg|gif|webp)$/)) return "image";
    if (name.endsWith(".txt")) return "sticky_note_2";
    return "draft";
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-8 custom-scrollbar-session"
      id="flow-container"
    >
      {/* ── STEP: UPLOAD ── */}
      {step === "upload" && (
        <div className="max-w-3xl mx-auto flex flex-col gap-8" id="step-upload">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-display text-on-surface">
              Initiate New Session
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Synchronize resources for cognitive analysis.
            </p>
          </div>

          {/* Upload trigger */}
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="border border-outline-variant bg-surface-container-low p-8 rounded-lg flex flex-col items-center justify-center gap-4 hover:border-accent cursor-pointer group transition-all h-64 w-full"
          >
            <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center group-hover:bg-accent/10 transition-all">
              <span className="material-symbols-outlined text-on-surface-variant group-hover:text-accent">
                upload_file
              </span>
            </div>
            <div className="text-center">
              <p className="font-body-md text-body-md text-on-surface">
                Click or drag files to sync
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">
                PDF, Markdown, or JSON preferred
              </p>
            </div>
          </button>

        

          {/* Process button */}
          <div className="pt-2 flex justify-end">
            <AuthGuardAction
              className="bg-accent text-on-background py-2 px-8 rounded-lg font-label-md text-label-md hover:brightness-110 transition-all flex items-center gap-2"
              onAuthenticatedClick={() => setStep("processing")}
            >
              Process Session
              <span className="material-symbols-outlined text-[18px]">
                forward
              </span>
            </AuthGuardAction>
          </div>
        </div>
      )}

      {/* ── STEP: PROCESSING ── */}
      {step === "processing" && (
        <div
          className="h-full flex flex-col items-center justify-center text-center gap-6"
          id="step-processing"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-2 border-accent/20 rounded-full" />
            <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin" />
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-headline-md text-headline-md text-on-surface-variant">
              {processingText}
            </p>
            <p className="font-label-md text-label-md text-on-surface-variant opacity-40">
              Integrating provided resources into active memory
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: BRIEF ── */}
      {step === "brief" && (
        <div className="max-w-4xl mx-auto flex flex-col gap-8" id="step-brief">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-accent">
              <span className="material-symbols-outlined text-[18px]">
                verified
              </span>
              <span className="font-label-md text-label-md uppercase tracking-widest">
                Analysis Complete
              </span>
            </div>
            <h1 className="font-display text-display text-on-surface">
              Session Architecture
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-outline-variant bg-surface-container-low p-8 rounded-lg flex flex-col gap-6">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                Detected Domains
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col border-l-2 border-accent pl-4 py-1">
                  <span className="font-body-md text-body-md text-on-surface">
                    Heuristic Evaluation
                  </span>
                </div>
                <div className="flex flex-col border-l-2 border-accent pl-4 py-1 opacity-80">
                  <span className="font-body-md text-body-md text-on-surface">
                    Cognitive Mapping
                  </span>
                </div>
                <div className="flex flex-col border-l-2 border-accent pl-4 py-1 opacity-60">
                  <span className="font-body-md text-body-md text-on-surface">
                    Information Foraging
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-outline-variant bg-surface-container-low p-8 rounded-lg flex flex-col gap-6">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                Priority Focus
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                The system recommends focusing on{" "}
                <strong>Heuristic Interconnectivity</strong>.
              </p>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 mb-8 md:mb-0">
            <AuthGuardAction
              className="border border-outline-variant text-on-surface-variant py-2 px-8 rounded-lg"
              onAuthenticatedClick={() => setStep("upload")}
            >
              Reset Session
            </AuthGuardAction>

            <Link
              href="/session/active-session"
              className="bg-accent text-on-background py-2 px-8 rounded-lg flex items-center gap-2"
            >
              Begin Session
              <span className="material-symbols-outlined text-[18px]">
                forward
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={addFiles}
      />
    </div>
  );
}