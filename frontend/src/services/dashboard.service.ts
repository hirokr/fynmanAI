import { apiFetch } from "@/lib/apiFetch";

export type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

export type DashboardProfile = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  userBodyImageUrl?: string | null;
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  interests?: string[] | null;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type DashboardSession = {
  id: string;
  subject?: string | null;
  topic?: string | null;
  goal?: string | null;
  status: "ACTIVE" | "ENDED";
  startedAt: string;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    transcriptChunks?: number;
    evaluations?: number;
    resources?: number;
  };
  evaluations?: Array<{
    id: string;
    summary?: string | null;
    confidenceScore?: number | null;
    topicDrift?: boolean | null;
    createdAt?: string;
  }>;
};

export type DashboardResource = {
  id: string;
  title: string;
  sourceType: "TEXT" | "UPLOAD" | "URL";
  status: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  subject?: string | null;
  topic?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    chunks?: number;
    sessions?: number;
  };
};

export type DashboardProgress = {
  totals?: {
    sessions: number;
    activeSessions: number;
    endedSessions: number;
    finalEvaluations: number;
    transcriptChunks: number;
    resourcesAttached: number;
  };
  averages?: {
    confidenceScore?: number | null;
    sessionDurationMs?: number | null;
  };
  subjects?: Array<{ value: string; count: number }>;
  topics?: Array<{ value: string; count: number }>;
  missedConcepts?: Array<{ value: string; count: number }>;
  trend?: Array<{
    sessionId: string;
    subject?: string | null;
    topic?: string | null;
    startedAt: string;
    confidenceScore?: number | null;
    topicDrift: boolean;
    missedConcepts: string[];
  }>;
};

export type DashboardTopicTrend = {
  topic: string;
  evaluations: number;
  averageConceptCoverage?: number | null;
  topicDriftRate: number;
  missedConcepts: Array<{ value: string; count: number }>;
};

export type DashboardTrends = {
  trend: Array<{
    evaluationId: string;
    sessionId: string;
    type: "ROLLING" | "FINAL";
    subject?: string | null;
    topic?: string | null;
    createdAt: string;
    conceptCoverage?: number | null;
    semanticConsistency?: number | null;
    explanationDepth?: number | null;
    topicDrift: boolean;
    missedConcepts: string[];
  }>;
  byTopic: DashboardTopicTrend[];
};

export type DashboardSnapshot = {
  profile: DashboardProfile | null;
  sessions: DashboardSession[];
  resources: DashboardResource[];
  progress: DashboardProgress | null;
  trends: DashboardTrends | null;
};

export type UpdateProfilePayload = {
  name?: string;
  avatarUrl?: string;
  userBodyImageUrl?: string;
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  interests?: string[];
  ethnicity?: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchDashboardProfile = async (token: string) => {
  const response = await apiFetch<ApiEnvelope<{ user: DashboardProfile }>>(
    "/api/user/me",
    {
      headers: authHeaders(token),
    }
  );

  return response.data?.user ?? null;
};

export const fetchDashboardSessions = async (token: string) => {
  const response = await apiFetch<ApiEnvelope<{ sessions: DashboardSession[] }>>(
    "/api/sessions",
    {
      headers: authHeaders(token),
    }
  );

  return response.data?.sessions ?? [];
};

export const fetchDashboardResources = async (token: string) => {
  const response = await apiFetch<ApiEnvelope<{ resources: DashboardResource[] }>>(
    "/api/resources",
    {
      headers: authHeaders(token),
    }
  );

  return response.data?.resources ?? [];
};

export const fetchDashboardProgress = async (token: string) => {
  const response = await apiFetch<ApiEnvelope<{ progress: DashboardProgress }>>(
    "/api/analytics/progress",
    {
      headers: authHeaders(token),
    }
  );

  return response.data?.progress ?? null;
};

export const fetchDashboardTrends = async (token: string) => {
  const response = await apiFetch<ApiEnvelope<{ trends: DashboardTrends }>>(
    "/api/analytics/trends",
    {
      headers: authHeaders(token),
    }
  );

  return response.data?.trends ?? null;
};

export const updateDashboardProfile = async (
  token: string,
  payload: UpdateProfilePayload
) => {
  const response = await apiFetch<ApiEnvelope<{ user: DashboardProfile }>>(
    "/api/user/me",
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: payload,
    }
  );

  return response.data?.user ?? null;
};

export const changeDashboardPassword = async (
  token: string,
  payload: ChangePasswordPayload
) => {
  await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/api/user/change-password",
    {
      method: "POST",
      headers: authHeaders(token),
      body: payload,
    }
  );
};
