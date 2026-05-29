import ProfileSection from "./ProfileSection";
import CognitiveSection from "./CognitiveSection";
import SystemSection from "./SystemSection";
import SettingsFooter from "./SettingsFooter";

export default function SettingsPage() {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar-settings p-8 bg-surface">
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        <ProfileSection />
        <CognitiveSection />
        <SystemSection />
        <SettingsFooter />
      </div>
    </div>
  );
}