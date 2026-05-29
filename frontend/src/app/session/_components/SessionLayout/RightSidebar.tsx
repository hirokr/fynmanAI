const depthModes = [
  { label: "Casual", active: false },
  { label: "Deep", active: true },
  { label: "Exam", active: false },
  { label: "Challenge", active: false },
];

interface RightSidebarProps {
  isActiveSession: boolean;
  onOpenArtcraft: () => void;
}

export default function RightSidebar({
  isActiveSession,
  onOpenArtcraft,
}: RightSidebarProps) {
  return (
    <div className="pt-14 p-6 flex flex-col gap-8 h-full custom-scrollbar-transparent overflow-y-auto">
      {/* AI Partner card */}
      <div className="p-4 bg-surface-container border border-outline-variant rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">
              psychology
            </span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface font-bold">
              FymenAI Partner
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Active Intelligence
            </p>
          </div>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant italic">
          "Guides reasoning through structured questioning"
        </p>
        <button className="mt-1 text-primary font-label-md text-label-md text-left hover:underline">
          Edit Partner
        </button>
      </div>

      {/* Depth Mode */}
      <div className="flex flex-col gap-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
          Depth Mode
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {depthModes.map((mode) => (
            <button
              key={mode.label}
              className={
                mode.active
                  ? "px-2 py-1 text-left font-label-md text-label-md rounded-lg bg-primary text-on-primary border border-primary"
                  : "px-2 py-1 text-left font-label-md text-label-md rounded-lg bg-surface-container-high border border-outline-variant text-on-surface"
              }
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Artcraft — active session only */}
      {isActiveSession && (
        <div className="flex flex-col gap-4">
          <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
            Artcraft
          </h3>
          <button
            className="flex items-center justify-between p-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all group"
            onClick={onOpenArtcraft}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">
                draw
              </span>
              <span className="font-body-md text-body-md text-on-surface">
                Visual Sketchpad
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {/* Voice */}
      <div className="flex flex-col gap-4">
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-1">
          Voice
        </h3>
        <div className="relative">
          <select className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-2 font-body-md text-body-md text-on-surface appearance-none focus:border-primary outline-none">
            <option>Atlas (Deep Warm)</option>
            <option>Nova (Clear Direct)</option>
            <option>Ember (Soft Academic)</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
            expand_more
          </span>
        </div>
      </div>

      {/* Session stats */}
      <div className="mt-auto pt-8">
        <div className="p-4 rounded-xl bg-surface-container-lowest/50 border border-outline-variant flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Session Duration
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              42:15
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Reasoning Cycles
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              12
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}