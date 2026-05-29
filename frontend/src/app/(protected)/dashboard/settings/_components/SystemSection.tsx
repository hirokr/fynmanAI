"use client";

import { useDashboardData } from "../../_components/DashboardDataProvider";

export default function SystemSection() {
  const { profile, progress } = useDashboardData();
  const darkModeEnabled = true;
  const focusNotificationsEnabled = (progress?.totals?.activeSessions ?? 0) > 0;

  return (
    <section className="space-y-6 pt-6" id="system">
      <div className="pb-4 border-b border-outline-variant">
        <h3 className="font-headline-md text-headline-md text-on-surface">
          System
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Application-wide interface and behavior settings.
        </p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
          <div>
            <p className="font-medium text-on-surface">Dark Mode</p>
            <p className="text-xs text-outline">
              {darkModeEnabled
                ? "Optimized for low-light focus"
                : "Balanced for light environments"}
            </p>
          </div>
          <div
            className={`w-12 h-6 rounded-full relative cursor-pointer ${darkModeEnabled ? "bg-primary" : "bg-outline-variant"}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-on-primary rounded-full ${darkModeEnabled ? "right-1" : "left-1"}`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-surface-container rounded border border-outline-variant">
          <div>
            <p className="font-medium text-on-surface">Focus Notifications</p>
            <p className="text-xs text-outline">
              {focusNotificationsEnabled
                ? "Mute all during active sessions"
                : "Ready when you start a session"}
            </p>
          </div>
          <div
            className={`w-12 h-6 rounded-full relative cursor-pointer ${focusNotificationsEnabled ? "bg-primary" : "bg-outline-variant"}`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full ${focusNotificationsEnabled ? "right-1 bg-on-primary" : "left-1 bg-on-surface-variant"}`}
            />
          </div>
        </div>
        <div className="p-4 bg-surface-container rounded border border-outline-variant space-y-1">
          <p className="font-medium text-on-surface">Account Sync</p>
          <p className="text-xs text-outline">
            {profile?.emailVerified ? "Verified and active" : "Verification pending"}
            {profile?.location ? ` • ${profile.location}` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}