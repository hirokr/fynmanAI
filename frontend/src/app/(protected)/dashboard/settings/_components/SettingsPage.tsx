import ProfileSection from "./ProfileSection";
import CognitiveSection from "./CognitiveSection";
import SystemSection from "./SystemSection";
import PasswordSection from "./PasswordSection";
import SettingsFooter from "./SettingsFooter";

export default function SettingsPage() {
  return (
    <div className="h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar-settings p-4 sm:p-6 md:p-8 bg-surface">
      <div className="max-w-3xl mx-auto space-y-8 pb-8">
        <ProfileSection />
        <CognitiveSection />
        <SystemSection />
        <PasswordSection />
        <SettingsFooter />
      </div>
    </div>
  );
}