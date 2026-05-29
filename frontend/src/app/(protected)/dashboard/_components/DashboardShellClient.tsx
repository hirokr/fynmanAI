"use client";

import { useAuth } from "@/context/auth/AuthContext";
import TopNav from "@/components/landing/TopNav";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type DashboardShellClientProps = {
  children: ReactNode;
};

export default function DashboardShellClient({
  children,
}: DashboardShellClientProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isDashboard = pathname === "/dashboard";
  const headerOffsetClass = isDashboard ? "pt-12" : "pt-16";
  const avatarSrc = user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuDx58UFf8Zkf4ThtO7ufT7-KQgBt-LCoSLduSZ6amC-zKnDnVdU9gjeq5UKGRFlh3HFR54soCyjtrs_xhIGNCWYZn77RB1JOSoKDZnROBJlGClfJs2YK5VbhKifwX_JnTidJUkQHzIA7bCd7O4Ic08Bfetzmk5Ts42fritLV2M8UTBbFVcGhXtjB6HKdIxVL48QMJzpQA93WERCEEU0RMepIGJeQyFdEjzat374OgO2x-Sq6558duwc4PloptIjzmzjYNCCPs4z1pMj";

  return (
    <>

    <div className="flex md:hidden lg:hidden">
      <TopNav />
    </div>

      <header
        className={
          isDashboard
            ? "fixed top-0 left-0 md:left-70 right-0 h-12 bg-[#0e1626] border-b border-[#273244] px-6 items-center justify-between z-40 hidden md:flex" 
            : "fixed top-0 left-0 md:left-70 right-0 h-16 bg-surface flex justify-between items-center px-6 z-40 border-b border-outline-variant"
        }
      >
        {isDashboard ? (
          <>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                  Focus:
                </span>
                <span className="font-body-md text-body-md text-on-surface">
                  Neural Networks
                </span>
              </div>
              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#273244]">
                <span className="text-[10px] text-tertiary-container uppercase tracking-widest font-bold">
                  Insight:
                </span>
                <span className="font-body-md text-body-md text-on-surface-variant italic">
                  weak causal reasoning detected
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Live Sync Active
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <h2 className="font-headline-md text-base md:text-headline-md text-on-surface">
                Settings
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <input
                  className="bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-label-md w-32 md:w-64 focus:outline-none focus:border-primary transition-all hidden sm:block"
                  placeholder="Search preferences..."
                  type="text"
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">
                    notifications_none
                  </span>
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
                  <Image
                    src={avatarSrc}
                    alt={user?.name || "Avatar"}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      <div className={`h-full ${headerOffsetClass}`}>{children}</div>
    </>
  );
}