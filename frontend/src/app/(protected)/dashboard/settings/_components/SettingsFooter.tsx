export default function SettingsFooter() {
  return (
    <div className="pt-6 flex justify-end gap-2 sm:gap-4">
      <button className="px-4 py-2 sm:px-6 sm:py-4 text-sm sm:text-base text-on-surface-variant font-label-md hover:bg-surface-container-high rounded-lg transition-colors">
        Discard Changes
      </button>
      <button className="px-5 py-2 sm:px-8 sm:py-4 text-sm sm:text-base bg-primary text-on-primary font-bold rounded-lg transition-all hover:brightness-110">
        Save All Changes
      </button>
    </div>
  );
}