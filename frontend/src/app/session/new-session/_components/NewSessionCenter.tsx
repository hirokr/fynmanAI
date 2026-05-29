"use client";

import { useEffect, useMemo, useState } from "react";
import UploadModal from "./UploadModal";
import UploadStep from "./UploadStep";
import ProcessingStep from "./ProcessingStep";
import BriefStep from "./BriefStep";
import { useSessionResources } from "../../../../context/Resource/SessionResourcesContext";

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

  const { addFiles } = useSessionResources();

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

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-session" id="flow-container">
      {step === "upload" && (
        <UploadStep
          onOpenModal={() => setUploadOpen(true)}
          onProcess={() => setStep("processing")}
        />
      )}

      {step === "processing" && (
        <ProcessingStep processingText={processingText} />
      )}

      {step === "brief" && (
        <BriefStep onReset={() => setStep("upload")} />
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={addFiles}
      />
    </div>
  );
}