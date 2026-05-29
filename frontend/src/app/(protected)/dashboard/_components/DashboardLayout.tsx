import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import DashboardNav from "./DashboardNav";
import DashboardShellClient from "./DashboardShellClient";
import { DashboardDataProvider } from "./DashboardDataProvider";
import MobileNav from "../../../../components/ui/MobileNav";

const topLogoUrl =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA15na-r3u-cNsiPUPABWuRoM1JD0OUSQZKW2jTp6J-Vnpn4oea-IR-NFPC-joMbkanu66lFhcC6O7mL3IKcIOz4mMzHVAUa9EMoPVJtKjXoDxG157iL0MfehVISzfDCHzqlYvZ-RamqYHkqGGhma9heXJ_7lYCpGzZyHwNINQYUf6NUOy5EY2EfQI5f7Bvta10HLy4JvlU94WfCaXX2g9zRuDU9wnBN962x9WBDq0q_uh0GNxqn38sKir9kTtIoxisHpSSGXOzLIPL";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-[#0b1220] text-[#e5e7eb] h-screen w-full overflow-hidden fade-in">
      <div className="flex h-full w-full">
        <aside className="hidden md:flex flex-col py-6 px-4 gap-2 bg-surface-container-low text-primary fixed left-0 top-0 h-screen w-70 border-r border-outline-variant">
          <div className="flex flex-col gap-1 mb-6">
            <span className="font-headline-md text-headline-md text-on-surface">
              <Image
                src={topLogoUrl}
                alt="FymenAI Logo"
                width={140}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              Cognitive System
            </span>
          </div>
          <Link
            href="/session/new-session"
            className="bg-[#4f6bff] text-[#e5e7eb] py-4 px-6 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 mb-6 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
            Start New Session
          </Link>
          <DashboardNav />
          <div className="mt-auto flex flex-col gap-1 pt-6 border-t border-outline-variant">
            <div className="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">help</span>
              <span className="font-label-md text-label-md">Help</span>
            </div>
            <div className="flex items-center gap-4 p-4 text-on-surface-variant hover:bg-surface-container-high transition-all rounded-xl cursor-pointer">
              <span className="material-symbols-outlined">shield</span>
              <span className="font-label-md text-label-md">Privacy</span>
            </div>
          </div>
        </aside>

        <div className="flex-1 ml-0 md:ml-70 relative">
          <DashboardShellClient>
            <DashboardDataProvider>{children}</DashboardDataProvider>
          </DashboardShellClient>
        </div>
      </div>

<MobileNav
  leftItems={[
    { icon: "home", label: "Home", href: "/dashboard" },
    { icon: "mic", label: "Voice Sessions", href: "/session/active-session", filled: true },
  ]}
  centerButton={{ icon: "add", href: "/session/new-session" }}
  rightItems={[
    { icon: "auto_stories", label: "Learning Path", href: "#" },
    { icon: "settings", label: "Settings", href: "/dashboard/settings" },
  ]}
/>    </div>
  );
}
