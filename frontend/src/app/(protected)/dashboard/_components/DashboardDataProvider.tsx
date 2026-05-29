"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/auth/AuthContext";
import { toast } from "sonner";
import {
  changeDashboardPassword,
  fetchDashboardProgress,
  fetchDashboardProfile,
  fetchDashboardResources,
  fetchDashboardSessions,
  fetchDashboardTrends,
  type DashboardProgress,
  type DashboardProfile,
  type DashboardResource,
  type DashboardSession,
  type DashboardSnapshot,
  type DashboardTrends,
  type ChangePasswordPayload,
  type UpdateProfilePayload,
  updateDashboardProfile,
} from "@/services/dashboard.service";

type DashboardDataContextValue = {
  profile: DashboardProfile | null;
  sessions: DashboardSession[];
  resources: DashboardResource[];
  progress: DashboardProgress | null;
  trends: DashboardTrends | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<DashboardProfile | null>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
};

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(
  undefined
);

const emptySnapshot: DashboardSnapshot = {
  profile: null,
  sessions: [],
  resources: [],
  progress: null,
  trends: null,
};

const loadDashboardSnapshot = async (
  token: string
): Promise<{ snapshot: DashboardSnapshot; errorCount: number }> => {
  const results = await Promise.allSettled([
    fetchDashboardProfile(token),
    fetchDashboardSessions(token),
    fetchDashboardResources(token),
    fetchDashboardProgress(token),
    fetchDashboardTrends(token),
  ]);

  const [profileResult, sessionsResult, resourcesResult, progressResult, trendsResult] =
    results;

  const snapshot: DashboardSnapshot = {
    profile: profileResult.status === "fulfilled" ? profileResult.value : null,
    sessions: sessionsResult.status === "fulfilled" ? sessionsResult.value : [],
    resources:
      resourcesResult.status === "fulfilled" ? resourcesResult.value : [],
    progress: progressResult.status === "fulfilled" ? progressResult.value : null,
    trends: trendsResult.status === "fulfilled" ? trendsResult.value : null,
  };

  const errorCount = results.filter((result) => result.status === "rejected").length;
  return { snapshot, errorCount };
};

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, refreshSession } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptySnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setSnapshot(emptySnapshot);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { snapshot: nextSnapshot, errorCount } = await loadDashboardSnapshot(
        accessToken
      );
      setSnapshot(nextSnapshot);
      if (errorCount > 0) {
        setError("Some dashboard data could not be loaded.");
      }
    } catch {
      setSnapshot(emptySnapshot);
      setError("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      if (!accessToken) {
        throw new Error("You must be signed in to update your profile.");
      }

      const updatedProfile = await updateDashboardProfile(accessToken, payload);
      toast.success("Profile updated successfully");
      await refreshSession();
      await refresh();
      return updatedProfile;
    },
    [accessToken, refresh, refreshSession]
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      if (!accessToken) {
        throw new Error("You must be signed in to change your password.");
      }

      await changeDashboardPassword(accessToken, payload);
      toast.success("Password changed successfully");
    },
    [accessToken]
  );

  const value = useMemo<DashboardDataContextValue>(
    () => ({
      profile: snapshot.profile,
      sessions: snapshot.sessions,
      resources: snapshot.resources,
      progress: snapshot.progress,
      trends: snapshot.trends,
      isLoading,
      error,
      refresh,
      updateProfile,
      changePassword,
    }),
    [changePassword, error, isLoading, refresh, snapshot, updateProfile]
  );

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error("useDashboardData must be used inside DashboardDataProvider");
  }

  return context;
}
