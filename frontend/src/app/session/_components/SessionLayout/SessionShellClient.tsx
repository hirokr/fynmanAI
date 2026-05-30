"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

import TopNav from "@/components/landing/TopNav";
import MobileNav from "@/components/ui/MobileNav";
import UploadModal from "@/app/session/new-session/_components/UploadModal";
import ResourceViewer from "../Resource/ResourceViewer";
import { useSessionResources } from "../../../../context/Resource/SessionResourcesContext";

import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import ArtcraftModal from "./ArtcraftModal";
import MobileSidebarOverlay from "./MobileSidebarOverlay";
import { useVoiceStore } from "@/store/useVoiceStore";

type SessionShellClientProps = {
  children: React.ReactNode;
};

export default function SessionShellClient({ children }: SessionShellClientProps) {
  const pathname = usePathname();
  const isActiveSession = pathname.includes("/session/active-session");

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [isArtcraftOpen, setIsArtcraftOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<File | null>(null);

  const { resources, addFiles, removeFile } = useSessionResources();
  const hasAiResponded = useVoiceStore((state) => state.hasAiResponded);
  const isRecording = useVoiceStore((state) => state.isRecording);
  const isProcessing = useVoiceStore((state) => state.isProcessing);
  const voiceDisabled = isActiveSession && !hasAiResponded;

  const headerTitle = useMemo(
    () => (isActiveSession ? "Sessions" : "New Session"),
    [isActiveSession]
  );

  useEffect(() => {
    const shouldLock = isLeftSidebarOpen || isRightSidebarOpen;
    document.body.style.overflow = shouldLock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLeftSidebarOpen, isRightSidebarOpen]);

  const openLeftSidebar = () => {
    setIsLeftSidebarOpen(true);
    setIsRightSidebarOpen(false);
  };

  const openRightSidebar = () => {
    setIsRightSidebarOpen(true);
    setIsLeftSidebarOpen(false);
  };

  const closeSidebars = () => {
    setIsLeftSidebarOpen(false);
    setIsRightSidebarOpen(false);
  };

  const triggerVoiceMic = () => {
    window.dispatchEvent(new CustomEvent("voice:mic"));
  };

  const triggerVoiceStop = () => {
    window.dispatchEvent(new CustomEvent("voice:stop"));
  };

  const triggerVoiceText = () => {
    window.dispatchEvent(new CustomEvent("voice:text"));
  };

  const leftSidebarContent = (
    <LeftSidebar
      resources={resources}
      onViewFile={setViewingFile}
      onRemoveFile={removeFile}
      onUploadClick={() => setUploadOpen(true)}
    />
  );

  const rightSidebarContent = (
    <RightSidebar
      isActiveSession={isActiveSession}
      onOpenArtcraft={() => setIsArtcraftOpen(true)}
    />
  );

  return (
    <div
      className={`flex flex-col h-screen overflow-hidden text-[#e5e7eb] ${
        isActiveSession ? "bg-[#0b1220]" : "bg-surface-container-lowest"
      } ${isFocusMode ? "focus-mode-active" : ""}`}
    >
      <div className="pt-14">
        <TopNav />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="side-panel panel-transition w-70 bg-surface-container-low border-r border-outline-variant hidden md:flex flex-col">
          {leftSidebarContent}
        </aside>

        <main
          className={
            isActiveSession
              ? "flex-1 flex flex-col min-h-0 relative"
              : "flex-1 flex flex-col min-h-0 relative bg-surface-container-lowest"
          }
        >
          {children}
        </main>

        <aside className="side-panel panel-transition w-80 bg-surface-container-low border-l border-outline-variant hidden md:flex flex-col">
          {rightSidebarContent}
        </aside>
      </div>

      <MobileNav
        leftItems={[
          { icon: "folder_open", label: "Resources", onPress: openLeftSidebar },
          isActiveSession
            ? {
                icon: "keyboard",
                label: "Type",
                onPress: triggerVoiceText,
                disabled: voiceDisabled,
              }
            : { icon: "keyboard", label: "Type", href: "#" },
        ]}
        centerButton={
          isActiveSession
            ? {
                icon: isProcessing ? "progress_activity" : "mic",
                onPress: triggerVoiceMic,
                disabled: voiceDisabled || isProcessing,
                className: isProcessing ? "animate-spin" : "",
              }
            : { icon: "mic", href: "/session/active-session" }
        }
        rightItems={[
          isActiveSession
            ? {
                icon: isRecording ? "stop_circle" : "play_circle",
                label: "Stop",
                onPress: triggerVoiceStop,
                disabled: voiceDisabled || !isRecording,
              }
            : { icon: "stop_circle", label: "Stop", href: "/session/new-session" },
          { icon: "tune", label: "Settings", onPress: openRightSidebar },
        ]}
      />

      <MobileSidebarOverlay
        isLeftOpen={isLeftSidebarOpen}
        isRightOpen={isRightSidebarOpen}
        onClose={closeSidebars}
        leftContent={leftSidebarContent}
        rightContent={rightSidebarContent}
      />

      <ArtcraftModal
        isOpen={isArtcraftOpen}
        onClose={() => setIsArtcraftOpen(false)}
      />

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={addFiles}
      />

      <ResourceViewer
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </div>
  );
}