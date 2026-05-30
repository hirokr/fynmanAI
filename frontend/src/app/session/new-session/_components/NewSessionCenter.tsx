"use client";

import { useEffect, useMemo, useState } from "react";
import UploadModal from "./UploadModal";
import UploadStep from "./UploadStep";
import ProcessingStep from "./ProcessingStep";
import BriefStep from "./BriefStep";
import { useSessionResources } from "../../../../context/Resource/SessionResourcesContext";
import { useAuth } from "@/context/auth/AuthContext";
import { uploadDocument, validateUploadFile } from "@/services/upload.service";
import { useVoiceStore } from "@/store/useVoiceStore";

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

  const {
    addFiles,
    uploadLoading,
    uploadSuccess,
    uploadError,
    setUploadLoading,
    setUploadSuccess,
    setUploadError,
    addParsedDocument,
    parsedDocuments,
    resetResources,
  } = useSessionResources();
  const { accessToken } = useAuth();
  const { setResourceIds, resetSessionState } = useVoiceStore();

  const handleProcessSession = () => {
    const currentResourceIds = Array.from(
      new Set(
        parsedDocuments
          .map((document) => document?.resource?.id)
          .filter((id): id is string => Boolean(id))
      )
    );

    setResourceIds(currentResourceIds);
    setStep("processing");
  };

  const handleContinueWithoutResources = () => {
    setResourceIds([]);
    setStep("brief");
  };

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
          onProcess={handleProcessSession}
          onContinueWithoutResources={handleContinueWithoutResources}
          uploadLoading={uploadLoading}
          uploadSuccess={uploadSuccess}
          uploadError={uploadError}
        />
      )}

      {step === "processing" && (
        <ProcessingStep processingText={processingText} />
      )}

      {step === "brief" && (
        <BriefStep
          onReset={() => {
            setStep("upload");
            resetResources();
            resetSessionState();
            setResourceIds([]);
          }}
        />
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async (files) => {
          if (!accessToken) {
            const error = new Error("Sign in to upload files.");
            setUploadError(error.message);
            setUploadSuccess(false);
            throw error;
          }

          setUploadLoading(true);
          setUploadError(null);
          setUploadSuccess(false);

          try {
            for (const file of files) {
              const validation = validateUploadFile(file);
              if (!validation.ok) {
                throw new Error(validation.message);
              }

              const result = await uploadDocument({ file, token: accessToken });
              addParsedDocument(result.data);
            }

            addFiles(files);
            setUploadSuccess(true);
            setUploadOpen(false);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Upload failed";
            setUploadError(message);
            setUploadSuccess(false);
            throw error;
          } finally {
            setUploadLoading(false);
          }
        }}
        uploadLoading={uploadLoading}
        uploadError={uploadError}
        uploadSuccess={uploadSuccess}
      />
    </div>
  );
}
