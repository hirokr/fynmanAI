import AuthGuardAction from "@/components/auth/AuthActionButton";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth/AuthContext";
import { useVoiceStore } from "@/store/useVoiceStore";
import { startSessionApi } from "@/services/session.service";

interface BriefStepProps {
  onReset: () => void;
}

export default function BriefStep({ onReset }: BriefStepProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const {
    resourceIds,
    subject,
    topic,
    setSubject,
    setTopic,
    resetLearningSessionState,
  } = useVoiceStore();
  const [beginLoading, setBeginLoading] = useState(false);
  const [beginError, setBeginError] = useState<string | null>(null);

  const handleBegin = async () => {
    if (beginLoading) return;
    if (!accessToken) {
      setBeginError("Sign in to start a session.");
      return;
    }
    setBeginLoading(true);
    setBeginError(null);

    try {
      resetLearningSessionState();
      await startSessionApi({
        token: accessToken,
        payload: {
          subject: subject.trim() || undefined,
          topic: topic.trim() || undefined,
          resourceIds: resourceIds.length ? resourceIds : undefined,
        },
      });
      router.push("/session/active-session");
    } catch (error) {
      setBeginError(
        error instanceof Error ? error.message : "Failed to start session"
      );
    } finally {
      setBeginLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-0" id="step-brief">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-accent">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span className="font-label-md text-label-md uppercase tracking-widest">
            Analysis Complete
          </span>
        </div>
        <h1 className="font-display text-display text-on-surface">
          Session Scope
        </h1>
        <p className="max-w-2xl font-body-lg text-body-lg text-on-surface-variant">
          Define the subject and topic for the session. Keep it broad enough to
          guide exploration, but specific enough to stay focused.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-outline-variant bg-linear-to-br from-surface-container-low via-surface-container-low to-surface-container-highest/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-8 lg:p-10">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent/70 to-transparent" />

        <div className="flex flex-col gap-2">
          <h3 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
            Session Scope
          </h3>
          <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
            Add a subject and topic so the session starts with the right frame of
            reference.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Subject
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject (e.g., math)"
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-highest/75 px-5 py-4 text-base text-on-surface outline-none transition-colors focus:border-accent"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Topic
            </span>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Topic (e.g., vectors)"
              className="w-full rounded-2xl border border-outline-variant bg-surface-container-highest/75 px-5 py-4 text-base text-on-surface outline-none transition-colors focus:border-accent"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/70 bg-background/40 px-5 py-4">
          <span className="material-symbols-outlined text-accent">tune</span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            This scope will guide the opening conversation and can be refined
            later if needed.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4 sm:pt-4">
        <AuthGuardAction
          className="rounded-lg border border-outline-variant px-8 py-2 text-on-surface-variant transition-all hover:border-on-surface-variant hover:text-on-surface"
          onAuthenticatedClick={onReset}
        >
          Reset Session
        </AuthGuardAction>

        <AuthGuardAction
          className={`flex items-center gap-2 rounded-lg border border-outline-variant bg-accent px-8 py-2 text-on-background transition-all ${
            beginLoading ? "pointer-events-none opacity-60" : "hover:brightness-110"
          }`}
          onAuthenticatedClick={handleBegin}
        >
          {beginLoading ? "Starting..." : "Begin Session"}
          <span className="material-symbols-outlined text-[18px]">forward</span>
        </AuthGuardAction>
      </div>

      {beginError && (
        <p className="text-right text-sm text-error">{beginError}</p>
      )}
    </div>
  );
}