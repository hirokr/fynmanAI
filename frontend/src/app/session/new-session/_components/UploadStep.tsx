"use client";

import AuthGuardAction from "@/components/auth/AuthActionButton";

interface UploadStepProps {
  onOpenModal: () => void;
  onProcess: () => void;
  onContinueWithoutResources: () => void;
  uploadLoading: boolean;
  uploadSuccess: boolean;
  uploadError: string | null;
}

export default function UploadStep({
  onOpenModal,
  onProcess,
  onContinueWithoutResources,
  uploadLoading,
  uploadSuccess,
  uploadError,
}: UploadStepProps) {
  const canProcess = uploadSuccess && !uploadLoading;

  return (
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
        onClick={onOpenModal}
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
      <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3">
        <AuthGuardAction
          className="border border-outline-variant bg-surface-container-low text-on-surface-variant py-3 px-6 rounded-lg font-label-md text-label-md transition-all hover:border-on-surface-variant hover:text-on-surface"
          onAuthenticatedClick={onContinueWithoutResources}
        >
          Continue Without Resources
        </AuthGuardAction>

        <AuthGuardAction
          className={`border border-outline-variant bg-accent text-on-background py-2 px-8 rounded-lg font-label-md text-label-md transition-all flex items-center gap-2 ${
            canProcess ? "hover:brightness-110" : "opacity-50 pointer-events-none"
          }`}
          onAuthenticatedClick={canProcess ? onProcess : undefined}
        >
          {uploadLoading ? "Uploading" : "Process Session"}
          <span className="material-symbols-outlined text-[18px]">forward</span>
        </AuthGuardAction>
      </div>

      {uploadError && (
        <p className="text-sm text-error text-right">{uploadError}</p>
      )}

      {uploadSuccess && !uploadLoading && (
        <p className="text-sm text-on-surface-variant text-right">
          Upload complete. You can continue.
        </p>
      )}
    </div>
  );
}