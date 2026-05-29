type ApiFetchOptions = Omit<RequestInit, "body"> & {
  endpoint?: string;
  body?: unknown;
  baseUrl?: string;
  returnResponse?: boolean;
};

export type ApiFetchError = {
  message: string;
  status: number;
  details?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://apiexample.com";

const buildUrl = (endpoint: string, baseUrl?: string) => {
  if (endpoint.startsWith("http")) return endpoint;
  if (baseUrl === "") return endpoint;
  const root = baseUrl ?? API_BASE_URL;
  return `${root}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

export async function apiFetch<T>(
  pathOrOptions: string | ApiFetchOptions,
  options: ApiFetchOptions = {}
): Promise<T> {
  const mergedOptions =
    typeof pathOrOptions === "string"
      ? { ...options, endpoint: pathOrOptions }
      : pathOrOptions;

  const endpoint = mergedOptions.endpoint ?? "";
  const url = buildUrl(endpoint, mergedOptions.baseUrl);
  const headers = new Headers(mergedOptions.headers);
  const hasBody = mergedOptions.body !== undefined && mergedOptions.body !== null;

  let body: BodyInit | undefined;
  if (hasBody) {
    if (mergedOptions.body instanceof FormData) {
      body = mergedOptions.body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body =
        typeof mergedOptions.body === "string"
          ? mergedOptions.body
          : JSON.stringify(mergedOptions.body);
    }
  }

  const response = await fetch(url, {
    ...mergedOptions,
    body,
    headers,
    credentials: mergedOptions.credentials ?? "include",
  });

  if (mergedOptions.returnResponse) {
    return response as unknown as T;
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const details = contentType.includes("application/json")
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => undefined);
    const message =
      typeof details === "object" && details && "message" in details
        ? String((details as { message?: string }).message)
        : "Request failed";
    const error: ApiFetchError = {
      message,
      status: response.status,
      details,
    };
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}
