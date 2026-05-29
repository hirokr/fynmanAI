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
    <div className="max-w-4xl mx-auto flex flex-col gap-8" id="step-brief">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-accent">
          <span className="material-symbols-outlined text-[18px]">verified</span>
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
            {[
              { label: "Heuristic Evaluation", opacity: "" },
              { label: "Cognitive Mapping", opacity: "opacity-80" },
              { label: "Information Foraging", opacity: "opacity-60" },
            ].map(({ label, opacity }) => (
              <div
                key={label}
                className={`flex flex-col border-l-2 border-accent pl-4 py-1 ${opacity}`}
              >
                <span className="font-body-md text-body-md text-on-surface">
                  {label}
                </span>
              </div>
            ))}
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

        <div className="border border-outline-variant bg-surface-container-low p-8 rounded-lg flex flex-col gap-6">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            Session Scope
          </h3>
          <div className="flex flex-col gap-3">
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Subject (e.g., math)"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-highest/60 px-4 py-2 text-sm text-on-surface outline-none focus:border-accent"
            />
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Topic (e.g., vectors)"
              className="w-full rounded-lg border border-outline-variant bg-surface-container-highest/60 px-4 py-2 text-sm text-on-surface outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end gap-4 mb-8 md:mb-0">
        <AuthGuardAction
          className="border border-outline-variant text-on-surface-variant py-2 px-8 rounded-lg"
          onAuthenticatedClick={onReset}
        >
          Reset Session
        </AuthGuardAction>

        <AuthGuardAction
          className={`bg-accent text-on-background py-2 px-8 rounded-lg flex items-center gap-2 ${
            beginLoading ? "opacity-60 pointer-events-none" : ""
          }`}
          onAuthenticatedClick={handleBegin}
        >
          {beginLoading ? "Starting..." : "Begin Session"}
          <span className="material-symbols-outlined text-[18px]">forward</span>
        </AuthGuardAction>
      </div>

      {beginError && (
        <p className="text-sm text-error text-right">{beginError}</p>
      )}
    </div>
  );
}