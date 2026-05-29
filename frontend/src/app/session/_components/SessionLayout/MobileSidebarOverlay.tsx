interface MobileSidebarOverlayProps {
  isLeftOpen: boolean;
  isRightOpen: boolean;
  onClose: () => void;
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export default function MobileSidebarOverlay({
  isLeftOpen,
  isRightOpen,
  onClose,
  leftContent,
  rightContent,
}: MobileSidebarOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 md:hidden transition-opacity ${
        isLeftOpen || isRightOpen
          ? "opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={`absolute left-0 top-14 h-[calc(100%-3.5rem)] w-70 bg-surface-container-low border-r border-outline-variant panel-transition ${
          isLeftOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Session resources"
      >
        {leftContent}
      </aside>
      <aside
        className={`absolute right-0 top-14 h-[calc(100%-3.5rem)] w-80 bg-surface-container-low border-l border-outline-variant panel-transition ${
          isRightOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Session settings"
      >
        {rightContent}
      </aside>
    </div>
  );
}