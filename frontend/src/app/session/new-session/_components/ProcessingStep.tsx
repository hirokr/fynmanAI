interface ProcessingStepProps {
  processingText: string;
}

export default function ProcessingStep({ processingText }: ProcessingStepProps) {
  return (
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
  );
}