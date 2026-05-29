import { apiFetch } from "@/lib/apiFetch";

type StartSessionPayload = {
  subject?: string;
  topic?: string;
  resourceIds?: string[];
};

type StartSessionResponse = {
  data: {
    session: {
      id: string;
    };
  };
};

export const startSessionApi = async (params: {
  token: string;
  payload: StartSessionPayload;
}) =>
  apiFetch<StartSessionResponse>("/api/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify(params.payload),
  });
